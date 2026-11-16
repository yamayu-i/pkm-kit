import { useEffect, useRef, useState } from "preact/hooks";
import { formatShortDate, localToday, type LocalDate } from "../core/dates";
import type { SubIssue } from "../core/sub-issue";
import { arrowMidpoint, barOf, canConnect, dateAtX, incomingOf, roundedPath, routeArrows, dayOffset, dependencyArrows, dragBar, timelineColumns, timelineRange, DAY_PX, type DragMode, type TimelineScale } from "../core/timeline";
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

/** 依存を引いている最中（ADR-0163）。x / y は日の列の左上からの px、target は離すと依存になる棒 */
interface Link {
	from: string;
	x: number;
	y: number;
	target: string | null;
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
	// ホバー・フォーカス（クリック）した棒。その棒に入る矢印と依存先の棒を強調し、ほかを薄くする
	const [hovered, setHovered] = useState<string | null>(null);
	const [focused, setFocused] = useState<string | null>(null);
	const body = useRef<HTMLDivElement>(null);
	const [link, setLink] = useState<Link | null>(null);
	// 選んだ矢印（ADR-0163）。選ぶと × ボタンにフォーカスが移り、× か Delete で消す
	const [selected, setSelected] = useState<{ from: string; to: string } | null>(null);

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
	const arrows = dependencyArrows(subs.map((s) => ({ ...s, ...(shown(s) ?? {}) }))).map((a) => ({ ...a, fromRow: rowOf.get(a.from)!, toRow: rowOf.get(a.to)! }));
	// 各行の棒の左右（px）。矢印は途中の棒をよけて引く（timeline.ts の routeArrows）
	const spans = subs.map((s) => {
		const bar = shown(s);
		return bar ? { x0: xOf(bar.start), x1: xOf(bar.end) + px } : null;
	});
	const routes = routeArrows(arrows, spans, ROW);
	const active = hovered ?? focused;
	const related = incomingOf(arrows, active);
	const routed = arrows.map((a, i) => ({ late: a.late, related: related?.arrows.includes(i) ?? false, d: roundedPath(routes[i]!, 4) }));
	const relatedFrom = new Set(related?.from ?? []);

