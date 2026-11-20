import { diffDays, type LocalDate } from "./dates";
import type { BoardState } from "./board";
import { isActive, type TaskIndex } from "./index";
import { isDoneStatus } from "./status-log";
import { PRIORITIES, type Issue } from "./schema";
import type { SubIssue } from "./sub-issue";

export interface DueLists {
	deadline: Issue[];
	softDeadline: Issue[];
}

const byDate = (key: "deadline" | "softDeadline") => (a: Issue, b: Issue) => (a[key] ?? "").localeCompare(b[key] ?? "") || a.id.localeCompare(b.id, "en", { numeric: true });

/** 期限を過ぎたもの（ADR-0009 の dead issue）。deadline と soft_deadline は別の表 */
export function deadIssues(issues: Iterable<Issue>, today: LocalDate): DueLists {
	const deadline: Issue[] = [];
	const softDeadline: Issue[] = [];
	for (const i of issues) {
		if (!isActive(i)) continue;
		if (i.deadline !== null && i.deadline < today) deadline.push(i);
		if (i.softDeadline !== null && i.softDeadline < today) softDeadline.push(i);
	}
	return { deadline: deadline.sort(byDate("deadline")), softDeadline: softDeadline.sort(byDate("softDeadline")) };
}

/** 期限まで `days` 日以内（今日を含む）。ADR-0009 の caution */
export function cautionIssues(issues: Iterable<Issue>, today: LocalDate, days = 3): DueLists {
	const within = (d: LocalDate | null) => d !== null && diffDays(d, today) >= 0 && diffDays(d, today) <= days;
	const deadline: Issue[] = [];
	const softDeadline: Issue[] = [];
	for (const i of issues) {
		if (!isActive(i)) continue;
		if (within(i.deadline)) deadline.push(i);
		if (within(i.softDeadline)) softDeadline.push(i);
	}
	return { deadline: deadline.sort(byDate("deadline")), softDeadline: softDeadline.sort(byDate("softDeadline")) };
}

/** その日が Calendar の日の issue（ボードに載せたものを除く。ADR-0152） */
export function scheduledOn(issues: Iterable<Issue>, date: LocalDate, exclude: ReadonlySet<string> = new Set()): Issue[] {
	return [...issues]
		.filter((i) => isActive(i) && i.scheduled === date && !exclude.has(i.id))
		.sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
}

/** Missed（ADR-0152）: Calendar の日（scheduled）が今日より前で、片付いていない issue。古い順 */
export function missedIssues(issues: Iterable<Issue>, today: LocalDate): Issue[] {
	return [...issues]
		.filter((i) => isActive(i) && i.scheduled !== null && i.scheduled < today)
		.sort((a, b) => a.scheduled!.localeCompare(b.scheduled!) || a.id.localeCompare(b.id, "en", { numeric: true }));
}

/** Missed のサブ（ADR-0152）。親が読めているものだけ。古い順 */
export function missedSubs(index: TaskIndex, today: LocalDate): SubIssue[] {
	return index.data.subIssues
		.filter((s) => isActive(s) && s.scheduled !== null && s.scheduled < today && index.sub(s.key) === s)
		.sort((a, b) => a.scheduled!.localeCompare(b.scheduled!) || a.key.localeCompare(b.key, "en", { numeric: true }));
}

/** 期限（end。ADR-0190）が hit に当たるサブ。active で親が読めているもの。end の早い順 */
function subDue(index: TaskIndex, hit: (d: LocalDate) => boolean): SubIssue[] {
	return index.data.subIssues
		.filter((s) => isActive(s) && index.sub(s.key) === s && s.end !== null && hit(s.end))
		.sort((a, b) => a.end!.localeCompare(b.end!) || a.key.localeCompare(b.key, "en", { numeric: true }));
}

/** 期限（end）を過ぎたサブ（ADR-0150, 0190。issue の deadIssues と同じ規則） */
export function deadSubs(index: TaskIndex, today: LocalDate): SubIssue[] {
	return subDue(index, (d) => d < today);
}

/** 期限（end）まで days 日以内（今日を含む）のサブ（ADR-0150, 0190。issue の cautionIssues と同じ規則） */
export function cautionSubs(index: TaskIndex, today: LocalDate, days = 3): SubIssue[] {
	return subDue(index, (d) => diffDays(d, today) >= 0 && diffDays(d, today) <= days);
}

/**
 * DailyTaskView の今の段階（ADR-0150）。手で選んだ段階があればそれ（Board 以外は片付いたら次へ）。
 * なければ、飛ばしていない、件数のある最初の段階。どれもなければ最後の段階（Board）
 */
