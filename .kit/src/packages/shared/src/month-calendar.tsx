/** 月のカレンダー（ADR-0078。月と年の一覧は ADR-0228 の 5）。pkm-task と pkm-template の日付の選択で共有する。見た目は month-calendar.css */
import { useEffect, useRef, useState } from "preact/hooks";
import { monthGridDays, WEEKDAY_NAMES, type LocalDate } from "./dates.ts";

export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;

/** 曜日の見出し（`S M T W T F S`） */
export const WEEKDAY_INITIALS = WEEKDAY_NAMES.map((w) => w.charAt(0).toUpperCase());

/** `2026-11` → `November 2026` */
export function formatMonthTitle(month: string): string {
	const [y, m] = month.split("-").map(Number) as [number, number];
	return `${MONTH_NAMES[m - 1] ?? ""} ${y}`;
}

/** n か月後（前）の月（`YYYY-MM`） */
export function shiftMonth(month: string, n: number): string {
	const [y, m] = month.split("-").map(Number) as [number, number];
	return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
}

/** 年の一覧に並べる年。今年の前後 10 年に、その外なら表示中の年を足す */
export function yearOptions(displayYear: number, todayYear: number): number[] {
	const years = Array.from({ length: 21 }, (_, i) => todayYear - 10 + i);
	if (!years.includes(displayYear)) years.push(displayYear);
	return years.sort((a, b) => a - b);
}

/** その月の週ごとの日。月の外の日は null（空けて描く）。週の数は月によって 4〜6 */
export function monthWeeks(month: string): (LocalDate | null)[][] {
	const days = monthGridDays(month).map((d) => (d.startsWith(month) ? d : null));
	const weeks: (LocalDate | null)[][] = [];
	for (let i = 0; i < days.length; i += 7) {
		const week = days.slice(i, i + 7);
		if (week.some((d) => d !== null)) weeks.push(week);
	}
	return weeks;
}

/** 日ごとに足す印（期限など）。class と、読み上げとツールチップに足す言葉 */
export interface DayMark {
	classes: string[];
	notes: string[];
}

function Chevron(props: { dir: "left" | "right" }) {
	return (
		<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d={props.dir === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
		</svg>
	);
}

function DropArrow() {
	return (
		<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
			<path d="M7 10l5 5 5-5z" />
		</svg>
	);
}

type CalendarView = "days" | "months" | "years";

/** 月か年の一覧。表示中のものは塗りの丸。選ぶと日の格子に戻る */
function OptionList(props: { label: string; options: { value: number; text: string; selected: boolean }[]; onPick: (value: number) => void }) {
	const ref = useRef<HTMLDivElement>(null);
	// 表示中のものが見える位置までスクロールする（年の一覧は長い）
	useEffect(() => {
		const list = ref.current;
		const selected = list?.querySelector<HTMLElement>(".is-selected");
		if (list && selected) list.scrollTop = selected.offsetTop - list.clientHeight / 2 + selected.offsetHeight / 2;
	}, []);
	return (
		<div class="vt-cal-options" role="group" aria-label={props.label} ref={ref}>
			{props.options.map((o) => (
				<button type="button" key={o.value} class={`vt-cal-option${o.selected ? " is-selected" : ""}`} aria-pressed={o.selected} onClick={() => props.onPick(o.value)}>
					{o.text}
				</button>
			))}
		</div>
	);
}

/**
 * 月のカレンダー。日は枠のない丸で、今日は枠線の丸、選んだ日は塗りの丸（ADR-0078）。
 * 選ぶ・外すの意味は呼ぶ側が決める（1 日を選ぶ・複数日を切り替える）
 */
export function MonthCalendar(props: {
	month: string;
	onMonth: (month: string) => void;
	today: LocalDate;
	isSelected: (date: LocalDate) => boolean;
	onPick: (date: LocalDate) => void;
	mark?: (date: LocalDate) => DayMark | null;
}) {
	const { month, today } = props;
	const [view, setView] = useState<CalendarView>("days");
	const [year, monthNumber] = month.split("-").map(Number) as [number, number];
	const toggle = (next: CalendarView) => setView(view === next ? "days" : next);
	const pick = (y: number, m: number) => {
		props.onMonth(`${y}-${String(m).padStart(2, "0")}`);
		setView("days");
	};
	return (
		<div class="vt-cal">
			<div class="vt-cal-head">
				<span class="vt-cal-title" aria-live="polite">
					<button type="button" class={`vt-cal-menu${view === "months" ? " is-open" : ""}`} aria-expanded={view === "months"} aria-label={`Choose month (${MONTH_NAMES[monthNumber - 1]})`} onClick={() => toggle("months")}>
						{MONTH_NAMES[monthNumber - 1]}
						<DropArrow />
					</button>
					<button type="button" class={`vt-cal-menu${view === "years" ? " is-open" : ""}`} aria-expanded={view === "years"} aria-label={`Choose year (${year})`} onClick={() => toggle("years")}>
						{year}
						<DropArrow />
					</button>
				</span>
				{view === "days" && (
					<>
						<button type="button" class="vt-cal-nav" aria-label="Previous month" title="Previous month" onClick={() => props.onMonth(shiftMonth(month, -1))}>
							<Chevron dir="left" />
						</button>
						<button type="button" class="vt-cal-nav" aria-label="Next month" title="Next month" onClick={() => props.onMonth(shiftMonth(month, 1))}>
							<Chevron dir="right" />
						</button>
					</>
				)}
			</div>
			{view === "months" && (
				<OptionList
					label="Months"
					options={MONTH_NAMES.map((name, i) => ({ value: i + 1, text: name.slice(0, 3), selected: i + 1 === monthNumber }))}
					onPick={(m) => pick(year, m)}
				/>
			)}
			{view === "years" && (
				<OptionList
					label="Years"
					options={yearOptions(year, Number(today.slice(0, 4))).map((y) => ({ value: y, text: String(y), selected: y === year }))}
					onPick={(y) => pick(y, monthNumber)}
				/>
			)}
			{view === "days" && (
			<div class="vt-cal-grid" role="group" aria-label={formatMonthTitle(month)}>
				{WEEKDAY_INITIALS.map((w, i) => (
					<span class="vt-cal-weekday" aria-hidden="true" title={WEEKDAY_NAMES[i]}>
						{w}
					</span>
				))}
				{monthWeeks(month)
					.flat()
					.map((d, i) => {
						if (d === null) return <span class="vt-cal-blank" key={`b${i}`} />;
						const selected = props.isSelected(d);
						const mark = props.mark?.(d) ?? null;
						const cls = ["vt-cal-day", ...(mark?.classes ?? [])];
						if (d === today) cls.push("is-today");
						if (selected) cls.push("is-selected");
						// 色や形だけに頼らないよう、今日と印は読み上げとツールチップでも伝える
						const notes = [d === today ? "Today" : null, ...(mark?.notes ?? [])].filter(Boolean);
						const label = notes.length > 0 ? `${d} (${notes.join(" · ")})` : d;
						return (
							<button type="button" key={d} class={cls.join(" ")} aria-pressed={selected} aria-label={label} title={label} onClick={() => props.onPick(d)}>
								{Number(d.slice(8, 10))}
							</button>
						);
					})}
			</div>
			)}
		</div>
	);
}
