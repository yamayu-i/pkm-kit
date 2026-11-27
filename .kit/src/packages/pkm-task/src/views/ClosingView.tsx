import { Keymap } from "obsidian";
import type { BoardState } from "../core/board";
import { CLOSING_GROUPS, closingGroups, closingNotes, closingRoutines, itemStatus, localDateOf, workedMinutes, type ClosingGroup, type ClosingItem, type NoteStat } from "../core/closing";
import { formatShortDate, type LocalDate } from "../core/dates";
import { formatMinutes } from "../core/format";
import type { TaskIndex } from "../core/index";
import { closeBoard, reopenBoard } from "../obsidian/board-actions";
import type { TaskContext } from "../obsidian/context";
import { StatusStepButton } from "../obsidian/status-change";
import { linkProps } from "../ui/a11y";
import { Icon } from "../ui/Icon";
import { carriedFrom } from "../core/routine-order";
import { CarriedChip, DoneToggle, RoutineStepButton } from "./Board";
import { splitDoneRoutines } from "../core/board-lanes";
import { useState } from "preact/hooks";

/** 群の見出し（ADR-0206）。アイコンと色は見出しだけに付ける */
const GROUP_HEAD: Record<ClosingGroup, { label: string; icon: string }> = {
	closed: { label: "Closed", icon: "check-circle-2" },
	"not-done": { label: "Not done", icon: "circle-dashed" },
	waiting: { label: "Waiting", icon: "hourglass" },
	canceled: { label: "Canceled", icon: "x-circle" },
};

