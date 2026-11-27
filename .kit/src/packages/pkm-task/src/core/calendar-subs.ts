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

type SubDates = { start: LocalDate | null; end: LocalDate | null; scheduled: LocalDate | null };

/**
 * サブは Calendar の日（scheduled）か期間（start・end）のどちらか一方だけを持つ（ADR-0255）。
 * patch が日付に触れ、書いた後に両方を持つならエラーの文。日付に触れない変更と、片方を消す変更は止めない（両方を持つ古いサブは lint が知らせる）
 */
export function subCalendarPeriodError(before: SubDates | null, patch: Partial<SubDates>): string | null {
	if (patch.start === undefined && patch.end === undefined && patch.scheduled === undefined) return null;
	const after = (k: keyof SubDates) => (patch[k] !== undefined ? patch[k]! : (before?.[k] ?? null));
	if (after("scheduled") === null || (after("start") === null && after("end") === null)) return null;
	return "サブは Calendar の日と期間を同時に持てません（ADR-0255）。どちらか一方を外してください。ガントでは 1 日の期間と Calendar を切り替えられます";
}
