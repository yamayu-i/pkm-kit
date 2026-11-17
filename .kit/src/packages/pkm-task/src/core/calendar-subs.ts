import type { LocalDate } from "./dates";
import type { Issue } from "./schema";

/**
 * Calendar（scheduled）とサブイシューを同時に持たせない（ADR-0203）。
 * Calendar は「その日にやらなければならない」1 つの行動で、何日もかかる作業はサブの期間で表す（ADR-0152）。
 * サブは closed・canceled も含めて数える（全部閉じても Project のまま）
 */

/** サブを subCount 件持つ issue に Calendar の日 scheduled を書けるか。書けなければエラーの文。消す（null）のはよい */
export function calendarWithSubsError(id: string, subCount: number, scheduled: LocalDate | null): string | null {
	if (scheduled === null || subCount === 0) return null;
	return `${id}: サブイシューを持つ issue には Calendar の日（scheduled）を付けられません（ADR-0203）。何日もかかる作業は、サブの期間で計画してください`;
}

/** issue にサブを足せるか。足せなければエラーの文 */
export function subsWithCalendarError(issue: Pick<Issue, "id" | "scheduled">): string | null {
	if (issue.scheduled === null) return null;
	return `${issue.id}: Calendar の日を持つ issue にはサブイシューを足せません（ADR-0203）。先に Calendar の日（scheduled）を消してください`;
}
