import { describe, expect, it } from "vitest";
import { TaskIndex, emptyVaultData } from "../src/core/index";
import { parseIssue } from "../src/core/schema";
import { formatElapsed, lastOrganizedMs, organizedCard, pausedCard, pausedTasks, restCard, runningTasks, todoTasks } from "../src/core/tasks-now";
import type { WorklogEntry } from "../src/core/worklog";

const H = 3_600_000;
const NOW = Date.parse("2026-11-15T12:00:00+09:00");

const issue = (id: string, extra: Record<string, unknown> = {}) =>
	parseIssue(`issue/${id}.md`, { type: "issue", id, summary: `題 ${id}`, status: "open", ...extra }).value!;

function log(id: string, taskId: string, fromMs: number, toMs: number | null): WorklogEntry {
	return { path: "worklog/pc/2026-11.jsonl", line: 1, id, taskId, from: new Date(fromMs).toISOString(), to: toMs === null ? null : new Date(toMs).toISOString(), description: "", fromMs, toMs };
}

const index = (issues = [issue("i-1"), issue("i-2")], worklogs: WorklogEntry[] = []) => new TaskIndex({ ...emptyVaultData(), issues, worklogs });

describe("Organized（ADR-0144）", () => {
	it("いちばん新しい reviewed の 0 時と、この端末の記録の新しい方を前回にする", () => {
		const i = index([issue("i-1", { reviewed: "2026-11-14" }), issue("i-2", { reviewed: "2026-11-10" })]);
		expect(lastOrganizedMs(i, null)).toBe(new Date(2026, 10, 14).getTime());
		const own = new Date(2026, 10, 15, 9, 0).toISOString();
		expect(lastOrganizedMs(i, own)).toBe(Date.parse(own));
		expect(lastOrganizedMs(index(), null)).toBeNull();
	});

	it("1 日未満は緑、1 日以上は赤、一度もなければ赤の Never", () => {
		expect(organizedCard(NOW - 23 * H, NOW)).toMatchObject({ level: "ok", elapsedMs: 23 * H });
		expect(organizedCard(NOW - 24 * H, NOW).level).toBe("alert");
		expect(organizedCard(null, NOW)).toMatchObject({ level: "alert", label: "Never", elapsedMs: null });
	});
});

describe("Worklog Paused（ADR-0144）", () => {
	it("止めてから 12 時間未満は緑、12 時間以上は赤", () => {
		expect(pausedCard([log("a", "i-1", NOW - 20 * H, NOW - 11 * H)], NOW)).toMatchObject({ level: "ok", elapsedMs: 11 * H });
		expect(pausedCard([log("a", "i-1", NOW - 20 * H, NOW - 12 * H)], NOW).level).toBe("alert");
	});

	it("いちばん新しい to から数える", () => {
		const logs = [log("a", "i-1", NOW - 30 * H, NOW - 29 * H), log("b", "i-1", NOW - 5 * H, NOW - 2 * H)];
		expect(pausedCard(logs, NOW).elapsedMs).toBe(2 * H);
	});

	it("記録中なら経過時間を出さない", () => {
		expect(pausedCard([log("a", "i-1", NOW - H, null)], NOW)).toMatchObject({ level: "ok", elapsedMs: null, label: "Running" });
	});

	it("記録が 1 件もなければ赤", () => {
		expect(pausedCard([], NOW).level).toBe("alert");
	});
});

describe("Rest / Focus Streak（ADR-0144）", () => {
	const at = (ms: number) => restCard([log("a", "i-1", NOW - ms, null)], NOW);
	it("1 時間以内は緑（Healthy）、2 時間までは黄（Caution）、2 時間以上は赤（Over-focused）", () => {
		expect(at(59 * 60_000)).toMatchObject({ level: "ok", label: "Healthy" });
		expect(at(H)).toMatchObject({ level: "caution", label: "Caution" });
		expect(at(2 * H - 1)).toMatchObject({ level: "caution" });
		expect(at(2 * H)).toMatchObject({ level: "alert", label: "Over-focused" });
	});

	it("複数の記録は、いちばん前に始めたものから数える。記録中がなければ色なし", () => {
		expect(restCard([log("a", "i-1", NOW - 30 * 60_000, null), log("b", "i-2", NOW - 90 * 60_000, null)], NOW).level).toBe("caution");
		expect(restCard([log("a", "i-1", NOW - 30 * 60_000, NOW - 10 * 60_000)], NOW)).toMatchObject({ level: "idle", elapsedMs: null });
	});
});

describe("タスク群", () => {
	it("実行中は同じ鍵を 1 つにまとめ、長い順に並べる", () => {
		const i = index(undefined, [log("a", "i-1", NOW - 10 * 60_000, null), log("b", "i-2", NOW - 30 * 60_000, null), log("c", "i-2", NOW - 5 * 60_000, null)]);
		expect(runningTasks(i, NOW).map((t) => [t.key, t.elapsedMs])).toEqual([
			["i-2", 30 * 60_000],
			["i-1", 10 * 60_000],
		]);
	});

	it("保留した群から、消えたタスクと終わったタスクと記録中のものを除く", () => {
		const i = index([issue("i-1"), issue("i-2", { status: "closed" }), issue("i-3")], [log("a", "i-3", NOW - 60_000, null)]);
		expect(pausedTasks(i, ["i-1", "i-2", "i-3", "i-9"]).map((t) => t.key)).toEqual(["i-1"]);
	});

	it("タスクリストは今日の記録中でないカードで、除いた鍵は出さない", () => {
		const i = index([issue("i-1", { scheduled: ["2026-11-15"] }), issue("i-2", { scheduled: ["2026-11-15"] }), issue("i-3")]);
		expect(todoTasks(i, "2026-11-15", new Set()).map((t) => t.key).sort()).toEqual(["i-1", "i-2"]);
		expect(todoTasks(i, "2026-11-15", new Set(["i-1"])).map((t) => t.key)).toEqual(["i-2"]);
	});
});

describe("経過時間の表示", () => {
	it("1 日以上は日と時間、それ未満は時間と分", () => {
		expect(formatElapsed(42 * 60_000)).toBe("42m");
		expect(formatElapsed(3 * H + 20 * 60_000)).toBe("3h20m");
		expect(formatElapsed(27 * H)).toBe("1d 3h");
	});
});
