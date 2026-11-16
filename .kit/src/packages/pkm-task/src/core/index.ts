import { diffDays, localToday, type LocalDate } from "./dates";
import { emptyBoard, unfinished, unfinishedCount, type DailyBoard } from "./board";
import { lastOrder, type OrderRecord } from "./board-log";
import { deadIssues, deadSubs, missedIssues, missedSubs, scheduledOn } from "./daily";
import { prorateEffort } from "./effort";
import type { LabelDef } from "./labels";
import type { IssuePreset } from "./presets";
import { occursOn } from "./repeat";
import type { Issue, Member, Routine, Status } from "./schema";
import { closedAtMap, isIssueStatusLog, statusBefore, type StatusLogEntry } from "./status-log";
import { parseSubKey, type SubIssue } from "./sub-issue";
import { reopenStatus } from "./transition";
import { workKey, type WorklogEntry } from "./worklog";

export interface VaultData {
	issues: Issue[];
	/** issue の md の中のサブイシュー（親の md の順 → md に書いた順。ADR-0135） */
	subIssues: SubIssue[];
	routines: Routine[];
	members: Member[];
	labels: LabelDef[];
	/** issue のプリセット（preset/ の md。ID の順。ADR-0186） */
	presets: IssuePreset[];
	worklogs: WorklogEntry[];
	/** ボードの状態（操作ログの再生結果。ADR-0020） */
	boards: DailyBoard[];
	/** status の記録（古い順。ADR-0031） */
	statusLogs: StatusLogEntry[];
	/** ボードを並べた記録（ボードの日付 → 時刻の順。ADR-0114, 0137） */
	orders: OrderRecord[];
}

export function emptyVaultData(): VaultData {
	return { issues: [], subIssues: [], routines: [], members: [], labels: [], presets: [], worklogs: [], boards: [], statusLogs: [], orders: [] };
}

/** 終わっている、または意識の外に置いている status（各 View の既定の表示から外す。ADR-0006） */
export const INACTIVE_STATUSES: readonly Status[] = ["closed", "canceled", "someday"];

export function isActive(issue: Pick<Issue, "status">): boolean {
	return !INACTIVE_STATUSES.includes(issue.status);
}

/**
 * Inbox（未整理）: open で、clarified でない。日付（期限・Calendar）は見ない（ADR-0148）。
 * Tickler（ADR-0152）: 日付の前は出さず、日付が来たら clarified でも出す（整理を先送りしたものが戻る）
 */
export function isInbox(issue: Issue, today: LocalDate): boolean {
	if (issue.status !== "open") return false;
	if (issue.tickler !== null) return issue.tickler <= today;
	return !issue.clarified;
}

/**
 * Next Actions: open で clarified のもの、または in-progress（着手したので整理済み）で、Calendar（scheduled）も Tickler もない
 * （ADR-0148, 0152, 0184）。日付は保存しない。waiting / delegated は Watch の欄で見張る
 */
export function isNext(issue: Issue, _today?: LocalDate): boolean {
	const ready = issue.status === "in-progress" || (issue.status === "open" && issue.clarified);
	return ready && issue.scheduled === null && issue.tickler === null;
}

/** サブの Next（ADR-0150, 0184）: open か in-progress で、Calendar の日がなく、start がないか today 以前 */
export function isNextSub(sub: Pick<SubIssue, "status" | "scheduled" | "start">, today: LocalDate): boolean {
	return (sub.status === "open" || sub.status === "in-progress") && sub.scheduled === null && (sub.start === null || sub.start <= today);
}

/** Watch の欄（ADR-0184）に出す status。待っているもの（GTD の Waiting For） */
export function isWatchStatus(status: Status): boolean {
	return status === "waiting" || status === "delegated";
}

