import { describe, expect, it } from "vitest";
import { dailyDate, noteTitle, WEEKDAYS } from "../src/core/note-title";

describe("noteTitle", () => {
	it("title があればそれを使う", () => {
		expect(noteTitle({ title: "RAG の基礎", name: "x" }, "rag_basics")).toBe("RAG の基礎");
	});

	it("title がなければ name、それもなければファイル名", () => {
		expect(noteTitle({ name: "佐藤さん" }, "m-1")).toBe("佐藤さん");
		expect(noteTitle({}, "rag_basics")).toBe("rag_basics");
		expect(noteTitle(undefined, "rag_basics")).toBe("rag_basics");
	});

	it("空文字・空白だけ・文字列でない値は無いものとして扱う", () => {
		expect(noteTitle({ title: "", name: "n" }, "f")).toBe("n");
		expect(noteTitle({ title: "   " }, "f")).toBe("f");
		expect(noteTitle({ title: null }, "f")).toBe("f");
		expect(noteTitle({ title: ["a"] }, "f")).toBe("f");
		expect(noteTitle({ title: { a: 1 } }, "f")).toBe("f");
	});

	it("数値の title(YAML で 2026 と書いた場合)は文字列にする", () => {
		expect(noteTitle({ title: 2026 }, "f")).toBe("2026");
	});

	it("前後の空白は取る", () => {
		expect(noteTitle({ title: "  a  " }, "f")).toBe("a");
	});
});

describe("dailyDate", () => {
	it("YYYY-MM-DD のファイル名から日付と曜日を導く", () => {
		expect(dailyDate("2026-11-01")).toEqual({ date: "2026-11-01", weekday: 0, label: "2026-11-01 SUN" });
		expect(dailyDate("2026-10-31")).toEqual({ date: "2026-10-31", weekday: 6, label: "2026-10-31 SAT" });
		expect(dailyDate("2026-11-02")?.label).toBe("2026-11-02 MON");
	});

	it("うるう日は有効、存在しない日付は null", () => {
		expect(dailyDate("2028-02-29")?.label).toBe("2028-02-29 TUE");
		expect(dailyDate("2026-02-29")).toBeNull();
		expect(dailyDate("2026-13-01")).toBeNull();
		expect(dailyDate("2026-00-10")).toBeNull();
		expect(dailyDate("2026-04-31")).toBeNull();
	});

	it("日付の形でないファイル名は null", () => {
		expect(dailyDate("memo")).toBeNull();
		expect(dailyDate("2026-1-1")).toBeNull();
		expect(dailyDate("2026-11-01-a")).toBeNull();
	});
});

describe("WEEKDAYS", () => {
	it("日曜始まりの 7 つ", () => {
		expect(WEEKDAYS).toEqual(["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]);
	});
});
