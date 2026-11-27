import type { Ref } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { DATE_INPUT_ERROR, DATE_INPUT_EXAMPLES, formatDateLabel, formatDateTimeValue, parseDateInput, parseDateTimeInput } from "../../../shared/src/date-input.ts";
import { MonthCalendar } from "../../../shared/src/month-calendar.tsx";
import { addDays, localToday, type LocalDate, weekdayOf } from "../core/dates";
import { periodError, pickPeriodDay, readPeriodTexts, type Period } from "../core/period";
import { DateTimeField } from "./DateTimeField";

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
				Save
			</button>
		</form>
	);
}

/** 入力の解釈の結果を、入力欄の下に出す */
function DateHint(props: { text: string; parsed: LocalDate | null }) {
	if (props.text.trim() === "") return <div class="vt-date-hint">{DATE_INPUT_EXAMPLES}</div>;
	if (props.parsed === null) return <div class="vt-error">{DATE_INPUT_ERROR}</div>;
	return <div class="vt-date-hint">{formatDateLabel(props.parsed)}</div>;
}

/**
 * 日付の入力欄（入力言語。ADR-0228）と、解釈の結果。日付の選択はすべてこれとカレンダーを並べる（ADR-0078）。
 * 欄を離れたときに、読めた入力を `yyyy-mm-dd` に書き換える
 */
function DateTextField(props: { text: string; parsed: LocalDate | null; onText: (value: string) => void; inputRef?: Ref<HTMLInputElement>; placeholder?: string; label?: string }) {
	return (
		<div class="vt-date-field">
			<input
				ref={props.inputRef}
				type="text"
				aria-label={props.label ?? "Date"}
				placeholder={props.placeholder}
				value={props.text}
				onInput={(e) => props.onText(e.currentTarget.value)}
				onBlur={() => {
					if (props.parsed !== null && props.parsed !== props.text) props.onText(props.parsed);
				}}
			/>
			<DateHint text={props.text} parsed={props.parsed} />
		</div>
	);
}

/** 日付を 1 つ選ぶ。入力言語の日付（ADR-0228）とカレンダーで選べる。クリアもできる */
export function DateForm(props: {
	initial: LocalDate | null;
	onSubmit: (value: LocalDate | null) => void;
	allowClear?: boolean;
	presets?: boolean;
	/** 選べない日なら理由（日本語）を返す。選ぶ前に止め、理由を出す（ADR-0210 の Tickler の上限など） */
	validate?: (value: LocalDate) => string | null;
}) {
	const today = localToday();
	const [text, setText] = useState(props.initial ?? "");
	const [month, setMonth] = useState((props.initial ?? today).slice(0, 7));
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => ref.current?.select(), []);
	const parsed = parseDateInput(text, today);
	const rejected = parsed !== null && props.validate ? props.validate(parsed) : null;
	const invalid = (text.trim() !== "" && parsed === null) || rejected !== null;
	/** 選べない日を押したら、閉じずに入力欄に入れて理由を出す */
	const choose = (d: LocalDate) => {
		if (props.validate?.(d)) {
			setText(d);
			setMonth(d.slice(0, 7));
		} else props.onSubmit(d);
	};
	return (
		<form
			class="vt-date-form"
			onSubmit={(e) => {
				e.preventDefault();
				if (!invalid) props.onSubmit(parsed);
			}}
		>
			<DateTextField
				inputRef={ref}
				text={text}
				parsed={parsed}
				onText={(value) => {
					setText(value);
					const next = parseDateInput(value, today);
					if (next !== null) setMonth(next.slice(0, 7));
				}}
			/>
			{props.presets !== false && (
				<div class="vt-date-presets">
					{[
						["Today", 0],
						["Tomorrow", 1],
						["Next week", 7],
					].map(([label, n]) => (
						<button type="button" class="vt-field-chip" onClick={() => choose(addDays(today, n as number))}>
							{label}
						</button>
					))}
				</div>
			)}
			<MonthCalendar month={month} onMonth={setMonth} today={today} isSelected={(d) => d === parsed} onPick={choose} />
			{rejected !== null && <div class="vt-error">{rejected}</div>}
			<div class="vt-form">
				{props.allowClear !== false && (
					<button type="button" onClick={() => props.onSubmit(null)}>
						Clear
					</button>
				)}
				<button type="submit" class="mod-cta" disabled={invalid}>
					Save
				</button>
			</div>
		</form>
	);
}

/**
 * 期間を選ぶ（ADR-0245）。上に Start と End の入力欄（入力言語。End は Start を基準に読む）、下に月のカレンダー。
 * カレンダーは 1 回目に押した日が Start、2 回目が End で、その間を塗る。片方だけ・逆転・validate の理由は欄の下に出し、Save を押せなくする
 */
