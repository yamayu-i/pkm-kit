import { describe, expect, it } from "vitest";
import { formatDateLabel, formatDateTimeLabel, formatDateTimeValue, parseDateInput, parseDateTimeInput, parseDurationInput, parseTimeInput } from "../src/date-input.ts";

/** ADR-0228: 日付・時刻・期間の入力言語 */

/** 2026-11-01 は日曜 */
const TODAY = "2026-11-01";

describe("parseDateInput", () => {
	it.each([
		["15", "2026-11-15"],
		["1224", "2026-12-24"],
		["0229", null],
		["270105", "2027-01-05"],
		["20270105", "2027-01-05"],
		["2027-01-05", "2027-01-05"],
		["2027/01/05", "2027-01-05"],
		[" 15 ", "2026-11-15"],
	])("数字と日付の形: %s", (input, expected) => {
		expect(parseDateInput(input, TODAY)).toBe(expected);
	});

	it.each([
		["+3", "2026-11-04"],
		["-1", "2026-10-31"],
		["+0", "2026-11-01"],
		["+30", "2026-12-01"],
		["+1d", "2026-11-02"],
		["+d", "2026-11-02"],
		["-2d", "2026-10-30"],
		["+0d", "2026-11-01"],
		["+10D", "2026-11-11"],
	])("日数: %s", (input, expected) => {
		expect(parseDateInput(input, TODAY)).toBe(expected);
	});

	it.each([
		["mon", "2026-11-02"],
		["+mon", "2026-11-02"],
		["-mon", "2026-10-26"],
		["sun", "2026-11-08"],
		["+sun", "2026-11-08"],
		["-sun", "2026-10-25"],
		["+2mon", "2026-11-09"],
		["-2mon", "2026-10-19"],
		["+1mon", "2026-11-02"],
		["MON", "2026-11-02"],
		["+2Sat", "2026-11-14"],
	])("曜日: %s", (input, expected) => {
		expect(parseDateInput(input, TODAY)).toBe(expected);
	});

	it.each([
		["+w", "2026-11-08"],
		["-w", "2026-10-25"],
		["+2w", "2026-11-15"],
		["-2w", "2026-10-18"],
	])("週: %s", (input, expected) => {
		expect(parseDateInput(input, TODAY)).toBe(expected);
	});

	it.each([
		["+mo", "2026-12-01"],
		["-mo", "2026-10-01"],
		["+2mo", "2027-01-01"],
		["-11mo", "2025-12-01"],
		["+y", "2027-11-01"],
		["-2y", "2024-11-01"],
	])("月と年: %s", (input, expected) => {
		expect(parseDateInput(input, TODAY)).toBe(expected);
	});

	it("移動先の月にない日は月末にする", () => {
		expect(parseDateInput("+mo", "2027-01-31")).toBe("2027-02-28");
		expect(parseDateInput("+mo", "2028-01-31")).toBe("2028-02-29");
		expect(parseDateInput("-mo", "2026-03-31")).toBe("2026-02-28");
		expect(parseDateInput("+y", "2028-02-29")).toBe("2029-02-28");
	});

	it.each([
		["+1w2d", "2026-11-10"],
		["+2d1w", "2026-11-10"],
		["-1w1d", "2026-10-24"],
		["+1mo1d", "2026-12-02"],
		["+1y1mo", "2027-12-01"],
	])("単位の組み合わせ: %s", (input, expected) => {
		expect(parseDateInput(input, TODAY)).toBe(expected);
	});

	it.each([
		["today", "2026-11-01"],
		["tomorrow", "2026-11-02"],
		["yesterday", "2026-10-31"],
		["Tomorrow", "2026-11-02"],
	])("語: %s", (input, expected) => {
		expect(parseDateInput(input, TODAY)).toBe(expected);
	});

	it("年をまたいでも基準の日から数える", () => {
		expect(parseDateInput("+1", "2026-12-31")).toBe("2027-01-01");
		expect(parseDateInput("+mon", "2026-12-31")).toBe("2027-01-04");
	});

	it.each(["", "5", "123", "12345", "1234567", "32", "00", "1301", "0231", "261301", "20260231", "+", "-", "+0mon", "+x", "monday", "+1.5", "2026-2-3", "2026-02-31", "++1", "+m", "+2m", "+1w1w", "+1w2", "tom", "tue2", "+1h"])(
		"読めない入力は null: %j",
		(input) => {
			expect(parseDateInput(input, "2026-02-10")).toBeNull();
		},
	);
});

describe("parseTimeInput", () => {
	it.each([
		["0930", "09:30"],
		["2359", "23:59"],
		["0000", "00:00"],
		["09:30", "09:30"],
		["9:30", "09:30"],
		[" 0930 ", "09:30"],
	])("%s", (input, expected) => {
		expect(parseTimeInput(input)).toBe(expected);
	});

	it.each(["", "930", "2400", "1260", "24:00", "12:60", "abcd", "09300", "9:3"])("読めない入力は null: %j", (input) => {
		expect(parseTimeInput(input)).toBeNull();
	});
});

// 2026-11-16 (MON) 23:00（テストは日本時間）
const NOW = new Date("2026-11-16T23:00:00+09:00").getTime();
const at = (s: string) => new Date(`${s}:00+09:00`).getTime();

