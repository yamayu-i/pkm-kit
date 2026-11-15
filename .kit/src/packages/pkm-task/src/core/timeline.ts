import { addDays, diffDays, weekdayOf, type LocalDate } from "./dates";

/** ガントチャートの目盛り（ADR-0143）。週は日曜始まり */
export type TimelineScale = "day" | "week";

/** 1 日の幅（px）。Week は全期間を見渡すために細くする */
export const DAY_PX: Record<TimelineScale, number> = { day: 28, week: 8 };

/** 前後に足す日数と、最低の長さ */
const PAD_DAYS = 2;
const MIN_DAYS = 14;
const MIN_WEEKS = 8;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** 図に出すサブの項目 */
export interface TimelineSub {
	id: string;
	start: LocalDate | null;
	end: LocalDate | null;
	scheduled: LocalDate[];
	softDeadline: LocalDate | null;
	deadline: LocalDate | null;
	dependsOn: string[];
}

/** 図の範囲: from から days 日（from を含む） */
export interface TimelineRange {
	from: LocalDate;
	days: number;
}

export interface TimelineColumn {
	/** Day はその日、Week はその週の日曜 */
	date: LocalDate;
	/** Day は日（`15`）、Week は日曜の月日（`11/15`） */
	label: string;
	/** 範囲の始まりと、月が変わった列にだけ月の名前 */
	month: string | null;
	/** 土日（Day だけ） */
	weekend: boolean;
	/** 週の始まり（日曜）。区切りの線を引く */
	weekStart: boolean;
	/** 列の日数 */
	span: number;
}

const minDate = (dates: LocalDate[]) => dates.reduce((a, b) => (b < a ? b : a));
const maxDate = (dates: LocalDate[]) => dates.reduce((a, b) => (b > a ? b : a));

/** 図の範囲（ADR-0143）: サブの日付と今日を含み、前後 2 日。Day は最低 14 日、Week は日曜〜土曜に広げて最低 8 週 */
export function timelineRange(subs: readonly TimelineSub[], today: LocalDate, scale: TimelineScale): TimelineRange {
	const dates = [today];
	for (const s of subs) {
		for (const d of [s.start, s.end, s.softDeadline, s.deadline, ...s.scheduled]) if (d) dates.push(d);
	}
	let from = addDays(minDate(dates), -PAD_DAYS);
	let to = addDays(maxDate(dates), PAD_DAYS);
	if (scale === "week") {
		from = addDays(from, -weekdayOf(from));
		to = addDays(to, 6 - weekdayOf(to));
	}
	const days = Math.max(diffDays(to, from) + 1, scale === "week" ? MIN_WEEKS * 7 : MIN_DAYS);
	return { from, days };
}

/** 列の見出し */
export function timelineColumns(range: TimelineRange, scale: TimelineScale): TimelineColumn[] {
	const out: TimelineColumn[] = [];
	const step = scale === "week" ? 7 : 1;
	let prevMonth = -1;
	for (let i = 0; i < range.days; i += step) {
		const date = addDays(range.from, i);
		const month = Number(date.slice(5, 7)) - 1;
		const day = Number(date.slice(8, 10));
		const wd = weekdayOf(date);
		const showMonth = i === 0 || (scale === "day" ? day === 1 : month !== prevMonth);
		out.push({
			date,
			label: scale === "week" ? `${month + 1}/${day}` : String(day),
			month: showMonth ? MONTHS[month]! : null,
			weekend: scale === "day" && (wd === 0 || wd === 6),
			weekStart: wd === 0,
			span: Math.min(step, range.days - i),
		});
		prevMonth = month;
	}
	return out;
}

/** 範囲の始まりからの日数 */
export function dayOffset(range: TimelineRange, date: LocalDate): number {
	return diffDays(date, range.from);
}

/** x 座標（図の左端から px）の日付。範囲の外は端の日にする */
export function dateAtX(range: TimelineRange, x: number, scale: TimelineScale): LocalDate {
	const i = Math.min(range.days - 1, Math.max(0, Math.floor(x / DAY_PX[scale])));
	return addDays(range.from, i);
}

/** 棒（両端の日を含む）。片方だけなら 1 日、逆なら入れ替える。期間がなければ null */
export function barOf(sub: Pick<TimelineSub, "start" | "end">): { start: LocalDate; end: LocalDate } | null {
	const a = sub.start ?? sub.end;
	const b = sub.end ?? sub.start;
	if (a === null || b === null) return null;
	return a <= b ? { start: a, end: b } : { start: b, end: a };
}

export type DragMode = "move" | "start" | "end";

/** ドラッグの結果: move は丸ごとずらす、start / end は片方だけ。start は end を越えない */
export function dragBar(bar: { start: LocalDate; end: LocalDate }, mode: DragMode, delta: number): { start: LocalDate; end: LocalDate } {
	if (mode === "move") return { start: addDays(bar.start, delta), end: addDays(bar.end, delta) };
	if (mode === "start") {
		const start = addDays(bar.start, delta);
		return { start: start > bar.end ? bar.end : start, end: bar.end };
	}
	const end = addDays(bar.end, delta);
	return { start: bar.start, end: end < bar.start ? bar.start : end };
}

/** 依存の矢印: 依存先とそのサブの両方に棒があるときだけ。依存先の end より前に始まると遅れ（lint の start-before-dependency と同じ） */
export function dependencyArrows(subs: readonly TimelineSub[]): { from: string; to: string; late: boolean }[] {
	const bars = new Map(subs.map((s) => [s.id, barOf(s)]));
	const out: { from: string; to: string; late: boolean }[] = [];
	for (const s of subs) {
		const to = bars.get(s.id);
		if (!to) continue;
		for (const dep of s.dependsOn) {
			const from = bars.get(dep);
			if (!from || dep === s.id) continue;
			out.push({ from: dep, to: s.id, late: to.start < from.end });
		}
	}
	return out;
}
