import { Menu } from "obsidian";
import { useEffect, useRef, useState } from "preact/hooks";
import { calendarPatch, cancelPatch, closePatch, nextPatch, somedayPatch, ticklerPatch, type Patch } from "../core/actions";
import { addDays, formatShortDate, localToday } from "../core/dates";
import { formatMinutes } from "../core/format";
import { organizeQueue } from "../core/index";
import { PRIORITIES, type Issue } from "../core/schema";
import type { TaskContext } from "../obsidian/context";
import { askDate } from "../obsidian/issue-actions";
import { PreactModal } from "../obsidian/modals";
import { IdBadge, LabelBadge, PriorityBadge } from "../ui/badges";
import { Icon } from "../ui/Icon";
import { LabelForm } from "../ui/LabelForm";
import { useStoreVersion } from "../ui/hooks";

const CHUNK = 5;
const SWIPE = 90;

/** 取り消し用に、変える欄の今の値を控える */
const FIELD_OF: Record<string, (i: Issue) => Patch[string]> = {
	status: (i) => i.status,
	scheduled: (i) => i.scheduled,
	soft_deadline: (i) => i.softDeadline,
	deadline: (i) => i.deadline,
	revisit: (i) => i.revisit,
	reviewed: (i) => i.reviewed,
	estimated: (i) => i.estimated,
	delegated_to: (i) => i.delegatedTo,
	priority: (i) => i.priority,
	label: (i) => i.labels,
	clarified: (i) => (i.clarified ? true : null),
	tickler: (i) => i.tickler,
};

function snapshot(issue: Issue, patch: Patch): Patch {
	const prev: Patch = {};
	for (const key of Object.keys(patch)) prev[key] = FIELD_OF[key]?.(issue) ?? null;
	return prev;
}

/** 本文の冒頭（frontmatter と既定の見出しを除く） */
function useExcerpt(ctx: TaskContext, issue: Issue | undefined): string {
	const [text, setText] = useState("");
	useEffect(() => {
		setText("");
		const file = issue && ctx.app.vault.getFileByPath(issue.path);
		if (!file) return;
		let alive = true;
		void ctx.app.vault.cachedRead(file).then((raw) => {
			const body = raw
				.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "")
				.split("\n")
				.filter((l) => l.trim() && !/^## (ToDo|Description|Note)\s*$/.test(l) && l.trim() !== "- [ ]")
				.slice(0, 4)
				.join("\n");
			if (alive) setText(body);
		});
		return () => {
			alive = false;
		};
	}, [issue?.path]);
	return text;
}