export function PeriodForm(props: {
	initial: Period;
	onSubmit: (value: Period) => void;
	/** その期間にしてよくなければ理由（日本語）。Inbox の Project・Tickler の規則（ADR-0210） */
	validate?: (value: Period) => string | null;
}) {
	const today = localToday();
	const [startText, setStartText] = useState(props.initial.start ?? "");
	const [endText, setEndText] = useState(props.initial.end ?? "");
	const [month, setMonth] = useState((props.initial.start ?? today).slice(0, 7));
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => ref.current?.select(), []);
	const period = readPeriodTexts(startText, endText, today);
	const unreadable = (startText.trim() !== "" && period.start === null) || (endText.trim() !== "" && period.end === null);
	const error = unreadable ? null : (periodError(period) ?? (period.start !== null && props.validate ? props.validate(period) : null));
	const invalid = unreadable || error !== null;
	const pick = (d: LocalDate) => {
		const next = pickPeriodDay(period, d);
		setStartText(next.start ?? "");
		setEndText(next.end ?? "");
	};
	const inRange = (d: LocalDate) => period.start !== null && period.end !== null && d > period.start && d < period.end;
	return (
		<form
			class="vt-date-form"
			onSubmit={(e) => {
				e.preventDefault();
				if (!invalid) props.onSubmit(period);
			}}
		>
			<div class="vt-period-fields">
				<label class="vt-text-field">
					<span>Start</span>
					<DateTextField
						inputRef={ref}
						label="Start"
						text={startText}
						parsed={period.start}
						onText={(value) => {
							setStartText(value);
							const next = readPeriodTexts(value, endText, today).start;
							if (next !== null) setMonth(next.slice(0, 7));
						}}
					/>
				</label>
				<label class="vt-text-field">
					<span>End</span>
					<DateTextField label="End" text={endText} parsed={period.end} onText={setEndText} />
				</label>
			</div>
			<MonthCalendar
				month={month}
				onMonth={setMonth}
				today={today}
				isSelected={(d) => d === period.start || d === period.end}
				onPick={pick}
				mark={(d) => (inRange(d) ? { classes: ["is-in-range"], notes: ["In period"] } : null)}
			/>
			{error !== null && <div class="vt-error">{error}</div>}
			<div class="vt-form">
				<button type="button" onClick={() => props.onSubmit({ start: null, end: null })}>
					Clear
				</button>
				<button type="submit" class="mod-cta" disabled={invalid}>
					Save
				</button>
			</div>
		</form>
	);
}

/** 実行日の 1 日分の枠。7 日ストリップとカレンダーで共通 */
export function DayCell(props: {
	date: LocalDate;
	scheduled: boolean;
	softDeadline: LocalDate | null;
	deadline: LocalDate | null;
	today: LocalDate;
	dimmed?: boolean;
	onClick: () => void;
}) {
	const w = weekdayOf(props.date);
	const cls = ["vt-day"];
	if (w === 0 || w === 6) cls.push("is-weekend");
	if (props.date === props.softDeadline) cls.push("is-soft-deadline");
	if (props.date === props.deadline) cls.push("is-deadline");
	if (props.deadline !== null && props.date > props.deadline) cls.push("is-after-deadline");
	if (props.scheduled) cls.push("is-scheduled");
	if (props.date === props.today) cls.push("is-today");
	if (props.dimmed) cls.push("is-dimmed");
	// 色だけに頼らないよう、期限は読み上げと title でも伝える
	// 今日も、印（太字と点）だけでなく読み上げとツールチップで伝える（ADR-0030）
	const marks = [props.date === props.today ? "Today" : null, props.date === props.softDeadline ? "soft_deadline" : null, props.date === props.deadline ? "deadline" : null]
		.filter(Boolean)
		.join(" · ");
	const label = marks ? `${props.date}（${marks}）` : props.date;
	return (
		<button type="button" class={cls.join(" ")} onClick={props.onClick} aria-pressed={props.scheduled} aria-label={label} title={label}>
			{Number(props.date.slice(8, 10))}
		</button>
	);
}

export interface WorklogDraft {
	fromMs: number;
	/** 空なら記録中 */
	toMs: number | null;
	description: string;
}

/** worklog 1 件の追加と編集（ADR-0012）。onDelete があれば削除を出す。削除は 2 回押して確定する */
export function WorklogForm(props: {
	initial: WorklogDraft;
	onSubmit: (draft: WorklogDraft) => void;
	onDelete?: () => void;
}) {
	const now = Date.now;
	const [fromText, setFromText] = useState(formatDateTimeValue(props.initial.fromMs));
	const [toText, setToText] = useState(props.initial.toMs === null ? "" : formatDateTimeValue(props.initial.toMs));
	const [description, setDescription] = useState(props.initial.description);
	const [confirming, setConfirming] = useState(false);
	// 開始は過去向き、終了は開始より後（ADR-0228 の 4）。終了が空なら記録中
	const fromMs = parseDateTimeInput(fromText, { now: now(), timeOnly: { kind: "past" } });
	const running = toText.trim() === "";
	const endMs = running ? null : parseDateTimeInput(toText, { now: now(), timeOnly: fromMs === null ? { kind: "past" } : { kind: "after", baseMs: fromMs } });
	const error =
		fromMs === null
			? "開始の日時を入力してください"
			: !running && endMs === null
				? "終了の日時を確かめてください"
				: fromMs > now() || (endMs !== null && endMs > now())
					? "今より後の日時は入れられません"
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
			<DateTimeField label="Start" text={fromText} parsed={fromMs} onText={setFromText} now={now} />
			<DateTimeField label="End" text={toText} parsed={endMs} placeholder="Empty while running" onText={setToText} now={now} />
			<label class="vt-text-field">
				<span>Description</span>
				<input type="text" value={description} onInput={(e) => setDescription(e.currentTarget.value)} />
			</label>
			{error !== null && <div class="vt-error">{error}</div>}
			<div class="vt-form">
				{props.onDelete && (
					<button type="button" class={confirming ? "mod-warning" : "vt-danger-text"} onClick={() => (confirming ? props.onDelete!() : setConfirming(true))}>
						{confirming ? "Click again to delete" : "Delete"}
					</button>
				)}
				<span class="vt-spacer" />
				<button type="submit" class="mod-cta" disabled={error !== null}>
					Save
				</button>
			</div>
		</form>
	);
}