describe("parseDateTimeInput", () => {
	it.each([
		["-22m", "2026-11-16T22:38"],
		["-70m", "2026-11-16T21:50"],
		["-1h10m", "2026-11-16T21:50"],
		["-2h", "2026-11-16T21:00"],
		["now", "2026-11-16T23:00"],
		["2200", "2026-11-16T22:00"],
		["9:30", "2026-11-16T09:30"],
		["2200 -1d", "2026-11-15T22:00"],
		["2200 yesterday", "2026-11-15T22:00"],
		["0930 fri", "2026-11-20T09:30"],
		["2200 15", "2026-11-15T22:00"],
		["2200 0826", "2026-08-26T22:00"],
		["2200 260826", "2026-08-26T22:00"],
		["2026-08-26 22:00", "2026-08-26T22:00"],
		["22:00 2026-08-26", "2026-08-26T22:00"],
		[" -22M ", "2026-11-16T22:38"],
		["2200  -1d", "2026-11-15T22:00"],
	])("%s → %s", (input, expected) => {
		expect(parseDateTimeInput(input, { now: NOW })).toBe(at(expected));
	});

	it("相対の時刻は、1 分未満を切り捨てた今から数える", () => {
		expect(parseDateTimeInput("-1m", { now: NOW + 30_000 })).toBe(at("2026-11-16T22:59"));
		expect(parseDateTimeInput("now", { now: NOW + 30_000 })).toBe(NOW);
	});

	it("`+` の相対の時刻は、欄が許すときだけ読む", () => {
		expect(parseDateTimeInput("+10m", { now: NOW })).toBeNull();
		expect(parseDateTimeInput("+10m", { now: NOW, allowFuture: true })).toBe(at("2026-11-16T23:10"));
	});

	it("時刻だけ・過去向き: 今か今より前で、いちばん近いその時刻", () => {
		const past = { kind: "past" } as const;
		expect(parseDateTimeInput("2200", { now: NOW, timeOnly: past })).toBe(at("2026-11-16T22:00"));
		expect(parseDateTimeInput("2300", { now: NOW, timeOnly: past })).toBe(NOW);
		expect(parseDateTimeInput("2330", { now: NOW, timeOnly: past })).toBe(at("2026-11-15T23:30"));
		expect(parseDateTimeInput("2330", { now: at("2026-12-01T01:00"), timeOnly: past })).toBe(at("2026-11-30T23:30"));
	});

	it("時刻だけ・基準より後: 基準より後で、いちばん近いその時刻", () => {
		const after = { kind: "after", baseMs: at("2026-11-15T23:30") } as const;
		expect(parseDateTimeInput("2345", { now: NOW, timeOnly: after })).toBe(at("2026-11-15T23:45"));
		expect(parseDateTimeInput("0040", { now: NOW, timeOnly: after })).toBe(at("2026-11-16T00:40"));
		expect(parseDateTimeInput("2330", { now: NOW, timeOnly: after })).toBe(at("2026-11-16T23:30"));
	});

	it("時刻だけ・既定: 今日のその時刻（今より後でもよい）", () => {
		expect(parseDateTimeInput("2330", { now: NOW })).toBe(at("2026-11-16T23:30"));
	});

	it("日付と組み合わせた時刻は、時刻だけの規則を使わない", () => {
		expect(parseDateTimeInput("2330 today", { now: NOW, timeOnly: { kind: "past" } })).toBe(at("2026-11-16T23:30"));
	});

	it.each(["", "fri", "-1d", "1224 2200", "-1d 2200", "-30", "2400", "2260", "2200 0231", "2200-1d", "152200", "08262200", "2608262200", "abc", "-m", "-0m10", "-22m -1d", "now -1d", "2200 -1d x"])(
		"読めない: %j",
		(input) => {
			expect(parseDateTimeInput(input, { now: NOW })).toBeNull();
		},
	);

	it("書き換えた後の文字は同じ日時に戻る", () => {
		const ms = at("2026-08-26T22:05");
		expect(formatDateTimeValue(ms)).toBe("2026-08-26 22:05");
		expect(parseDateTimeInput(formatDateTimeValue(ms), { now: NOW })).toBe(ms);
	});
});

describe("parseDurationInput", () => {
	it("m / h / d の単位を読んで分にする。単位のない数字は分", () => {
		expect(parseDurationInput("1m")).toBe(1);
		expect(parseDurationInput("2h")).toBe(120);
		expect(parseDurationInput("0.5d")).toBe(720);
		expect(parseDurationInput("1h 30m")).toBe(90);
		expect(parseDurationInput("45")).toBe(45);
	});

	it("0 は 0 分（ADR-0247）", () => {
		expect(parseDurationInput("0")).toBe(0);
		expect(parseDurationInput("0m")).toBe(0);
		expect(parseDurationInput("0h")).toBe(0);
	});

	it("読めないもの・同じ単位の重複・負は null", () => {
		expect(parseDurationInput("1w")).toBeNull();
		expect(parseDurationInput("1h1h")).toBeNull();
		expect(parseDurationInput("-1h")).toBeNull();
	});
});

describe("表示", () => {
	it("曜日は英大文字 3 字", () => {
		expect(formatDateLabel("2026-11-24")).toBe("2026-11-24 TUE");
		expect(formatDateTimeLabel(at("2026-11-24T22:00"))).toBe("2026-11-24 TUE 22:00");
	});
});
