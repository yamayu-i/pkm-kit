import { describe, expect, it } from "vitest";
import { emptyBoard } from "../src/core/board";
import { emptyVaultData, TaskIndex } from "../src/core/index";
import { boardWorkload, buildOverview, carryCounts, estimationStats, stalledIssues } from "../src/core/metrics";
import { parseIssue, parseRoutine } from "../src/core/schema";
import { parseWorklog } from "../src/core/worklog";

const today = "2026-11-01";
const now = Date.parse("2026-11-01T12:00:00Z");

function makeIssue(id: string, fields: Record<string, unknown> = {}) {
	return parseIssue(`issue/${id}.md`, { type: "issue", id, summary: `Task ${id}`, status: "open", ...fields }).value!;
}

function makeRoutine(id: string, fields: Record<string, unknown> = {}) {
	return parseRoutine(`routine/${id}.md`, {
		type: "routine",
		id,
		summary: `Routine ${id}`,
		repeat: { every: "day" },
		start: "2026-10-01",
		active: true,
		...fields,
	}).value!;
}

describe("boardWorkload", () => {
	it("未完了の issue と routine の見積もり合計と負荷率を計算する", () => {
		const i1 = makeIssue("i-1", { estimated: 120 });
		const i2 = makeIssue("i-2", { estimated: 90 });
		const i3 = makeIssue("i-3", { status: "closed", estimated: 60 });
		const i4 = makeIssue("i-4", { estimated: null });
		const r1 = makeRoutine("r-1", { estimated: 60 });
		const r2 = makeRoutine("r-2", { estimated: 30 });
		const board = {
			...emptyBoard(),
			issues: ["i-1", "i-2", "i-3", "i-4"],
			carried: ["i-2"],
			routines: { "r-2": "closed" as const },
		};
		const index = new TaskIndex({
			...emptyVaultData(),
			issues: [i1, i2, i3, i4],
			routines: [r1, r2],
			boards: [{ date: today, path: "daily/2026/11/2026-11-01.md", board }],
		});

		const w = boardWorkload(index, today, 150);
		// 未完了は i-1 (120), i-4 (null), r-1 (60) => 合計 180 分、未見積もり 1 件
		expect(w.unfinishedEstimatedMinutes).toBe(180);
		expect(w.unestimatedCount).toBe(1);
		expect(w.availableMinutes).toBe(150);
		expect(w.overloadedByMinutes).toBe(30);
		expect(w.loadRatio).toBe(1.2);
	});
});

describe("carryCounts と stalledIssues", () => {
	it("複数回持ち越された issue と、worklog が途絶えた in-progress issue を検出する", () => {
		const i1 = makeIssue("i-1", { status: "in-progress", created: "2026-10-20T10:00:00+09:00" });
		const i2 = makeIssue("i-2", { status: "in-progress", created: "2026-10-20T10:00:00+09:00" });
		const i3 = makeIssue("i-3", { status: "someday", revisit: "2026-10-31" });
		const worklogs = parseWorklog(
			"worklog/pc/2026-10.jsonl",
			[
				JSON.stringify({ id: "wl_1", task_id: "i-1", from: "2026-10-25T10:00:00+09:00", to: "2026-10-25T11:00:00+09:00", description: "" }),
				JSON.stringify({ id: "wl_2", task_id: "i-2", from: "2026-10-31T10:00:00+09:00", to: "2026-10-31T11:00:00+09:00", description: "" }),
			].join("\n"),
		).entries;
		const boards = [
			{ date: "2026-10-29", path: "daily/2026/10/2026-10-29.md", board: { ...emptyBoard(), issues: ["i-1"], carried: ["i-1"] } },
			{ date: "2026-10-30", path: "daily/2026/10/2026-10-30.md", board: { ...emptyBoard(), issues: ["i-1", "i-2"], carried: ["i-1"] } },
		];
		const index = new TaskIndex({ ...emptyVaultData(), issues: [i1, i2, i3], worklogs, boards });

		const counts = carryCounts(index.data.boards);
		expect(counts.get("i-1")).toBe(2);
		expect(counts.get("i-2")).toBeUndefined();

		const stalled = stalledIssues(index, today, 3);
		expect(stalled.inProgressStale.map((x) => x.issue.id)).toEqual(["i-1"]);
		expect(stalled.inProgressStale[0]!.lastWorkDate).toBe("2026-10-25");
		expect(stalled.revisitDue.map((i) => i.id)).toEqual(["i-3"]);
	});
});

describe("estimationStats と buildOverview", () => {
	it("見積もりと実績の比較、および 1 日の全体状況をまとめて返す", () => {
		const i1 = makeIssue("i-1", { status: "closed", estimated: 60 });
		const i2 = makeIssue("i-2", { status: "open", deadline: "2026-10-30", estimated: 90 });
		const i3 = makeIssue("i-3", { status: "open", scheduled: [today], estimated: 45 });
		const i4 = makeIssue("i-4", { status: "open" }); // Inbox
		const worklogs = parseWorklog(
			"worklog/pc/2026-11.jsonl",
			JSON.stringify({ id: "wl_1", task_id: "i-1", from: "2026-11-01T09:00:00Z", to: "2026-11-01T10:30:00Z", description: "" }),
		).entries;
		const index = new TaskIndex({
			...emptyVaultData(),
			issues: [i1, i2, i3, i4],
			worklogs,
			boards: [{ date: today, path: "daily/2026/11/2026-11-01.md", board: { ...emptyBoard(), issues: ["i-2"] } }],
		});

		const est = estimationStats(index, now);
		expect(est.sampleCount).toBe(1);
		expect(est.totalEstimatedMinutes).toBe(60);
		expect(est.totalActualMinutes).toBe(90);
		expect(est.ratio).toBe(1.5);

		const overview = buildOverview(index, today, now, { availableMinutes: 60 });
		expect(overview.date).toBe(today);
		expect(overview.workload.overloadedByMinutes).toBe(30);
		expect(overview.dead.deadline.map((i) => i.id)).toEqual(["i-2"]);
		expect(overview.scheduledNotOnBoard.map((i) => i.id)).toEqual(["i-3"]);
		expect(overview.inboxCount).toBe(1);
	});
});
