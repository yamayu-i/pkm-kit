import { describe, expect, it } from "vitest";
import { findInlineCode, cursorInside } from "../src/core/inline-code.ts";

describe("findInlineCode（行の文字列と位置から、インラインコードを取り出す）", () => {
	it("位置がコードの中なら、中身と範囲（` を含む）を返す", () => {
		const line = "実行は `git status` で確かめる";
		const at = line.indexOf("status");
		expect(findInlineCode(line, at)).toEqual({ from: 4, to: 16, text: "git status" });
	});

	it("` の上も範囲に入る", () => {
		const line = "a `x` b";
		expect(findInlineCode(line, 2)?.text).toBe("x");
		expect(findInlineCode(line, 4)?.text).toBe("x");
	});

	it("コードの外なら null", () => {
		const line = "a `x` b";
		expect(findInlineCode(line, 0)).toBeNull();
		expect(findInlineCode(line, 6)).toBeNull();
	});

	it("`` で囲めば中に ` を含められる。前後の空白 1 つずつは除く", () => {
		const line = "書き方は `` a`b `` です";
		expect(findInlineCode(line, line.indexOf("a`b"))?.text).toBe("a`b");
	});

	it("同じ行の 2 つ目のコードも取れる", () => {
		const line = "`one` と `two`";
		expect(findInlineCode(line, line.indexOf("two"))?.text).toBe("two");
	});

	it("閉じていない ` はコードにしない", () => {
		expect(findInlineCode("a `x b", 3)).toBeNull();
	});

	it("開きと閉じの ` の数が違えばコードにしない（次の同じ数の ` まで探す）", () => {
		const line = "``a` b``";
		expect(findInlineCode(line, 2)?.text).toBe("a` b");
	});

	it("\\` はコードの始まりにしない", () => {
		expect(findInlineCode("a \\`x` b", 4)).toBeNull();
	});

	it("中身が空白だけなら、空白を除かない", () => {
		expect(findInlineCode("`  `", 1)?.text).toBe("  ");
	});
});

describe("cursorInside（編集中にカーソルがコードの中にあるか）", () => {
	const span = { from: 10, to: 20 };
	it("範囲の中か端にあれば true（記号が見えている）", () => {
		expect(cursorInside(span, [10])).toBe(true);
		expect(cursorInside(span, [15])).toBe(true);
		expect(cursorInside(span, [20])).toBe(true);
	});
	it("範囲の外なら false。複数のカーソルのどれかが中なら true", () => {
		expect(cursorInside(span, [9, 21])).toBe(false);
		expect(cursorInside(span, [0, 12])).toBe(true);
	});
});
