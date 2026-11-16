import { isNext, isNextSub } from "./index";
import type { Issue, Status } from "./schema";
import { isDoneStatus } from "./status-log";
import type { Patch } from "./actions";
import type { LocalDate } from "./dates";
import type { SubIssue, SubIssuePatch } from "./sub-issue";

/** issue と上下のサブで共通。記録中は、完了後や日をまたいでも停止できる。 */
export function pickTimerControl(status: Status, picked: boolean, running: boolean): "pick" | "start" | "stop" | null {
	if (running) return "stop";
	if (isDoneStatus(status)) return null;
	return picked ? "start" : "pick";
}

/** Pick の前に Next にする。null なら確認も更新も不要。期限は残す。in-progress は in-progress のまま（ADR-0184） */
export function pickIssuePatch(issue: Issue): Patch | null {
	if (isNext(issue)) return null;
	return { status: issue.status === "in-progress" ? "in-progress" : "open", clarified: true, scheduled: null, tickler: null, delegated_to: null, revisit: null };
}
export function pickSubPatch(sub: SubIssue, today: LocalDate): SubIssuePatch | null {
	if (isNextSub(sub, today)) return null;
	const future = sub.start !== null && sub.start > today;
	return { status: sub.status === "in-progress" ? "in-progress" : "open", delegatedTo: null, scheduled: null, ...(future ? { start: null } : {}) };
}
