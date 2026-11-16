import { isNext, isNextSub, isWatchStatus } from "./index";
import type { Issue, Status } from "./schema";
import { isDoneStatus } from "./status-log";
import type { Patch } from "./actions";
import type { LocalDate } from "./dates";
import type { SubIssue, SubIssuePatch } from "./sub-issue";

/**
 * issue と上下のサブで共通。記録中は、完了後や日をまたいでも停止できる。
 * 待ち（waiting / delegated）には出さない（status のボタンの Resume で戻す）。someday は Pick だけ（Pick で open になる。ADR-0183）
 */
export function pickTimerControl(status: Status, picked: boolean, running: boolean): "pick" | "start" | "stop" | null {
	if (running) return "stop";
	if (isDoneStatus(status) || isWatchStatus(status)) return null;
	if (status === "someday") return "pick";
	return picked ? "start" : "pick";
}

/** Pick したときの status（ADR-0183 の遷移表に沿う）: in-progress はそのまま、待ちは in-progress、ほかは open */
function pickedStatus(status: Status): Status {
	return status === "in-progress" || isWatchStatus(status) ? "in-progress" : "open";
}

/** Pick の前に Next にする。null なら確認も更新も不要。期限は残す。in-progress は in-progress のまま（ADR-0184） */
export function pickIssuePatch(issue: Issue): Patch | null {
	if (isNext(issue)) return null;
	return { status: pickedStatus(issue.status), clarified: true, scheduled: null, tickler: null, delegated_to: null, revisit: null };
}
export function pickSubPatch(sub: SubIssue, today: LocalDate): SubIssuePatch | null {
	if (isNextSub(sub, today)) return null;
	const future = sub.start !== null && sub.start > today;
	return { status: pickedStatus(sub.status), delegatedTo: null, scheduled: null, ...(future ? { start: null } : {}) };
}
