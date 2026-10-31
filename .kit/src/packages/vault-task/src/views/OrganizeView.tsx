import { Menu } from "obsidian";
import { useEffect, useRef, useState } from "preact/hooks";
import { cancelPatch, closePatch, schedulePatch, somedayPatch, type Patch } from "../core/actions";
import { addDays, formatShortDate, localToday, weekdayOf, type LocalDate } from "../core/dates";
import { formatMinutes } from "../core/format";
import { isInbox, organizeQueue } from "../core/index";
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
const ESTIMATES = [15, 30, 60, 120, 300, 480];

/** 取り消し用に、変える欄の今の値を控える */
const FIELD_OF: Record<string, (i: Issue) => Patch[string]> = {
	status: (i) => i.status,
	scheduled: (i) => i.scheduled,
	mid_due: (i) => i.midDue,
	deadline: (i) => i.deadline,
	revisit: (i) => i.revisit,
	reviewed: (i) => i.reviewed,
	estimated: (i) => i.estimated,
	delegated_to: (i) => i.delegatedTo,
	priority: (i) => i.priority,
	label: (i) => i.labels,
};

function snapshot(issue: Issue, patch: Patch): Patch {
	const prev: Patch = {};
	for (const key of Object.keys(patch)) prev[key] = FIELD_OF[key]?.(issue) ?? null;
	return prev;
}

/** 今週中 = 次の金曜（金〜日なら今日） */
function thisWeek(today: LocalDate): LocalDate {
	const w = weekdayOf(today);
	return w >= 5 || w === 0 ? today : addDays(today, 5 - w);
}

