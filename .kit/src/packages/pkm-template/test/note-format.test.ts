import { describe, expect, it } from "vitest";
import { shortDate, tagList } from "../src/core/note-format";

describe("shortDate", () => {
	it("日時の文字列から日付(YYYY-MM-DD)だけを取り出す", () => {
		expect(shortDate("2026-11-01T09:00:00+09:00")).toBe("2026-11-01");
		expect(shortDate("2026-11-01")).toBe("2026-11-01");
	});

	it("日付の形でない値は空文字", () => {
		expect(shortDate(undefined)).toBe("");
		expect(shortDate(null)).toBe("");
		expect(shortDate("昨日")).toBe("");
		expect(shortDate(20261101)).toBe("");
	});
});

describe("tagList", () => {
	it("リストの文字列を返す。先頭の # は取る", () => {
		expect(tagList(["a", "#b", "  c  "])).toEqual(["a", "b", "c"]);
	});

	it("カンマか空白で区切った文字列も受け付ける", () => {
		expect(tagList("a, b  #c")).toEqual(["a", "b", "c"]);
	});

	it("文字列でない要素や空は捨てる。リストでも文字列でもなければ空", () => {
		expect(tagList(["a", 1, null, "", "  "])).toEqual(["a"]);
		expect(tagList(undefined)).toEqual([]);
		expect(tagList({ a: 1 })).toEqual([]);
	});
});
