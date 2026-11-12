import { describe, expect, it } from "vitest";
import { noteLink } from "../src/core/note-link";

describe("noteLink", () => {
	it("title を表示テキストにする", () => {
		expect(noteLink("topics/foo.md", { title: "日本語のタイトル" })).toBe("[日本語のタイトル](topics/foo.md)");
	});
	it("title がなければファイル名（拡張子なし）", () => {
		expect(noteLink("topics/foo.md", {})).toBe("[foo](topics/foo.md)");
		expect(noteLink("foo.md", undefined)).toBe("[foo](foo.md)");
	});
	it("空白と括弧をエンコードし、表示テキストの [] を退避する", () => {
		expect(noteLink("a b/c (1).md", { title: "[x]" })).toBe("[\\[x\\]](a%20b/c%20%281%29.md)");
	});
});
