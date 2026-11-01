import { boardItems, emptyBoard, pendingBoards, unfinished, type DailyBoard, type RoutineResult } from "./board";
import { cautionIssues, deadIssues, scheduledOn, type DueLists } from "./daily";
import { addDays, type LocalDate } from "./dates";
import { isActive, isInbox, type TaskIndex } from "./index";
import type { Issue, Routine } from "./schema";

/** 1 日の集中作業に使える時間の既定値（分。ADR-0023） */
export const DEFAULT_AVAILABLE_MINUTES = 240;

/** in-progress のまま worklog がないときに停滞とみなす日数の既定値 */
export const DEFAULT_STALE_DAYS = 3;

export interface BoardWorkload {
	totalEstimatedMinutes: number;
	unfinishedEstimatedMinutes: number;
	unestimatedCount: number;
	availableMinutes: number;
	overloadedByMinutes: number;
	loadRatio: number | null;
}

/** その日のボードの見積もり合計と、使える時間に対する負荷を計算する */
export function boardWorkload(index: TaskIndex, date: LocalDate, availableMinutes = DEFAULT_AVAILABLE_MINUTES): BoardWorkload {
	const board = index.board(date)?.board ?? emptyBoard();
	const items = boardItems(index, date, board);
	const activeBoardIssues = items.issues.filter((i) => !board.carried.includes(i.id));
	const totalEstimatedMinutes =
		activeBoardIssues.reduce((sum, i) => sum + (i.estimated ?? 0), 0) +
		items.routines.reduce((sum, r) => sum + (r.estimated ?? 0), 0);

	const rem = unfinished(index, date, board);
	const unfinishedEstimatedMinutes =
		rem.issues.reduce((sum, i) => sum + (i.estimated ?? 0), 0) +
		rem.routines.reduce((sum, r) => sum + (r.estimated ?? 0), 0);
	const unestimatedCount =
		rem.issues.filter((i) => i.estimated === null).length +
		rem.routines.filter((r) => r.estimated === null).length;

	const overloadedByMinutes = Math.max(0, unfinishedEstimatedMinutes - availableMinutes);
	const loadRatio = availableMinutes > 0 ? Math.round((unfinishedEstimatedMinutes / availableMinutes) * 100) / 100 : null;
	return {
		totalEstimatedMinutes,
		unfinishedEstimatedMinutes,
		unestimatedCount,
		availableMinutes,
		overloadedByMinutes,
		loadRatio,
	};
}

/** 各ボードで carried になった回数を issue の ID ごとに数える */
export function carryCounts(boards: Iterable<DailyBoard>): Map<string, number> {
	const counts = new Map<string, number>();
	for (const b of boards) {
		for (const id of b.board.carried) {
			counts.set(id, (counts.get(id) ?? 0) + 1);
		}
	}
	return counts;
}

export interface StalledIssue {
	issue: Issue;
	lastWorkDate: LocalDate | null;
}

export interface StalledIssuesResult {
	/** in-progress だが直近 staleDays 日間 worklog がない issue */
	inProgressStale: StalledIssue[];
	/** revisit の日付が到来している someday issue */
	revisitDue: Issue[];
	/** waiting または delegated のままになっている issue */
	waitingOrDelegated: Issue[];
}

/** 停滞しているタスクや見直し時期が来たタスクを抽出する */
export function stalledIssues(index: TaskIndex, today: LocalDate, staleDays = DEFAULT_STALE_DAYS): StalledIssuesResult {
	const lastWorkByTask = new Map<string, LocalDate>();
	for (const log of index.data.worklogs) {
		const d = log.from.slice(0, 10);
		const prev = lastWorkByTask.get(log.taskId);
		if (prev === undefined || d > prev) lastWorkByTask.set(log.taskId, d);
	}

	const threshold = addDays(today, -staleDays);
	const inProgressStale: StalledIssue[] = [];
	const revisitDue: Issue[] = [];
	const waitingOrDelegated: Issue[] = [];

	for (const issue of index.data.issues) {
		if (issue.status === "in-progress") {
			const lastWorkDate = lastWorkByTask.get(issue.id) ?? null;
			const createdDate = issue.created ? issue.created.slice(0, 10) : null;
			const referenceDate = lastWorkDate ?? createdDate;
			if (referenceDate === null || referenceDate <= threshold) {
				inProgressStale.push({ issue, lastWorkDate });
			}
		} else if (issue.status === "someday" && issue.revisit !== null && issue.revisit <= today) {
			revisitDue.push(issue);
		} else if (issue.status === "waiting" || issue.status === "delegated") {
			waitingOrDelegated.push(issue);
		}
	}

	return { inProgressStale, revisitDue, waitingOrDelegated };
}

export interface EstimationItem {
	id: string;
	summary: string;
	estimatedMinutes: number;
	actualMinutes: number;
	diffMinutes: number;
	ratio: number;
}

