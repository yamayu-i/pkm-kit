import type { LocalDate } from "./dates";
import type { Issue } from "./schema";

/** frontmatter の更新内容。null / 空配列は欄ごと消す（TaskWriter.update と同じ） */
export type Patch = Record<string, string | number | boolean | string[] | null>;

/** Cancel: 期限は外す（ADR-0009） */
export function cancelPatch(): Patch {
	return { status: "canceled", mid_due: null, deadline: null, delegated_to: null, revisit: null };
}

/** 終わっていた */
export function closePatch(): Patch {
	return { status: "closed", delegated_to: null, revisit: null };
}

/** Inbox に戻す: 予定と期限をすべて外す（ADR-0006） */
export function inboxPatch(): Patch {
	return { status: "open", scheduled: null, mid_due: null, deadline: null, delegated_to: null, revisit: null };
}

/** Someday へ: 予定と期限を外す。revisit は任意（ADR-0006） */
export function somedayPatch(revisit: LocalDate | null = null): Patch {
	return { status: "someday", scheduled: null, mid_due: null, deadline: null, delegated_to: null, revisit };
}

/** someday から戻すときは open にして revisit を外す */
export function reopenPatch(): Patch {
	return { status: "open", revisit: null };
}

export type RescheduleTarget = "scheduled" | "mid_due" | "deadline";

/**
 * リスケ。期限はその日に置き換える。実行日は `from` を外して `to` を足す（from が null なら足すだけ）
 */
export function reschedulePatch(issue: Issue, target: RescheduleTarget, to: LocalDate, from: LocalDate | null = null): Patch {
	if (target !== "scheduled") return { [target]: to };
	const dates = new Set(issue.scheduled);
	if (from !== null) dates.delete(from);
	dates.add(to);
	return { scheduled: [...dates].sort() };
}

/** 実行日を足す（Organize で予定を入れるとき。estimated も一緒に入れられる） */
export function schedulePatch(issue: Issue, dates: LocalDate[], estimated: number | null = null): Patch {
	const patch: Patch = { scheduled: [...new Set([...issue.scheduled, ...dates])].sort() };
	if (issue.status === "someday") Object.assign(patch, reopenPatch());
	if (estimated !== null) patch.estimated = estimated;
	return patch;
}
