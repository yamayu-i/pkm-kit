import { isNext } from "./index";
import type { Issue } from "./schema";
import type { Patch } from "./actions";
import type { LocalDate } from "./dates";
import type { SubIssue, SubIssuePatch } from "./sub-issue";

/** Pick の前に Next にする。null なら確認も更新も不要。期限は残す。 */
export function pickIssuePatch(issue: Issue): Patch | null {
	return isNext(issue) ? null : { status: "open", clarified: true, scheduled: null, tickler: null, delegated_to: null, revisit: null };
}
export function pickSubPatch(sub: SubIssue, today: LocalDate): SubIssuePatch | null {
	const future = sub.start !== null && sub.start > today;
	if (sub.status === "open" && sub.scheduled === null && !future) return null;
	return { status: "open", delegatedTo: null, scheduled: null, ...(future ? { start: null } : {}) };
}
