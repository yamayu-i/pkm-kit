import { useEffect, useRef, useState } from "preact/hooks";
import { addDays, localToday, type LocalDate, WEEKDAY_NAMES, weekdayOf } from "../core/dates";

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

/** 日付を 1 つ選ぶ。クリアもできる */
export function DateForm(props: { initial: LocalDate | null; onSubmit: (value: LocalDate | null) => void }) {
	const [value, setValue] = useState(props.initial ?? "");
	return (
		<form
			class="vt-form"
			onSubmit={(e) => {
				e.preventDefault();
				props.onSubmit(value || null);
			}}
		>
			<input type="date" value={value} onInput={(e) => setValue(e.currentTarget.value)} />
			<button type="button" onClick={() => props.onSubmit(null)}>
				クリア
			</button>
			<button type="submit" class="mod-cta">
				保存
			</button>
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
	const today = localToday();
	const [selected, setSelected] = useState(new Set(props.initial));
	const [month, setMonth] = useState(today.slice(0, 7));
	const first = `${month}-01`;
	const start = addDays(first, -((weekdayOf(first) + 6) % 7));
	const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
	const shift = (n: number) => {
		const [y, m] = month.split("-").map(Number) as [number, number];
		const d = new Date(Date.UTC(y, m - 1 + n, 1));
		setMonth(d.toISOString().slice(0, 7));
	};
	const toggle = (d: LocalDate) => {
		const next = new Set(selected);
		if (next.has(d)) next.delete(d);
		else next.add(d);
		setSelected(next);
	};
	return (
		<div class="vt-calendar">
			<div class="vt-calendar-nav">
				<button onClick={() => shift(-1)}>‹</button>
				<span>{month.replace("-", " / ")}</span>
				<button onClick={() => shift(1)}>›</button>
			</div>
			<div class="vt-calendar-grid">
				{[1, 2, 3, 4, 5, 6, 0].map((w) => (
					<span class="vt-weekday">{WEEKDAY_NAMES[w]}</span>
				))}
				{days.map((d) => (
					<DayCell
						date={d}
						dimmed={!d.startsWith(month)}
						scheduled={selected.has(d)}
						midDue={props.midDue}
						deadline={props.deadline}
						today={today}
						onClick={() => toggle(d)}
					/>
				))}
			</div>
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
	return (
		<button class={cls.join(" ")} onClick={props.onClick} aria-pressed={props.scheduled} title={props.date}>
			{Number(props.date.slice(8, 10))}
		</button>
	);
}

function toInputValue(ms: number | null): string {
	if (ms === null) return "";
	const d = new Date(ms);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface WorklogDraft {
	fromMs: number;
	/** 空なら記録中 */
	toMs: number | null;
	description: string;
}

/** worklog 1 件の編集（ADR-0012）。削除は 2 回押して確定する */
export function WorklogForm(props: {
	initial: WorklogDraft;
	onSubmit: (draft: WorklogDraft) => void;
	onDelete: () => void;
}) {
	const [from, setFrom] = useState(toInputValue(props.initial.fromMs));
	const [to, setTo] = useState(toInputValue(props.initial.toMs));
	const [description, setDescription] = useState(props.initial.description);
	const [confirming, setConfirming] = useState(false);
	const fromMs = Date.parse(from);
	const toMs = to ? Date.parse(to) : null;
	const error = Number.isNaN(fromMs)
		? "開始を入力してください"
		: toMs !== null && (Number.isNaN(toMs) || toMs <= fromMs)
			? "終了は開始より後にしてください"
			: null;
	return (
		<form
			class="vt-worklog-form"
			onSubmit={(e) => {
				e.preventDefault();
				if (error === null) props.onSubmit({ fromMs, toMs, description: description.trim() });
			}}
		>
			<label class="vt-text-field">
				<span>開始</span>
				<input type="datetime-local" value={from} onInput={(e) => setFrom(e.currentTarget.value)} />
			</label>
			<label class="vt-text-field">
				<span>終了（空なら記録中）</span>
				<input type="datetime-local" value={to} onInput={(e) => setTo(e.currentTarget.value)} />
			</label>
			<label class="vt-text-field">
				<span>内容</span>
				<input type="text" value={description} onInput={(e) => setDescription(e.currentTarget.value)} />
			</label>
			{error !== null && <div class="vt-error">{error}</div>}
			<div class="vt-form">
				<button type="button" class={confirming ? "mod-warning" : "vt-danger-text"} onClick={() => (confirming ? props.onDelete() : setConfirming(true))}>
					{confirming ? "もう一度押すと削除" : "削除"}
				</button>
				<span class="vt-spacer" />
				<button type="submit" class="mod-cta" disabled={error !== null}>
					保存
				</button>
			</div>
		</form>
	);
}
