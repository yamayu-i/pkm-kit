/** 日付と時刻の短い書き方の解釈（ADR-0017）。pkm-task と pkm-template で共有する（ADR-0065） */
import { WEEKDAY_NAMES, addDays, fromEpochDay, isLocalDate, weekdayOf, type LocalDate, type Weekday } from "./dates.ts";

function ymd(year: string, month: string, day: string): LocalDate | null {
	const date = `${year}-${month}-${day}`;
	return isLocalDate(date) ? date : null;
}

function daysInMonth(year: number, month: number): number {
	return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** n か月後（前）。その月にない日は月末にする */
function addMonths(date: LocalDate, n: number): LocalDate {
	const [y, m, d] = date.split("-").map(Number) as [number, number, number];
	const first = new Date(Date.UTC(y, m - 1 + n, 1));
	const year = first.getUTCFullYear();
	const month = first.getUTCMonth() + 1;
	return fromEpochDay(Date.UTC(year, month - 1, Math.min(d, daysInMonth(year, month))) / 86_400_000);
}

/** n 回後（前）のその曜日。今日と同じ曜日は数えない */
function addWeekdays(date: LocalDate, weekday: Weekday, sign: 1 | -1, n: number): LocalDate {
	const gap = (sign * (weekday - weekdayOf(date)) + 7) % 7 || 7;
	return addDays(date, sign * (gap + (n - 1) * 7));
}

/** 日付の入力を今日を基準に解釈する（ADR-0017）。読めない入力と存在しない日付は null */
export function parseDateInput(input: string, today: LocalDate): LocalDate | null {
	const s = input.trim().toLowerCase();
	const separated = /^(\d{4})[-/](\d{2})[-/](\d{2})$/.exec(s);
	if (separated) return ymd(separated[1]!, separated[2]!, separated[3]!);
	if (/^\d+$/.test(s)) {
		const [year, month] = today.split("-") as [string, string];
		if (s.length === 2) return ymd(year, month, s);
		if (s.length === 4) return ymd(year, s.slice(0, 2), s.slice(2));
		if (s.length === 6) return ymd(`20${s.slice(0, 2)}`, s.slice(2, 4), s.slice(4));
		if (s.length === 8) return ymd(s.slice(0, 4), s.slice(4, 6), s.slice(6));
		return null;
	}
	const bare = (WEEKDAY_NAMES as readonly string[]).indexOf(s);
	if (bare >= 0) return addWeekdays(today, bare as Weekday, 1, 1);
	const m = /^([+-])(\d*)([a-z]*)$/.exec(s);
	if (!m) return null;
	const sign = m[1] === "+" ? 1 : -1;
	const digits = m[2]!;
	const unit = m[3]!;
	const n = digits === "" ? 1 : Number(digits);
	if (unit === "") return digits === "" ? null : addDays(today, sign * n);
	if (unit === "d") return addDays(today, sign * n);
	if (unit === "w") return addDays(today, sign * n * 7);
	if (unit === "m") return addMonths(today, sign * n);
	const weekday = (WEEKDAY_NAMES as readonly string[]).indexOf(unit);
	if (weekday < 0 || n < 1) return null;
	return addWeekdays(today, weekday as Weekday, sign, n);
}

/** 時刻の入力（`hhmm` か `hh:mm`）を `hh:mm` にする。読めなければ null */
export function parseTimeInput(input: string): string | null {
	const m = /^(\d{2}):?(\d{2})$/.exec(input.trim());
	if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null;
	return `${m[1]}:${m[2]}`;
}