/** Scheduled に出す issue: 有効で、今日以降に Calendar の日がある（ADR-0009, 0152）。PKM Updates も同じ規則を使う（ADR-0070） */
export function isScheduledAhead(issue: Issue, today: LocalDate): boolean {
	return isActive(issue) && issue.scheduled !== null && issue.scheduled >= today;
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
		if (isInbox(issue, today)) inbox.push(issue);
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

/** メモリ上の索引（ADR-0002）。サブの引き当てなど保存しない値はここで作る */
export class TaskIndex {
	readonly issues = new Map<string, Issue>();
	readonly routines = new Map<string, Routine>();
	readonly members = new Map<string, Member>();
	readonly issuesByPath = new Map<string, Issue>();
	private readonly subsOf = new Map<string, SubIssue[]>();
	private readonly subsByKey = new Map<string, SubIssue>();

	constructor(readonly data: VaultData) {
		// ID が重複していたら最初のものを使う（重複は lint で報告する）
		for (const i of data.issues) if (!this.issues.has(i.id)) this.issues.set(i.id, i);
		for (const r of data.routines) if (!this.routines.has(r.id)) this.routines.set(r.id, r);
		for (const m of data.members) if (!this.members.has(m.id)) this.members.set(m.id, m);
		for (const i of data.issues) this.issuesByPath.set(i.path, i);
		for (const sub of data.subIssues) {
			// 同じ親で id が重なったら最初のものを使う（重なりは lint で報告する）
			if (this.subsByKey.has(sub.key)) continue;
			this.subsByKey.set(sub.key, sub);
			const list = this.subsOf.get(sub.parent) ?? [];
			list.push(sub);
			this.subsOf.set(sub.parent, list);
		}
	}

	/** その issue のサブ（md に書いた順。ADR-0135） */
	subs(parentId: string): SubIssue[] {
		return this.subsOf.get(parentId) ?? [];
	}

	/** 合成キー `i-12#k3f9a2` のサブ */
	sub(key: string): SubIssue | undefined {
		return this.subsByKey.get(key);
	}

	/** 移行で子の issue から変換したサブ（元の ID → サブ。ADR-0135） */
	migrated(oldId: string): SubIssue | undefined {
		if (this.issues.has(oldId)) return undefined;
		return this.data.subIssues.find((s) => s.migratedFrom === oldId);
	}

	/** 按分後の実績（分）。タスクの ID ごと（ADR-0005）。親の issue は、親に直接付けた行とサブの行の合計（ADR-0135） */
	effortMinutes(now: number): Map<string, number> {
		const ms = prorateEffort(this.data.worklogs, now);
		return new Map([...ms].map(([id, v]) => [id, v / 60_000]));
	}

	/**
	 * 按分後の実績（分）。記録の鍵（workKey）ごと: サブは合成キー、親の ID は親に直接付けた行だけ（ADR-0135）。
	 * 按分は同時に動いている区間の数で割るので、親の ID とそのサブの合計は effortMinutes の親の値と同じ
	 */
	effortByKey(now: number): Map<string, number> {
		const ms = prorateEffort(this.data.worklogs.map((l) => ({ taskId: workKey(l), fromMs: l.fromMs, toMs: l.toMs })), now);
		return new Map([...ms].map(([key, v]) => [key, v / 60_000]));
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

	/**
	 * その日のボードに自動で載せる issue の ID とサブの合成キー（ADR-0034, 0137）:
	 * その日が実行日で active で、まだ載っておらず、その日に外してもいないもの。issue（ID の順）→ サブ（親の md の順）
	 */
	toAutoAdd(date: LocalDate): string[] {
		const daily = this.board(date);
		const skip = new Set([...(daily?.board.issues ?? []), ...(daily?.removed ?? [])]);
		const subs = this.data.subIssues.filter((s) => isActive(s) && s.scheduled === date && !skip.has(s.key) && this.subsByKey.get(s.key) === s);
		return [...scheduledOn(this.issues.values(), date, skip).map((i) => i.id), ...subs.map((s) => s.key)];
	}

	/** ボードの並び（ADR-0114, 0137）。その日までで最後に並べたもの。なければ undefined */
	order(date: LocalDate): string[] | undefined {
		return lastOrder(this.data.orders, date);
	}

	/** 記録中（to が空）の worklog。鍵（workKey）の完全一致で選ぶ: 親の ID なら親に直接付けた記録だけ（ADR-0135） */
	running(key?: string): WorklogEntry[] {
		return this.data.worklogs.filter((l) => l.toMs === null && (key === undefined || workKey(l) === key));
	}

	/** issue が今の status になる前の status（記録から。分からなければ null。ADR-0031） */
	statusBefore(id: string): Status | null {
		const issue = this.issues.get(id);
		return issue ? statusBefore(this.data.statusLogs, id, issue.status) : null;
	}

	/** closed / canceled からの ↩ の戻る先（ADR-0183）。key は issue の ID かサブの合成キー。分からなければ open */
	reopenStatus(key: string): Status {
		const sub = parseSubKey(key);
		return sub ? reopenStatus(this.data.statusLogs, sub.parent, sub.id) : reopenStatus(this.data.statusLogs, key);
	}

	/** その issue の最後の status の記録 */
	lastStatusLog(id: string): StatusLogEntry | undefined {
		const logs = this.data.statusLogs;
		for (let i = logs.length - 1; i >= 0; i--) if (logs[i]!.task === id && isIssueStatusLog(logs[i]!)) return logs[i];
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
	const deadSub = deadSubs(index, today);
	const missed = missedIssues(issues, today).length + missedSubs(index, today).length;
	const todayBoard = index.board(today)?.board ?? emptyBoard();
	const scheduledToday = index.toAutoAdd(today);
	const todayLeft = unfinished(index, today, todayBoard);
	return {
		// 期限切れ（issue とサブ）・過ぎた Calendar の日（ADR-0150, 0152）・今日の Calendar・今日の未完了。前のボードは数えない（締めは記録だけ。ADR-0189）
		daily: dead.deadline.length + dead.softDeadline.length + deadSub.deadline.length + deadSub.softDeadline.length + missed + scheduledToday.length + unfinishedCount(todayLeft),
		inbox: issues.filter((i) => isInbox(i, today)).length,
		organize: organizeQueue(issues, today).length,
		scheduled: issues.filter((i) => isScheduledAhead(i, today)).length,
		issues: issues.filter(isActive).length,
		someday: issues.filter((i) => i.status === "someday").length,
		routines: [...index.routines.values()].filter((r) => r.active).length,
	};
}
