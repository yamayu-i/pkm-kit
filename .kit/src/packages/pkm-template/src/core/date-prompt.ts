import { parseDateInput } from "../../../shared/src/date-input.ts";
import { WEEKDAY_NAMES, weekdayOf, type LocalDate } from "../../../shared/src/dates.ts";

export interface DatePromptValue {
	date: LocalDate;
	/** 曜日を付けるか（`-d`） */
	weekday: boolean;
}

/**
 * 日付のダイアログの入力（ADR-0065）。ADR-0017 の短い書き方に、空白で区切った `-d`（曜日を付ける）を足す。
 * 空なら今日。読めない入力と存在しない日付は null
 */
export function parseDatePromptInput(input: string, today: LocalDate): DatePromptValue | null {
	const words = input.trim().split(/\s+/).filter((w) => w !== "");
	const weekday = words.some((w) => w.toLowerCase() === "-d");
	const rest = words.filter((w) => w.toLowerCase() !== "-d");
	if (rest.length === 0) return { date: today, weekday };
	if (rest.length > 1) return null;
	const date = parseDateInput(rest[0]!, today);
	return date === null ? null : { date, weekday };
}

/** `YYYY-MM-DD` か `YYYY-MM-DD DDD`（`2026-11-08 SUN`）。曜日は `{{date:DDD}}` と同じ英大文字 3 字 */
export function formatPromptDate(date: LocalDate, weekday: boolean): string {
	return weekday ? `${date} ${(WEEKDAY_NAMES[weekdayOf(date)] ?? "sun").toUpperCase()}` : date;
}