/** 予定を入れる（Inbox からなら estimated も。ADR-0009） */
function ScheduleSheet(props: { issue: Issue; requireEstimate: boolean; onSubmit: (date: LocalDate, estimated: number | null) => void; onPickDate: () => void }) {
	const today = localToday();
	const [date, setDate] = useState<LocalDate>(today);
	const [estimated, setEstimated] = useState<number | null>(props.issue.estimated);
	const dates: [string, LocalDate][] = [
		["今日", today],
		["明日", addDays(today, 1)],
		["今週中", thisWeek(today)],
		["来週", addDays(today, 7)],
	];
	const ok = !props.requireEstimate || estimated !== null;
	return (
		<div class="vt-sheet">
			<div class="vt-field-label">いつやる</div>
			<div class="vt-chip-row">
				{dates.map(([label, d]) => (
					<button class={`vt-filter-chip${date === d ? " is-on" : ""}`} onClick={() => setDate(d)}>
						{label} <span class="vt-muted">{formatShortDate(d)}</span>
					</button>
				))}
				<button class="vt-filter-chip" onClick={props.onPickDate}>
					<Icon name="calendar" /> 日付を選ぶ
				</button>
			</div>
			<div class="vt-field-label">estimated{props.requireEstimate ? "（必須）" : ""}</div>
			<div class="vt-chip-row">
				{ESTIMATES.map((m) => (
					<button class={`vt-filter-chip${estimated === m ? " is-on" : ""}`} onClick={() => setEstimated(m)}>
						{formatMinutes(m)}
					</button>
				))}
			</div>
			<div class="vt-form">
				<button class="mod-cta" disabled={!ok} onClick={() => props.onSubmit(date, estimated)}>
					予定に入れる
				</button>
			</div>
		</div>
	);
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

/** Organize（ADR-0009）: Inbox と Someday を 1 枚ずつ整理する */
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

	const schedule = () => {
		if (!issue) return;
		const target = issue;
		const modal = new PreactModal(ctx.app, "予定を入れる", (close) => (
			<ScheduleSheet
				issue={target}
				requireEstimate={isInbox(target)}
				onSubmit={(date, est) => {
					close();
					void apply(schedulePatch(target, [date], est), `${formatShortDate(date)} に予定`);
				}}
				onPickDate={() => {
					close();
					void askDate(ctx, "実行日").then((d) => {
						if (d === null) return;
						const needEstimate = isInbox(target) && target.estimated === null;
						new PreactModal(ctx.app, "予定を入れる", (c2) => (
							<ScheduleSheet
								issue={target}
								requireEstimate={needEstimate}
								onSubmit={(_, est) => {
									c2();
									void apply(schedulePatch(target, [d], est), `${formatShortDate(d)} に予定`);
								}}
								onPickDate={() => undefined}
							/>
						)).open();
					});
				}}
			/>
		));
		modal.open();
	};
	const someday = () => void apply(issue?.status === "someday" ? {} : somedayPatch(), "Someday へ");
	const later = () => void apply({}, "あとで");
	const cancel = () => void apply(cancelPatch(), "Cancel");
	const close = () => void apply(closePatch(), "Closed");

	// PC ではキーボードでも操作できる
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			// 見えていて、入力欄やエディタ（contenteditable）にいないときだけ
			if (!issue || !root.current || root.current.offsetParent === null) return;
			if ((e.target as HTMLElement | null)?.closest("input, textarea, select, [contenteditable='true'], .modal")) return;
			if (document.querySelector(".modal-container")) return;
			const map: Record<string, () => void> = { ArrowRight: schedule, ArrowLeft: someday, ArrowUp: later, ArrowDown: cancel };
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
		if (dir === "right") schedule();
		else if (dir === "left") someday();
		else if (dir === "up") later();
		else if (dir === "down") cancel();
	};

	const priorityMenu = (e: MouseEvent) => {
		if (!issue) return;
		const m = new Menu();
		for (const p of PRIORITIES) m.addItem((mi) => mi.setTitle(p).setChecked(issue.priority === p).onClick(() => void ctx.writer.update(issue.path, { priority: p })));
		m.addItem((mi) => mi.setTitle("なし").onClick(() => void ctx.writer.update(issue.path, { priority: null })));
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
				<span class="vt-count">残り {queue.length}</span>
				<span class="vt-spacer" />
				<div class="vt-chunk" title={`${CHUNK} 件で一区切り`}>
					{Array.from({ length: CHUNK }, (_, i) => (
						<span class={`vt-chunk-dot${i < inChunk || (count > 0 && inChunk === 0) ? " is-on" : ""}`} />
					))}
				</div>
			</header>
			{count > 0 && inChunk === 0 && issue && <div class="vt-banner">{count} 件整理しました。ここで一区切り。続けるならそのまま次のカードへ</div>}
			{issue ? (
				<div class="vt-swipe-area">
					<div class={`vt-swipe-hint is-left${hint === "left" ? " is-active" : ""}`}>
						<Icon name="cloud" /> Someday
					</div>
					<div class={`vt-swipe-hint is-right${hint === "right" ? " is-active" : ""}`}>
						<Icon name="calendar-plus" /> 予定
					</div>
					<div class={`vt-swipe-hint is-up${hint === "up" ? " is-active" : ""}`}>
						<Icon name="clock" /> あとで
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
							<span class="vt-chip-mini">{isInbox(issue) ? "Inbox" : "Someday"}</span>
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
					<div>整理するものはありません{count > 0 ? `（${count} 件整理しました）` : ""}</div>
				</div>
			)}
			<div class="vt-organize-actions">
				<button class="vt-round is-someday" disabled={!issue} onClick={someday} title="Someday へ（←）">
					<Icon name="cloud" />
					<span>Someday</span>
				</button>
				<button class="vt-round" disabled={!issue} onClick={later} title="あとで（↑）">
					<Icon name="clock" />
					<span>あとで</span>
				</button>
				<button class="vt-round is-cancel" disabled={!issue} onClick={cancel} title="Cancel（↓）">
					<Icon name="x" />
					<span>Cancel</span>
				</button>
				<button class="vt-round" disabled={!issue} onClick={close} title="もう終わっていた">
					<Icon name="check" />
					<span>Closed</span>
				</button>
				<button class="vt-round is-schedule" disabled={!issue} onClick={schedule} title="予定を入れる（→）">
					<Icon name="calendar-plus" />
					<span>予定</span>
				</button>
			</div>
			<div class="vt-organize-foot">
				{undo ? (
					<button class="vt-button is-text" onClick={() => void undoLast()}>
						<Icon name="undo-2" /> 取り消す（{undo.id}: {undo.label}）
					</button>
				) : (
					<span class="vt-muted">← Someday ／ → 予定 ／ ↑ あとで ／ ↓ Cancel（スワイプか矢印キー）</span>
				)}
				{issue && (
					<button class="vt-button is-text" onClick={() => void ctx.openPath(issue.path, true)}>
						<Icon name="external-link" /> 開く
					</button>
				)}
			</div>
		</div>
	);
}
