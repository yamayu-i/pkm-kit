import { describe, expect, it } from "vitest";
import { barOf, dateAtX, dependencyArrows, dragBar, timelineColumns, timelineRange, DAY_PX, type TimelineSub } from "../src/core/timeline";

function s(id: string, extra: Partial<TimelineSub> = {}): TimelineSub {
	return { id, start: null, end: null, scheduled: [], softDeadline: null, deadline: null, dependsOn: [], ...extra };
}

// 2026-11-15 は日曜
const today = "2026-11-15";

describe("範囲（ADR-0143）", () => {
	it("Day: 日付と今日を含み、前後 2 日。最低 14 日", () => {
		expect(timelineRange([s("a", { start: "2026-11-16", end: "2026-11-20" })], today, "day")).toEqual({ from: "2026-11-13", days: 14 });
		expect(timelineRange([s("a", { start: "2026-11-10", end: "2026-12-10" }), s("b", { deadline: "2026-12-20" })], today, "day")).toEqual({ from: "2026-11-08", days: 45 });
		expect(timelineRange([], today, "day")).toEqual({ from: "2026-11-13", days: 14 });
	});

	it("Week: 日曜始まり・土曜終わりに広げ、最低 8 週", () => {
		const r = timelineRange([s("a", { start: "2026-11-18", end: "2026-11-20" })], today, "week");
		expect(r).toEqual({ from: "2026-11-08", days: 56 });
		const long = timelineRange([s("a", { start: "2026-11-18", end: "2027-02-10" })], today, "week");
		expect(long.from).toBe("2026-11-08");
		expect(long.days % 7).toBe(0);
		expect(long.days).toBe(98);
	});
});

describe("列の見出し", () => {
	it("Day: 日ごと。範囲の始まりと月の 1 日に月、日曜は週の区切り、土日は週末", () => {
		const cols = timelineColumns({ from: "2026-11-28", days: 5 }, "day");
		expect(cols.map((c) => [c.date, c.label, c.month, c.weekend, c.weekStart, c.span])).toEqual([
			["2026-11-28", "28", "Nov", true, false, 1],
			["2026-11-29", "29", null, true, true, 1],
			["2026-11-30", "30", null, false, false, 1],
			["2026-12-01", "1", "Dec", false, false, 1],
			["2026-12-02", "2", null, false, false, 1],
		]);
	});

	it("Week: 週ごと（日曜の日付）。範囲の始まりと月が変わった週に月", () => {
		const cols = timelineColumns({ from: "2026-11-15", days: 21 }, "week");
		expect(cols.map((c) => [c.date, c.label, c.month, c.span, c.weekStart])).toEqual([
			["2026-11-15", "11/15", "Nov", 7, true],
			["2026-11-22", "11/22", null, 7, true],
			["2026-11-29", "11/29", null, 7, true],
		]);
		expect(timelineColumns({ from: "2026-11-29", days: 14 }, "week").map((c) => c.month)).toEqual(["Nov", "Dec"]);
	});
});

describe("棒と位置", () => {
	it("start〜end。片方だけなら 1 日。逆なら入れ替える。期間がなければ null", () => {
		expect(barOf(s("a", { start: "2026-11-16", end: "2026-11-20" }))).toEqual({ start: "2026-11-16", end: "2026-11-20" });
		expect(barOf(s("a", { start: "2026-11-16" }))).toEqual({ start: "2026-11-16", end: "2026-11-16" });
		expect(barOf(s("a", { end: "2026-11-20" }))).toEqual({ start: "2026-11-20", end: "2026-11-20" });
		expect(barOf(s("a", { start: "2026-11-20", end: "2026-11-16" }))).toEqual({ start: "2026-11-16", end: "2026-11-20" });
		expect(barOf(s("a", { scheduled: ["2026-11-16"] }))).toBeNull();
	});

	it("x 座標から日付（目盛りの 1 日の幅で）", () => {
		const range = { from: "2026-11-13", days: 14 };
		expect(DAY_PX).toEqual({ day: 28, week: 8 });
		expect(dateAtX(range, 0, "day")).toBe("2026-11-13");
		expect(dateAtX(range, 27, "day")).toBe("2026-11-13");
		expect(dateAtX(range, 28 * 3 + 1, "day")).toBe("2026-11-16");
		expect(dateAtX(range, 8 * 7, "week")).toBe("2026-11-20");
		expect(dateAtX(range, -5, "day")).toBe("2026-11-13");
		expect(dateAtX(range, 9999, "day")).toBe("2026-11-26");
	});
});

describe("ドラッグ", () => {
	const bar = { start: "2026-11-16", end: "2026-11-20" };
	it("真ん中はずらす。両端は片方だけ。start は end を越えない", () => {
		expect(dragBar(bar, "move", 3)).toEqual({ start: "2026-11-19", end: "2026-11-23" });
		expect(dragBar(bar, "move", -2)).toEqual({ start: "2026-11-14", end: "2026-11-18" });
		expect(dragBar(bar, "start", 2)).toEqual({ start: "2026-11-18", end: "2026-11-20" });
		expect(dragBar(bar, "start", 9)).toEqual({ start: "2026-11-20", end: "2026-11-20" });
		expect(dragBar(bar, "end", -9)).toEqual({ start: "2026-11-16", end: "2026-11-16" });
		expect(dragBar(bar, "end", 1)).toEqual({ start: "2026-11-16", end: "2026-11-21" });
	});
});

describe("依存の矢印", () => {
	it("両方に棒があるときだけ。依存先の end より前に始まると遅れ", () => {
		const subs = [
			s("a", { start: "2026-11-16", end: "2026-11-20" }),
			s("b", { start: "2026-11-19", end: "2026-11-22", dependsOn: ["a"] }),
			s("c", { start: "2026-11-21", dependsOn: ["a", "b", "zzzzzz"] }),
			s("d", { scheduled: ["2026-11-25"], dependsOn: ["a"] }),
		];
		expect(dependencyArrows(subs)).toEqual([
			{ from: "a", to: "b", late: true },
			{ from: "a", to: "c", late: false },
			{ from: "b", to: "c", late: true },
		]);
	});
});
