import { diffDays, localToday, type LocalDate } from "./dates";
import { emptyBoard, pendingBoards, unfinished, type DailyBoard } from "./board";
import { deadIssues, scheduledOn } from "./daily";
import { prorateEffort } from "./effort";
import type { GroupDef } from "./groups";
import type { LabelDef } from "./labels";
import { occursOn } from "./repeat";
import type { Issue, Member, Routine, Status } from "./schema";
import { closedAtMap, statusBefore, type StatusLogEntry } from "./status-log";
import type { WorklogEntry } from "./worklog";

export interface VaultData {
	issues: Issue[];
	routines: Routine[];
	members: Member[];
	labels: LabelDef[];
	worklogs: WorklogEntry[];
	/** ボードの状態（操作ログの再生結果。ADR-0020） */
	boards: DailyBoard[];
	/** task board のグループ（issue/board-groups.json） */
	groups: GroupDef[];
	/** status の記録（古い順。ADR-0031） */
	statusLogs: StatusLogEntry[];
}

export function emptyVaultData(): VaultData {
	return { issues: [], routines: [], members: [], labels: [], worklogs: [], boards: [], groups: [], statusLogs: [] };
}

/** 終わっている、または意識の外に置いている status（各 View の既定の表示から外す。ADR-0006） */
export const INACTIVE_STATUSES: readonly Status[] = ["closed", "canceled", "someday"];

export function isActive(issue: Issue): boolean {
	return !INACTIVE_STATUSES.includes(issue.status);
}

/** open で、scheduled・mid_due・deadline がどれもない（ADR-0006） */
export function isInbox(issue: Issue): boolean {
	return issue.status === "open" && issue.scheduled.length === 0 && issue.midDue === null && issue.deadline === null;
}

/** routine の interval を数える起点: start、なければ created の日付 */
export function routineAnchor(routine: Routine): LocalDate | null {
	return routine.start ?? (routine.created ? routine.created.slice(0, 10) : null);
}

/** その日のボードに載る routine か（ADR-0010） */
export function routineOccursOn(routine: Routine, date: LocalDate): boolean {
	if (!routine.active || routine.repeat === null) return false;
	const anchor = routineAnchor(routine);
	if (anchor === null) return false;
	if (routine.end !== null && diffDays(date, routine.end) > 0) return false;
	return occursOn(routine.repeat, anchor, date);
}

function compareNullableAsc(a: string | null, b: string | null): number {
	if (a === b) return 0;
	if (a === null) return -1;
	if (b === null) return 1;
	return a < b ? -1 : 1;
}

/** Organize に出す順（ADR-0009）: Inbox の古い順 → revisit を過ぎた someday → reviewed が古い someday */
export function organizeQueue(issues: Iterable<Issue>, today: LocalDate): Issue[] {
	const inbox: Issue[] = [];
	const revisitDue: Issue[] = [];
	const someday: Issue[] = [];
	for (const issue of issues) {
		if (isInbox(issue)) inbox.push(issue);
		else if (issue.status === "someday") {
			if (issue.revisit !== null && issue.revisit <= today) revisitDue.push(issue);
			else someday.push(issue);
		}
	}
	inbox.sort((a, b) => compareNullableAsc(a.created, b.created));
	revisitDue.sort((a, b) => compareNullableAsc(a.revisit, b.revisit));
	someday.sort((a, b) => compareNullableAsc(a.reviewed, b.reviewed));
	return [...inbox, ...revisitDue, ...someday];
}

/** メモリ上の索引（ADR-0002）。children など保存しない値はここで作る */
export class TaskIndex {
	readonly issues = new Map<string, Issue>();
	readonly routines = new Map<string, Routine>();
	readonly members = new Map<string, Member>();
	readonly issuesByPath = new Map<string, Issue>();
	private readonly childrenOf = new Map<string, Issue[]>();

	constructor(readonly data: VaultData) {
		// ID が重複していたら最初のものを使う（重複は lint で報告する）
		for (const i of data.issues) if (!this.issues.has(i.id)) this.issues.set(i.id, i);
		for (const r of data.routines) if (!this.routines.has(r.id)) this.routines.set(r.id, r);
		for (const m of data.members) if (!this.members.has(m.id)) this.members.set(m.id, m);
		for (const i of data.issues) this.issuesByPath.set(i.path, i);
		for (const issue of this.issues.values()) {
			if (issue.parent === null) continue;
			const list = this.childrenOf.get(issue.parent) ?? [];
			list.push(issue);
			this.childrenOf.set(issue.parent, list);
		}
	}

