import { describe, expect, it } from "vitest";
import { parseCaptureText } from "../src/core/capture";
import { formatMinutes, parseDaysInput } from "../src/core/format";
import { nextIds } from "../src/core/ids";

describe("formatMinutes", () => {
	it("8h = 1d で換算する", () => {
		expect(formatMinutes(0)).toBe("0m");
		expect(formatMinutes(15)).toBe("15m");
		expect(formatMinutes(60)).toBe("1h");
		expect(formatMinutes(480)).toBe("1d");
		expect(formatMinutes(2 * 480 + 3 * 60 + 33)).toBe("2d3h33m");
		expect(formatMinutes(-90)).toBe("-1h30m");
	});
});

describe("parseDaysInput", () => {
	it("日数を分にする", () => {
		expect(parseDaysInput("0.5")).toBe(240);
		expect(parseDaysInput(" 2d ")).toBe(960);
		expect(parseDaysInput("abc")).toBeNull();
	});
});

describe("nextIds", () => {
	it("最大値 + 1 から連番で振る", () => {
		expect(nextIds("i", ["i-1", "i-7", "i-3", "r-20", "x"], 3)).toEqual(["i-8", "i-9", "i-10"]);
		expect(nextIds("r", [])).toEqual(["r-1"]);
	});
});

describe("parseCaptureText", () => {
	it("1 行 1 件。空行と箇条書きの記号を取り除く", () => {
		const text = "- 牛乳を買う\n\n- [ ] 請求書を送る\n* メモ整理\n1. 予約する\n  そのまま  \r\n- [x] 済み";
		expect(parseCaptureText(text)).toEqual(["牛乳を買う", "請求書を送る", "メモ整理", "予約する", "そのまま", "済み"]);
	});
});
