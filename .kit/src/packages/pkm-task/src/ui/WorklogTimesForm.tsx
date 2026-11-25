import { useEffect, useRef, useState } from "preact/hooks";
import { formatDateTimeValue, parseDateTimeInput } from "../../../shared/src/date-input.ts";
import { planWorklogTimes, type WorklogTimesPlan } from "../core/worklog-times";
import { DateTimeField } from "./DateTimeField";
import { Icon } from "./Icon";

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
	const [fromText, setFromText] = useState(props.initialFromMs === null ? "" : formatDateTimeValue(props.initialFromMs));
	const [toText, setToText] = useState("");
	const fromRef = useRef<HTMLInputElement>(null);
	const toRef = useRef<HTMLInputElement>(null);
	const playRef = useRef<HTMLButtonElement>(null);
	const stopRef = useRef<HTMLButtonElement>(null);
	useEffect(() => fromRef.current?.select(), []);

	const toEmpty = toText.trim() === "";
	// From は過去向き、To は From より後（ADR-0228 の 4）
	const fromMs = parseDateTimeInput(fromText, { now: now(), timeOnly: { kind: "past" } });
	const toMs = toEmpty ? null : parseDateTimeInput(toText, { now: now(), timeOnly: fromMs === null ? { kind: "past" } : { kind: "after", baseMs: fromMs } });
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
			<DateTimeField label="From" text={fromText} parsed={fromMs} onText={setFromText} inputRef={fromRef} now={now} onEnter={() => toRef.current?.focus()} />
			<DateTimeField
				label="To"
				text={toText}
				parsed={toMs}
				placeholder="Empty to keep running"
				onText={setToText}
				inputRef={toRef}
				now={now}
				onEnter={() => focusAction(toEmpty ? "play" : "stop")}
			/>
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
