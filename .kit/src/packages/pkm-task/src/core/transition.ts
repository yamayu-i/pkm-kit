import { cancelPatch, closePatch, somedayPatch, type Patch } from "./actions";
import type { LocalDate } from "./dates";
import { STATUSES, type Status } from "./schema";
import type { StatusLogEntry } from "./status-log";
import type { SubIssuePatch } from "./sub-issue";

/**
 * status の遷移表（ADR-0183）。status はここにある遷移でしか変えない。
 * closed / canceled からは、表の先に加えて ↩（閉じる前の status。reopenStatus）にだけ戻せる
 */
export const STATUS_TRANSITIONS: Readonly<Record<Status, readonly Status[]>> = {
	open: ["in-progress", "waiting", "delegated", "someday", "closed", "canceled"],
	"in-progress": ["waiting", "delegated", "someday", "closed", "canceled"],
	waiting: ["in-progress", "someday", "closed", "canceled"],
	delegated: ["in-progress", "someday", "closed", "canceled"],
	someday: ["open", "closed", "canceled"],
	closed: ["canceled"],
	canceled: ["closed"],
};

const isDone = (s: Status) => s === "closed" || s === "canceled";

/** 表の移れる先（STATUSES の順）。↩ は含まない */
export function transitionTargets(from: Status): Status[] {
	return STATUSES.filter((s) => STATUS_TRANSITIONS[from].includes(s));
}

/**
 * from から to に変えてよいか。reopenTo は closed / canceled のときの ↩ の戻る先（reopenStatus）。
 * 同じ status は遷移ではない（delegated の委任先の選び直しは status を変えない）
 */
export function canTransition(from: Status, to: Status, reopenTo: Status | null = null): boolean {
	if (from === to) return false;
	if (STATUS_TRANSITIONS[from].includes(to)) return true;
	return isDone(from) && reopenTo !== null && !isDone(reopenTo) && to === reopenTo;
}

/** 表にない遷移の誤り。移れる先を書く（MCP の返す文） */
export function transitionError(from: Status, to: Status, reopenTo: Status | null = null): string {
	const targets = [...transitionTargets(from), ...(isDone(from) && reopenTo !== null && !isDone(reopenTo) ? [`${reopenTo}（Reopen）`] : [])];
	return `status は ${from} から ${to} に変えられません。移れる先: ${targets.join(", ")}（ADR-0183）`;
}

/** 選んだものがすべて to に移れるか（一括の操作のボタン。1 つでも移れなければ押せなくする） */
export function canTransitionAll(froms: readonly Status[], to: Status): boolean {
	return froms.length > 0 && froms.every((from) => canTransition(from, to));
}

/** status のボタン（ADR-0183）。いちばんよく使う遷移 1 つ。reopen は closed / canceled の ↩ */
export type PrimaryStep = { kind: "status"; to: Status; label: string } | { kind: "reopen"; label: "Reopen" };

export function primaryStep(status: Status): PrimaryStep {
	switch (status) {
		case "open":
			return { kind: "status", to: "in-progress", label: "Start" };
		case "in-progress":
			return { kind: "status", to: "closed", label: "Close" };
		case "waiting":
		case "delegated":
			return { kind: "status", to: "in-progress", label: "Resume" };
		case "someday":
			return { kind: "status", to: "open", label: "Reopen" };
		default:
			return { kind: "reopen", label: "Reopen" };
	}
}

/**
 * ↩ の戻る先: その issue（sub があればそのサブ）の、最後の「終わっていない → closed / canceled」の記録の from。
 * 分からなければ open。logs は compareStatusLog の順
 */
export function reopenStatus(logs: readonly StatusLogEntry[], task: string, sub: string | null = null): Status {
	for (let i = logs.length - 1; i >= 0; i--) {
		const e = logs[i]!;
		if (e.task !== task || (e.sub ?? null) !== sub) continue;
		if (isDone(e.to) && !isDone(e.from)) return e.from;
	}
	return "open";
}

/** status を変えたらタイマーを止めるか（ADR-0183）。今の自分の作業でなくなるもの */
export function stopsTimer(to: Status): boolean {
	return to !== "open" && to !== "in-progress";
}

