/**
 * 日付・時刻・期間の入力言語（ADR-0228。ADR-0017・ADR-0193 を一部置換）。pkm-task と pkm-template で共有する（ADR-0065）。
 * 書き方と意味だけを決める。空欄の意味・今より後を許すか・時刻だけのときの日などは、欄の設定として引数で受け取る
 */
import { WEEKDAY_NAMES, addDays, fromEpochDay, isLocalDate, weekdayOf, type LocalDate, type Weekday } from "./dates.ts";

const pad2 = (n: number) => String(n).padStart(2, "0");

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

const DATE_WORDS: Record<string, number> = { today: 0, tomorrow: 1, yesterday: -1 };

/** 相対の日付の単位。月は `mo`（`m` は分。ADR-0228） */
const DATE_UNIT_RE = /(\d*)(mo|y|w|d)/g;

/** `+1w2d` の `1w2d` の部分。各単位は 1 回まで。読めなければ null */
function relativeDate(today: LocalDate, sign: 1 | -1, body: string): LocalDate | null {
	if (/^\d+$/.test(body)) return addDays(today, sign * Number(body));
	let rest = body;
	let months = 0;
	let days = 0;
	const seen = new Set<string>();
	for (const m of body.matchAll(DATE_UNIT_RE)) {
		const unit = m[2]!;
		if (seen.has(unit)) return null;
		seen.add(unit);
		const n = m[1] === "" ? 1 : Number(m[1]);
		if (unit === "y") months += 12 * n;
		else if (unit === "mo") months += n;
		else if (unit === "w") days += 7 * n;
		else days += n;
		rest = rest.replace(m[0], "");
	}
	if (seen.size === 0 || rest !== "") return null;
	return addDays(addMonths(today, sign * months), sign * days);
}

/** 日付の入力を今日を基準に解釈する（ADR-0228 の 2）。読めない入力と存在しない日付は null */
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
	if (s in DATE_WORDS) return addDays(today, DATE_WORDS[s]!);
	const bare = (WEEKDAY_NAMES as readonly string[]).indexOf(s);
	if (bare >= 0) return addWeekdays(today, bare as Weekday, 1, 1);
	const m = /^([+-])(.+)$/.exec(s);
	if (!m) return null;
	const sign = m[1] === "+" ? 1 : -1;
	const weekday = /^(\d*)([a-z]{3})$/.exec(m[2]!);
	const weekdayIndex = weekday ? (WEEKDAY_NAMES as readonly string[]).indexOf(weekday[2]!) : -1;
	if (weekday && weekdayIndex >= 0) {
		const n = weekday[1] === "" ? 1 : Number(weekday[1]);
		return n < 1 ? null : addWeekdays(today, weekdayIndex as Weekday, sign, n);
	}
	return relativeDate(today, sign, m[2]!);
}

/** 時刻の入力（`hhmm` / `hh:mm` / `h:mm`）を `hh:mm` にする。読めなければ null */
export function parseTimeInput(input: string): string | null {
	const m = /^(?:(\d{2})(\d{2})|(\d{1,2}):(\d{2}))$/.exec(input.trim());
	if (!m) return null;
	const hour = Number(m[1] ?? m[3]);
	const minute = Number(m[2] ?? m[4]);
	if (hour > 23 || minute > 59) return null;
	return `${pad2(hour)}:${pad2(minute)}`;
}

/** 時刻だけを入れたときの日の決め方（欄の設定。ADR-0228 の 2） */
export type TimeOnlyDay =
	/** 今か今より前で、いちばん近いその時刻 */
	| { kind: "past" }
	/** 基準の日時より後で、いちばん近いその時刻 */
	| { kind: "after"; baseMs: number }
	/** 今日のその時刻 */
	| { kind: "today" };

export interface DateTimeInputOptions {
	/** 基準の今（ms） */
	now: number;
	/** 時刻だけのときの日。省略時は今日 */
	timeOnly?: TimeOnlyDay;
	/** 相対の時刻に `+`（今より後）を許すか。省略時は許さない */
	allowFuture?: boolean;
}

