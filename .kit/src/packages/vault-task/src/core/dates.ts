/** `YYYY-MM-DD`（タイムゾーンなしの日付） */
export type LocalDate = string;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

/** 0 = 日曜 … 6 = 土曜（Date#getDay と同じ） */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/** 1970-01-01 からの日数。不正な日付なら null */
export function toEpochDay(date: string): number | null {
	const m = DATE_RE.exec(date);
	if (!m) return null;
	const y = Number(m[1]);
	const mo = Number(m[2]);
	const d = Number(m[3]);
	const t = Date.UTC(y, mo - 1, d);
	const back = new Date(t);
	if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null;
	return t / DAY_MS;
}

export function fromEpochDay(day: number): LocalDate {
	return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

export function isLocalDate(value: unknown): value is LocalDate {
	return typeof value === "string" && toEpochDay(value) !== null;
}

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

function requireDay(date: LocalDate): number {
	const day = toEpochDay(date);
	if (day === null) throw new RangeError(`日付ではありません: ${date}`);
	return day;
}

export function addDays(date: LocalDate, days: number): LocalDate {
	return fromEpochDay(requireDay(date) + days);
}

/** a - b の日数 */
export function diffDays(a: LocalDate, b: LocalDate): number {
	return requireDay(a) - requireDay(b);
}

export function weekdayOf(date: LocalDate): Weekday {
	return new Date(requireDay(date) * DAY_MS).getUTCDay() as Weekday;
}

/** 端末のタイムゾーンでの今日 */
export function localToday(now: Date = new Date()): LocalDate {
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, "0");
	const d = String(now.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
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

/** 月のカレンダーに並べる 42 日（日曜始まり）。`month` は `YYYY-MM` */
export function monthGridDays(month: string): LocalDate[] {
	const first = `${month}-01`;
	const start = addDays(first, -weekdayOf(first));
	return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** `11/02 (mon)` */
export function formatShortDate(date: LocalDate): string {
	return `${date.slice(5, 7)}/${date.slice(8, 10)} (${WEEKDAY_NAMES[weekdayOf(date)]})`;
}