/** status を変えたら今日のボードの ★ を外すか（ADR-0184, 0183）。待ち・someday はやれないので外す */
export function unstarsOn(to: Status): boolean {
	return to === "waiting" || to === "delegated" || to === "someday";
}

/** タイマーを始めたときの status（ADR-0183）。null なら変えない */
export function timerStartStatus(from: Status): Status | null {
	return from === "open" || from === "waiting" || from === "delegated" ? "in-progress" : null;
}

export interface TransitionOptions {
	/** delegated にするときの委任先（m-N）。必須 */
	delegatedTo?: string | null;
	/** someday にするときの見直す日（任意） */
	revisit?: LocalDate | null;
}

/** issue の status を to にする frontmatter の変更（ADR-0183 の付随の変更の表）。遷移してよいかは canTransition で見る */
export function issueStatusPatch(to: Status, opts: TransitionOptions = {}): Patch {
	if (to === "closed") return closePatch();
	if (to === "canceled") return cancelPatch();
	if (to === "someday") return somedayPatch(opts.revisit ?? null);
	if (to === "delegated") {
		if (!opts.delegatedTo) throw new Error("delegated にするときは委任先を選んでください");
		return { status: to, delegated_to: opts.delegatedTo, revisit: null, tickler: null };
	}
	// Tickler は open だけが持つ（整理の先送り。ADR-0183）。open 以外にしたら消す
	if (to === "open") return { status: to, delegated_to: null, revisit: null };
	return { status: to, delegated_to: null, revisit: null, tickler: null };
}

/** サブの status を to にする変更。サブには tickler / revisit がない。ほかは issue と同じ */
export function subStatusPatch(to: Status, opts: TransitionOptions = {}): SubIssuePatch {
	if (to === "delegated") {
		if (!opts.delegatedTo) throw new Error("delegated にするときは委任先を選んでください");
		return { status: to, delegatedTo: opts.delegatedTo };
	}
	if (to === "someday") return { status: to, delegatedTo: null, scheduled: null, softDeadline: null, deadline: null };
	if (to === "canceled") return { status: to, delegatedTo: null, softDeadline: null, deadline: null };
	return { status: to, delegatedTo: null };
}

/**
 * status を from から to に変える変更に、付随の変更を補う（どの経路から書いても同じ結果にする。ADR-0183）。
 * someday から open に戻すときは clarified を外して Inbox に入れる（整理し直す。ADR-0189）。
 * 呼び出し側が書いた値が優先する（delegated の委任先、someday の revisit、Organize の Next・Calendar の clarified など）
 */
export function completeIssuePatch<T extends Record<string, unknown>>(to: Status, fields: T, from: Status | null = null): T {
	const base: Patch = to === "delegated" ? { revisit: null, tickler: null } : issueStatusPatch(to, { revisit: (fields.revisit as LocalDate | null | undefined) ?? null });
	if (from === "someday" && to === "open") base.clarified = null;
	return { ...base, ...fields };
}

export function completeSubPatch(to: Status, patch: SubIssuePatch): SubIssuePatch {
	const base: SubIssuePatch = to === "delegated" ? {} : subStatusPatch(to);
	return { ...base, ...patch };
}

/**
 * Tickler（ADR-0152）を付けられるか。Tickler は整理の先送りで、日付が来たら Inbox に戻すので、open だけが持つ（ADR-0183）。
 * someday は付けると open に戻る（ticklerPatch）。in-progress・待ち・終わったものには付けない（Inbox にも Next にも出なくなる）
 */
export function canSetTickler(status: Status): boolean {
	return status === "open" || status === "someday";
}

/** Tickler を付けられないときの文 */
export function ticklerError(status: Status): string {
	return `Tickler は open（と someday）の issue だけに付けられます。今は ${status} です（ADR-0183）`;
}

/** 一括の操作（ADR-0183）。tickler は canSetTickler。Inbox に戻す一括の操作はない（ADR-0189） */
export type BulkStatusOp = "closed" | "canceled" | "someday" | "tickler";

/** 選んだものすべてに、その一括の操作ができるか。1 つでもできなければ、ボタンを押せなくする */
export function canApplyAll(froms: readonly Status[], op: BulkStatusOp): boolean {
	if (op === "tickler") return froms.length > 0 && froms.every(canSetTickler);
	return canTransitionAll(froms, op);
}