function hm(ms: number): string {
	const d = new Date(ms);
	return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Vault の md の更新時刻と created（Closing の Notes。ADR-0206） */
function vaultNotes(ctx: TaskContext): NoteStat[] {
	const files = ctx.app.vault.getMarkdownFiles?.() ?? [];
	return files.map((f) => {
		const fm = ctx.app.metadataCache.getFileCache(f)?.frontmatter as Record<string, unknown> | undefined;
		const created = typeof fm?.created === "string" ? fm.created : null;
		const title = typeof fm?.title === "string" && fm.title ? fm.title : typeof fm?.name === "string" && fm.name ? fm.name : f.basename;
		return { path: f.path, mtime: f.stat.mtime, created, title };
	});
}

/** 1 行のタスク（status のボタン・題・付記） */
function TaskRow(props: { ctx: TaskContext; date: LocalDate; board: BoardState; item: ClosingItem; kindLabel?: boolean }) {
	const { ctx, date, board, item } = props;
	const path = item.kind === "issue" ? item.issue.path : item.kind === "sub" ? item.sub.path : item.routine.path;
	const summary = item.kind === "issue" ? item.issue.summary : item.kind === "sub" ? item.sub.summary : item.routine.summary;
	return (
		<li class="vt-compact-row" data-key={item.key}>
			{/* status のボタンが出ない行でも題の位置を揃える */}
			<span class="vt-compact-step">
				{item.kind === "routine" ? <RoutineStepButton ctx={ctx} date={date} id={item.key} status={itemStatus(board, item)} /> : <StatusStepButton ctx={ctx} keyOf={item.key} onBoard />}
			</span>
			{item.kind === "sub" && <span class="vt-compact-meta">{item.sub.parent} ›</span>}
			<span class="vt-compact-title" title={summary} {...linkProps((e) => void ctx.openPath(path, Keymap.isModEvent(e) !== false))}>
				{summary || "(no summary)"}
			</span>
			{item.kind === "routine" && item.carriedFrom !== null && <CarriedChip from={item.carriedFrom} />}
			{item.kind === "routine" && props.kindLabel !== false && <span class="vt-compact-meta">routine</span>}
			{item.minutes > 0 && <span class="vt-compact-meta vt-num">{formatMinutes(item.minutes)}</span>}
		</li>
	);
}

/**
 * Closing の画面（ADR-0206）。Today の中の 1 画面で、段階表示には入れない。
 * 上から closing の routine、その日のタスクの群、その日に変えたノート、記録を書くボタン
 */
export function ClosingView(props: { ctx: TaskContext; index: TaskIndex; date: LocalDate; board: BoardState; isToday: boolean; onBack: () => void }) {
	const { ctx, index, date, board } = props;
	const grace = ctx.settings.closingGraceHour;
	const routines = closingRoutines(index, date);
	const routinesLeft = routines.filter((r) => board.routines[r.id] === undefined).length;
	// 片付いた closing の routine は既定で隠す（ADR-0240）
	const [showDone, setShowDone] = useState(false);
	const folded = splitDoneRoutines(routines, (r) => board.routines[r.id] ?? "open");
	const visibleRoutines = showDone ? routines : folded.open;
	const groups = closingGroups(index, date, board, grace);
	const taskCount = CLOSING_GROUPS.reduce((n, g) => n + groups[g].length, 0);
	const notes = closingNotes(vaultNotes(ctx), date, grace);
	const total = [...workedMinutes(index, date).values()].reduce((a, b) => a + b, 0);
	return (
		<div class="vt-closing">
			<div class="vt-closing-head">
				<button class="vt-button is-text" onClick={props.onBack}>
					<Icon name="arrow-left" /> Board
				</button>
				<h3 class="vt-h">Closing · {formatShortDate(date)}</h3>
				{!props.isToday && <span class="vt-chip-mini">yesterday</span>}
				<span class="vt-spacer" />
				{total > 0 && (
					<span class="vt-chip-mini vt-num" title="Time recorded today">
						<Icon name="timer" /> {formatMinutes(total)}
					</span>
				)}
			</div>

			<section class="vt-card vt-closing-section" aria-label="Closing routines">
				<div class="vt-section-head">
					<span class="vt-field-label">Closing routines</span>
					<span class="vt-count">{routines.length}</span>
					{routines.length > 0 && routinesLeft === 0 && (
						<span class="vt-done-label">
							<Icon name="check-circle-2" /> All done
						</span>
					)}
				</div>
				{routines.length === 0 ? (
					<div class="vt-empty">No closing routines today. Set a routine's category to closing to show it here.</div>
				) : (
					<>
					<ul class="vt-compact-list">
						{visibleRoutines.map((r) => (
							<TaskRow ctx={ctx} date={date} board={board} item={{ kind: "routine", key: r.id, routine: r, minutes: 0, carriedFrom: carriedFrom(index, r, date) }} kindLabel={false} key={r.id} />
						))}
					</ul>
					<DoneToggle count={folded.done.length} shown={showDone} onToggle={() => setShowDone(!showDone)} />
					</>
				)}
			</section>

			<section class="vt-card vt-closing-section" aria-label="Tasks">
				<div class="vt-section-head">
					<span class="vt-field-label">Tasks</span>
					<span class="vt-count">{taskCount}</span>
				</div>
				{taskCount === 0 && <div class="vt-empty">Nothing on today's board</div>}
				{CLOSING_GROUPS.filter((g) => groups[g].length > 0).map((g) => (
					<div class="vt-closing-group" key={g}>
						<div class={`vt-closing-group-head is-${g}`}>
							<Icon name={GROUP_HEAD[g].icon} />
							<span>{GROUP_HEAD[g].label}</span>
							<span class="vt-num">{groups[g].length}</span>
						</div>
						<ul class="vt-compact-list">
							{groups[g].map((item) => (
								<TaskRow ctx={ctx} date={date} board={board} item={item} key={item.key} />
							))}
						</ul>
					</div>
				))}
			</section>

			<section class="vt-card vt-closing-section" aria-label="Notes">
				<div class="vt-section-head">
					<span class="vt-field-label">Notes</span>
					<span class="vt-count">{notes.length}</span>
				</div>
				{notes.length === 0 ? (
					<div class="vt-empty">No notes changed today</div>
				) : (
					<ul class="vt-compact-list">
						{notes.map(({ note, created }) => (
							<li class="vt-compact-row" key={note.path}>
								<Icon name={created ? "file-plus" : "file-text"} />
								<span class="vt-compact-title" title={note.path} {...linkProps((e) => void ctx.openPath(note.path, Keymap.isModEvent(e) !== false))}>
									{note.title}
								</span>
								{created && <span class="vt-chip-mini">new</span>}
								<span class="vt-compact-meta vt-num">{hm(note.mtime)}</span>
							</li>
						))}
					</ul>
				)}
			</section>

			<div class="vt-page-foot">
				<button class="vt-button is-text" onClick={props.onBack}>
					<Icon name="arrow-left" /> Board
				</button>
				{board.closed ? (
					<span class="vt-closing-done">
						<span class="vt-done-label">
							<Icon name="check-circle-2" /> Closed
						</span>
						<button class="vt-button is-text" onClick={() => void reopenBoard(ctx, date)}>
							Reopen
						</button>
					</span>
				) : (
					<button class="vt-button is-primary" title="Write today's record to the daily note. Unfinished cards are recorded as carried over" onClick={() => void closeBoard(ctx, date)}>
						<Icon name="check" /> Finish closing
					</button>
				)}
			</div>
		</div>
	);
}
