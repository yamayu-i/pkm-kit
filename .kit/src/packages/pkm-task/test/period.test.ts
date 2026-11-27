import { describe, expect, it } from "vitest";
import { formatPeriod, periodError, pickPeriodDay, readPeriodTexts } from "../src/core/period";

describe("期間のダイアログ（ADR-0245）", () => {
	it("1 回目に押した日が Start、2 回目が End。Start より前を押したら Start にし直す。両方あれば選び直す", () => {
		const empty = { start: null, end: null };
		const a = pickPeriodDay(empty, "2026-11-10");
		expect(a).toEqual({ start: "2026-11-10", end: null });
		expect(pickPeriodDay(a, "2026-11-12")).toEqual({ start: "2026-11-10", end: "2026-11-12" });
		expect(pickPeriodDay(a, "2026-11-10")).toEqual({ start: "2026-11-10", end: "2026-11-10" });
		expect(pickPeriodDay(a, "2026-11-08")).toEqual({ start: "2026-11-08", end: null });
		expect(pickPeriodDay({ start: "2026-11-10", end: "2026-11-12" }, "2026-11-20")).toEqual({ start: "2026-11-20", end: null });
	});

	it("片方だけと逆転は理由を返す。両方・どちらもなしは通す", () => {
		expect(periodError({ start: null, end: null })).toBeNull();
		expect(periodError({ start: "2026-11-10", end: "2026-11-10" })).toBeNull();
		expect(periodError({ start: "2026-11-10", end: null })).toMatch(/End/);
		expect(periodError({ start: null, end: "2026-11-10" })).toMatch(/Start/);
		expect(periodError({ start: "2026-11-10", end: "2026-11-09" })).toMatch(/前/);
	});

	it("入力言語で読む。End は Start を基準に読み、Start が読めなければ今日を基準にする", () => {
		const today = "2026-11-27";
		expect(readPeriodTexts("2026-12-01", "+3d", today)).toEqual({ start: "2026-12-01", end: "2026-12-04" });
		expect(readPeriodTexts("", "+3d", today)).toEqual({ start: null, end: "2026-11-30" });
		expect(readPeriodTexts("", "", today)).toEqual({ start: null, end: null });
	});

	it("チップは 11/03–11/07、同じ日は 11/03、なければ null（行の補足と同じ形）", () => {
		expect(formatPeriod({ start: "2026-11-03", end: "2026-11-07" })).toBe("11/03–11/07");
		expect(formatPeriod({ start: "2026-11-03", end: "2026-11-03" })).toBe("11/03");
		expect(formatPeriod({ start: null, end: null })).toBeNull();
	});
});
