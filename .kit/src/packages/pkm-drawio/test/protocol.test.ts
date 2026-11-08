import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { svgDataUri } from "../src/core/encoding.ts";
import { EditSession, embedUrl, EXPORT_TIMEOUT_MS, EMBED_ORIGIN, parseMessage, verifyExportedSvg, type Effect } from "../src/core/protocol.ts";

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
const DIAGRAM = fixture("two-pages.drawio.svg");
const XML = fixture("two-pages.drawio");
const ONE_PAGE = '<mxfile><diagram id="p1" name="1"><mxGraphModel><root/></mxGraphModel></diagram></mxfile>';

const posts = (effects: Effect[]) => effects.filter((e) => e.type === "post").map((e) => (e.type === "post" ? e.message : null));
const kinds = (effects: Effect[]) => effects.map((e) => (e.type === "post" ? `post:${String(e.message.action)}` : e.type));

function started(xml: string | null = XML) {
	const s = new EditSession(xml, "sys");
	s.handle({ event: "init" });
	return s;
}

describe("embedUrl", () => {
	it("固定の origin の JSON protocol", () => {
		const url = new URL(embedUrl());
		expect(url.origin).toBe(EMBED_ORIGIN);
		expect(url.searchParams.get("embed")).toBe("1");
		expect(url.searchParams.get("proto")).toBe("json");
	});
});

describe("parseMessage", () => {
	it("知っている形だけを読む", () => {
		expect(parseMessage(JSON.stringify({ event: "save", xml: "<mxfile/>", exit: true }))).toEqual({ event: "save", xml: "<mxfile/>", exit: true });
		expect(parseMessage(JSON.stringify({ event: "export", format: "xmlsvg", data: "data:" }))).toEqual({ event: "export", format: "xmlsvg", data: "data:" });
		expect(parseMessage({ event: "init" })).toBeNull();
		expect(parseMessage("not json")).toBeNull();
		expect(parseMessage(JSON.stringify({ event: "save" }))).toBeNull();
		expect(parseMessage(JSON.stringify({ event: "openLink", href: "x" }))).toBeNull();
		expect(parseMessage(JSON.stringify(null))).toBeNull();
	});
});

