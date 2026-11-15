import { useEffect, useRef, useState } from "preact/hooks";
import { formatShortDate, localToday, type LocalDate } from "../core/dates";
import type { SubIssue } from "../core/sub-issue";
import { barOf, dateAtX, dayOffset, dependencyArrows, dragBar, timelineColumns, timelineRange, DAY_PX, type DragMode, type TimelineScale } from "../core/timeline";
import type { TaskContext } from "../obsidian/context";
import { openSubEditor } from "../obsidian/sub-editor";
import { StatusIcon } from "../ui/StatusIcon";

/** 1 行の高さ（px）。styles.css の .vt-timeline と同じ */
const ROW = 36;
/** 棒の両端のつまみの幅（px）。棒がこれの 3 倍より短ければ、つまみを出さずに丸ごとずらす */
const HANDLE = 8;

interface Drag {
	key: string;
	mode: DragMode;
	x0: number;
	bar: { start: LocalDate; end: LocalDate };
	delta: number;
}

/** サブイシューのガントチャート（ADR-0143）。期間はドラッグで直し、指を離したときに 1 回だけ保存する */
export function SubTimeline(props: { ctx: TaskContext; subs: SubIssue[]; scale: TimelineScale }) {
	const { ctx, subs, scale } = props;
	const today = localToday();
	const px = DAY_PX[scale];
	const range = timelineRange(subs, today, scale);
	const cols = timelineColumns(range, scale);
	const width = range.days * px;
	const scroller = useRef<HTMLDivElement>(null);
	const [drag, setDrag] = useState<Drag | null>(null);

	// 開いたときと目盛りを変えたときは、今日が左寄りに見えるようにする
	useEffect(() => {
		const el = scroller.current;
		if (el) el.scrollLeft = Math.max(0, (dayOffset(range, today) - 2) * px);
	}, [scale]);

	const save = (sub: SubIssue, next: { start: LocalDate; end: LocalDate }) =>
		ctx.writer.updateSub(sub.key, { start: next.start, end: next.end }).catch((e) => ctx.report("期間を保存できませんでした", e));
	const shown = (sub: SubIssue) => {
		const bar = barOf(sub);
		return drag && drag.key === sub.key && bar ? dragBar(drag.bar, drag.mode, drag.delta) : bar;
	};
	const xOf = (date: LocalDate) => dayOffset(range, date) * px;
	const rowOf = new Map(subs.map((s, i) => [s.id, i]));
	const arrows = dependencyArrows(subs.map((s) => ({ ...s, ...(shown(s) ?? {}) })));

	const startDrag = (e: PointerEvent, sub: SubIssue, mode: DragMode) => {
		const bar = barOf(sub);
		if (!bar || e.button !== 0) return;
		e.preventDefault();
		e.stopPropagation();
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		setDrag({ key: sub.key, mode, x0: e.clientX, bar, delta: 0 });
	};
	const moveDrag = (e: PointerEvent) => {
		if (!drag) return;
		const delta = Math.round((e.clientX - drag.x0) / px);
		if (delta !== drag.delta) setDrag({ ...drag, delta });
	};
	const endDrag = (sub: SubIssue) => {
		if (!drag) return;
		const d = drag;
		setDrag(null);
		if (d.delta !== 0) void save(sub, dragBar(d.bar, d.mode, d.delta));
	};
	const keyDown = (e: KeyboardEvent, sub: SubIssue) => {
		const bar = barOf(sub);
		if (e.key === "Enter") {
			e.preventDefault();
			openSubEditor(ctx, sub);
		} else if (bar && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
			e.preventDefault();
			void save(sub, dragBar(bar, e.shiftKey ? "end" : "move", e.key === "ArrowLeft" ? -1 : 1));
		}
	};
	// 期間のない行で日を押すと、その日の 1 日の棒を作る
	const pickDay = (e: MouseEvent, sub: SubIssue) => {
		if (barOf(sub)) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const date = dateAtX(range, e.clientX - rect.left, scale);
		void save(sub, { start: date, end: date });
	};

	return (
		<div class={`vt-timeline is-${scale}`}>
			<div class="vt-timeline-labels">
				<div class="vt-timeline-corner" />
				{subs.map((sub) => (
					<button type="button" class={`vt-timeline-label${sub.status === "closed" || sub.status === "canceled" ? " is-done" : ""}`} title={`Edit: ${sub.summary}`} onClick={() => openSubEditor(ctx, sub)}>
						<StatusIcon status={sub.status} />
						<span class="vt-timeline-label-text">{sub.summary}</span>
					</button>
				))}
			</div>
			<div class="vt-timeline-scroll" ref={scroller}>
				<div class="vt-timeline-grid" style={{ width: `${width}px` }}>
					<div class="vt-timeline-head">
						{cols.map((c) => (
							<div
								class={`vt-timeline-col${c.weekend ? " is-weekend" : ""}${c.weekStart ? " is-week-start" : ""}${c.date === today ? " is-today" : ""}`}
								style={{ left: `${xOf(c.date)}px`, width: `${c.span * px}px` }}
							>
								{c.month !== null && <span class="vt-timeline-month">{c.month}</span>}
								<span class="vt-timeline-day">{c.label}</span>
							</div>
						))}
					</div>
					<div class="vt-timeline-body" style={{ height: `${subs.length * ROW}px` }}>
						{cols.map((c) => (
							<div class={`vt-timeline-stripe${c.weekend ? " is-weekend" : ""}${c.weekStart ? " is-week-start" : ""}`} style={{ left: `${xOf(c.date)}px`, width: `${c.span * px}px` }} />
						))}
						<div class="vt-timeline-today" style={{ left: `${xOf(today) + px / 2}px` }} aria-hidden="true" />
						{subs.map((sub, i) => {
							const bar = shown(sub);
							const left = bar ? xOf(bar.start) : 0;
							const barWidth = bar ? (dayOffset(range, bar.end) - dayOffset(range, bar.start) + 1) * px : 0;
							const handles = barWidth >= HANDLE * 3;
							const period = bar ? `${formatShortDate(bar.start)} – ${formatShortDate(bar.end)}` : "";
							const marks = [
								...(sub.softDeadline ? [{ date: sub.softDeadline, cls: "is-soft", label: `Soft deadline ${formatShortDate(sub.softDeadline)}` }] : []),
								...(sub.deadline ? [{ date: sub.deadline, cls: "is-hard", label: `Deadline ${formatShortDate(sub.deadline)}` }] : []),
							];
							const nothing = !bar && sub.scheduled.length === 0 && marks.length === 0;
							return (
								<div class={`vt-timeline-row${bar ? "" : " is-empty"}`} style={{ top: `${i * ROW}px` }} onClick={(e) => pickDay(e, sub)} title={bar ? undefined : "Click a day to set the period"}>
									{nothing && <span class="vt-timeline-none">No dates</span>}
									{!bar &&
										sub.scheduled.map((d) => (
											<span class="vt-timeline-dot" style={{ left: `${xOf(d) + px / 2}px` }} title={`Do date ${formatShortDate(d)}`} />
										))}
									{marks.map((m) => (
										<span class={`vt-timeline-mark ${m.cls}`} style={{ left: `${xOf(m.date) + px - 1}px` }} title={m.label} />
									))}
									{bar && (
										<div
											class={`vt-timeline-bar vt-status-${sub.status}${drag?.key === sub.key ? " is-dragging" : ""}`}
											style={{ left: `${left}px`, width: `${barWidth}px` }}
											tabIndex={0}
											role="button"
											aria-label={`${sub.summary}: ${period}. Drag or use arrow keys to move, Shift + arrow keys to change the end`}
											title={`${sub.summary}\n${period}`}
											onPointerDown={(e) => startDrag(e, sub, "move")}
											onPointerMove={moveDrag}
											onPointerUp={() => endDrag(sub)}
											onPointerCancel={() => setDrag(null)}
											onKeyDown={(e) => keyDown(e, sub)}
											onClick={(e) => e.stopPropagation()}
										>
											{handles && (
												<>
													<span class="vt-timeline-handle is-start" aria-hidden="true" onPointerDown={(e) => startDrag(e, sub, "start")} onPointerMove={moveDrag} onPointerUp={() => endDrag(sub)} />
													<span class="vt-timeline-handle is-end" aria-hidden="true" onPointerDown={(e) => startDrag(e, sub, "end")} onPointerMove={moveDrag} onPointerUp={() => endDrag(sub)} />
												</>
											)}
										</div>
									)}
								</div>
							);
						})}
						<svg class="vt-timeline-arrows" width={width} height={subs.length * ROW} aria-hidden="true">
							<defs>
								{(["", "-late"] as const).map((suffix) => (
									<marker id={`vt-timeline-arrowhead${suffix}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
										<path d="M0 0 L8 4 L0 8 z" class={`vt-timeline-arrowhead${suffix ? " is-late" : ""}`} />
									</marker>
								))}
							</defs>
							{arrows.map((a) => {
								const from = shown(subs[rowOf.get(a.from)!]!)!;
								const to = shown(subs[rowOf.get(a.to)!]!)!;
								const x1 = xOf(from.end) + px;
								const y1 = rowOf.get(a.from)! * ROW + ROW / 2;
								const x2 = xOf(to.start);
								const y2 = rowOf.get(a.to)! * ROW + ROW / 2;
								const elbow = Math.max(x1, x2 - 6);
								return <path class={`vt-timeline-arrow${a.late ? " is-late" : ""}`} d={`M${x1} ${y1} H${elbow} V${y2} H${x2}`} marker-end={`url(#vt-timeline-arrowhead${a.late ? "-late" : ""})`} />;
							})}
						</svg>
					</div>
				</div>
			</div>
		</div>
	);
}