/** Organize（ADR-0009, 0148, 0152）: Inbox と Someday を 1 枚ずつ整理する。→ Next / ← Someday / ↑ Tickler / ↓ Cancel */
export function OrganizeView(props: { ctx: TaskContext }) {
	const { ctx } = props;
	useStoreVersion(ctx.store);
	const today = localToday();
	const [handled, setHandled] = useState<Set<string>>(new Set());
	const [count, setCount] = useState(0);
	const [undo, setUndo] = useState<{ path: string; id: string; prev: Patch; label: string } | null>(null);
	const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
	const start = useRef<{ x: number; y: number } | null>(null);
	const root = useRef<HTMLDivElement>(null);
	const queue = organizeQueue(ctx.store.index.issues.values(), today).filter((i) => !handled.has(i.id));
	const issue = queue[0];
	const excerpt = useExcerpt(ctx, issue);

	const apply = async (patch: Patch, label: string) => {
		if (!issue) return;
		const full = { ...patch, reviewed: today };
		const prev = snapshot(issue, full);
		try {
			await ctx.writer.update(issue.path, full);
			setUndo({ path: issue.path, id: issue.id, prev, label });
			setHandled(new Set([...handled, issue.id]));
			setCount(count + 1);
		} catch (e) {
			ctx.report("整理できませんでした", e);
		}
	};
	const undoLast = async () => {
		if (!undo) return;
		try {
			await ctx.writer.update(undo.path, undo.prev);
			const next = new Set(handled);
			next.delete(undo.id);
			setHandled(next);
			setCount(Math.max(0, count - 1));
			setUndo(null);
		} catch (e) {
			ctx.report("取り消せませんでした", e);
		}
	};

	/** Calendar（ADR-0152）: その日にやらなければならない日を 1 つ選ぶ。整理済みにする */
	const calendar = () => {
		if (!issue) return;
		const target = issue;
		void askDate(ctx, "Calendar (must be done on this day)", localToday()).then((d) => {
			if (d) void apply(calendarPatch(target, d), `Calendar: ${formatShortDate(d)}`);
		});
	};
	/** Tickler（ADR-0152）: 今は決めず、選んだ日に Inbox に戻す。既定は明日 */
	const tickler = () => {
		if (!issue) return;
		const target = issue;
		void askDate(ctx, "Tickler (back to Inbox on this date)", addDays(localToday(), 1)).then((d) => {
			if (d) void apply(ticklerPatch(target, d), `Tickler: ${formatShortDate(d)}`);
		});
	};
	const someday = () => void apply(issue?.status === "someday" ? { tickler: null } : somedayPatch(), "To Someday");
	const next = () => void apply(issue ? nextPatch(issue) : {}, "Next");
	const cancel = () => void apply(cancelPatch(), "Cancel");
	const close = () => void apply(closePatch(), "Closed");

	// PC ではキーボードでも操作できる
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			// 見えていて、入力欄やエディタ（contenteditable）にいないときだけ
			if (!issue || !root.current || root.current.offsetParent === null) return;
			if ((e.target as HTMLElement | null)?.closest("input, textarea, select, [contenteditable='true'], .modal")) return;
			if (document.querySelector(".modal-container")) return;
			const map: Record<string, () => void> = { ArrowRight: next, ArrowLeft: someday, ArrowUp: tickler, ArrowDown: cancel };
			const fn = map[e.key];
			if (fn) {
				e.preventDefault();
				fn();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});

	const direction = (d: { x: number; y: number }) =>
		Math.abs(d.x) >= Math.abs(d.y) ? (d.x > SWIPE ? "right" : d.x < -SWIPE ? "left" : null) : d.y < -SWIPE ? "up" : d.y > SWIPE ? "down" : null;
	const hint = drag ? direction(drag) : null;
	const release = () => {
		const d = drag;
		start.current = null;
		setDrag(null);
		if (!d) return;
		const dir = direction(d);
		if (dir === "right") next();
		else if (dir === "left") someday();
		else if (dir === "up") tickler();
		else if (dir === "down") cancel();
	};

	const priorityMenu = (e: MouseEvent) => {
		if (!issue) return;
		const m = new Menu();
		for (const p of PRIORITIES) m.addItem((mi) => mi.setTitle(p).setChecked(issue.priority === p).onClick(() => void ctx.writer.update(issue.path, { priority: p })));
		m.addItem((mi) => mi.setTitle("None").onClick(() => void ctx.writer.update(issue.path, { priority: null })));
		m.showAtMouseEvent(e);
	};
	const editLabels = () => {
		if (!issue) return;
		new PreactModal(ctx.app, "label", (c) => (
			<LabelForm
				labels={ctx.store.index.data.labels}
				initial={issue.labels}
				onCreate={(name) => ctx.writer.addLabel(name)}
				onSubmit={(names) => {
					c();
					void ctx.writer.update(issue.path, { label: names });
				}}
				onError={(e) => ctx.report("label を追加できませんでした", e)}
			/>
		)).open();
	};
	const colors = new Map(ctx.store.index.data.labels.map((l) => [l.name, l.color]));
	const inChunk = count % CHUNK;

	return (
		<div class="vt-page vt-organize" ref={root}>
			<header class="vt-page-head">
				<h2 class="vt-page-title">Organize</h2>
				<span class="vt-count">{queue.length} left</span>
				<span class="vt-spacer" />
				<div class="vt-chunk" title={`A break every ${CHUNK}`}>
					{Array.from({ length: CHUNK }, (_, i) => (
						<span class={`vt-chunk-dot${i < inChunk || (count > 0 && inChunk === 0) ? " is-on" : ""}`} />
					))}
				</div>
			</header>
			{count > 0 && inChunk === 0 && issue && <div class="vt-banner">Organized {count}. Good place for a break. To keep going, move on to the next card.</div>}
			{issue ? (
				<div class="vt-swipe-area">
					<div class={`vt-swipe-hint is-left${hint === "left" ? " is-active" : ""}`}>
						<Icon name="cloud" /> Someday
					</div>
					<div class={`vt-swipe-hint is-right${hint === "right" ? " is-active" : ""}`}>
						<Icon name="list-todo" /> Next
					</div>
					<div class={`vt-swipe-hint is-up${hint === "up" ? " is-active" : ""}`}>
						<Icon name="alarm-clock" /> Tickler
					</div>
					<div class={`vt-swipe-hint is-down${hint === "down" ? " is-active" : ""}`}>
						<Icon name="x" /> Cancel
					</div>
					<article
						class={`vt-organize-card${drag ? " is-dragging" : ""}`}
						key={issue.id}
						style={drag ? { transform: `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 20}deg)` } : undefined}
						onPointerDown={(e) => {
							if ((e.target as HTMLElement).closest("button")) return;
							start.current = { x: e.clientX, y: e.clientY };
							(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
						}}
						onPointerMove={(e) => start.current && setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y })}
						onPointerUp={release}
						onPointerCancel={() => {
							start.current = null;
							setDrag(null);
						}}
					>
						<div class="vt-organize-meta">
							<IdBadge issue={issue} />
							<span class="vt-chip-mini">{issue.status === "someday" ? "Someday" : "Inbox"}</span>
							{issue.revisit && <span class="vt-chip-mini">revisit {formatShortDate(issue.revisit)}</span>}
							<span class="vt-spacer" />
							<span class="vt-muted vt-num">{issue.created?.slice(0, 10)}</span>
						</div>
						<h3 class="vt-organize-summary">{issue.summary}</h3>
						{excerpt && <p class="vt-organize-excerpt">{excerpt}</p>}
						<div class="vt-chip-row">
							<PriorityBadge priority={issue.priority} onClick={priorityMenu} />
							{issue.labels.map((l) => (
								<LabelBadge name={l} color={colors.get(l) ?? "var(--background-modifier-border)"} />
							))}
							<button class="vt-badge vt-label is-empty" onClick={editLabels}>
								<Icon name="tag" />
								label
							</button>
							{issue.estimated !== null && <span class="vt-chip-mini">{formatMinutes(issue.estimated)}</span>}
						</div>
					</article>
				</div>
			) : (
				<div class="vt-empty vt-organize-done">
					<Icon name="party-popper" />
					<div>Nothing to organize{count > 0 ? ` (organized ${count})` : ""}</div>
				</div>
			)}
			<div class="vt-organize-actions">
				<button class="vt-round is-someday" disabled={!issue} onClick={someday} title="To Someday (←)">
					<Icon name="cloud" />
					<span>Someday</span>
				</button>
				<button class="vt-round is-cancel" disabled={!issue} onClick={cancel} title="Cancel（↓）">
					<Icon name="x" />
					<span>Cancel</span>
				</button>
				<button class="vt-round" disabled={!issue} onClick={close} title="Already done">
					<Icon name="check" />
					<span>Closed</span>
				</button>
				<button class="vt-round" disabled={!issue} onClick={tickler} title="Tickler: decide later, back to Inbox on a date (↑)">
					<Icon name="alarm-clock" />
					<span>Tickler</span>
				</button>
				<button class="vt-round" disabled={!issue} onClick={calendar} title="Calendar: must be done on a specific day">
					<Icon name="calendar-plus" />
					<span>Calendar</span>
				</button>
				<button class="vt-round is-schedule" disabled={!issue} onClick={next} title="Next action, no date (→)">
					<Icon name="list-todo" />
					<span>Next</span>
				</button>
			</div>
			<div class="vt-organize-foot">
				{undo ? (
					<button class="vt-button is-text" onClick={() => void undoLast()}>
						<Icon name="undo-2" /> Undo ({undo.id}: {undo.label})
					</button>
				) : (
					<span class="vt-muted">← Someday / → Next / ↑ Tickler / ↓ Cancel (swipe or arrow keys)</span>
				)}
				{issue && (
					<button class="vt-button is-text" onClick={() => void ctx.openPath(issue.path, true)}>
						<Icon name="external-link" /> Open
					</button>
				)}
			</div>
		</div>
	);
}
