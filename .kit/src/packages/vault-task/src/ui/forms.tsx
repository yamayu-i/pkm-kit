import { useEffect, useRef, useState } from "preact/hooks";
import { parseDateInput, parseTimeInput } from "../core/date-input";
import { addDays, formatShortDate, localToday, monthGridDays, type LocalDate, WEEKDAY_NAMES, weekdayOf } from "../core/dates";
import { Icon } from "./Icon";

/** 1 行のテキストを入力して保存する */
export function TextForm(props: { initial: string; maxLength?: number; placeholder?: string; onSubmit: (value: string) => void }) {
	const [value, setValue] = useState(props.initial);
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => ref.current?.focus(), []);
	return (
		<form
			class="vt-form"
			onSubmit={(e) => {
				e.preventDefault();
				props.onSubmit(value.trim());
			}}
		>
			<input
				ref={ref}
				type="text"
				value={value}
				maxLength={props.maxLength}
				placeholder={props.placeholder}
				onInput={(e) => setValue(e.currentTarget.value)}
			/>
			{props.maxLength !== undefined && (
				<span class="vt-muted">
					{value.length} / {props.maxLength}
				</span>
			)}
			<button type="submit" class="mod-cta">
				保存
			</button>
		</form>
	);
}

/** 月のカレンダー（ADR-0017）。依存を足さずに、実行日の枠と同じ部品で描く */
function MonthCalendar(props: {
	month: string;
	onMonth: (month: string) => void;
	isSelected: (date: LocalDate) => boolean;
	onPick: (date: LocalDate) => void;
	midDue?: LocalDate | null;
	deadline?: LocalDate | null;
}) {
	const today = localToday();
	const { month } = props;
	const days = monthGridDays(month);
	const shift = (n: number) => {
		const [y, m] = month.split("-").map(Number) as [number, number];
		props.onMonth(new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7));
	};
	return (
		<div class="vt-calendar">
			<div class="vt-calendar-nav">
				<button type="button" aria-label="前の月" onClick={() => shift(-1)}>
					‹
				</button>
				<span>{month.replace("-", " / ")}</span>
				<button type="button" aria-label="次の月" onClick={() => shift(1)}>
					›
				</button>
			</div>
			<div class="vt-calendar-grid">
				{[0, 1, 2, 3, 4, 5, 6].map((w) => (
					<span class="vt-weekday">{WEEKDAY_NAMES[w]}</span>
				))}
				{days.map((d) => (
					<DayCell
						date={d}
						dimmed={!d.startsWith(month)}
						scheduled={props.isSelected(d)}
						midDue={props.midDue ?? null}
						deadline={props.deadline ?? null}
						today={today}
						onClick={() => props.onPick(d)}
					/>
				))}
			</div>
		</div>
	);
}

/** 入力の解釈の結果を、入力欄の下に出す */
function DateHint(props: { text: string; parsed: LocalDate | null }) {
	if (props.text.trim() === "") return <div class="vt-date-hint">例: 15 / 1224 / +3 / mon / +2w / +m</div>;
	if (props.parsed === null) return <div class="vt-error">日付として読めません</div>;
	return <div class="vt-date-hint">{`${props.parsed.slice(0, 4)}/${formatShortDate(props.parsed)}`}</div>;
}

