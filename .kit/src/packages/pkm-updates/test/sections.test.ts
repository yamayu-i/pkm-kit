import { describe, expect, it } from "vitest";
import { SECTIONS, buildSections, uniqueCount, updatedMs, type NoteRecord } from "../src/core/sections";

const T0 = "2026-11-08T10:00:00+09:00";
const NEW = "2026-11-08T11:00:00+09:00";
const OLD = "2026-11-08T09:00:00+09:00";
const today = "2026-11-08";
const since = Date.parse(T0);

function issue(n: number, updated: string, extra: Record<string, unknown> = {}): NoteRecord {
	return {
		path: `issue/i-${n}.md`,
		basename: `i-${n}`,
		frontmatter: { type: "issue", schema: 1, id: `i-${n}`, summary: `課題 ${n}`, status: "open", created: OLD, updated, ...extra },
	};
}

function note(path: string, type: string, updated: unknown, extra: Record<string, unknown> = {}): NoteRecord {
	const basename = path.replace(/^.*\//, "").replace(/\.md$/, "");
	return { path, basename, frontmatter: { type, created: OLD, updated, ...extra } };
}

const ids = (notes: NoteRecord[], s = since) => Object.fromEntries(buildSections(notes, s, today).map((x) => [x.id, x.items.map((i) => i.path)]));

describe("セクションの定義（ADR-0070 の 2）", () => {
	it("並びと、見出しが開く一覧のコマンド", () => {
		expect(SECTIONS.map((s) => [s.title, s.command])).toEqual([
			["Issues", "pkm-task:open-issues"],
			["Inbox", "pkm-task:open-inbox"],
			["Organize", "pkm-task:open-organize"],
			["Scheduled", "pkm-task:open-scheduled"],
			["Someday", "pkm-task:open-someday"],
			["Routines", "pkm-task:open-routines"],
			["Members", "pkm-task:open-members"],
			["Daily notes", "pkm-template:open-daily-list"],
			["Notes", "pkm-template:open-note-list"],
			["Sources", "pkm-template:open-source-list"],
		]);
	});
});

describe("載せる規則", () => {
	it("基準より後に updated が新しくなったものだけ。同じ時刻・古い・ない・読めないものは載せない", () => {
		const notes = [
			note("a.md", "note", NEW),
			note("b.md", "note", T0),
			note("c.md", "note", OLD),
			note("d.md", "note", undefined),
			note("e.md", "note", "いつか"),
		];
		expect(ids(notes)).toEqual({ notes: ["a.md"] });
	});

	it("基準がなければ、updated があるものをすべて載せる", () => {
		expect(ids([note("c.md", "note", OLD), note("d.md", "note", undefined)], null as unknown as number)).toEqual({ notes: ["c.md"] });
	});

	it("issue は当たる一覧すべてに出す（Issues は closed も含むすべて）", () => {
		const notes = [
			issue(1, NEW),
			issue(2, NEW, { status: "someday" }),
			issue(3, NEW, { scheduled: ["2026-11-09"] }),
			issue(4, NEW, { status: "closed" }),
			issue(5, OLD),
		];
		expect(ids(notes)).toEqual({
			// 同じ updated ならパスの順
			issues: ["issue/i-1.md", "issue/i-2.md", "issue/i-3.md", "issue/i-4.md"],
			inbox: ["issue/i-1.md"],
			organize: ["issue/i-1.md", "issue/i-2.md"],
			scheduled: ["issue/i-3.md"],
			someday: ["issue/i-2.md"],
		});
	});

	it("routine・member・daily・source も type と場所で集める", () => {
		const notes = [
			{ path: "routine/r-1.md", basename: "r-1", frontmatter: { type: "routine", schema: 1, id: "r-1", summary: "掃除", repeat: "daily", created: OLD, updated: NEW } },
			{ path: "member/m-1.md", basename: "m-1", frontmatter: { type: "member", schema: 1, id: "m-1", name: "山田 花子", nickname: "花子", created: OLD, updated: NEW } },
			note("daily/2026/11/2026-11-08.md", "daily", NEW),
			note("sources/x.md", "source", NEW, { title: "記事" }),
		];
		expect(ids(notes)).toEqual({ routines: ["routine/r-1.md"], members: ["member/m-1.md"], daily: ["daily/2026/11/2026-11-08.md"], sources: ["sources/x.md"] });
	});

	it("セクションの中は updated の新しい順。行の名前は一覧と同じ決め方", () => {
		const notes = [note("a.md", "note", NEW, { title: "A のタイトル" }), note("b.md", "note", "2026-11-08T12:00:00+09:00"), issue(7, NEW), note("daily/2026/11/2026-11-01.md", "daily", NEW)];
		const sections = buildSections(notes, since, today);
		const titles = Object.fromEntries(sections.map((s) => [s.id, s.items.map((i) => i.title)]));
		expect(titles.notes).toEqual(["b", "A のタイトル"]);
		expect(titles.issues).toEqual(["i-7 課題 7"]);
		expect(titles.daily).toEqual(["2026-11-01 SUN"]);
		expect(sections[0]?.items[0]?.updatedMs).toBe(Date.parse(NEW));
	});
});

describe("件数", () => {
	it("全セクションを通したノートの数で、重複を数えない", () => {
		const sections = buildSections([issue(1, NEW), issue(2, NEW, { status: "someday" }), note("a.md", "note", NEW)], since, today);
		expect(uniqueCount(sections)).toBe(3);
		expect(uniqueCount([])).toBe(0);
	});
});

describe("updated の読み方", () => {
	it("文字列と Date を読み、読めないものは null", () => {
		expect(updatedMs(T0)).toBe(since);
		expect(updatedMs(new Date(since))).toBe(since);
		expect(updatedMs("x")).toBeNull();
		expect(updatedMs(123)).toBeNull();
		expect(updatedMs(undefined)).toBeNull();
	});
});