	children(id: string): Issue[] {
		return this.childrenOf.get(id) ?? [];
	}

	/** 親をたどった一覧（近い順）。循環していたら、そこで止める */
	ancestors(id: string): Issue[] {
		const out: Issue[] = [];
		const seen = new Set([id]);
		let parent = this.issues.get(id)?.parent ?? null;
		while (parent !== null && !seen.has(parent)) {
			seen.add(parent);
			const issue = this.issues.get(parent);
			if (!issue) break;
			out.push(issue);
			parent = issue.parent;
		}
		return out;
	}

	/** `childId` の親に `parentId` を選べるか（自分自身と子孫は選べない。ADR-0012） */
	canSetParent(childId: string, parentId: string): boolean {
		if (childId === parentId || !this.issues.has(parentId)) return false;
		return !this.ancestors(parentId).some((a) => a.id === childId);
	}

	/** 按分後の実績（分）。タスクの ID ごと（ADR-0005） */
	effortMinutes(now: number): Map<string, number> {
		const ms = prorateEffort(this.data.worklogs, now);
		return new Map([...ms].map(([id, v]) => [id, v / 60_000]));
	}

	/** routine 画面の工数（ADR-0021）: 按分後の累計（分）・worklog がある日数・1 日あたりの平均（分、0 日なら null） */
	routineEffort(taskId: string, now: number): { total: number; days: number; average: number | null } {
		const total = this.effortMinutes(now).get(taskId) ?? 0;
		const dates = new Set<LocalDate>();
		for (const l of this.data.worklogs) {
			if (l.taskId !== taskId) continue;
			const to = l.toMs ?? Math.max(now, l.fromMs);
			if (to > l.fromMs) dates.add(localToday(new Date(l.fromMs)));
		}
		const days = dates.size;
		return { total, days, average: days > 0 ? total / days : null };
	}

	board(date: LocalDate): DailyBoard | undefined {
		return this.data.boards.find((b) => b.date === date);
	}

	/** 記録中（to が空）の worklog */
	running(taskId?: string): WorklogEntry[] {
		return this.data.worklogs.filter((l) => l.toMs === null && (taskId === undefined || l.taskId === taskId));
	}

	/** issue が今の status になる前の status（記録から。分からなければ null。ADR-0031） */
	statusBefore(id: string): Status | null {
		const issue = this.issues.get(id);
		return issue ? statusBefore(this.data.statusLogs, id, issue.status) : null;
	}

	/** その issue の最後の status の記録 */
	lastStatusLog(id: string): StatusLogEntry | undefined {
		const logs = this.data.statusLogs;
		for (let i = logs.length - 1; i >= 0; i--) if (logs[i]!.task === id) return logs[i];
		return undefined;
	}

	/** 今 closed の issue を、最後に closed にした時刻（ミリ秒。記録にあるものだけ。ADR-0031） */
	closedAt(): Map<string, number> {
		const closed = [...this.issues.values()].filter((i) => i.status === "closed").map((i) => i.id);
		return closedAtMap(this.data.statusLogs, closed);
	}

	routinesOn(date: LocalDate): Routine[] {
		return [...this.routines.values()].filter((r) => routineOccursOn(r, date));
	}
}

export interface SidebarCounts {
	daily: number;
	inbox: number;
	organize: number;
	scheduled: number;
	issues: number;
	someday: number;
	routines: number;
}

/** 左サイドバーに出す各 View の件数（ADR-0021） */
export function sidebarCounts(index: TaskIndex, today: LocalDate): SidebarCounts {
	const issues = [...index.issues.values()];
	const dead = deadIssues(issues, today);
	const pending = pendingBoards(index, index.data.boards, today);
	const todayBoard = index.board(today)?.board ?? emptyBoard();
	const scheduledToday = scheduledOn(issues, today, new Set(todayBoard.issues));
	const todayLeft = unfinished(index, today, todayBoard);
	const previousCount = pending.reduce((n, b) => {
		const u = unfinished(index, b.date, b.board);
		return n + u.issues.length + u.routines.length;
	}, 0);
	return {
		daily: dead.deadline.length + dead.midDue.length + previousCount + scheduledToday.length + todayLeft.issues.length + todayLeft.routines.length,
		inbox: issues.filter(isInbox).length,
		organize: organizeQueue(issues, today).length,
		scheduled: issues.filter((i) => isActive(i) && i.scheduled.some((d) => d >= today)).length,
		issues: issues.filter(isActive).length,
		someday: issues.filter((i) => i.status === "someday").length,
		routines: [...index.routines.values()].filter((r) => r.active).length,
	};
}
