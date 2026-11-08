import { WEEKDAY_NAMES, diffDays, weekdayOf, type LocalDate, type Weekday } from "./dates";

/** 月の中のどの日か（ADR-0010） */
export type MonthSpec =
	| { kind: "day"; day: number }
	| { kind: "last" }
	| { kind: "nth"; n: number; weekday: Weekday }
	| { kind: "lastWeekday"; weekday: Weekday };

export type RepeatRule =
	| { every: "day"; interval: number }
	| { every: "week"; interval: number; weekdays: Weekday[] }
	| { every: "month"; interval: number; days: MonthSpec[] };

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

function parseWeekday(s: string): Weekday | null {
	const i = (WEEKDAY_NAMES as readonly string[]).indexOf(s.toLowerCase());
	return i < 0 ? null : (i as Weekday);
}

/** `15` / `last` / `2th-tue`（`2nd-tue` も可）/ `last-fri` */
export function parseMonthSpec(value: unknown): MonthSpec | null {
	if (typeof value === "number") {
		return Number.isInteger(value) && value >= 1 && value <= 31 ? { kind: "day", day: value } : null;
	}
	if (typeof value !== "string") return null;
	const s = value.trim().toLowerCase();
	if (/^\d+$/.test(s)) return parseMonthSpec(Number(s));
	if (s === "last") return { kind: "last" };
	const nth = /^([1-5])(?:th|st|nd|rd)-([a-z]{3})$/.exec(s);
	if (nth) {
		const weekday = parseWeekday(nth[2]!);
		return weekday === null ? null : { kind: "nth", n: Number(nth[1]), weekday };
	}
	const last = /^last-([a-z]{3})$/.exec(s);
	if (last) {
		const weekday = parseWeekday(last[1]!);
		return weekday === null ? null : { kind: "lastWeekday", weekday };
	}
	return null;
}

function asList(value: unknown): unknown[] {
	if (value === undefined || value === null) return [];
	return Array.isArray(value) ? value : [value];
}

function serializeMonthSpec(spec: MonthSpec): number | string {
	switch (spec.kind) {
		case "day":
			return spec.day;
		case "last":
			return "last";
		case "nth":
			return `${spec.n}th-${WEEKDAY_NAMES[spec.weekday]}`;
		case "lastWeekday":
			return `last-${WEEKDAY_NAMES[spec.weekday]}`;
	}
}

/** frontmatter に書く形。interval が 1 なら省く */
export function serializeRepeat(rule: RepeatRule): Record<string, unknown> {
	const interval = rule.interval > 1 ? { interval: rule.interval } : {};
	if (rule.every === "day") return { every: "day", ...interval };
	if (rule.every === "week") return { every: "week", ...interval, on: rule.weekdays.map((w) => WEEKDAY_NAMES[w]) };
	return { every: "month", ...interval, on: rule.days.map(serializeMonthSpec) };
}

/** frontmatter の `repeat` を読む */
export function parseRepeat(value: unknown): ParseResult<RepeatRule> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return { ok: false, error: "repeat がオブジェクトではありません" };
	}
	const raw = value as Record<string, unknown>;
	const interval = raw.interval === undefined || raw.interval === null ? 1 : raw.interval;
	if (typeof interval !== "number" || !Number.isInteger(interval) || interval < 1) {
		return { ok: false, error: `repeat.interval は 1 以上の整数にしてください: ${String(raw.interval)}` };
	}
	const on = asList(raw.on);
	switch (raw.every) {
		case "day":
			return { ok: true, value: { every: "day", interval } };
		case "week": {
			const weekdays: Weekday[] = [];
			for (const v of on) {
				const w = typeof v === "string" ? parseWeekday(v.trim()) : null;
				if (w === null) return { ok: false, error: `repeat.on の曜日が読めません: ${String(v)}` };
				if (!weekdays.includes(w)) weekdays.push(w);
			}
			if (weekdays.length === 0) return { ok: false, error: "every: week には repeat.on で曜日を指定してください" };
			return { ok: true, value: { every: "week", interval, weekdays } };
		}
		case "month": {
			const days: MonthSpec[] = [];
			for (const v of on) {
				const spec = parseMonthSpec(v);
				if (spec === null) return { ok: false, error: `repeat.on の日付が読めません: ${String(v)}` };
				days.push(spec);
			}
			if (days.length === 0) return { ok: false, error: "every: month には repeat.on で日付を指定してください" };
			return { ok: true, value: { every: "month", interval, days } };
		}
		default:
			return { ok: false, error: `repeat.every は day / week / month のどれかにしてください: ${String(raw.every)}` };
	}
}

function daysInMonth(year: number, month: number): number {
	return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function matchesMonthSpec(spec: MonthSpec, year: number, month: number, day: number, weekday: Weekday): boolean {
	const last = daysInMonth(year, month);
	switch (spec.kind) {
		case "day":
			return spec.day === day;
		case "last":
			return day === last;
		case "nth":
			return weekday === spec.weekday && Math.ceil(day / 7) === spec.n;
		case "lastWeekday":
			return weekday === spec.weekday && day + 7 > last;
	}
}

/** 月曜始まりの週の月曜からの日数 */
function mondayOffset(date: LocalDate): number {
	return (weekdayOf(date) + 6) % 7;
}

/**
 * `date` が `rule` に当てはまるか。`anchor` は interval を数える起点（その日以前は当てはまらない）
 */
export function occursOn(rule: RepeatRule, anchor: LocalDate, date: LocalDate): boolean {
	const elapsed = diffDays(date, anchor);
	if (elapsed < 0) return false;
	switch (rule.every) {
		case "day":
			return elapsed % rule.interval === 0;
		case "week": {
			if (!rule.weekdays.includes(weekdayOf(date))) return false;
			const weeks = (elapsed + mondayOffset(anchor) - mondayOffset(date)) / 7;
			return weeks % rule.interval === 0;
		}
		case "month": {
			const [y, m, d] = date.split("-").map(Number) as [number, number, number];
			const [ay, am] = anchor.split("-").map(Number) as [number, number];
			const months = (y - ay) * 12 + (m - am);
			if (months % rule.interval !== 0) return false;
			const weekday = weekdayOf(date);
			return rule.days.some((spec) => matchesMonthSpec(spec, y, m, d, weekday));
		}
	}
}


const ORDINAL = ["", "1st", "2nd", "3rd", "4th", "5th"];

/** 表示用の説明（例: Every 2 weeks mon, thu / Monthly 2nd tue。ADR-0076） */
export function describeRepeat(rule: RepeatRule): string {
	const every = (unit: string, each: string) => (rule.interval === 1 ? each : `Every ${rule.interval} ${unit}s`);
	switch (rule.every) {
		case "day":
			return every("day", "Daily");
		case "week":
			return `${every("week", "Weekly")} ${rule.weekdays.map((w) => WEEKDAY_NAMES[w]).join(", ")}`;
		case "month": {
			const days = rule.days.map((d) => {
				switch (d.kind) {
					case "day":
						return `day ${d.day}`;
					case "last":
						return "last day";
					case "nth":
						return `${ORDINAL[d.n]} ${WEEKDAY_NAMES[d.weekday]}`;
					case "lastWeekday":
						return `last ${WEEKDAY_NAMES[d.weekday]}`;
				}
			});
			return `${every("month", "Monthly")} ${days.join(", ")}`;
		}
	}
}