export function currentStep<K extends string>(steps: readonly K[], counts: Record<K, number>, passed: ReadonlySet<K>, manual: K | null): K {
	const last = steps[steps.length - 1]!;
	if (manual !== null && (manual === last || counts[manual] > 0)) return manual;
	return steps.find((s) => s !== last && counts[s] > 0 && !passed.has(s)) ?? last;
}

/** Pick の候補（ADR-0150, 0203）: Next の issue と、親ごとにまとめたサブと、次の行動のない Project */
export interface PickCandidates {
	issues: Issue[];
	groups: { parent: Issue; subs: SubIssue[] }[];
	/** Next の Project（サブを持つ issue）のうち、Next のサブが 1 つもなく、先の期間もないもの（今日のボードに載っているものも含めて。ADR-0203, 0210） */
	stalled: Issue[];
}

const priorityRank = (p: Issue["priority"]) => (p === null ? PRIORITIES.length : PRIORITIES.indexOf(p));
const nullsLast = (a: string | null, b: string | null) => (a === b ? 0 : a === null ? 1 : b === null ? -1 : a.localeCompare(b));
/** Pick と Watch の並び（ADR-0150, 0184）: priority → deadline → 見直しが古い順 → ID */
export const byPick = (a: Issue, b: Issue) =>
	priorityRank(a.priority) - priorityRank(b.priority) || nullsLast(a.deadline, b.deadline) || nullsLast(a.reviewed ?? "", b.reviewed ?? "") || a.id.localeCompare(b.id, "en", { numeric: true });

/**
 * Pick の候補（ADR-0150）。今日のボードにないものだけ。
 * - issue: Next（isNext。open で clarified か in-progress で、Calendar も Tickler もない。ADR-0184）。サブを持つ親（Project。サブの status は見ない。ADR-0210）は行にしない
 * - サブ: Next（isNextSub。open か in-progress で、Calendar の日がなく、親が Next で、今日が期間に入っている。ADR-0203）。親ごとにまとめ、親の中の順に並べる
 * - 次の行動のない Project（ADR-0203, 0210）: Next の Project で、Next のサブが 1 つもなく、今日より後に始まる期間のサブもないもの。
 *   サブがすべて閉じたものも入る（親を閉じるよう促す）。Pick の段階から消えないように出す
 * 並びは priority → deadline → 見直しが古い順（サブは親の値）
 */
export function pickCandidates(index: TaskIndex, today: LocalDate, board: BoardState): PickCandidates {
	const on = new Set(board.issues);
	const groups = new Map<string, SubIssue[]>();
	const withNext = new Set<string>();
	for (const s of index.data.subIssues) {
		if (index.sub(s.key) !== s) continue;
		if (!index.nextSub(s, today)) continue;
		withNext.add(s.parent);
		if (on.has(s.key)) continue;
		groups.set(s.parent, [...(groups.get(s.parent) ?? []), s]);
	}
	const projects = new Set(index.data.subIssues.filter((s) => index.sub(s.key) === s).map((s) => s.parent));
	const issues = [...index.issues.values()].filter((i) => !on.has(i.id) && !projects.has(i.id) && index.next(i, today)).sort(byPick);
	const stalled = [...projects]
		.map((id) => index.issues.get(id))
		.filter((i): i is Issue => i !== undefined && index.next(i, today) && !withNext.has(i.id) && !hasFuturePeriod(index.subs(i.id), today))
		.sort(byPick);
	return {
		stalled,
		issues,
		groups: [...groups.entries()]
			.map(([id, subs]) => ({ parent: index.issues.get(id)!, subs: subs.sort((a, b) => a.order - b.order) }))
			.sort((a, b) => byPick(a.parent, b.parent)),
	};
}

/** 閉じていないサブに、今日より後に始まる期間があるか（次の行動が計画されている。ADR-0210） */
export function hasFuturePeriod(subs: readonly SubIssue[], today: LocalDate): boolean {
	return subs.some((s) => !isDoneStatus(s.status) && (s.start ?? s.end) !== null && (s.start ?? s.end)! > today);
}

/** サブがすべて閉じた（closed・canceled）Project か。親を閉じるよう促す（ADR-0210）。サブがなければ偽 */
export function allSubsDone(subs: readonly Pick<SubIssue, "status">[]): boolean {
	return subs.length > 0 && subs.every((s) => isDoneStatus(s.status));
}
