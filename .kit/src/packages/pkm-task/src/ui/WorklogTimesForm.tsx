import type { Ref } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { MonthCalendar } from "../../../shared/src/month-calendar.tsx";
import { localToday, weekdayOf, WEEKDAY_NAMES, type LocalDate } from "../core/dates";
import {
	clockValueAt,
	dialPositions,
	formatTimeInput,
	handPosition,
	parseTimeInputAt,
	planWorklogTimes,
	type ClockMode,
	type WorklogTimesPlan,
} from "../core/worklog-times";
import { Icon } from "./Icon";

const pad2 = (n: number) => String(n).padStart(2, "0");

/** 解釈した日時の表示（`11/16 MON 21:38`） */
function describe(ms: number): string {
	const text = formatTimeInput(ms);
	const date = text.slice(0, 10) as LocalDate;
	return `${text.slice(5, 7)}/${text.slice(8, 10)} ${WEEKDAY_NAMES[weekdayOf(date)]!.toUpperCase()} ${text.slice(11)}`;
}

/** 日付（`YYYY-MM-DD`）と時・分から ms */
function compose(date: string, hour: number, minute: number): number {
	const [y, m, d] = date.split("-").map(Number) as [number, number, number];
	return new Date(y, m - 1, d, hour, minute, 0, 0).getTime();
}

/** ダイヤルの寸法（SVG の座標。外の輪の数字を半径 1 に置く） */
const VIEW = 1.3;

/**
 * 時刻のピッカー（ADR-0193 の 5）。Material 3 の時刻ピッカー（Android の時計のダイヤル）にならう。
 * 上に時と分の欄、下に 24 時間のダイヤル（外の輪 0〜11、内の輪 12〜23）。時を決めると分に移る
 */
