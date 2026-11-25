import type { Ref } from "preact";
import { useState } from "preact/hooks";
import { DATETIME_INPUT_ERROR, DATETIME_INPUT_EXAMPLES, composeDateTime, formatDateTimeLabel, formatDateTimeValue } from "../../../shared/src/date-input.ts";
import { MonthCalendar } from "../../../shared/src/month-calendar.tsx";
import { localToday } from "../core/dates";
import { ClockPicker } from "./ClockPicker";
import { Icon } from "./Icon";

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * 日時の 1 つの欄（ADR-0228。ADR-0193 の欄を、worklog の編集・追加でも使う）。
 * 入力言語の `時刻 [日付]` を入れ、欄を離れたときに読める形（`yyyy-mm-dd hh:mm`）に書き換える。
 * 解釈は呼ぶ側が欄の設定（時刻だけのときの日など）で行い、結果を parsed で渡す
 */
export function DateTimeField(props: {
	label: string;
	text: string;
	/** text を解釈した日時。読めなければ null */
	parsed: number | null;
	onText: (text: string) => void;
	onEnter?: () => void;
	inputRef?: Ref<HTMLInputElement>;
	placeholder?: string;
	now: () => number;
}) {
	const [panel, setPanel] = useState<"calendar" | "clock" | null>(null);
	const { parsed } = props;
	const empty = props.text.trim() === "";
	const commit = () => {
		if (parsed !== null) props.onText(formatDateTimeValue(parsed));
	};
	// カレンダーと時計の基準: 読めた日時か、今
	const base = new Date(parsed ?? props.now());
	const baseDate = formatDateTimeValue(base.getTime()).slice(0, 10);
	const [month, setMonth] = useState(baseDate.slice(0, 7));
	const set = (date: string, hour: number, minute: number) => {
		const ms = composeDateTime(date, `${pad2(hour)}:${pad2(minute)}`);
		if (ms !== null) props.onText(formatDateTimeValue(ms));
	};
	const toggle = (next: "calendar" | "clock") => {
		if (next === "calendar") setMonth(baseDate.slice(0, 7));
		setPanel(panel === next ? null : next);
	};
	return (
		<div class="vt-text-field vt-wt-field">
			<span>{props.label}</span>
			<div class="vt-wt-row">
				<input
					ref={props.inputRef}
					type="text"
					aria-label={props.label}
					placeholder={props.placeholder ?? DATETIME_INPUT_EXAMPLES.replace(/^e\.g\. /, "")}
					value={props.text}
					onInput={(e) => props.onText(e.currentTarget.value)}
					onBlur={commit}
					onKeyDown={(e) => {
						if (e.key !== "Enter" || e.isComposing || !props.onEnter) return;
						e.preventDefault();
						commit();
						props.onEnter();
					}}
				/>
				<button type="button" class="vt-icon-button vt-wt-tool" aria-label={`${props.label} calendar`} aria-expanded={panel === "calendar"} title="Pick a date" onClick={() => toggle("calendar")}>
					<Icon name="calendar" />
				</button>
				<button type="button" class="vt-icon-button vt-wt-tool" aria-label={`${props.label} clock`} aria-expanded={panel === "clock"} title="Pick a time" onClick={() => toggle("clock")}>
					<Icon name="clock" />
				</button>
			</div>
			{empty ? null : parsed === null ? <div class="vt-error">{DATETIME_INPUT_ERROR}</div> : <div class="vt-date-hint">{formatDateTimeLabel(parsed)}</div>}
			{panel === "calendar" && (
				<MonthCalendar
					month={month}
					onMonth={setMonth}
					today={localToday(new Date(props.now()))}
					isSelected={(d) => parsed !== null && d === baseDate}
					onPick={(d) => {
						set(d, base.getHours(), base.getMinutes());
						setPanel(null);
					}}
				/>
			)}
			{panel === "clock" && <ClockPicker hour={base.getHours()} minute={base.getMinutes()} onChange={(h, m) => set(baseDate, h, m)} onDone={() => setPanel(null)} />}
		</div>
	);
}
