import { describe, expect, it } from "vitest";
import { addDays } from "../src/core/dates";
import { occursOn, parseMonthSpec, parseRepeat, type RepeatRule } from "../src/core/repeat";

function rule(value: unknown): RepeatRule {
	const r = parseRepeat(value);
	if (!r.ok) throw new Error(r.error);
	return r.value;
}

function datesIn(r: RepeatRule, anchor: string, from: string, days: number): string[] {
	const out: string[] = [];
	for (let i = 0; i < days; i++) {
		const d = addDays(from, i);
		if (occursOn(r, anchor, d)) out.push(d);
	}
	return out;
}

describe("parseMonthSpec", () => {
	it("日付・月末・第 N 曜日・最終曜日を読む", () => {
		expect(parseMonthSpec(15)).toEqual({ kind: "day", day: 15 });
		expect(parseMonthSpec("15")).toEqual({ kind: "day", day: 15 });
		expect(parseMonthSpec("last")).toEqual({ kind: "last" });
		expect(parseMonthSpec("2th-tue")).toEqual({ kind: "nth", n: 2, weekday: 2 });
		expect(parseMonthSpec("2nd-TUE")).toEqual({ kind: "nth", n: 2, weekday: 2 });
		expect(parseMonthSpec("last-fri")).toEqual({ kind: "lastWeekday", weekday: 5 });
	});

	it("範囲外や知らない曜日は読まない", () => {
		expect(parseMonthSpec(0)).toBeNull();
		expect(parseMonthSpec(32)).toBeNull();
		expect(parseMonthSpec("6th-mon")).toBeNull();
		expect(parseMonthSpec("2th-xyz")).toBeNull();
	});
});

describe("parseRepeat", () => {
	it("不正な指定はエラーにする", () => {
		expect(parseRepeat({ every: "year" }).ok).toBe(false);
		expect(parseRepeat({ every: "week" }).ok).toBe(false);
		expect(parseRepeat({ every: "week", on: ["funday"] }).ok).toBe(false);
		expect(parseRepeat({ every: "day", interval: 0 }).ok).toBe(false);
		expect(parseRepeat(null).ok).toBe(false);
	});

	it("on は 1 つだけなら配列でなくてもよい", () => {
		expect(rule({ every: "week", on: "fri" })).toEqual({ every: "week", interval: 1, weekdays: [5] });
	});
});

describe("occursOn", () => {
	it("毎日・隔日", () => {
		expect(datesIn(rule({ every: "day" }), "2026-11-01", "2026-11-01", 3)).toEqual(["2026-11-01", "2026-11-02", "2026-11-03"]);
		expect(datesIn(rule({ every: "day", interval: 2 }), "2026-11-01", "2026-11-01", 5)).toEqual(["2026-11-01", "2026-11-03", "2026-11-05"]);
	});

	it("起点より前は出てこない", () => {
		expect(occursOn(rule({ every: "day" }), "2026-11-01", "2026-10-31")).toBe(false);
	});

	it("毎週の曜日", () => {
		// 2026-11-02 は月曜
		expect(datesIn(rule({ every: "week", on: ["mon", "thu"] }), "2026-11-01", "2026-11-01", 10)).toEqual([
			"2026-11-02",
			"2026-11-05",
			"2026-11-09",
		]);
	});

	it("隔週は起点の週（月曜始まり）から数える", () => {
		// 起点 2026-11-04（水）の週 = 11/02〜11/08。その週の金曜（11/06）から 2 週ごと
		expect(datesIn(rule({ every: "week", interval: 2, on: ["fri", "mon"] }), "2026-11-04", "2026-11-01", 28)).toEqual([
			"2026-11-06",
			"2026-11-16",
			"2026-11-20",
		]);
	});

	it("第 2 火曜と最終金曜", () => {
		const r = rule({ every: "month", on: ["2th-tue", "last-fri"] });
		// 2026-11: 火曜は 3, 10, 17…、最終金曜は 27。2026-12: 第 2 火曜は 8、最終金曜は 25
		expect(datesIn(r, "2026-11-01", "2026-11-01", 61)).toEqual(["2026-11-10", "2026-11-27", "2026-12-08", "2026-12-25"]);
	});

	it("月末と、その月にない日付", () => {
		const r = rule({ every: "month", on: ["last", 30] });
		expect(datesIn(r, "2027-01-01", "2027-01-01", 90)).toEqual(["2027-01-30", "2027-01-31", "2027-02-28", "2027-03-30", "2027-03-31"]);
	});

	it("第 5 曜日がない月は出てこない", () => {
		const r = rule({ every: "month", on: ["5th-sat"] });
		// 2026-10 は 31 日（土）が第 5 土曜、2026-11 は第 5 土曜（29 日は日曜）がない
		expect(datesIn(r, "2026-10-01", "2026-10-01", 61)).toEqual(["2026-10-31"]);
	});

	it("隔月は起点の月から数える", () => {
		const r = rule({ every: "month", interval: 2, on: [1] });
		expect(datesIn(r, "2026-11-15", "2026-11-01", 100)).toEqual(["2027-01-01"]);
	});
});
