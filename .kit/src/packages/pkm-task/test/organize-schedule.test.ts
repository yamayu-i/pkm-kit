import { describe, expect, it } from "vitest";
import { canConfirmSchedule, organizeSchedulePatch } from "../src/core/actions";
import { parseIssue, type Issue } from "../src/core/schema";

function issue(fm: Record<string, unknown> = {}): Issue {
	return parseIssue("issue/i-1.md", { type: "issue", id: "i-1", summary: "s", status: "open", ...fm }).value!;
}

describe("Organize の予定入れ（ADR-0030）", () => {
	it("決定は 1 日以上選んでいるときだけ押せる", () => {
		expect(canConfirmSchedule(0, false, null)).toBe(false);
		expect(canConfirmSchedule(1, false, null)).toBe(true);
		expect(canConfirmSchedule(3, false, 30)).toBe(true);
	});

	it("estimated が必須（Inbox で未入力）なら、選ぶまで決定は押せない", () => {
		expect(canConfirmSchedule(2, true, null)).toBe(false);
		expect(canConfirmSchedule(2, true, 60)).toBe(true);
		expect(canConfirmSchedule(0, true, 60)).toBe(false);
	});

	it("選んだ日付で実行日を置き換える（外した既存の日付は戻らない）。並びは日付の順", () => {
		const i = issue({ scheduled: ["2026-11-03", "2026-11-05"] });
		expect(organizeSchedulePatch(i, ["2026-11-10", "2026-11-05"], null)).toEqual({ scheduled: ["2026-11-05", "2026-11-10"] });
	});

	it("estimated を選んだら入れる。someday なら open に戻す", () => {
		expect(organizeSchedulePatch(issue(), ["2026-11-04"], 30)).toEqual({ scheduled: ["2026-11-04"], estimated: 30 });
		expect(organizeSchedulePatch(issue({ status: "someday", revisit: "2026-12-01" }), ["2026-11-04"], null)).toEqual({
			scheduled: ["2026-11-04"],
			status: "open",
			revisit: null,
		});
	});
});