export function ClockPicker(props: { hour: number; minute: number; onChange: (hour: number, minute: number) => void; onDone: () => void }) {
	const [mode, setMode] = useState<ClockMode>("hour");
	const dragging = useRef(false);
	const dialRef = useRef<HTMLDivElement>(null);
	const value = mode === "hour" ? props.hour : props.minute;
	const set = (v: number) => (mode === "hour" ? props.onChange(v, props.minute) : props.onChange(props.hour, v));
	const pick = (e: PointerEvent) => {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2 * VIEW;
		const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2 * VIEW;
		set(clockValueAt(mode, x, y));
	};
	const choose = (next: ClockMode) => {
		setMode(next);
		dialRef.current?.focus();
	};
	const hand = handPosition(mode, value);
	const numbers = dialPositions(mode);
	const max = mode === "hour" ? 24 : 60;
	return (
		<div class="vt-clock">
			<div class="vt-clock-display">
				<button type="button" class={`vt-clock-part${mode === "hour" ? " is-selected" : ""}`} aria-pressed={mode === "hour"} aria-label="Hour" onClick={() => choose("hour")}>
					{pad2(props.hour)}
				</button>
				<span class="vt-clock-colon" aria-hidden="true">
					:
				</span>
				<button type="button" class={`vt-clock-part${mode === "minute" ? " is-selected" : ""}`} aria-pressed={mode === "minute"} aria-label="Minute" onClick={() => choose("minute")}>
					{pad2(props.minute)}
				</button>
			</div>
			<div
				ref={dialRef}
				class="vt-clock-dial"
				role="slider"
				tabIndex={0}
				aria-label={mode === "hour" ? "Hour" : "Minute"}
				aria-valuemin={0}
				aria-valuemax={max - 1}
				aria-valuenow={value}
				onPointerDown={(e) => {
					dragging.current = true;
					(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
					pick(e);
				}}
				onPointerMove={(e) => dragging.current && pick(e)}
				onPointerUp={() => {
					if (!dragging.current) return;
					dragging.current = false;
					if (mode === "hour") setMode("minute");
				}}
				onKeyDown={(e) => {
					const step = e.key === "ArrowUp" || e.key === "ArrowRight" ? 1 : e.key === "ArrowDown" || e.key === "ArrowLeft" ? -1 : 0;
					if (step !== 0) {
						e.preventDefault();
						set((value + step + max) % max);
					} else if (e.key === "Enter") {
						e.preventDefault();
						e.stopPropagation();
						if (mode === "hour") setMode("minute");
						else props.onDone();
					}
				}}
			>
				<svg viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`} aria-hidden="true">
					<circle class="vt-clock-face" r={VIEW} />
					<line class="vt-clock-hand" x1={0} y1={0} x2={hand.x} y2={hand.y} />
					<circle class="vt-clock-center" r={0.04} />
					<circle class="vt-clock-knob" cx={hand.x} cy={hand.y} r={0.17} />
				</svg>
				{/* 数字は HTML で置き、文字の大きさをトークンで決める（SVG の中では px のトークンが使えない） */}
				{numbers.map((n) => (
					<span
						class={`vt-clock-number${n.inner ? " is-inner" : ""}${n.value === value ? " is-selected" : ""}`}
						style={{ left: `${50 + (n.x / VIEW) * 50}%`, top: `${50 + (n.y / VIEW) * 50}%` }}
						aria-hidden="true"
					>
						{pad2(n.value)}
					</span>
				))}
			</div>
			<div class="vt-form">
				<span class="vt-spacer" />
				<button type="button" class="vt-button is-text" onClick={props.onDone}>
					OK
				</button>
			</div>
		</div>
	);
}

/** From / To の 1 つの欄。欄を離れたときに解釈して、読める形（`yyyy-mm-dd hh:mm`）に書き換える */
function TimeField(props: {
	label: string;
	text: string;
	onText: (text: string) => void;
	onEnter: () => void;
	inputRef: Ref<HTMLInputElement>;
	now: () => number;
}) {
	const [panel, setPanel] = useState<"calendar" | "clock" | null>(null);
	const parsed = parseTimeInputAt(props.text, props.now());
	const empty = props.text.trim() === "";
	const commit = () => {
		if (parsed !== null) props.onText(formatTimeInput(parsed));
	};
	// カレンダーと時計の基準: 読めた日時か、今
	const base = new Date(parsed ?? props.now());
	const baseDate = formatTimeInput(base.getTime()).slice(0, 10);
	const [month, setMonth] = useState(baseDate.slice(0, 7));
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
					placeholder={props.label === "From" ? "-22m / 2200 / 2200-1d" : "Empty to keep running"}
					value={props.text}
					onInput={(e) => props.onText(e.currentTarget.value)}
					onBlur={commit}
					onKeyDown={(e) => {
						if (e.key !== "Enter" || e.isComposing) return;
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
			{empty ? null : parsed === null ? <div class="vt-error">日時として読めません（今より後も入れられません）</div> : <div class="vt-date-hint">{describe(parsed)}</div>}
			{panel === "calendar" && (
				<MonthCalendar
					month={month}
					onMonth={setMonth}
					today={localToday(new Date(props.now()))}
					isSelected={(d) => parsed !== null && d === baseDate}
					onPick={(d) => {
						props.onText(formatTimeInput(compose(d, base.getHours(), base.getMinutes())));
						setPanel(null);
					}}
				/>
			)}
			{panel === "clock" && (
				<ClockPicker
					hour={base.getHours()}
					minute={base.getMinutes()}
					onChange={(h, m) => props.onText(formatTimeInput(compose(baseDate, h, m)))}
					onDone={() => setPanel(null)}
				/>
			)}
		</div>
	);
}

/**
 * 記録の開始・終了を直すダイアログの中身（ADR-0193）。
 * From で Enter → To、To が空で Enter → 再生、To ありで Enter → 停止にフォーカスが移る
 */
export function WorklogTimesForm(props: {
	summary: string;
	running: boolean;
	initialFromMs: number | null;
	onSubmit: (plan: Exclude<WorklogTimesPlan, { kind: "error" }>) => void;
	/** テストとプレビューで今を決める */
	now?: () => number;
}) {
	const now = props.now ?? Date.now;
	const [fromText, setFromText] = useState(props.initialFromMs === null ? "" : formatTimeInput(props.initialFromMs));
	const [toText, setToText] = useState("");
	const fromRef = useRef<HTMLInputElement>(null);
	const toRef = useRef<HTMLInputElement>(null);
	const playRef = useRef<HTMLButtonElement>(null);
	const stopRef = useRef<HTMLButtonElement>(null);
	useEffect(() => fromRef.current?.select(), []);

	const toEmpty = toText.trim() === "";
	const fromMs = parseTimeInputAt(fromText, now());
	const toMs = toEmpty ? null : parseTimeInputAt(toText, now());
	const unreadable = (fromText.trim() !== "" && fromMs === null) || (!toEmpty && toMs === null);
	const plan = unreadable ? null : planWorklogTimes({ running: props.running, fromMs, toMs, now: now() });
	const error = plan?.kind === "error" && fromText.trim() !== "" ? plan.error : null;
	const ready = plan !== null && plan.kind !== "error";
	const canPlay = ready && toEmpty;
	const canStop = ready && !toEmpty;
	const submit = () => {
		if (ready) props.onSubmit(plan);
	};
	// 押せないボタンにはフォーカスできないので、そのときは欄に残る
	const focusAction = (to: "play" | "stop") => setTimeout(() => (to === "play" ? playRef : stopRef).current?.focus(), 0);

	return (
		<div class="vt-wt">
			<div class="vt-wt-summary">{props.summary}</div>
			<TimeField label="From" text={fromText} onText={setFromText} inputRef={fromRef} now={now} onEnter={() => toRef.current?.focus()} />
			<TimeField label="To" text={toText} onText={setToText} inputRef={toRef} now={now} onEnter={() => focusAction(toEmpty ? "play" : "stop")} />
			{error !== null && <div class="vt-error">{error}</div>}
			<div class="vt-wt-actions">
				<span class="vt-wt-note">{props.running ? "Running: ▶ keeps it running, ■ stops it" : "▶ starts from From, ■ adds a finished record"}</span>
				<span class="vt-spacer" />
				<button
					ref={playRef}
					type="button"
					class="vt-play"
					disabled={!canPlay}
					aria-label={props.running ? "Keep running with this start" : "Start from this time"}
					title={props.running ? "Keep running with this start" : "Start from this time"}
					onClick={submit}
				>
					<Icon name="play" />
				</button>
				<button
					ref={stopRef}
					type="button"
					class="vt-play is-running"
					disabled={!canStop}
					aria-label={props.running ? "Stop with these times" : "Add this record"}
					title={props.running ? "Stop with these times" : "Add this record"}
					onClick={submit}
				>
					<Icon name="square" />
				</button>
			</div>
		</div>
	);
}
