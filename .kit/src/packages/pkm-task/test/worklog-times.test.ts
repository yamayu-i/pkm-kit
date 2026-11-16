import { describe, expect, it } from "vitest";
import { clockValueAt, dialPositions, formatTimeInput, parseTimeInputAt, planWorklogTimes } from "../src/core/worklog-times";

/** ADR-0193: 記録の開始・終了の短い書き方と、ダイアログの操作 */

// 2026-11-16 (MON) 23:00（テストは日本時間）
const NOW = new Date("2026-11-16T23:00:00+09:00").getTime();
const at = (s: string) => new Date(`${s}:00+09:00`).getTime();

describe("parseTimeInputAt", () => {
	it.each([
		["-22m", "2026-11-16T22:38"],
		["-70m", "2026-11-16T21:50"],
		["-1h10m", "2026-11-16T21:50"],
		["-2h", "2026-11-16T21:00"],
		["2200", "2026-11-16T22:00"],
		["2200-1d", "2026-11-15T22:00"],
		["2200-3d", "2026-11-13T22:00"],
		["152200", "2026-11-15T22:00"],
		["08262200", "2026-08-26T22:00"],
		["2608262200", "2026-08-26T22:00"],
		["2026-08-26 22:00", "2026-08-26T22:00"],
		[" -22M ", "2026-11-16T22:38"],
	])("%s → %s", (input, expected) => {
		expect(parseTimeInputAt(input, NOW)).toBe(at(expected));
	});

	it("1 分未満を切り捨てた今を基準にする", () => {
		expect(parseTimeInputAt("-1m", NOW + 30_000)).toBe(at("2026-11-16T22:59"));
	});

	it("月をまたぐ日の引き算", () => {
		expect(parseTimeInputAt("0900-1d", at("2026-12-01T10:00"))).toBe(at("2026-11-30T09:00"));
	});

	it.each(["", "+10m", "-30", "262200-1d", "2400", "2260", "3122000", "0231 2200", "02302200", "abc", "-m", "-1d", "22:00", "-0m10"])("読めない: %j", (input) => {
		expect(parseTimeInputAt(input, NOW)).toBeNull();
	});

	it("今より後は null（未来の日時）", () => {
		expect(parseTimeInputAt("2301", NOW)).toBeNull();
		expect(parseTimeInputAt("262200", NOW)).toBeNull();
		expect(parseTimeInputAt("2300", NOW)).toBe(NOW);
	});

	it("書き換えた後の文字は同じ日時に戻る", () => {
		const ms = at("2026-08-26T22:05");
		expect(formatTimeInput(ms)).toBe("2026-08-26 22:05");
		expect(parseTimeInputAt(formatTimeInput(ms), NOW)).toBe(ms);
	});
});

describe("planWorklogTimes", () => {
	const from = at("2026-11-16T22:00");
	const to = at("2026-11-16T22:30");

	it("記録中・To が空: from を直して続ける", () => {
		expect(planWorklogTimes({ running: true, fromMs: from, toMs: null, now: NOW })).toEqual({ kind: "continue", fromMs: from });
	});
	it("記録中・To あり: from と to を直して止める", () => {
		expect(planWorklogTimes({ running: true, fromMs: from, toMs: to, now: NOW })).toEqual({ kind: "stop", fromMs: from, toMs: to });
	});
	it("記録なし・To が空: from から始める", () => {
		expect(planWorklogTimes({ running: false, fromMs: from, toMs: null, now: NOW })).toEqual({ kind: "start", fromMs: from });
	});
	it("記録なし・To あり: 記録を足す", () => {
		expect(planWorklogTimes({ running: false, fromMs: from, toMs: to, now: NOW })).toEqual({ kind: "add", fromMs: from, toMs: to });
	});
	it("1 分未満でも止められる（手で入れた長さ）", () => {
		expect(planWorklogTimes({ running: true, fromMs: from, toMs: from + 30_000, now: NOW }).kind).toBe("stop");
	});
	it.each([
		[{ fromMs: null, toMs: null }, "From を入力してください"],
		[{ fromMs: to, toMs: from }, "To は From より後にしてください"],
		[{ fromMs: from, toMs: from }, "To は From より後にしてください"],
		[{ fromMs: NOW + 60_000, toMs: null }, "今より後の日時は入れられません"],
		[{ fromMs: from, toMs: NOW + 60_000 }, "今より後の日時は入れられません"],
	])("エラー %j", (input, error) => {
		expect(planWorklogTimes({ running: true, now: NOW, ...input })).toEqual({ kind: "error", error });
	});
});

describe("時計のダイヤル", () => {
	it("時: 外の輪が 0〜11、内の輪が 12〜23。真上が 0 / 12", () => {
		expect(clockValueAt("hour", 0, -1)).toBe(0);
		expect(clockValueAt("hour", 1, 0)).toBe(3);
		expect(clockValueAt("hour", 0, 1)).toBe(6);
		expect(clockValueAt("hour", -1, 0)).toBe(9);
		expect(clockValueAt("hour", 0, -0.5)).toBe(12);
		expect(clockValueAt("hour", 0.5, 0)).toBe(15);
		expect(clockValueAt("hour", -0.5, 0)).toBe(21);
	});
	it("分: 1 分きざみで、一周が 60", () => {
		expect(clockValueAt("minute", 0, -1)).toBe(0);
		expect(clockValueAt("minute", 1, 0)).toBe(15);
		expect(clockValueAt("minute", 0, 1)).toBe(30);
		expect(clockValueAt("minute", -1, -0.0001)).toBe(45);
		// 真上の少し左は 59 ではなく、近い方に丸める
		expect(clockValueAt("minute", -0.01, -1)).toBe(0);
	});
	it("数字の位置: 時は 24 個（内外）、分は 5 分おきの 12 個", () => {
		const hours = dialPositions("hour");
		expect(hours).toHaveLength(24);
		expect(hours.find((p) => p.value === 0)).toMatchObject({ inner: false });
		expect(hours.find((p) => p.value === 12)).toMatchObject({ inner: true });
		expect(dialPositions("minute").map((p) => p.value)).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
	});
});