describe("EditSession", () => {
	it("init で、内包していた XML を load する。2 回目の init は無視", () => {
		const s = new EditSession(XML, "sys");
		expect(posts(s.handle({ event: "init" }))).toEqual([{ action: "load", xml: XML, autosave: 1, title: "sys" }]);
		expect(s.handle({ event: "init" })).toEqual([]);
		expect(s.dirty).toBe(false);
	});

	it("新しい図は空の XML を load する", () => {
		expect(posts(new EditSession(null, "new").handle({ event: "init" }))[0]).toMatchObject({ action: "load", xml: "" });
	});

	it("save → 同じ XML を指定して xmlsvg を export → 検査して write → 保存済みを知らせる", () => {
		const s = started();
		const exp = s.handle({ event: "save", xml: XML, exit: false });
		expect(posts(exp)).toContainEqual({ action: "export", format: "xmlsvg", xml: XML, spinKey: "saving" });
		const write = s.handle({ event: "export", format: "xmlsvg", data: svgDataUri(DIAGRAM) });
		expect(write).toEqual([{ type: "write", svg: DIAGRAM, xml: XML, generation: 1 }]);
		expect(s.dirty).toBe(true);
		const done = s.writeDone(1, true);
		expect(posts(done)).toContainEqual({ action: "status", message: "Saved", modified: false });
		expect(s.dirty).toBe(false);
	});

	it("export の前にスピナーを出さない（Draw.io はスピナーが出ていると spinKey 付きの export をしない。#98）", () => {
		const s = started(null);
		const exp = s.handle({ event: "save", xml: XML, exit: false });
		expect(posts(exp).filter((m) => m?.action === "spinner")).toEqual([]);
		expect(posts(exp)).toEqual([{ action: "export", format: "xmlsvg", xml: XML, spinKey: "saving" }]);
	});

	it("export を頼んだら、返事を待つ時間を親に知らせる", () => {
		const s = started();
		const exp = s.handle({ event: "save", xml: XML, exit: false });
		expect(exp).toContainEqual({ type: "wait", generation: 1, ms: EXPORT_TIMEOUT_MS });
	});

	it("export の返事が来ないまま時間が切れたら、スピナーを消して知らせ、編集画面を残す", () => {
		const s = started();
		s.handle({ event: "save", xml: XML, exit: true });
		const r = s.exportTimedOut(1);
		expect(kinds(r)).toEqual(["post:spinner", "post:status", "error"]);
		expect(s.busy).toBe(false);
		expect(s.dirty).toBe(true);
		expect(s.unsavedXml).toBe(XML);
		// 遅れて届いた export は書かない
		expect(kinds(s.handle({ event: "export", format: "xmlsvg", data: svgDataUri(DIAGRAM) }))).toEqual(["error"]);
	});

	it("書き出しが返った後の時間切れ・古い世代の時間切れは無視する", () => {
		const s = started();
		s.handle({ event: "save", xml: XML, exit: false });
		s.handle({ event: "export", format: "xmlsvg", data: svgDataUri(DIAGRAM) });
		expect(s.exportTimedOut(1)).toEqual([]);
		expect(s.exportTimedOut(99)).toEqual([]);
	});

	it("保存して閉じる（exit）は、書けてから閉じる", () => {
		const s = started();
		s.handle({ event: "save", xml: XML, exit: true });
		s.handle({ event: "export", format: "xmlsvg", data: svgDataUri(DIAGRAM) });
		expect(kinds(s.writeDone(1, true))).toContain("close");
	});

	it("保存中の編集と保存は次の世代に回し、古い保存の完了で未保存を消さない", () => {
		const s = started(null);
		s.handle({ event: "save", xml: XML, exit: false });
		// export の待ち中に編集し、もう一度保存
		s.handle({ event: "autosave", xml: ONE_PAGE });
		expect(s.handle({ event: "save", xml: ONE_PAGE, exit: false })).toEqual([]);
		const w1 = s.handle({ event: "export", format: "xmlsvg", data: svgDataUri(DIAGRAM) });
		expect(w1[0]).toMatchObject({ type: "write", generation: 1 });
		const next = s.writeDone(1, true);
		expect(posts(next)).toContainEqual({ action: "status", message: "Saved", modified: true });
		expect(posts(next)).toContainEqual({ action: "export", format: "xmlsvg", xml: ONE_PAGE, spinKey: "saving" });
		expect(s.dirty).toBe(true);
	});

	it("頼んでいない export・古い世代の writeDone は無視する", () => {
		const s = started();
		expect(kinds(s.handle({ event: "export", format: "xmlsvg", data: svgDataUri(DIAGRAM) }))).toEqual(["error"]);
		s.handle({ event: "save", xml: XML, exit: false });
		s.handle({ event: "export", format: "xmlsvg", data: svgDataUri(DIAGRAM) });
		expect(s.writeDone(99, true)).toEqual([]);
		expect(s.busy).toBe(true);
	});

	it("export の SVG が壊れていたら書かず、編集画面を残す", () => {
		const s = started();
		s.handle({ event: "save", xml: XML, exit: true });
		const r = s.handle({ event: "export", format: "xmlsvg", data: svgDataUri("<svg/>") });
		expect(kinds(r)).toEqual(["post:spinner", "post:status", "error"]);
		expect(s.busy).toBe(false);
		expect(s.dirty).toBe(true);
		expect(s.unsavedXml).toBe(XML);
	});

	it("書けなかったら編集画面を残し、閉じない", () => {
		const s = started();
		s.handle({ event: "save", xml: XML, exit: true });
		s.handle({ event: "export", format: "xmlsvg", data: svgDataUri(DIAGRAM) });
		const r = s.writeDone(1, false, "disk full");
		expect(kinds(r)).toEqual(["post:spinner", "post:status", "error"]);
		expect(r[2]).toEqual({ type: "error", message: "disk full" });
		expect(s.dirty).toBe(true);
	});

	it("保存中の exit は、保存が終わってから閉じる", () => {
		const s = started();
		s.handle({ event: "save", xml: XML, exit: false });
		expect(s.handle({ event: "exit", modified: false })).toEqual([]);
		s.handle({ event: "export", format: "xmlsvg", data: svgDataUri(DIAGRAM) });
		expect(kinds(s.writeDone(1, true))).toContain("close");
		expect(s.handle({ event: "init" })).toEqual([]);
	});

	it("autosave は保存しないが、未保存として覚える", () => {
		const s = started();
		expect(s.handle({ event: "autosave", xml: ONE_PAGE })).toEqual([]);
		expect(s.dirty).toBe(true);
		expect(s.unsavedXml).toBe(ONE_PAGE);
	});
});

describe("verifyExportedSvg", () => {
	it("ページの数が保存した XML と違えば保存しない（ページの欠落）", () => {
		expect(() => verifyExportedSvg(svgDataUri(DIAGRAM), ONE_PAGE)).toThrow(/ページの数/);
		expect(verifyExportedSvg(svgDataUri(DIAGRAM), XML)).toBe(DIAGRAM);
	});
	it("SVG でない data URI、編集用 XML のない SVG はエラー", () => {
		expect(() => verifyExportedSvg("data:image/png;base64,AAAA", XML)).toThrow();
		expect(() => verifyExportedSvg(svgDataUri(fixture("plain.svg")), XML)).toThrow(/編集用 XML/);
	});
});
