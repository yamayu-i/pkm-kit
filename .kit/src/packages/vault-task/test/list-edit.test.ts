import { describe, expect, it } from "vitest";
import { duePatch, reschedulePatch, schedulePatch, scheduledPatch, statusPatch } from "../src/core/actions";
import { emptyBoard, markCarried, routineResults } from "../src/core/board";
import { TaskIndex, emptyVaultData, sidebarCounts } from "../src/core/index";
import { parseRepeat, serializeRepeat } from "../src/core/repeat";
import { parseIssue, parseRoutine, type Issue } from "../src/core/schema";
import { parseWorklog } from "../src/core/worklog";

function issue(fm: Record<string, unknown> = {}): Issue {
	return parseIssue("issue/i-1.md", { type: "issue", id: "i-1", summary: "s", status: "open", ...fm }).value!;
}

describe("リストの編集（ADR-0018）", () => {
	it("status: ボードのカードと同じ規則で欄を外す", () => {
		expect(statusPatch("closed")).toMatchObject({ status: "closed", delegated_to: null, revisit: null });
		expect(statusPatch("canceled")).toMatchObject({ status: "canceled", mid_due: null, deadline: null });
		expect(statusPatch("someday")).toMatchObject({ status: "someday", scheduled: null, mid_due: null, deadline: null });
		expect(statusPatch("waiting")).toEqual({ status: "waiting", delegated_to: null, revisit: null });
		expect(statusPatch("delegated", "m-1")).toEqual({ status: "delegated", delegated_to: "m-1", revisit: null });
	});

	it("someday に実行日や期限を入れると open に戻す。外すだけなら戻さない", () => {
		const someday = issue({ status: "someday", revisit: "2026-12-01" });
		expect(duePatch(someday, "deadline", "2026-11-10")).toEqual({ deadline: "2026-11-10", status: "open", revisit: null });
		expect(duePatch(someday, "mid_due", null)).toEqual({ mid_due: null });
		expect(scheduledPatch(someday, ["2026-11-02"])).toEqual({ scheduled: ["2026-11-02"], status: "open", revisit: null });
		expect(scheduledPatch(someday, [])).toEqual({ scheduled: [] });
		expect(duePatch(issue(), "deadline", "2026-11-10")).toEqual({ deadline: "2026-11-10" });
	});

	it("Schedule: 選んだ issue ごとに、既存の実行日を残して足す", () => {
		expect(schedulePatch(issue({ scheduled: ["2026-11-01"] }), ["2026-11-03"]).scheduled).toEqual(["2026-11-01", "2026-11-03"]);
		expect(schedulePatch(issue(), ["2026-11-03"]).scheduled).toEqual(["2026-11-03"]);
	});
});

describe("Do Today / Do Tomorrow（ADR-0018）", () => {
	it("ボードの日付を実行日から外して移動先を足し、carried に入れる", () => {
		const i = issue({ scheduled: ["2026-10-31", "2026-11-05"] });
		expect(reschedulePatch(i, "scheduled", "2026-11-01", "2026-10-31").scheduled).toEqual(["2026-11-01", "2026-11-05"]);
		const board = emptyBoard();
		board.carried = ["i-2"];
		markCarried(board, ["i-1", "i-2"]);
		expect(board.carried).toEqual(["i-2", "i-1"]);
	});
});

describe("routine 画面（ADR-0018）", () => {
	it("くり返しの設定を frontmatter の形に戻せる", () => {
		for (const raw of [
			{ every: "day" },
			{ every: "day", interval: 2 },
			{ every: "week", on: ["mon", "fri"] },
			{ every: "month", interval: 3, on: [15, "last", "2th-tue", "last-fri"] },
		]) {
			const parsed = parseRepeat(raw);
			if (!parsed.ok) throw new Error(parsed.error);
			expect(serializeRepeat(parsed.value)).toEqual(raw);
		}
	});

	it("直近の結果: 古い順に、結果・未記録・予定なしを返す", () => {
		const routine = parseRoutine("routine/r-1.md", {
			type: "routine",
			id: "r-1",
			summary: "s",
			repeat: { every: "day", interval: 2 },
			start: "2026-10-28",
		}).value!;
		const index = new TaskIndex({
			...emptyVaultData(),
			routines: [routine],
			boards: [
				{ date: "2026-10-28", path: "", board: { ...emptyBoard(), routines: { "r-1": "closed" } } },
				{ date: "2026-10-30", path: "", board: { ...emptyBoard(), routines: { "r-1": "canceled" } } },
			],
		});
		expect(routineResults(index, routine, "2026-11-01", 5)).toEqual([
			{ date: "2026-10-28", state: "closed" },
			{ date: "2026-10-29", state: "off" },
			{ date: "2026-10-30", state: "canceled" },
			{ date: "2026-10-31", state: "off" },
			{ date: "2026-11-01", state: "none" },
		]);
	});

	it("total と average: worklog がある日数（ユニークな日付数）で割る。0日なら average は null（ADR-0019）", () => {
		const logs = parseWorklog(
			"worklog/pc/2026-10.jsonl",
			[
				// 10/28 に 2 件（合計 30m）
				JSON.stringify({ id: "w1", task_id: "r-1", from: "2026-10-28T09:00:00+09:00", to: "2026-10-28T09:10:00+09:00", description: "" }),
				JSON.stringify({ id: "w2", task_id: "r-1", from: "2026-10-28T10:00:00+09:00", to: "2026-10-28T10:20:00+09:00", description: "" }),
				// 10/30 に 1 件（60m）
				JSON.stringify({ id: "w3", task_id: "r-1", from: "2026-10-30T09:00:00+09:00", to: "2026-10-30T10:00:00+09:00", description: "" }),
			].join("\n"),
		).entries;
		const index = new TaskIndex({ ...emptyVaultData(), worklogs: logs });
		const now = Date.parse("2026-11-01T12:00:00+09:00");
		expect(index.routineEffort("r-1", now)).toEqual({ total: 90, days: 2, average: 45 });
		expect(index.routineEffort("r-2", now)).toEqual({ total: 0, days: 0, average: null });
	});
});

describe("左サイドバーの件数集計（ADR-0019）", () => {
	it("各 View の件数を返す", () => {
		const r1 = parseRoutine("routine/r-1.md", {
			type: "routine",
			id: "r-1",
			summary: "毎日",
			repeat: { every: "day" },
			start: "2026-10-01",
		}).value!;
		const r2 = parseRoutine("routine/r-2.md", {
			type: "routine",
			id: "r-2",
			summary: "停止中",
			repeat: { every: "day" },
			start: "2026-10-01",
			active: false,
		}).value!;
		const index = new TaskIndex({
			...emptyVaultData(),
			issues: [
				issue({ id: "i-1", created: "2026-10-20T09:00:00+09:00" }), // inbox
				issue({ id: "i-2", scheduled: ["2026-11-01"] }), // today scheduled
				issue({ id: "i-3", deadline: "2026-10-31" }), // dead
				issue({ id: "i-4", status: "someday", revisit: "2026-10-31" }), // someday (organize queue)
				issue({ id: "i-5", status: "closed" }), // closed
			],
			routines: [r1, r2],
		});
		expect(sidebarCounts(index, "2026-11-01")).toEqual({
			daily: 3, // dead(1: i-3) + scheduled(1: i-2) + today board routine(1: r-1)
			inbox: 1,
			organize: 2, // inbox(i-1) + someday(i-4)
			scheduled: 1, // i-2
			issues: 3, // active issues: i-1, i-2, i-3
			someday: 1, // i-4
			routines: 1, // active routine: r-1
		});
	});
});
