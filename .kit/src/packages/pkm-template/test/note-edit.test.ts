import { describe, expect, it } from "vitest";
import { parseEdit } from "../src/core/note-edit";

describe("parseEdit（ヘッダーの入力を frontmatter の値にする。ADR-0238）", () => {
	it("title: 前後の空白を除く。空は拒む", () => {
		expect(parseEdit("title", "  RAG の基礎 ")).toEqual({ ok: true, value: "RAG の基礎" });
		expect(parseEdit("title", "   ").ok).toBe(false);
	});

	it("tags: カンマか空白で区切り、先頭の # と重複と空を除く。空ならから のリスト", () => {
		expect(parseEdit("tags", "#ai, llm  ai,,rag")).toEqual({ ok: true, value: ["ai", "llm", "rag"] });
		expect(parseEdit("tags", " ")).toEqual({ ok: true, value: [] });
	});

	it("origin: 前後の空白を除く。空は空文字", () => {
		expect(parseEdit("origin", " https://example.com/a ")).toEqual({ ok: true, value: "https://example.com/a" });
		expect(parseEdit("origin", "")).toEqual({ ok: true, value: "" });
	});

	it("retrieved: 実在する YYYY-MM-DD だけ。空は空文字。読めなければ拒む", () => {
		expect(parseEdit("retrieved", " 2026-11-27 ")).toEqual({ ok: true, value: "2026-11-27" });
		expect(parseEdit("retrieved", "")).toEqual({ ok: true, value: "" });
		expect(parseEdit("retrieved", "2026-02-30").ok).toBe(false);
		expect(parseEdit("retrieved", "11/27").ok).toBe(false);
	});

	it("sources: 1 行 1 件。空の行と重複を除く。CRLF も行の区切り", () => {
		expect(parseEdit("sources", "sources/a.md\r\n\n https://example.com \nsources/a.md\n")).toEqual({ ok: true, value: ["sources/a.md", "https://example.com"] });
		expect(parseEdit("sources", "")).toEqual({ ok: true, value: [] });
	});

	it("拒むときは日本語の説明を返す", () => {
		const r = parseEdit("retrieved", "昨日");
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error).toMatch(/日付/);
	});
});