/** 端末のタイムゾーンでの日付 */
function localDateOf(ms: number): LocalDate {
	const d = new Date(ms);
	return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** 日付と `hh:mm` から ms（端末のタイムゾーン）。夏時間で存在しない時刻は null */
export function composeDateTime(date: LocalDate, time: string): number | null {
	const [y, mo, d] = date.split("-").map(Number) as [number, number, number];
	const [h, mi] = time.split(":").map(Number) as [number, number];
	const t = new Date(y, mo - 1, d, h, mi, 0, 0);
	return t.getHours() === h && t.getMinutes() === mi ? t.getTime() : null;
}

function resolveTimeOnly(time: string, opts: DateTimeInputOptions): number | null {
	const rule = opts.timeOnly ?? { kind: "today" };
	if (rule.kind === "after") {
		const base = localDateOf(rule.baseMs);
		const same = composeDateTime(base, time);
		return same !== null && same > rule.baseMs ? same : composeDateTime(addDays(base, 1), time);
	}
	const today = localDateOf(opts.now);
	const same = composeDateTime(today, time);
	if (rule.kind === "today" || (same !== null && same <= opts.now)) return same;
	return composeDateTime(addDays(today, -1), time);
}

/**
 * 日時の入力（`時刻 [日付]`。ADR-0228 の 2）を ms にする。読めない入力・存在しない日時・日付だけは null。
 * 今より後かどうかは確かめない（欄の制約で確かめる）
 */
export function parseDateTimeInput(input: string, opts: DateTimeInputOptions): number | null {
	const words = input.trim().toLowerCase().split(/\s+/).filter((w) => w !== "");
	const floored = new Date(opts.now);
	floored.setSeconds(0, 0);
	if (words.length === 1) {
		const w = words[0]!;
		if (w === "now") return floored.getTime();
		const relative = /^([+-])(?:(\d+)h)?(?:(\d+)m)?$/.exec(w);
		if (relative && (relative[2] !== undefined || relative[3] !== undefined)) {
			if (relative[1] === "+" && !opts.allowFuture) return null;
			const minutes = Number(relative[2] ?? 0) * 60 + Number(relative[3] ?? 0);
			return floored.getTime() + (relative[1] === "+" ? 1 : -1) * minutes * 60_000;
		}
		const time = parseTimeInput(w);
		return time === null ? null : resolveTimeOnly(time, opts);
	}
	if (words.length !== 2) return null;
	const today = localDateOf(opts.now);
	const [a, b] = words as [string, string];
	const timeFirst = parseTimeInput(a);
	if (timeFirst !== null) {
		const date = parseDateInput(b, today);
		return date === null ? null : composeDateTime(date, timeFirst);
	}
	// 保存の形（`2026-11-24 22:00`）だけは日付が先
	if (/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(a)) {
		const date = parseDateInput(a, today);
		const time = parseTimeInput(b);
		return date === null || time === null ? null : composeDateTime(date, time);
	}
	return null;
}

/** 1 日 = 24 時間で換算する（ADR-0034） */
export const MINUTES_PER_DAY = 24 * 60;

const UNIT_MINUTES: Record<string, number> = { d: MINUTES_PER_DAY, h: 60, m: 1 };

/**
 * 期間の入力を分にする（ADR-0034・ADR-0228）。`1m` / `2h` / `1d` / `0.5d` / `2d3h33m` / `1h 30m` を読む。
 * 単位のない数字だけなら分。読めないもの、同じ単位が 2 回あるもの、0 以下は null
 */
export function parseDurationInput(input: string): number | null {
	const text = input.trim().toLowerCase();
	if (/^\d+(?:\.\d+)?$/.test(text)) {
		const min = Math.round(Number(text));
		return min > 0 ? min : null;
	}
	if (!/^(?:\d+(?:\.\d+)?\s*[dhm]\s*)+$/.test(text)) return null;
	const seen = new Set<string>();
	let total = 0;
	for (const m of text.matchAll(/(\d+(?:\.\d+)?)\s*([dhm])/g)) {
		const unit = m[2]!;
		if (seen.has(unit)) return null;
		seen.add(unit);
		total += Number(m[1]) * UNIT_MINUTES[unit]!;
	}
	const min = Math.round(total);
	return min > 0 ? min : null;
}

/** 欄を離れたときに書き換える日時の文字（`2026-08-26 22:05`）。parseDateTimeInput で同じ日時に戻る */
export function formatDateTimeValue(ms: number): string {
	const d = new Date(ms);
	return `${localDateOf(ms)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** 解釈した日付の表示（`2026-11-24 TUE`。ADR-0228 の 3） */
export function formatDateLabel(date: LocalDate): string {
	return `${date} ${WEEKDAY_NAMES[weekdayOf(date)]!.toUpperCase()}`;
}

/** 解釈した日時の表示（`2026-11-24 TUE 22:00`） */
export function formatDateTimeLabel(ms: number): string {
	const value = formatDateTimeValue(ms);
	return `${formatDateLabel(value.slice(0, 10))} ${value.slice(11)}`;
}

/** 入力欄の例（入力欄の下と placeholder に出す） */
export const DATE_INPUT_EXAMPLES = "e.g. 15 / 1224 / +1d / fri / +2w / +mo / tomorrow";
export const DATETIME_INPUT_EXAMPLES = "e.g. 2200 / -22m / 2200 -1d / 0930 fri / now";

export const DATE_INPUT_ERROR = "日付として読めません";
export const DATETIME_INPUT_ERROR = "日時として読めません";
