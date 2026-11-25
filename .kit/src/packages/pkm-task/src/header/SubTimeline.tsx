import { Menu } from "obsidian";
import { useEffect, useRef, useState } from "preact/hooks";
import { formatShortDate, localToday, type LocalDate } from "../core/dates";
import { formatMinutes } from "../core/format";
import { columnLoad, dayLoad, loadLabel, needsEstimate, SIZES, type Capacity, type LoadItem } from "../core/projects";
import type { Issue } from "../core/schema";
import { subKey, type SubIssue } from "../core/sub-issue";
import { arrowMidpoint, barOf, canConnect, dateAtX, incomingOf, roundedPath, routeArrows, dayOffset, dependencyArrows, dragBar, timelineColumns, timelineRange, DAY_PX, type DragMode, type TimelineScale, type TimelineSub } from "../core/timeline";
import type { TaskContext } from "../obsidian/context";
import { openSubEditor } from "../obsidian/sub-editor";
import { canEditSubPeriod, periodInInboxMessage, subPeriodError } from "../core/project-periods";
import { Segmented } from "../ui/Segmented";
import { StatusIcon } from "../ui/StatusIcon";
import { revealSub } from "./sub-reveal";

/** 1 行の高さ（px）。styles.css の .vt-timeline と同じ */
const ROW = 36;
/** 棒の両端のつまみの幅（px）。棒がこれの 3 倍より短ければ、つまみを出さずに丸ごとずらす */
const HANDLE = 8;

/**
 * 図の行（ADR-0231）。Project の行（題・期間をまとめた棒・期限の印。読むだけ）とサブの行。
 * 親の画面はサブの行だけ、Projects は Project の行とその下のサブの行を並べる
 */
export type ChartRow = { kind: "project"; issue: Issue; subs: SubIssue[] } | { kind: "sub"; sub: SubIssue };

interface Drag {
	key: string;
	mode: DragMode;
	x0: number;
	bar: { start: LocalDate; end: LocalDate };
	delta: number;
}

/** 依存を引いている最中（ADR-0163）。x / y は日の列の左上からの px、target は離すと依存になる棒（どれも合成キー） */
interface Link {
	from: string;
	x: number;
	y: number;
	target: string | null;
}

/** 図の中ではサブを合成キーで区別する（サブの id は同じ親の中でしか一意でない。ADR-0231） */
function chartSub(sub: SubIssue): TimelineSub {
	return { id: sub.key, start: sub.start, end: sub.end, scheduled: sub.scheduled, dependsOn: sub.dependsOn.map((d) => subKey(sub.parent, d)) };
}

/** サブイシューのガントチャート（ADR-0143）。親の画面のカード「Sub-issues」の Timeline */
export function SubTimeline(props: { ctx: TaskContext; subs: SubIssue[]; scale: TimelineScale; onScale: (scale: TimelineScale) => void; target?: string | null }) {
	return <TimelineChart ctx={props.ctx} rows={props.subs.map((sub) => ({ kind: "sub", sub }))} scale={props.scale} onScale={props.onScale} target={props.target ?? null} />;
}

/**
 * ガントチャートの部品（ADR-0143, 0163, 0231）。期間はドラッグで直し、指を離したときに 1 回だけ保存する。
 * load を渡すと、日の列の見出しの下に負荷の行を出す（Projects）。onSubLabel はサブの題を押したとき（既定は下部のカードを出す）
 */
