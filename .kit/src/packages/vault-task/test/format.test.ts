import { describe, expect, it } from "vitest";
import { parseCaptureText } from "../src/core/capture";
import { formatMinutes, parseDurationInput } from "../src/core/format";
import { nextIds } from "../src/core/ids";

describe("formatMinutes", () => {
	it("60m = 1h、24h = 1d で換算する", () => {
		expect(formatMinutes(0)).toBe("0m");
		expect(formatMinutes(15)).toBe("15m");
		expect(formatMinutes(60)).toBe("1h");
		expect(formatMinutes(480)).toBe("8h");
		expect(formatMinutes(1440)).toBe("1d");
		expect(formatMinutes(2 * 1440 + 3 * 60 + 33)).toBe("2d3h33m");
		expect(formatMinutes(-90)).toBe("-1h30m");
	});
});

describe("parseDurationInput", () => {
	it("m / h / d の単位を読んで分にする", () => {
		expect(parseDurationInput("1m")).toBe(1);
		expect(parseDurationInput("2h")).toBe(120);
		expect(parseDurationInput("1d")).toBe(1440);
		expect(parseDurationInput("0.5d")).toBe(720);
		expect(parseDurationInput("1.5h")).toBe(90);
	});

	it("組み合わせ（formatMinutes の表記）と空白、大文字を読める", () => {
		expect(parseDurationInput("2d3h33m")).toBe(2 * 1440 + 3 * 60 + 33);
		expect(parseDurationInput(" 1h 30m ")).toBe(90);
		expect(parseDurationInput("2H")).toBe(120);
	});

	it("単位のない数字は分として読む", () => {
		expect(parseDurationInput("45")).toBe(45);
	});

	it("読めないもの・同じ単位の重複・0 以下は null", () => {
		expect(parseDurationInput("")).toBeNull();
		expect(parseDurationInput("abc")).toBeNull();
		expect(parseDurationInput("1w")).toBeNull();
		expect(parseDurationInput("1h1h")).toBeNull();
		expect(parseDurationInput("1h 30")).toBeNull();
		expect(parseDurationInput("0m")).toBeNull();
		expect(parseDurationInput("-1h")).toBeNull();
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