/** 日付を 1 つ選ぶ。短い書き方の入力（ADR-0017）とカレンダーで選べる。クリアもできる */
export function DateForm(props: { initial: LocalDate | null; onSubmit: (value: LocalDate | null) => void; allowClear?: boolean; presets?: boolean }) {
	const today = localToday();
	const [text, setText] = useState(props.initial ?? "");
	const [month, setMonth] = useState((props.initial ?? today).slice(0, 7));
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => ref.current?.select(), []);
	const parsed = parseDateInput(text, today);
	const invalid = text.trim() !== "" && parsed === null;
	return (
		<form
			class="vt-date-form"
			onSubmit={(e) => {
				e.preventDefault();
				if (!invalid) props.onSubmit(parsed);
			}}
		>
			<div class="vt-date-field">
				<input
					ref={ref}
					type="text"
					aria-label="日付"
					value={text}
					onInput={(e) => {
						const value = e.currentTarget.value;
						setText(value);
						const next = parseDateInput(value, today);
						if (next !== null) setMonth(next.slice(0, 7));
					}}
				/>
				<DateHint text={text} parsed={parsed} />
			</div>
			{props.presets !== false && (
				<div class="vt-date-presets">
					{[
						["今日", 0],
						["明日", 1],
						["来週", 7],
					].map(([label, n]) => (
						<button type="button" class="vt-field-chip" onClick={() => props.onSubmit(addDays(today, n as number))}>
							{label}
						</button>
					))}
				</div>
			)}
			<MonthCalendar month={month} onMonth={setMonth} isSelected={(d) => d === parsed} onPick={(d) => props.onSubmit(d)} />
			<div class="vt-form">
				{props.allowClear !== false && (
					<button type="button" onClick={() => props.onSubmit(null)}>
						クリア
					</button>
				)}
				<button type="submit" class="mod-cta" disabled={invalid}>
					保存
				</button>
			</div>
		</form>
	);
}

/** 月のカレンダーで実行日を on / off する（ADR-0012 の「calendar >」） */
export function CalendarForm(props: {
	initial: LocalDate[];
	midDue: LocalDate | null;
	deadline: LocalDate | null;
	onSubmit: (dates: LocalDate[]) => void;
}) {
	const [selected, setSelected] = useState(new Set(props.initial));
	const [month, setMonth] = useState(localToday().slice(0, 7));
	const toggle = (d: LocalDate) => {
		const next = new Set(selected);
		if (next.has(d)) next.delete(d);
		else next.add(d);
		setSelected(next);
	};
	return (
		<div class="vt-calendar">
			<MonthCalendar month={month} onMonth={setMonth} isSelected={(d) => selected.has(d)} onPick={toggle} midDue={props.midDue} deadline={props.deadline} />
			<div class="vt-form">
				<span class="vt-muted">{selected.size} 日</span>
				<button class="mod-cta" onClick={() => props.onSubmit([...selected].sort())}>
					保存
				</button>
			</div>
		</div>
	);
}

/** 実行日の 1 日分の枠。7 日ストリップとカレンダーで共通 */
export function DayCell(props: {
	date: LocalDate;
	scheduled: boolean;
	midDue: LocalDate | null;
	deadline: LocalDate | null;
	today: LocalDate;
	dimmed?: boolean;
	onClick: () => void;
}) {
	const w = weekdayOf(props.date);
	const cls = ["vt-day"];
	if (w === 0 || w === 6) cls.push("is-weekend");
	if (props.date === props.midDue) cls.push("is-mid-due");
	if (props.date === props.deadline) cls.push("is-deadline");
	if (props.deadline !== null && props.date > props.deadline) cls.push("is-after-deadline");
	if (props.scheduled) cls.push("is-scheduled");
	if (props.date === props.today) cls.push("is-today");
	if (props.dimmed) cls.push("is-dimmed");
	// 色だけに頼らないよう、期限は読み上げと title でも伝える
	const dues = [props.date === props.midDue ? "mid_due" : null, props.date === props.deadline ? "deadline" : null].filter(Boolean).join("・");
	const label = dues ? `${props.date}（${dues}）` : props.date;
	return (
		<button type="button" class={cls.join(" ")} onClick={props.onClick} aria-pressed={props.scheduled} aria-label={label} title={label}>
			{Number(props.date.slice(8, 10))}
		</button>
	);
}

const pad2 = (n: number) => String(n).padStart(2, "0");