export function TimelineChart(props: {
	ctx: TaskContext;
	rows: ChartRow[];
	scale: TimelineScale;
	onScale: (scale: TimelineScale) => void;
	target?: string | null;
	load?: { capacity: Capacity; items: LoadItem[] };
	onSubLabel?: (sub: SubIssue) => void;
}) {
	const { ctx, rows, scale } = props;
	const target = props.target ?? null;
	const subs = rows.flatMap((r) => (r.kind === "sub" ? [r.sub] : []));
	const today = localToday();
	const px = DAY_PX[scale];
	// 範囲は、サブの日付と、Project の期限を含める
	const dues: TimelineSub[] = rows.flatMap((r) => {
		if (r.kind !== "project") return [];
		return [r.issue.deadline, r.issue.softDeadline].flatMap((d) => (d ? [{ id: r.issue.id, start: null, end: null, scheduled: d, dependsOn: [] }] : []));
	});
	const range = timelineRange([...subs.map(chartSub), ...dues], today, scale);
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

	// 期間の外のサブの Timeline のボタンから来たとき（ADR-0203）、その行を画面に入れる（来たときだけ。ドラッグのたびには動かさない）
	const labels = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (target !== null) labels.current?.querySelector(".vt-timeline-label.is-target")?.scrollIntoView({ block: "nearest" });
	}, [target]);

	// 開いたときと目盛りを変えたときは、今日が左寄りに見えるようにする
	useEffect(() => {
		const el = scroller.current;
		if (el) el.scrollLeft = Math.max(0, (dayOffset(range, today) - 2) * px);
	}, [scale]);

	// 期間の規則（ADR-0210）は親ごと。Inbox の Project では棒を作れず、動かせない。Tickler より前には置けない（置こうとしたら戻して理由を出す）
	const index = ctx.store.index;
	const lockOf = (parentId: string) => (canEditSubPeriod(index.issues.get(parentId), index.planned(parentId), today) ? null : periodInInboxMessage(parentId));
	const parents = [...new Set(subs.map((s) => s.parent))];
	// 親の画面（親が 1 つ）では、理由を図の上に出しておく。Projects では動かそうとしたときだけ出す
	const fixedLock = parents.length === 1 && !rows.some((r) => r.kind === "project") ? lockOf(parents[0]!) : null;
	const [notice, setNotice] = useState<string | null>(null);
	const save = (sub: SubIssue, next: { start: LocalDate; end: LocalDate }) => {
		const lock = lockOf(sub.parent);
		if (lock !== null) return setNotice(lock);
		const parent = index.issues.get(sub.parent);
		const error = parent ? subPeriodError(parent, index.planned(sub.parent), sub, next, today) : null;
		if (error) return setNotice(error);
		setNotice(null);
		return void ctx.writer.updateSub(sub.key, { start: next.start, end: next.end }).catch((e) => ctx.report("期間を保存できませんでした", e));
	};
	const shown = (sub: SubIssue) => {
		const bar = barOf(sub);
		return drag && drag.key === sub.key && bar ? dragBar(drag.bar, drag.mode, drag.delta) : bar;
	};
	const xOf = (date: LocalDate) => dayOffset(range, date) * px;
	const byKey = new Map(subs.map((s) => [s.key, s]));
	const rowOf = new Map(rows.flatMap((r, i) => (r.kind === "sub" ? [[r.sub.key, i] as const] : [])));
	const chartSubs = subs.map((s) => ({ ...chartSub(s), ...(shown(s) ?? {}) }));
	const arrows = dependencyArrows(chartSubs).map((a) => ({ ...a, fromRow: rowOf.get(a.from)!, toRow: rowOf.get(a.to)! }));
	// 各行の棒の左右（px）。矢印は途中の棒をよけて引く（timeline.ts の routeArrows）。Project の行は矢印の通り道にする
	const spans = rows.map((r) => {
		const bar = r.kind === "sub" ? shown(r.sub) : null;
		return bar ? { x0: xOf(bar.start), x1: xOf(bar.end) + px } : null;
	});
	const routes = routeArrows(arrows, spans, ROW);
	const active = hovered ?? focused;
	const related = incomingOf(arrows, active);
	const routed = arrows.map((a, i) => ({ late: a.late, related: related?.arrows.includes(i) ?? false, d: roundedPath(routes[i]!, 4) }));
	const relatedFrom = new Set(related?.from ?? []);
	// 依存は同じ親のサブの間だけ（depends_on は同じ親の中。ADR-0231）
	const connectable = (from: string, to: string) => byKey.get(from)?.parent === byKey.get(to)?.parent && canConnect(chartSubs, from, to);

	const saveDeps = (sub: SubIssue, dependsOn: string[]) => ctx.writer.updateSub(sub.key, { dependsOn }).catch((e) => ctx.report("依存を保存できませんでした", e));
	const removeDep = (a: { from: string; to: string }) => {
		const to = byKey.get(a.to);
		const from = byKey.get(a.from);
		setSelected(null);
		if (to && from) void saveDeps(to, to.dependsOn.filter((d) => d !== from.id));
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
		setLink({ from: sub.key, ...pointInBody(e), target: null });
	};
	const moveLink = (e: PointerEvent) => {
		if (!link) return;
		const key = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-sub-key]")?.dataset.subKey ?? null;
		setLink({ ...link, ...pointInBody(e), target: key !== null && connectable(link.from, key) ? key : null });
	};
	const endLink = () => {
		if (!link) return;
		const l = link;
		setLink(null);
		const to = l.target === null ? undefined : byKey.get(l.target);
		const from = byKey.get(l.from);
		if (to && from) void saveDeps(to, [...to.dependsOn, from.id]);
	};

	const startDrag = (e: PointerEvent, sub: SubIssue, mode: DragMode) => {
		const bar = barOf(sub);
		if (!bar || e.button !== 0) return;
		const lock = lockOf(sub.parent);
		if (lock !== null) return setNotice(lock);
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
	// 近いうちの見積もりのないサブの印（ADR-0231）。押すと S / M / L のメニュー
	const pickSize = (e: MouseEvent, sub: SubIssue) => {
		e.stopPropagation();
		const m = new Menu();
		for (const size of SIZES) {
			m.addItem((item) => item.setTitle(`${size.label} (${formatMinutes(size.minutes)})`).onClick(() => void ctx.writer.updateSub(sub.key, { estimated: size.minutes }).catch((err) => ctx.report("見積もりを保存できませんでした", err))));
		}
		m.showAtMouseEvent(e);
	};
	const onSubLabel = props.onSubLabel ?? revealSub;
	const height = rows.length * ROW;
	const load = props.load ? dayLoad(props.load.items, props.load.capacity) : null;

	return (
		<>
			{(notice ?? fixedLock) !== null && <div class="vt-muted vt-timeline-notice">{notice ?? fixedLock}</div>}
			<div class={`vt-timeline is-${scale}${related ? " has-focus" : ""}${link ? " has-link" : ""}${load ? " has-load" : ""}`} onKeyDown={(e) => e.key === "Escape" && setSelected(null)}>
				<div class="vt-timeline-labels" ref={labels}>
					{/* 目盛りの切り替えは、目盛り（日付の行）の隣に置く。表示の切り替え（List / Timeline）と離す */}
					<div class="vt-timeline-corner">
						<Segmented
							label="Scale"
							size="small"
							options={[
								{ value: "day", label: "Day" },
								{ value: "week", label: "Week" },
							]}
							value={scale}
							onChange={props.onScale}
						/>
					</div>
					{load && <div class="vt-timeline-load-label" title="Estimated hours per column, compared with the time you can use (settings)">Load</div>}
					{rows.map((row) =>
						row.kind === "project" ? (
							<button type="button" class="vt-timeline-label is-project" title={`Open: ${row.issue.summary}`} onClick={() => void ctx.openPath(row.issue.path)}>
								<span class="vt-badge vt-id">{row.issue.id}</span>
								<span class="vt-timeline-label-text">{row.issue.summary}</span>
							</button>
						) : (
							<button
								type="button"
								class={`vt-timeline-label${row.sub.status === "closed" || row.sub.status === "canceled" ? " is-done" : ""}${row.sub.key === target ? " is-target" : ""}${rows.some((r) => r.kind === "project") ? " is-child" : ""}`}
								title={`Open: ${row.sub.summary}`}
								onClick={() => onSubLabel(row.sub)}
							>
								<StatusIcon status={row.sub.status} />
								<span class="vt-timeline-label-text">{row.sub.summary}</span>
							</button>
						),
					)}
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
						{load && props.load && (
							<div class="vt-timeline-load">
								{cols.map((c) => {
									const v = columnLoad(load, c.date, c.span, props.load!.capacity);
									const text = loadLabel(v.minutes, v.unknown);
									const tip = `見積もり ${formatMinutes(v.minutes)} / 使える時間 ${formatMinutes(v.capacity)}${v.unknown > 0 ? `\n見積もりのないサブ ${v.unknown} 件` : ""}`;
									return (
										<div class={`vt-timeline-load-cell${v.over ? " is-over" : ""}`} style={{ left: `${xOf(c.date)}px`, width: `${c.span * px}px` }} title={tip}>
											{text}
										</div>
									);
								})}
							</div>
						)}
						<div class="vt-timeline-body" ref={body} style={{ height: `${height}px` }} onPointerDown={() => setSelected(null)}>
							{cols.map((c) => (
								<div class={`vt-timeline-stripe${c.weekend ? " is-weekend" : ""}${c.weekStart ? " is-week-start" : ""}`} style={{ left: `${xOf(c.date)}px`, width: `${c.span * px}px` }} />
							))}
							{/* 矢印は棒の下に描く（棒を塗りつぶさない）。経路は timeline.ts の routeArrows（途中の棒をよけ、線どうしが重ならないようにずらす） */}
							<svg class="vt-timeline-arrows" width={width} height={height} aria-hidden="true">
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
								{link &&
									(() => {
										const row = rowOf.get(link.from)!;
										const span = spans[row];
										return span && <path class="vt-timeline-link" d={`M${span.x1} ${row * ROW + ROW / 2} L${link.x} ${link.y}`} />;
									})()}
							</svg>
							{/* 矢印を押して選ぶための、広い当たり判定（矢印の線は細いので）。棒（z-index 2）の下、行の上 */}
							<svg class="vt-timeline-arrow-hits" aria-hidden="true" width={width} height={height}>
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
							{rows.map((row, i) => {
								if (row.kind === "project") return <ProjectRow issue={row.issue} subs={row.subs.map((s) => shown(s))} top={i * ROW} xOf={xOf} px={px} />;
								const sub = row.sub;
								const bar = shown(sub);
								const left = bar ? xOf(bar.start) : 0;
								const barWidth = bar ? (dayOffset(range, bar.end) - dayOffset(range, bar.start) + 1) * px : 0;
								const handles = barWidth >= HANDLE * 3;
								const period = bar ? `${formatShortDate(bar.start)} – ${formatShortDate(bar.end)}` : "";
								const nothing = !bar && sub.scheduled === null;
								const key = sub.key;
								return (
									<div class={`vt-timeline-row${bar ? "" : " is-empty"}`} style={{ top: `${i * ROW}px` }} onClick={(e) => pickDay(e, sub)} title={bar ? undefined : "Click a day to set the period"}>
										{nothing && <span class="vt-timeline-none">No dates</span>}
										{!bar &&
											sub.scheduled !== null && (
												<span class="vt-timeline-dot" style={{ left: `${xOf(sub.scheduled) + px / 2}px` }} title={`Calendar ${formatShortDate(sub.scheduled)}`} />
											)}
										{bar && (
											<div
												data-sub-key={key}
												class={`vt-timeline-bar vt-status-${sub.status}${link && link.from !== key ? (link.target === key ? " is-link-target" : connectable(link.from, key) ? "" : " is-link-no") : ""}${selected?.to === key || selected?.from === key ? " is-selected-end" : ""}${drag?.key === key ? " is-dragging" : ""}${active === key && related ? " is-active" : ""}${relatedFrom.has(key) ? " is-related" : ""}`}
												style={{ left: `${left}px`, width: `${barWidth}px` }}
												tabIndex={0}
												role="button"
												aria-label={`${sub.summary}: ${period}. Drag or use arrow keys to move, Shift + arrow keys to change the end`}
												title={`${sub.summary}\n${period}`}
												onPointerEnter={() => setHovered(key)}
												onPointerLeave={() => setHovered((h) => (h === key ? null : h))}
												onFocus={() => setFocused(key)}
												onBlur={() => setFocused((f) => (f === key ? null : f))}
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
										{bar && needsEstimate(sub, today) && (
											<button type="button" class="vt-timeline-estimate" style={{ left: `${left + barWidth + 16}px` }} title="No estimate: choose a size" onClick={(e) => pickSize(e, sub)}>
												Estimate
											</button>
										)}
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

/** Project の行（ADR-0231）: 出しているサブの期間をまとめた棒と、親の期限の印。読むだけ */
function ProjectRow(props: { issue: Issue; subs: ({ start: LocalDate; end: LocalDate } | null)[]; top: number; xOf: (d: LocalDate) => number; px: number }) {
	const { issue, xOf, px } = props;
	const bars = props.subs.filter((b): b is { start: LocalDate; end: LocalDate } => b !== null);
	const span = bars.length > 0 ? { start: bars.map((b) => b.start).reduce((a, b) => (b < a ? b : a)), end: bars.map((b) => b.end).reduce((a, b) => (b > a ? b : a)) } : null;
	const marks = [
		issue.softDeadline ? { date: issue.softDeadline, kind: "soft", label: `Soft deadline ${formatShortDate(issue.softDeadline)}` } : null,
		issue.deadline ? { date: issue.deadline, kind: "hard", label: `Deadline ${formatShortDate(issue.deadline)}` } : null,
	].filter((m) => m !== null);
	return (
		<div class="vt-timeline-row is-project" style={{ top: `${props.top}px` }}>
			{span && <div class="vt-timeline-span" style={{ left: `${xOf(span.start)}px`, width: `${xOf(span.end) - xOf(span.start) + px}px` }} title={`${formatShortDate(span.start)} – ${formatShortDate(span.end)}`} />}
			{marks.map((m) => (
				<span class={`vt-timeline-due is-${m.kind}`} style={{ left: `${xOf(m.date) + px / 2}px` }} title={m.label} />
			))}
		</div>
	);
}
