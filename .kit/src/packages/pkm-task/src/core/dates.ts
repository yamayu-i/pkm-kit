export {
	addDays,
	diffDays,
	fromEpochDay,
	isLocalDate,
	localToday,
	monthGridDays,
	toEpochDay,
	weekdayOf,
	WEEKDAY_NAMES,
	type LocalDate,
	type Weekday,
} from "../../../shared/src/dates.ts";
import { isLocalDate, localToday, weekdayOf, WEEKDAY_NAMES, type LocalDate } from "../../../shared/src/dates.ts";

/**
 * frontmatter の値を日付にする。YAML パーサーによっては Date になるので、それも受ける。
 * 日付として読めなければ null
 */
export function normalizeDate(value: unknown): LocalDate | null {
	if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
	if (typeof value === "string") {
		const s = value.trim();
		return isLocalDate(s) ? s : null;
	}
	return null;
}

/** 端末のタイムゾーンでの日時（`2026-10-31T10:00:00+09:00`）。created に使う */
export function localDateTime(now: Date = new Date()): string {
	const pad = (n: number) => String(Math.trunc(Math.abs(n))).padStart(2, "0");
	const offset = -now.getTimezoneOffset();
	const sign = offset >= 0 ? "+" : "-";
	return (
		`${localToday(now)}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}` +
		`${sign}${pad(offset / 60)}:${pad(offset % 60)}`
	);
}

/** `11/02 (mon)` */
export function formatShortDate(date: LocalDate): string {
	return `${date.slice(5, 7)}/${date.slice(8, 10)} (${WEEKDAY_NAMES[weekdayOf(date)]})`;
}
