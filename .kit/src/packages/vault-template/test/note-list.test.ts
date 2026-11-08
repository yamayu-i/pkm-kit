import { describe, expect, it } from "vitest";
import { filterByQuery, hasNoteHeader, importedSourcePaths, notesOfType, sortNotes, type NoteInfo } from "../src/core/note-list";

function note(path: string, frontmatter: Record<string, unknown> = {}): NoteInfo {
	const name = path.split("/").pop() ?? path;
	return { path, basename: name.replace(/\.md$/, ""), frontmatter };
}

describe("notesOfType", () => {
	it("frontmatter の type で絞り込む。場所は見ない", () => {
		const notes = [note("a.md", { type: "note" }), note("x/b.md", { type: "note" }), note("c.md", { type: "daily" }), note("d.md")];
		expect(notesOfType(notes, "note").map((n) => n.path)).toEqual(["a.md", "x/b.md"]);
		expect(notesOfType(notes, "source")).toEqual([]);
	});
});

describe("filterByQuery", () => {
	const notes = [note("rag_basics.md", { type: "note", title: "RAG の基礎" }), note("memo.md", { type: "note" })];

	it("空の検索語はそのまま返す", () => {
		expect(filterByQuery(notes, "  ")).toEqual(notes);
	});

	it("表示タイトルとファイル名に、大文字小文字を区別せず部分一致する", () => {
		expect(filterByQuery(notes, "rag").map((n) => n.path)).toEqual(["rag_basics.md"]);
		expect(filterByQuery(notes, "基礎").map((n) => n.path)).toEqual(["rag_basics.md"]);
		expect(filterByQuery(notes, "MEMO").map((n) => n.path)).toEqual(["memo.md"]);
		expect(filterByQuery(notes, "zzz")).toEqual([]);
	});
});

describe("sortNotes", () => {
	const a = note("a.md", { created: "2026-10-01T09:00:00+09:00", title: "b" });
	const b = note("b.md", { created: "2026-11-01T09:00:00+09:00", title: "a" });
	const c = note("c.md", {});

	it("created の新しい順。created がないものは末尾", () => {
		expect(sortNotes([c, a, b], "created", "desc").map((n) => n.path)).toEqual(["b.md", "a.md", "c.md"]);
		expect(sortNotes([c, a, b], "created", "asc").map((n) => n.path)).toEqual(["a.md", "b.md", "c.md"]);
	});

	it("表示タイトル順", () => {
		expect(sortNotes([a, b, c], "title", "asc").map((n) => n.path)).toEqual(["b.md", "a.md", "c.md"]);
	});

	it("ファイル名順(daily は日付順になる)", () => {
		const d1 = note("daily/2026/11/2026-11-01.md");
		const d2 = note("daily/2026/10/2026-10-31.md");
		expect(sortNotes([d2, d1], "name", "desc").map((n) => n.path)).toEqual([d1.path, d2.path]);
	});

	it("元の配列を変えない", () => {
		const input = [a, b];
		sortNotes(input, "title", "asc");
		expect(input).toEqual([a, b]);
	});
});

describe("importedSourcePaths", () => {
	it("wiki のページの sources に載っている元資料のパスを集める", () => {
		const notes = [
			note("wiki/rag.md", { type: "concept", sources: ["sources/a.md", "sources/b.md"] }),
			note("wiki/q.md", { type: "answer", sources: ["sources/b.md", "https://example.com"] }),
			note("sources/a.md", { type: "source" }),
			note("sources/c.md", { type: "source" }),
		];
		expect(importedSourcePaths(notes)).toEqual(new Set(["sources/a.md", "sources/b.md", "https://example.com"]));
	});

	it("wiki のページ以外の sources は数えない。リストでない値は無視する", () => {
		const notes = [
			note("n.md", { type: "note", sources: ["sources/a.md"] }),
			note("wiki/t.md", { type: "topic", sources: "sources/b.md" }),
			note("wiki/e.md", { type: "entity", sources: [1, null, "sources/c.md"] }),
		];
		expect(importedSourcePaths(notes)).toEqual(new Set(["sources/c.md"]));
	});
});

describe("hasNoteHeader", () => {
	it("issue・routine・member にはヘッダーを出さない(vault-task が出す。ADR-0035)", () => {
		expect(hasNoteHeader("issue/i-1.md", { type: "issue" })).toBe(false);
		expect(hasNoteHeader("routine/r-1.md", { type: "routine" })).toBe(false);
		expect(hasNoteHeader("issue/i-2.md", undefined)).toBe(false);
		expect(hasNoteHeader("x/y.md", { type: "issue" })).toBe(false);
		expect(hasNoteHeader("member/m-1.md", { type: "member" })).toBe(false);
		expect(hasNoteHeader("member/m-2.md", undefined)).toBe(false);
	});

	it("それ以外の Markdown には出す(型のないものも)", () => {
		expect(hasNoteHeader("daily/2026/11/2026-11-01.md", { type: "daily" })).toBe(true);
		expect(hasNoteHeader("memo.md", undefined)).toBe(true);
	});
});