export interface EstimationStats {
	sampleCount: number;
	totalEstimatedMinutes: number;
	totalActualMinutes: number;
	ratio: number | null;
	items: EstimationItem[];
}

/** closed な issue の見積もりと按分後実績（分）を比較する */
export function estimationStats(index: TaskIndex, now: number): EstimationStats {
	const efforts = index.effortMinutes(now);
	const items: EstimationItem[] = [];
	let totalEstimatedMinutes = 0;
	let totalActualMinutes = 0;

	for (const issue of index.data.issues) {
		if (issue.status !== "closed" || issue.estimated === null || issue.estimated <= 0) continue;
		const actual = Math.round(efforts.get(issue.id) ?? 0);
		if (actual <= 0) continue;
		totalEstimatedMinutes += issue.estimated;
		totalActualMinutes += actual;
		items.push({
			id: issue.id,
			summary: issue.summary,
			estimatedMinutes: issue.estimated,
			actualMinutes: actual,
			diffMinutes: actual - issue.estimated,
			ratio: Math.round((actual / issue.estimated) * 100) / 100,
		});
	}

	const ratio = totalEstimatedMinutes > 0 ? Math.round((totalActualMinutes / totalEstimatedMinutes) * 100) / 100 : null;
	return {
		sampleCount: items.length,
		totalEstimatedMinutes,
		totalActualMinutes,
		ratio,
		items,
	};
}

export interface OverviewOptions {
	availableMinutes?: number;
	staleDays?: number;
	cautionDays?: number;
	minCarryCount?: number;
}

export interface TaskOverview {
	date: LocalDate;
	board: {
		closed: boolean;
		issues: Issue[];
		routines: Routine[];
		unfinished: { issues: Issue[]; routines: Routine[] };
		carried: string[];
		groups: Record<string, string>;
		routineResults: Record<string, RoutineResult>;
	};
	workload: BoardWorkload;
	scheduledNotOnBoard: Issue[];
	dead: DueLists;
	caution: DueLists;
	inboxCount: number;
	inboxSample: Issue[];
	pendingBoards: { date: LocalDate; unfinishedIssues: string[]; unfinishedRoutines: string[] }[];
	runningTimers: { id: string; taskId: string; summary: string | null; from: string; elapsedMinutes: number }[];
	frequentlyCarried: { issue: Issue; count: number }[];
	stalled: StalledIssuesResult;
	estimation: EstimationStats;
}

/** AI が 1 回の呼び出しでタスク状況の全体を把握するためのサマリを作る（ADR-0023） */
export function buildOverview(index: TaskIndex, date: LocalDate, now: number, options: OverviewOptions = {}): TaskOverview {
	const availableMinutes = options.availableMinutes ?? DEFAULT_AVAILABLE_MINUTES;
	const staleDays = options.staleDays ?? DEFAULT_STALE_DAYS;
	const cautionDays = options.cautionDays ?? 3;
	const minCarryCount = options.minCarryCount ?? 2;

	const board = index.board(date)?.board ?? emptyBoard();
	const items = boardItems(index, date, board);
	const rem = unfinished(index, date, board);
	const workload = boardWorkload(index, date, availableMinutes);
	const scheduledNotOnBoard = scheduledOn(index.data.issues, date, new Set(board.issues));
	const dead = deadIssues(index.data.issues, date);
	const caution = cautionIssues(index.data.issues, date, cautionDays);

	const inbox = index.data.issues.filter(isInbox);
	const pending = pendingBoards(index, index.data.boards, date).map((b) => {
		const u = unfinished(index, b.date, b.board);
		return {
			date: b.date,
			unfinishedIssues: u.issues.map((i) => i.id),
			unfinishedRoutines: u.routines.map((r) => r.id),
		};
	});

	const runningTimers = index.running().map((l) => ({
		id: l.id,
		taskId: l.taskId,
		summary: index.issues.get(l.taskId)?.summary ?? index.routines.get(l.taskId)?.summary ?? null,
		from: l.from,
		elapsedMinutes: Math.max(0, Math.round((now - l.fromMs) / 60_000)),
	}));

	const counts = carryCounts(index.data.boards);
	const frequentlyCarried = [...counts.entries()]
		.filter(([, c]) => c >= minCarryCount)
		.map(([id, count]) => ({ issue: index.issues.get(id)!, count }))
		.filter((x) => x.issue !== undefined && isActive(x.issue))
		.sort((a, b) => b.count - a.count);

	const stalled = stalledIssues(index, date, staleDays);
	const estimation = estimationStats(index, now);

	return {
		date,
		board: {
			closed: board.closed,
			issues: items.issues,
			routines: items.routines,
			unfinished: rem,
			carried: [...board.carried],
			groups: { ...board.groups },
			routineResults: { ...board.routines },
		},
		workload,
		scheduledNotOnBoard,
		dead,
		caution,
		inboxCount: inbox.length,
		inboxSample: inbox.slice(0, 10),
		pendingBoards: pending,
		runningTimers,
		frequentlyCarried,
		stalled,
		estimation,
	};
}
