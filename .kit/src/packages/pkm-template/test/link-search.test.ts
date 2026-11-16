import { describe, expect, it } from "vitest";
import { dailyEntries, dailyLink, headingLink, linkIcon, noteLinkOf, searchDailies, searchDecks, searchHeadings, searchNotes } from "../src/core/link-search";
import type { NoteInfo } from "../src/core/note-list";

const note = (path: string, frontmatter: Record<string, unknown> = {}): NoteInfo => ({ path, basename: (path.split("/").pop() ?? "").replace(/\.md$/, ""), frontmatter });
const notes = [
	note("wiki/llm.md", { type: "concept", title: "LLM wiki", aliases: ["エルエルエム"] }),
	note("meeting.md", { type: "note", title: "定例のメモ" }),
	note("sources/paper.md", { type: "source", title: "論文" }),
	note("issue/i-1.md", { type: "issue" }),
	note("daily/2026/11/2026-11-16.md", { type: "daily" }),
	note("tmp/x.md"),
];
const mtime: Record<string, number> = { "wiki/llm.md": 1, "meeting.md": 3, "sources/paper.md": 2 };
const paths = (list: { path: string }[]) => list.map((n) => n.path);

describe("searchNotes（ADR-0194）", () => {
	it("issue・daily・tmp などを除き、新しい順", () => {
		expect(paths(searchNotes(notes, "", (p) => mtime[p] ?? 0))).toEqual(["meeting.md", "sources/paper.md", "wiki/llm.md"]);
	});
	it("タイトル・aliases・パスで探す", () => {
		expect(paths(searchNotes(notes, "エルエル", () => 0))).toEqual(["wiki/llm.md"]);
		expect(paths(searchNotes(notes, "sources", () => 0))).toEqual(["sources/paper.md"]);
	});
	it("t: と f: で絞る。t:wiki は wiki の type", () => {
		expect(paths(searchNotes(notes, "t:wiki", () => 0))).toEqual(["wiki/llm.md"]);
		expect(paths(searchNotes(notes, "t:source", () => 0))).toEqual(["sources/paper.md"]);
		expect(paths(searchNotes(notes, "f:wiki/", () => 0))).toEqual(["wiki/llm.md"]);
	});
	it("リンクの文字はタイトル", () => {
		expect(noteLinkOf(notes[1]!)).toBe("[定例のメモ](meeting.md)");
		expect(headingLink(notes[0]!, "仕組み 1")).toBe("[LLM wiki › 仕組み 1](wiki/llm.md#仕組み%201)");
	});
});

describe("searchHeadings", () => {
	it("md の順で、見出しの文字で探す", () => {
		const hs = [
			{ heading: "背景", level: 2 },
			{ heading: "決定", level: 2 },
			{ heading: "決定の理由", level: 3 },
		];
		expect(searchHeadings(hs, "").map((h) => h.heading)).toEqual(["背景", "決定", "決定の理由"]);
		expect(searchHeadings(hs, "理由").map((h) => h.heading)).toEqual(["決定の理由"]);
	});
});

describe("daily", () => {
	const entries = dailyEntries(["daily/2026/11/2026-11-16.md", "daily/2026/10/2026-10-20.md", "daily/x.md", "meeting.md"]);
	it("日付のファイル名だけを、新しい順に", () => {
		expect(searchDailies(entries, "").map((e) => e.label)).toEqual(["2026-11-16 MON", "2026-10-20 TUE"]);
	});
	it("数字は - を除いた日付、文字は曜日付きの表示で探す", () => {
		expect(searchDailies(entries, "1020").map((e) => e.date)).toEqual(["2026-10-20"]);
		expect(searchDailies(entries, "2026-11").map((e) => e.date)).toEqual(["2026-11-16"]);
		expect(searchDailies(entries, "tue").map((e) => e.date)).toEqual(["2026-10-20"]);
	});
	it("リンクの文字は日付と曜日", () => {
		expect(dailyLink(entries[0]!)).toBe("[2026-11-16 MON](daily/2026/11/2026-11-16.md)");
	});
});

describe("searchDecks", () => {
	it("題とフォルダで探し、新しい順", () => {
		const decks = [
			{ path: "slide/a/index.html", title: "発表", mtime: 1 },
			{ path: "slide/work/b/index.html", title: "共有", mtime: 2 },
		];
		expect(searchDecks(decks, "").map((d) => d.title)).toEqual(["共有", "発表"]);
		expect(searchDecks(decks, "work").map((d) => d.title)).toEqual(["共有"]);
	});
});

describe("linkIcon", () => {
	it("種類ごとのアイコン。pkm-task が描くものは null", () => {
		expect(linkIcon("issue/i-1.md", "", "issue")).toBeNull();
		expect(linkIcon("member/m-1.md", "", "member")).toBeNull();
		expect(linkIcon("slide/a/index.html", "", undefined)).toBe("presentation");
		expect(linkIcon("asset/a.png", "", undefined)).toBeNull();
		expect(linkIcon("wiki/a.md", "x", "concept")).toBe("hash");
		expect(linkIcon("daily/2026/11/2026-11-16.md", "", "daily")).toBe("calendar");
		expect(linkIcon("wiki/a.md", "", "concept")).toBe("book-open");
		expect(linkIcon("sources/a.md", "", "source")).toBe("library");
		expect(linkIcon("a.md", "", "note")).toBe("file-text");
	});
});