	const saveDeps = (sub: SubIssue, dependsOn: string[]) => ctx.writer.updateSub(sub.key, { dependsOn }).catch((e) => ctx.report("依存を保存できませんでした", e));
	const removeDep = (a: { from: string; to: string }) => {
		const to = subs.find((s) => s.id === a.to);
		setSelected(null);
		if (to) void saveDeps(to, to.dependsOn.filter((d) => d !== a.from));
	};
	// コネクタからのドラッグ。離した棒が、始めた棒に依存する（ADR-0163）
	const pointInBody = (e: PointerEvent) => {
		const rect = body.current?.getBoundingClientRect();
		return { x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) };
	};
	const startLink = (e: PointerEvent, sub: SubIssue) => {
		if (e.button !== 0) return;
		e.preventDefault();
		e.stopPropagation();
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		setSelected(null);
		setLink({ from: sub.id, ...pointInBody(e), target: null });
	};
	const moveLink = (e: PointerEvent) => {
		if (!link) return;
		const id = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-sub-id]")?.dataset.subId ?? null;
		setLink({ ...link, ...pointInBody(e), target: id !== null && canConnect(subs, link.from, id) ? id : null });
	};
	const endLink = () => {
		if (!link) return;
		const l = link;
		setLink(null);
		const to = l.target === null ? undefined : subs.find((s) => s.id === l.target);
		if (to) void saveDeps(to, [...to.dependsOn, l.from]);
	};

	const startDrag = (e: PointerEvent, sub: SubIssue, mode: DragMode) => {
		const bar = barOf(sub);
		if (!bar || e.button !== 0) return;
		setSelected(null);
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
		<div class={`vt-timeline is-${scale}${related ? " has-focus" : ""}${link ? " has-link" : ""}`} onKeyDown={(e) => e.key === "Escape" && setSelected(null)}>
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
					<div class="vt-timeline-body" ref={body} style={{ height: `${subs.length * ROW}px` }} onPointerDown={() => setSelected(null)}>
						{cols.map((c) => (
							<div class={`vt-timeline-stripe${c.weekend ? " is-weekend" : ""}${c.weekStart ? " is-week-start" : ""}`} style={{ left: `${xOf(c.date)}px`, width: `${c.span * px}px` }} />
						))}
						{/* 矢印は棒の下に描く（棒を塗りつぶさない）。経路は timeline.ts の routeArrows（途中の棒をよけ、線どうしが重ならないようにずらす） */}
						<svg class="vt-timeline-arrows" width={width} height={subs.length * ROW} aria-hidden="true">
							<defs>
								{(["", "-late", "-related"] as const).map((suffix) => (
									// 先端は塗らない小さな「>」（線の太さによらず 5px）。主張を小さくする
									<marker id={`vt-timeline-arrowhead${suffix}`} viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
										<path d="M1 0.5 L5 3 L1 5.5" class={`vt-timeline-arrowhead${suffix === "-late" ? " is-late" : suffix === "-related" ? " is-related" : ""}`} />
									</marker>
								))}
							</defs>
							{routed.map((r) => (
								<path
									class={`vt-timeline-arrow${r.late ? " is-late" : ""}${r.related ? " is-related" : ""}`}
									d={r.d}
									marker-end={`url(#vt-timeline-arrowhead${r.late ? "-late" : r.related ? "-related" : ""})`}
								/>
							))}
							{link && (() => {
								const row = rowOf.get(link.from)!;
								const span = spans[row];
								return span && <path class="vt-timeline-link" d={`M${span.x1} ${row * ROW + ROW / 2} L${link.x} ${link.y}`} />;
							})()}
						</svg>
						{/* 矢印を押して選ぶための、広い当たり判定（矢印の線は細いので）。棒（z-index 2）の下、行の上 */}
						<svg class="vt-timeline-arrow-hits" aria-hidden="true" width={width} height={subs.length * ROW}>
							{arrows.map((a, i) => {
								const isSel = selected?.from === a.from && selected?.to === a.to;
								return (
									<path
										class={`vt-timeline-arrow-hit${isSel ? " is-selected" : ""}`}
										d={routed[i]!.d}
										onPointerDown={(e) => e.stopPropagation()}
										onClick={() => setSelected({ from: a.from, to: a.to })}
									/>
								);
							})}
						</svg>
						{selected &&
							(() => {
								const i = arrows.findIndex((a) => a.from === selected.from && a.to === selected.to);
								if (i < 0) return null;
								const [x, y] = arrowMidpoint(routes[i]!);
								return (
									<button
										type="button"
										class="vt-timeline-arrow-remove"
										style={{ left: `${x}px`, top: `${y}px` }}
										title="Remove dependency"
										aria-label="Remove dependency"
										ref={(el) => el?.focus()}
										onPointerDown={(e) => e.stopPropagation()}
										onKeyDown={(e) => {
											if (e.key === "Delete" || e.key === "Backspace") {
												e.preventDefault();
												removeDep(selected);
											}
										}}
										onClick={() => removeDep(selected)}
									>
										×
									</button>
								);
							})()}
						<div class="vt-timeline-today" style={{ left: `${xOf(today) + px / 2}px` }} aria-hidden="true" />
						{subs.map((sub, i) => {
							const bar = shown(sub);
							const left = bar ? xOf(bar.start) : 0;
							const barWidth = bar ? (dayOffset(range, bar.end) - dayOffset(range, bar.start) + 1) * px : 0;
							const handles = barWidth >= HANDLE * 3;
							const period = bar ? `${formatShortDate(bar.start)} – ${formatShortDate(bar.end)}` : "";
							const nothing = !bar && sub.scheduled === null;
							return (
								<div class={`vt-timeline-row${bar ? "" : " is-empty"}`} style={{ top: `${i * ROW}px` }} onClick={(e) => pickDay(e, sub)} title={bar ? undefined : "Click a day to set the period"}>
									{nothing && <span class="vt-timeline-none">No dates</span>}
									{!bar &&
										sub.scheduled !== null && (
											<span class="vt-timeline-dot" style={{ left: `${xOf(sub.scheduled) + px / 2}px` }} title={`Calendar ${formatShortDate(sub.scheduled)}`} />
										)}
									{bar && (
										<div
											data-sub-id={sub.id}
											class={`vt-timeline-bar vt-status-${sub.status}${link && link.from !== sub.id ? (link.target === sub.id ? " is-link-target" : canConnect(subs, link.from, sub.id) ? "" : " is-link-no") : ""}${selected?.to === sub.id || selected?.from === sub.id ? " is-selected-end" : ""}${drag?.key === sub.key ? " is-dragging" : ""}${active === sub.id && related ? " is-active" : ""}${relatedFrom.has(sub.id) ? " is-related" : ""}`}
											style={{ left: `${left}px`, width: `${barWidth}px` }}
											tabIndex={0}
											role="button"
											aria-label={`${sub.summary}: ${period}. Drag or use arrow keys to move, Shift + arrow keys to change the end`}
											title={`${sub.summary}\n${period}`}
											onPointerEnter={() => setHovered(sub.id)}
											onPointerLeave={() => setHovered((h) => (h === sub.id ? null : h))}
											onFocus={() => setFocused(sub.id)}
											onBlur={() => setFocused((f) => (f === sub.id ? null : f))}
											onPointerDown={(e) => startDrag(e, sub, "move")}
											onPointerMove={moveDrag}
											onPointerUp={() => endDrag(sub)}
											onPointerCancel={() => setDrag(null)}
											onKeyDown={(e) => keyDown(e, sub)}
											onClick={(e) => e.stopPropagation()}
										>
											<span
												class="vt-timeline-connector"
												title="Connect: drag to a bar that depends on this"
												aria-hidden="true"
												onPointerDown={(e) => startLink(e, sub)}
												onPointerMove={moveLink}
												onPointerUp={endLink}
												onPointerCancel={() => setLink(null)}
											/>
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
					</div>
				</div>
			</div>
		</div>
	);
}
