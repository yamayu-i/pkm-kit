import { describe, expect, it } from "vitest";
import { notePreviewBlocks } from "../src/core/note-preview";
import { newSubIssueInput } from "../src/core/sub-issue";

describe("Note", () => {
	it("新規のサブには見出しと空行を入れ、指定された本文は空文字も含めて残す", () => {
		expect(newSubIssueInput({ summary: "Task" }, "aaaaaa", "2026-11-15").body).toBe("# Note\n\n");
		expect(newSubIssueInput({ summary: "Task", body: "" }, "aaaaaa", "2026-11-15").body).toBe("");
	});
	it("カーソルと選択範囲を含む段落はプレビューに置き換えない", () => {
		const text = "# Note\n\nfirst\n\nlast";
		expect(notePreviewBlocks(text, [{ from: 8, to: 8 }])).toEqual([{ from: 0, to: 6 }, { from: 15, to: 19 }]);
		expect(notePreviewBlocks(text, [{ from: 0, to: text.length }])).toEqual([]);
	});
	it("コードフェンス内の空行を分割しない", () => {
		const text = "```md\n\n# code\n\n```\n\nedit";
		const blocks = notePreviewBlocks(text, [{ from: text.length, to: text.length }]);
		expect(blocks.map((b) => text.slice(b.from, b.to))).toEqual(["```md\n\n# code\n\n```"]);
	});
});
