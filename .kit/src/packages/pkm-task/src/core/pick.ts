import { isNext } from "./index";
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

/** Pick の前に Next にする。null なら確認も更新も不要。期限は残す。 */
export function pickIssuePatch(issue: Issue): Patch | null {
	return isNext(issue) ? null : { status: "open", clarified: true, scheduled: null, tickler: null, delegated_to: null, revisit: null };
}
export function pickSubPatch(sub: SubIssue, today: LocalDate): SubIssuePatch | null {
	const future = sub.start !== null && sub.start > today;
	if (sub.status === "open" && sub.scheduled === null && !future) return null;
	return { status: "open", delegatedTo: null, scheduled: null, ...(future ? { start: null } : {}) };
}
