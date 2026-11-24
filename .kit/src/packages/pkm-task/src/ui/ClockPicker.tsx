import { useRef, useState } from "preact/hooks";
import { clockValueAt, dialPositions, handPosition, type ClockMode } from "../core/worklog-times";

const pad2 = (n: number) => String(n).padStart(2, "0");

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
