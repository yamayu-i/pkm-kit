import { describe, expect, it } from "vitest";
import { pasteIntoQuote, quoteBlock, quotePrefix, quoteSource } from "../src/core/blockquote.ts";

describe("quotePrefix（行の頭の引用の記号）", () => {
	it("> と、その後ろの空白 1 つを返す", () => {
		expect(quotePrefix("> 引用")).toBe("> ");
		expect(quotePrefix(">引用")).toBe(">");
		expect(quotePrefix(">")).toBe(">");
	});

	it("入れ子の記号はまとめて返す", () => {
		expect(quotePrefix("> > 入れ子")).toBe("> > ");
		expect(quotePrefix(">> 入れ子")).toBe(">> ");
	});

	it("頭の空白は 3 つまで（4 つならコードブロック）", () => {
		expect(quotePrefix("   > a")).toBe("   > ");
		expect(quotePrefix("    > a")).toBeNull();
	});

	it("引用でない行は null", () => {
		expect(quotePrefix("ふつうの行")).toBeNull();
		expect(quotePrefix("a > b")).toBeNull();
		expect(quotePrefix("")).toBeNull();
	});
});

describe("pasteIntoQuote（引用の中に貼る文字に、記号を付ける）", () => {
	it("2 行目から下に、カーソルの行と同じ記号を付ける", () => {
		expect(pasteIntoQuote("> ", 2, "一\n二\n三")).toBe("一\n> 二\n> 三");
	});

	it("入れ子の引用では、入れ子の記号を付ける", () => {
		expect(pasteIntoQuote("> > ", 4, "一\n二")).toBe("一\n> > 二");
	});

	it("途中の空行には、末尾の空白を除いた記号だけを付ける（引用を切らない）", () => {
		expect(pasteIntoQuote("> ", 2, "一\n\n二")).toBe("一\n>\n> 二");
	});

	it("最後が改行なら、元の行の続きが記号の後ろに続く", () => {
		expect(pasteIntoQuote("> 前後", 3, "一\n")).toBe("一\n> ");
	});

	it("CRLF は LF にそろえる", () => {
		expect(pasteIntoQuote("> ", 2, "一\r\n二")).toBe("一\n> 二");
	});

	it("1 行だけなら手を出さない（null）", () => {
		expect(pasteIntoQuote("> ", 2, "一")).toBeNull();
	});

	it("引用でない行なら null", () => {
		expect(pasteIntoQuote("ふつう", 3, "一\n二")).toBeNull();
	});

	it("カーソルが記号より前なら null", () => {
		expect(pasteIntoQuote("> a", 0, "一\n二")).toBeNull();
		expect(pasteIntoQuote("> > a", 2, "一\n二")).toBeNull();
	});
});

describe("quoteBlock（ひと続きの引用の行の範囲）", () => {
	const doc = ["前", "> 一", "> 二", ">", "> 三", "", "> 別"];
	const lineAt = (n: number): string | null => doc[n] ?? null;

	it("上下に、引用の行が続くところまで広げる", () => {
		expect(quoteBlock(lineAt, 2)).toEqual({ first: 1, last: 4 });
		expect(quoteBlock(lineAt, 1)).toEqual({ first: 1, last: 4 });
	});

	it("空行で区切られた引用は別のまとまり", () => {
		expect(quoteBlock(lineAt, 6)).toEqual({ first: 6, last: 6 });
	});

	it("引用でない行なら null", () => {
		expect(quoteBlock(lineAt, 0)).toBeNull();
		expect(quoteBlock(lineAt, 5)).toBeNull();
	});
});

describe("quoteSource（コピーする生の文）", () => {
	it("外側の > を 1 段だけ外す。記法はそのまま", () => {
		expect(quoteSource(["> **一**", "> [リンク](a.md)"])).toBe("**一**\n[リンク](a.md)");
	});

	it("入れ子の引用は 1 段残す", () => {
		expect(quoteSource(["> 外", "> > 内"])).toBe("外\n> 内");
	});

	it("記号だけの行は空行になる", () => {
		expect(quoteSource(["> 一", ">", "> 二"])).toBe("一\n\n二");
	});

	it("コールアウトは、[!type] の行を除いた本文を返す", () => {
		expect(quoteSource(["> [!note] 題", "> 本文", "> 二行目"])).toBe("本文\n二行目");
		expect(quoteSource(["> [!tip]- 畳む", "> 本文"])).toBe("本文");
	});

	it("> の後ろに空白がなくても外す", () => {
		expect(quoteSource([">一", ">二"])).toBe("一\n二");
	});
});
