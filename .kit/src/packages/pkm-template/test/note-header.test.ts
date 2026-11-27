import { describe, expect, it } from "vitest";
import { buildHeader } from "../src/core/note-header";
import type { NoteInfo } from "../src/core/note-list";

function note(path: string, frontmatter: Record<string, unknown> = {}): NoteInfo {
	const name = path.split("/").pop() ?? path;
	return { path, basename: name.replace(/\.md$/, ""), frontmatter };
}

const ctx = (notes: NoteInfo[] = [], backlinks = 0) => ({ notes, backlinks });

describe("buildHeader", () => {
	it("daily: 日付と曜日がタイトル、曜日の枠にフォーカスを当てる", () => {
		const h = buildHeader(note("daily/2026/11/2026-11-01.md", { type: "daily" }), ctx());
		expect(h.title).toBe("2026-11-01 SUN");
		expect(h.weekday).toBe(0);
		expect(h.items).toEqual([]);
	});

	it("daily でもファイル名が日付でなければ、ファイル名のタイトルで枠はなし", () => {
		const h = buildHeader(note("daily/memo.md", { type: "daily" }), ctx());
		expect(h.title).toBe("memo");
		expect(h.weekday).toBeNull();
	});

	it("note: tags と作成日", () => {
		const h = buildHeader(note("rag_basics.md", { type: "note", title: "RAG の基礎", tags: ["ai", "#llm"], created: "2026-11-01T09:00:00+09:00" }), ctx());
		expect(h.title).toBe("RAG の基礎");
		expect(h.weekday).toBeNull();
		expect(h.titleEdit).toEqual({ field: "title", multiline: false, initial: "RAG の基礎" });
		expect(h.items).toEqual([
			{ label: "Tags", values: [{ text: "ai" }, { text: "llm" }], edit: { field: "tags", multiline: false, initial: "ai, llm" } },
			{ label: "Created", values: [{ text: "2026-11-01" }] },
		]);
	});

	it("note: 編集できる項目（Tags）は値がなくても出す。表示だけの項目（Created）は出さない（ADR-0238）", () => {
		const h = buildHeader(note("memo.md", { type: "note" }), ctx());
		expect(h.items).toEqual([{ label: "Tags", values: [], edit: { field: "tags", multiline: false, initial: "" } }]);
		// title がなければ、表示しているファイル名を初期値にする
		expect(h.titleEdit).toEqual({ field: "title", multiline: false, initial: "memo" });
	});

	it("source: origin(http/https だけリンク)、取得日、取り込み先の wiki ページ", () => {
		const wiki = note("wiki/rag.md", { type: "concept", title: "RAG", sources: ["sources/a.md"] });
		const other = note("wiki/x.md", { type: "topic", sources: ["sources/b.md"] });
		const h = buildHeader(note("sources/a.md", { type: "source", title: "記事", origin: "https://example.com/a", retrieved: "2026-10-31" }), ctx([wiki, other]));
		expect(h.items).toEqual([
			{
				label: "Origin",
				values: [{ text: "https://example.com/a", url: "https://example.com/a" }],
				edit: { field: "origin", multiline: false, initial: "https://example.com/a" },
			},
			{ label: "Retrieved", values: [{ text: "2026-10-31" }], edit: { field: "retrieved", multiline: false, initial: "2026-10-31" } },
			{ label: "Cited by", values: [{ text: "RAG", path: "wiki/rag.md" }] },
		]);
	});

	it("source: テンプレートのまま（origin が空）でも Origin と Retrieved の行を出す（ADR-0238）", () => {
		const h = buildHeader(note("sources/a.md", { type: "source", title: "記事", origin: null }), ctx());
		expect(h.items).toEqual([
			{ label: "Origin", values: [], edit: { field: "origin", multiline: false, initial: "" } },
			{ label: "Retrieved", values: [], edit: { field: "retrieved", multiline: false, initial: "" } },
		]);
	});

	it("source: http/https 以外の origin(javascript: など)はリンクにしない", () => {
		const h = buildHeader(note("sources/a.md", { type: "source", origin: "javascript:alert(1)" }), ctx());
		expect(h.items[0]?.values).toEqual([{ text: "javascript:alert(1)" }]);
	});

	it("wiki のページ: 出典の一覧(Vault にあればタイトル、URL はリンク)と、被リンクの数", () => {
		const src = note("sources/a.md", { type: "source", title: "記事" });
		const h = buildHeader(
			note("wiki/rag.md", { type: "concept", title: "RAG", sources: ["sources/a.md", "https://example.com", "sources/gone.md"] }),
			ctx([src], 3),
		);
		expect(h.title).toBe("RAG");
		expect(h.items).toEqual([
			{
				label: "Sources",
				values: [
					{ text: "記事", path: "sources/a.md" },
					{ text: "https://example.com", url: "https://example.com" },
					{ text: "sources/gone.md" },
				],
				edit: { field: "sources", multiline: true, initial: "sources/a.md\nhttps://example.com\nsources/gone.md" },
			},
			{ label: "Backlinks", values: [{ text: "3" }] },
		]);
	});

	it("wiki のページ: 出典も被リンクもなければ、編集できる Sources の行だけ", () => {
		expect(buildHeader(note("wiki/t.md", { type: "topic" }), ctx()).items).toEqual([{ label: "Sources", values: [], edit: { field: "sources", multiline: true, initial: "" } }]);
	});

	it("daily・対象外の type・型なしには、編集の指定を付けない（ADR-0238）", () => {
		for (const n of [note("daily/2026/11/2026-11-01.md", { type: "daily" }), note("daily/memo.md", { type: "daily" }), note("wiki/feedback.md", { type: "feedback" }), note("memo.md")]) {
			const h = buildHeader(n, ctx());
			expect(h.titleEdit).toBeUndefined();
			expect(h.items.every((it) => it.edit === undefined)).toBe(true);
		}
	});

	it("Properties 欄を隠すのは、専用のヘッダーを持つ type(daily / note / source / wiki)だけ", () => {
		for (const type of ["daily", "note", "source", "concept", "entity", "topic", "answer"]) {
			expect(buildHeader(note("x.md", { type }), ctx()).hideProperties).toBe(true);
		}
		for (const type of ["feedback", "index", "log", "member", ""]) {
			expect(buildHeader(note("x.md", type ? { type } : {}), ctx()).hideProperties).toBe(false);
		}
		// daily でもファイル名が日付でないときは、通常のヘッダーでも隠す
		expect(buildHeader(note("daily/memo.md", { type: "daily" }), ctx()).hideProperties).toBe(true);
	});

	it("対象外の type(feedback など)や型なしは、タイトルだけ", () => {
		const h = buildHeader(note("wiki/feedback.md", { type: "feedback" }), ctx());
		expect(h).toEqual({ title: "feedback", weekday: null, items: [], hideProperties: false });
		expect(buildHeader(note("memo.md"), ctx()).title).toBe("memo");
		expect(buildHeader(note("member/m-1.md", { type: "member", name: "佐藤さん" }), ctx()).title).toBe("佐藤さん");
	});
});