function dateOfMs(ms: number | null): string {
	if (ms === null) return "";
	const d = new Date(ms);
	return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function timeOfMs(ms: number | null): string {
	if (ms === null) return "";
	const d = new Date(ms);
	return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export interface WorklogDraft {
	fromMs: number;
	/** 空なら記録中 */
	toMs: number | null;
	description: string;
}

/** 日付と時刻の入力欄（ADR-0017: 時刻は入力欄を分ける）。カレンダーはアイコンで開く */
function DateTimeField(props: { label: string; date: string; time: string; onDate: (value: string) => void; onTime: (value: string) => void }) {
	const today = localToday();
	const parsed = parseDateInput(props.date, today);
	const [open, setOpen] = useState(false);
	const [month, setMonth] = useState((parsed ?? today).slice(0, 7));
	return (
		<div class="vt-text-field">
			<span>{props.label}</span>
			<div class="vt-datetime">
				<input
					type="text"
					aria-label={`${props.label}の日付`}
					placeholder="日付"
					value={props.date}
					onInput={(e) => {
						props.onDate(e.currentTarget.value);
						const next = parseDateInput(e.currentTarget.value, today);
						if (next !== null) setMonth(next.slice(0, 7));
					}}
				/>
				<input class="vt-time-input" type="text" aria-label={`${props.label}の時刻`} placeholder="hhmm" value={props.time} onInput={(e) => props.onTime(e.currentTarget.value)} />
				<button type="button" class="vt-calendar-toggle" aria-label={`${props.label}のカレンダー`} aria-expanded={open} onClick={() => setOpen(!open)}>
					<Icon name="calendar" />
				</button>
			</div>
			{props.date.trim() !== "" && <DateHint text={props.date} parsed={parsed} />}
			{open && (
				<MonthCalendar
					month={month}
					onMonth={setMonth}
					isSelected={(d) => d === parsed}
					onPick={(d) => {
						props.onDate(d);
						setOpen(false);
					}}
				/>
			)}
		</div>
	);
}

/** 日付と時刻の入力を ms にする。読めなければ null */
function toMs(date: string, time: string): number | null {
	const d = parseDateInput(date, localToday());
	const t = parseTimeInput(time);
	return d === null || t === null ? null : new Date(`${d}T${t}:00`).getTime();
}

/** worklog 1 件の追加と編集（ADR-0012）。onDelete があれば削除を出す。削除は 2 回押して確定する */
export function WorklogForm(props: {
	initial: WorklogDraft;
	onSubmit: (draft: WorklogDraft) => void;
	onDelete?: () => void;
}) {
	const [fromDate, setFromDate] = useState(dateOfMs(props.initial.fromMs));
	const [fromTime, setFromTime] = useState(timeOfMs(props.initial.fromMs));
	const [toDate, setToDate] = useState(dateOfMs(props.initial.toMs));
	const [toTime, setToTime] = useState(timeOfMs(props.initial.toMs));
	const [description, setDescription] = useState(props.initial.description);
	const [confirming, setConfirming] = useState(false);
	const fromMs = toMs(fromDate, fromTime);
	// 終了は時刻だけなら開始と同じ日。どちらも空なら記録中
	const running = toDate.trim() === "" && toTime.trim() === "";
	const endMs = running ? null : toMs(toDate.trim() === "" ? fromDate : toDate, toTime);
	const error =
		fromMs === null
			? "開始の日付と時刻を入力してください"
			: !running && endMs === null
				? "終了の日付と時刻を確かめてください"
				: endMs !== null && endMs <= fromMs
					? "終了は開始より後にしてください"
					: null;
	return (
		<form
			class="vt-worklog-form"
			onSubmit={(e) => {
				e.preventDefault();
				if (error === null) props.onSubmit({ fromMs: fromMs!, toMs: endMs, description: description.trim() });
			}}
		>
			<DateTimeField label="開始" date={fromDate} time={fromTime} onDate={setFromDate} onTime={setFromTime} />
			<DateTimeField label="終了（空なら記録中）" date={toDate} time={toTime} onDate={setToDate} onTime={setToTime} />
			<label class="vt-text-field">
				<span>内容</span>
				<input type="text" value={description} onInput={(e) => setDescription(e.currentTarget.value)} />
			</label>
			{error !== null && <div class="vt-error">{error}</div>}
			<div class="vt-form">
				{props.onDelete && (
					<button type="button" class={confirming ? "mod-warning" : "vt-danger-text"} onClick={() => (confirming ? props.onDelete!() : setConfirming(true))}>
						{confirming ? "もう一度押すと削除" : "削除"}
					</button>
				)}
				<span class="vt-spacer" />
				<button type="submit" class="mod-cta" disabled={error !== null}>
					保存
				</button>
			</div>
		</form>
	);
}
