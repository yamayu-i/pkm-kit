import { describe, expect, it } from "vitest";
import { parseDateInput, parseTimeInput } from "../src/core/date-input";

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
		["+m", "2026-12-01"],
		["-m", "2026-10-01"],
		["+2m", "2027-01-01"],
		["-11m", "2025-12-01"],
	])("月: %s", (input, expected) => {
		expect(parseDateInput(input, TODAY)).toBe(expected);
	});

	it("移動先の月にない日は月末にする", () => {
		expect(parseDateInput("+m", "2027-01-31")).toBe("2027-02-28");
		expect(parseDateInput("+m", "2028-01-31")).toBe("2028-02-29");
		expect(parseDateInput("-m", "2026-03-31")).toBe("2026-02-28");
	});

	it("年をまたいでも基準の日から数える", () => {
		expect(parseDateInput("+1", "2026-12-31")).toBe("2027-01-01");
		expect(parseDateInput("+mon", "2026-12-31")).toBe("2027-01-04");
	});

	it.each(["", "5", "123", "12345", "1234567", "32", "00", "1301", "0231", "261301", "20260231", "+", "-", "+0mon", "+x", "monday", "+1.5", "2026-2-3", "2026-02-31", "++1"])(
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
		[" 0930 ", "09:30"],
	])("%s", (input, expected) => {
		expect(parseTimeInput(input)).toBe(expected);
	});

	it.each(["", "930", "2400", "1260", "9:30", "12:60", "abcd", "09300"])("読めない入力は null: %j", (input) => {
		expect(parseTimeInput(input)).toBeNull();
	});
});
