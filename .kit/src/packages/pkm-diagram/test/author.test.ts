import { readFileSync } from "node:fs";
import { deflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { buildDiagram, inspectDiagram, renderDiagram, xmlFromInput } from "../src/core/author.ts";
import { buildXml, readSpec } from "../src/core/build.ts";
import { decompressDiagramFile, parseDiagramFile } from "../src/core/model.ts";
import { wrapLines } from "../src/core/render.ts";
import { countPages, extractDiagramXml, findSvgProblems, toSharingSvg } from "../src/core/svg.ts";
import { parseXml } from "../src/core/xml.ts";

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");

const FLOW = {
	direction: "down",
	groups: [{ id: "g", label: "Vault", color: "blue" }],
	nodes: [
		{ id: "a", label: "開始" },
		{ id: "b", label: "ノート", group: "g" },
		{ id: "c", label: "図", group: "g", shape: "document" },
		{ id: "d", label: "正しい？", shape: "diamond" },
		{ id: "u", label: "人", shape: "actor" },
	],
	edges: [
		{ from: "u", to: "a" },
		{ from: "a", to: "c" },
		{ from: "b", to: "c", dashed: true, label: "参照" },
		{ from: "c", to: "d" },
		{ from: "d", to: "a", label: "いいえ" },
	],
};

type Geo = { x: number; y: number; w: number; h: number };

async function boxes(xml: string): Promise<Map<string, Geo>> {
	const [page] = await parseDiagramFile(xml);
	const byId = new Map(page?.cells.map((c) => [c.id, c]));
	const out = new Map<string, Geo>();
	for (const c of page?.cells ?? []) {
		if (!c.vertex || !c.geometry) continue;
		let x = c.geometry.x;
		let y = c.geometry.y;
		let p = c.parent ? byId.get(c.parent) : undefined;
		while (p?.vertex && p.geometry) {
			x += p.geometry.x;
			y += p.geometry.y;
			p = p.parent ? byId.get(p.parent) : undefined;
		}
		out.set(c.id, { x, y, w: c.geometry.width, h: c.geometry.height });
	}
	return out;
}

const overlap = (a: Geo, b: Geo) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe("build", () => {
	it("同じ spec からは同じバイト列。既存の検査を通る", async () => {
		const first = await buildDiagram(FLOW);
		const second = await buildDiagram(structuredClone(FLOW));
		expect(second.svg).toBe(first.svg);
		const back = extractDiagramXml(first.svg);
		expect(back.kind).toBe("diagram");
		if (back.kind === "diagram") expect(back.xml).toBe(first.xml);
		expect(countPages(first.xml)).toBe(1);
		expect(findSvgProblems(toSharingSvg(first.svg)).errors).toEqual([]);
		expect(first.warnings).toEqual([]);
	});

	it("層に分けて上から並べ、ノード同士が重ならない。グループはメンバーを囲む", async () => {
		const { xml } = await buildDiagram(FLOW);
		const b = await boxes(xml);
		const ids = ["a", "b", "c", "d", "u"];
		for (const x of ids) for (const y of ids) if (x < y) expect(overlap(b.get(x) as Geo, b.get(y) as Geo), `${x} と ${y}`).toBe(false);
		const g = b.get("g") as Geo;
		for (const m of ["b", "c"]) {
			const n = b.get(m) as Geo;
			expect(n.x >= g.x && n.y >= g.y && n.x + n.w <= g.x + g.w && n.y + n.h <= g.y + g.h).toBe(true);
		}
		expect((b.get("u") as Geo).y).toBeLessThan((b.get("a") as Geo).y);
		expect((b.get("a") as Geo).y).toBeLessThan((b.get("g") as Geo).y);
		expect((b.get("g") as Geo).y).toBeLessThan((b.get("d") as Geo).y);
		// グループの子の座標はグループからの相対
		expect(xml).toMatch(/id="b" [^>]*parent="g"/);
	});

	it("戻る辺は図の外側を回る経由点を持ち、横切る辺は横に寄せる", async () => {
		const { xml } = await buildDiagram(FLOW);
		const edge = (from: string, to: string) => new RegExp(`source="${from}" target="${to}">(.*?)</mxCell>`).exec(xml)?.[1] ?? "";
		expect(edge("d", "a")).toContain('<Array as="points">');
		// a → c は、グループの中の b を避ける
		expect(edge("a", "c")).toContain('<Array as="points">');
		expect(edge("c", "d")).not.toContain("points");
	});

	it("right の向き、格子、座標の指定", async () => {
		const xml = buildXml(
			readSpec({
				pages: [
					{ direction: "right", nodes: [{ id: "a" }, { id: "b" }], edges: [{ from: "a", to: "b" }] },
					{ layout: "grid", columns: 2, nodes: [{ id: "a" }, { id: "b" }, { id: "c" }] },
					{ layout: "none", nodes: [{ id: "a", x: 10, y: 20, width: 50, height: 40 }] },
				],
			}),
		);
		expect(countPages(xml)).toBe(3);
		const pages = await parseDiagramFile(xml);
		const geo = (p: number, id: string) => pages[p]?.cells.find((c) => c.id === id)?.geometry;
		expect(geo(0, "b")?.x).toBeGreaterThan((geo(0, "a")?.x ?? 0) + 100);
		expect(geo(0, "b")?.y).toBe(geo(0, "a")?.y);
		expect(geo(1, "c")?.y).toBeGreaterThan(geo(1, "a")?.y ?? 0);
		expect(geo(1, "c")?.x).toBe(geo(1, "a")?.x);
		expect(geo(2, "a")).toMatchObject({ x: 10, y: 20, width: 50, height: 40 });
	});

	it("spec の誤りは場所を添えてエラー", () => {
		expect(() => readSpec({ nodes: [{ id: "a", colour: "blue" }] })).toThrow(/nodes\[0\].*知らない項目 colour/);
		expect(() => readSpec({ nodes: [{ id: "1" }] })).toThrow(/0 と 1 は使えない/);
		expect(() => readSpec({ nodes: [{ id: "a", shape: "star" }] })).toThrow(/shape は/);
		expect(() => readSpec({ nodes: [{ id: "a", fill: "red;image=x" }] })).toThrow(/#rrggbb/);
		expect(() => readSpec({ nodes: [{ id: "a", style: "a=<b>" }] })).toThrow(/style に使えない文字/);
		expect(() => buildXml(readSpec({ nodes: [{ id: "a" }], edges: [{ from: "a", to: "x" }] }))).toThrow(/x がない/);
		expect(() => buildXml(readSpec({ nodes: [{ id: "a" }, { id: "a" }] }))).toThrow(/重複/);
		expect(() => buildXml(readSpec({ layout: "none", nodes: [{ id: "a" }] }))).toThrow(/x と y が要る/);
	});

	it("ラベルはエスケープする（描画にも XML にもタグが入らない）", async () => {
		const r = await buildDiagram({ nodes: [{ id: "a", label: '<script>alert(1)</script> & "x"\n<img onerror=1>' }] });
		const sharing = toSharingSvg(r.svg);
		expect(sharing).not.toContain("<script");
		expect(sharing).not.toContain("<img");
		expect(sharing).toContain("&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;x&quot;");
		expect(findSvgProblems(sharing).errors).toEqual([]);
		const [page] = await parseDiagramFile(r.xml);
		expect(page?.cells.find((c) => c.id === "a")?.value).toBe("&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;x&quot;<br>&lt;img onerror=1&gt;");
	});
});

describe("render", () => {
	it("XML はバイト列のまま content に入れ、全ページを残す", async () => {
		const xml = fixture("two-pages.drawio");
		const r = await renderDiagram(xml.trim());
		const back = extractDiagramXml(r.svg);
		expect(back.kind === "diagram" && back.xml).toBe(xml.trim());
		expect(r.pages).toBe(2);
		expect(r.svg).toContain(">開始 &amp; 終了</tspan>");
		expect(r.svg).toContain('rx="9"');
	});

	it("図の SVG・.drawio・XML のどれからでも同じ XML を取り出す", () => {
		const xml = fixture("two-pages.drawio").trim();
		expect(xmlFromInput(fixture("two-pages.drawio.svg"))).toBe(xml);
		expect(xmlFromInput(`<?xml version="1.0"?>\n${xml}\n`)).toBe(xml);
		expect(() => xmlFromInput(fixture("plain.svg"))).toThrow(/普通の SVG/);
		expect(() => xmlFromInput("<html></html>")).toThrow();
	});

	it("圧縮したページ、UserObject、辺のラベル、スイムレーン、知らない形", async () => {
		const model =
			'<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>' +
			'<mxCell id="lane" value="レーン" style="swimlane;startSize=30;" vertex="1" parent="1"><mxGeometry x="0" y="0" width="300" height="200" as="geometry"/></mxCell>' +
			'<UserObject id="u" label="&lt;b&gt;利用者&lt;/b&gt;&lt;br&gt;二行目"><mxCell style="rounded=1;html=1;" vertex="1" parent="lane"><mxGeometry x="20" y="50" width="100" height="50" as="geometry"/></mxCell></UserObject>' +
			'<mxCell id="s" value="星" style="shape=mxgraph.basic.star;" vertex="1" parent="1"><mxGeometry x="400" y="0" width="60" height="60" as="geometry"/></mxCell>' +
			'<mxCell id="e" style="edgeStyle=orthogonalEdgeStyle;html=1;" edge="1" parent="1" source="u" target="s"><mxGeometry relative="1" as="geometry"/></mxCell>' +
			'<mxCell id="el" value="ラベル" style="edgeLabel;html=1;" vertex="1" connectable="0" parent="e"><mxGeometry x="-0.5" relative="1" as="geometry"><mxPoint as="offset"/></mxGeometry></mxCell>' +
			"</root></mxGraphModel>";
		const compressed = Buffer.from(deflateRawSync(Buffer.from(encodeURIComponent(model)))).toString("base64");
		const xml = `<mxfile><diagram id="p" name="圧縮">${compressed}</diagram></mxfile>`;
		const r = await renderDiagram(xml);
		expect(r.svg).toContain(">利用者</tspan>");
		expect(r.svg).toContain(">二行目</tspan>");
		expect(r.svg).toContain(">ラベル</tspan>");
		// スイムレーンの子は親の位置を足す（20 + 0, 50 + 0）
		expect(r.svg).toMatch(/data-cell-id="u"><rect x="20" y="50"/);
		expect(r.warnings).toEqual(["形 mxgraph.basic.star は描けない（四角で描いた）"]);
		const plain = await decompressDiagramFile(xml);
		expect(plain).toContain('<diagram id="p" name="圧縮"><mxGraphModel><root>');
		expect(plain).toContain('label="&lt;b&gt;利用者&lt;/b&gt;&lt;br&gt;二行目"');
		expect((await renderDiagram(plain)).svg.replace(/content="[^"]*"/, "")).toBe(r.svg.replace(/content="[^"]*"/, ""));
		expect(await decompressDiagramFile(fixture("two-pages.drawio"))).toBe(fixture("two-pages.drawio").trim());
		const text = await inspectDiagram(xml);
		expect(text).toContain("[1] 圧縮");
		expect(text).toContain('u  rect  "利用者 / 二行目"  x=20 y=50 w=100 h=50  中: lane');
		expect(text).toContain("e  辺 u -> s");
		expect(text).toContain("! 形 mxgraph.basic.star は描けない");
	});

	it("属性に入る値は検査し、読めない色は既定にする", async () => {
		const xml =
			'<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>' +
			'<mxCell id="a" value="x" style="fillColor=red&quot; onload=&quot;alert(1);fontFamily=a&quot;&gt;&lt;script&gt;;" vertex="1" parent="1"><mxGeometry width="80" height="40" as="geometry"/></mxCell>' +
			"</root></mxGraphModel>";
		const r = await renderDiagram(xml);
		const sharing = toSharingSvg(r.svg);
		expect(findSvgProblems(sharing).errors).toEqual([]);
		expect(sharing).toContain('fill="#ffffff"');
		expect(r.warnings.some((w) => w.includes("fillColor"))).toBe(true);
	});

	it("壊れた XML・DOCTYPE はエラー", async () => {
		await expect(renderDiagram("<mxfile><diagram></mxfile>")).rejects.toThrow();
		expect(() => parseXml('<!DOCTYPE x [<!ENTITY a "b">]><mxfile/>')).toThrow(/DOCTYPE/);
		await expect(renderDiagram("<mxfile></mxfile>")).rejects.toThrow(/ページ/);
		await expect(renderDiagram(fixture("two-pages.drawio").trim(), 3)).rejects.toThrow(/ページ 3 がない/);
	});
});

describe("wrapLines", () => {
	it("全角はどこでも折り返し、閉じかっこで行を始めない", () => {
		expect(wrapLines("通知を送る処理（メールとチャット）", 12 * 16, 12)).toEqual(["通知を送る処理（メールとチャット）"]);
		expect(wrapLines("あいうえおかきくけこ", 12 * 4, 12)).toEqual(["あいうえ", "おかきく", "けこ"]);
		expect(wrapLines("あいう」えお", 12 * 3, 12)).toEqual(["あいう」", "えお"]);
		expect(wrapLines("hello world foo", 40, 12)).toEqual(["hello", "world", "foo"]);
	});
});
