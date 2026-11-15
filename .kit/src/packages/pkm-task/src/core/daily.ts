import { diffDays, type LocalDate } from "./dates";
import type { BoardState } from "./board";
import { isActive, isNext, type TaskIndex } from "./index";
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

/** サブの期限の一覧（ADR-0150）。deadline と soft_deadline は別 */
export interface SubDueLists {
	deadline: SubIssue[];
	softDeadline: SubIssue[];
}

function subDue(index: TaskIndex, hit: (d: LocalDate) => boolean): SubDueLists {
	const live = index.data.subIssues.filter((s) => isActive(s) && index.sub(s.key) === s);
	const by = (key: "deadline" | "softDeadline") =>
		live.filter((s) => s[key] !== null && hit(s[key]!)).sort((a, b) => a[key]!.localeCompare(b[key]!) || a.key.localeCompare(b.key, "en", { numeric: true }));
	return { deadline: by("deadline"), softDeadline: by("softDeadline") };
}

/** 期限を過ぎたサブ（ADR-0150。issue の deadIssues と同じ規則） */
export function deadSubs(index: TaskIndex, today: LocalDate): SubDueLists {
	return subDue(index, (d) => d < today);
}

/** 期限まで days 日以内（今日を含む）のサブ（ADR-0150。issue の cautionIssues と同じ規則） */
export function cautionSubs(index: TaskIndex, today: LocalDate, days = 3): SubDueLists {
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

/** Pick の候補（ADR-0150）: Next の issue と、親ごとにまとめたサブ */
export interface PickCandidates {
	issues: Issue[];
	groups: { parent: Issue; subs: SubIssue[] }[];
}

const priorityRank = (p: Issue["priority"]) => (p === null ? PRIORITIES.length : PRIORITIES.indexOf(p));
const nullsLast = (a: string | null, b: string | null) => (a === b ? 0 : a === null ? 1 : b === null ? -1 : a.localeCompare(b));
const byPick = (a: Issue, b: Issue) =>
	priorityRank(a.priority) - priorityRank(b.priority) || nullsLast(a.deadline, b.deadline) || nullsLast(a.reviewed ?? "", b.reviewed ?? "") || a.id.localeCompare(b.id, "en", { numeric: true });

/**
 * Pick の候補（ADR-0150）。今日のボードにないものだけ。
 * - issue: Next（open・clarified・Calendar も Tickler もない）。active なサブを持つ親（Project）は行にしない
 * - サブ: open で、Calendar の日がなく、start がないか今日以前。親が active なもの。親ごとにまとめ、親の中の順に並べる
 * 並びは priority → deadline → 見直しが古い順（サブは親の値）
 */
export function pickCandidates(index: TaskIndex, today: LocalDate, board: BoardState): PickCandidates {
	const on = new Set(board.issues);
	const groups = new Map<string, SubIssue[]>();
	for (const s of index.data.subIssues) {
		if (on.has(s.key) || index.sub(s.key) !== s) continue;
		if (s.status !== "open" || s.scheduled !== null || (s.start !== null && s.start > today)) continue;
		const parent = index.issues.get(s.parent);
		if (!parent || !isActive(parent)) continue;
		groups.set(s.parent, [...(groups.get(s.parent) ?? []), s]);
	}
	const projects = new Set(index.data.subIssues.filter((s) => isActive(s) && index.sub(s.key) === s).map((s) => s.parent));
	const issues = [...index.issues.values()].filter((i) => !on.has(i.id) && !projects.has(i.id) && isNext(i)).sort(byPick);
	return {
		issues,
		groups: [...groups.entries()]
			.map(([id, subs]) => ({ parent: index.issues.get(id)!, subs: subs.sort((a, b) => a.order - b.order) }))
			.sort((a, b) => byPick(a.parent, b.parent)),
	};
}
