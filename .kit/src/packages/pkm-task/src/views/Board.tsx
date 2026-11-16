import { Keymap, Menu } from "obsidian";
import { useState } from "preact/hooks";
import { unfinished, unfinishedCount, type BoardState } from "../core/board";
import { boardLanes, canStar, showRoutineLane, TOP_LIMIT, cardPath, cardRuns, cardStatus, cardSummary, stepOps, type BoardCard, type BoardLanes, type LaneId, type OrderedLane } from "../core/board-lanes";
import { formatShortDate, type LocalDate } from "../core/dates";
import { formatMinutes } from "../core/format";
import { isActive, type TaskIndex } from "../core/index";
import type { Issue, Routine, Status } from "../core/schema";
import { memberLabel } from "../core/member";
import { isDoneStatus } from "../core/status-log";
import { canApplyAll } from "../core/transition";
import type { SubIssue } from "../core/sub-issue";
import {
	addSubToBoard,
	addToBoard,
	resumeCard,
	carryIssues,
	carrySubs,
	closeBoard,
	createOnBoard,
	moveCard,
	removeFromBoard,
	reopenBoard,
	setRoutineResult,
	setStar,
	startTimer,
	stepCard,
	stopTimer,
} from "../obsidian/board-actions";
import type { TaskContext } from "../obsidian/context";
import { cancelIssues, closeIssues } from "../obsidian/issue-actions";
import { changeSubStatus, showStatusMenu as showTaskStatusMenu, StatusStepButton } from "../obsidian/status-change";
import { BoardIssueModal, type BoardChoice } from "../obsidian/modals";
import { StatusBadge } from "../ui/badges";
import { Icon } from "../ui/Icon";
import { ActionBar, IssueTable } from "../ui/IssueTable";
import { useNow } from "../ui/hooks";
import { linkProps } from "../ui/a11y";

/** 閉じた直後の動きを付ける時間 */
const ENTER_MS = 3_000;

/** 欄の見出し（画面の文字は英語。ADR-0137） */
const LANE_TITLE: Record<LaneId, string> = {
	working: "Working",
	top: "Top 4",
	routine: "Routines",
	next: "Up next",
	watch: "Watch",
	done: "Done",
};

const LANE_EMPTY: Partial<Record<LaneId, string>> = {
	top: "Pick up to 4 cards that matter most today. Drag them here, or use the card menu.",
	next: "Nothing else to do today.",
};

/** ドラッグで運ぶ値（カードの鍵） */
const DRAG_TYPE = "text/plain";
const readDrag = (e: DragEvent): string | null => e.dataTransfer?.getData(DRAG_TYPE) || null;

/** ドラッグで並べられる欄（ADR-0137: ★ と次にやる順の間と中だけ） */
const isDragLane = (lane: LaneId): lane is "top" | "next" => lane === "top" || lane === "next";

/** カードの status のメニュー（ボードのカードと Watch で共通）。issue とサブは遷移表の先だけ（ADR-0183）。routine はその日の結果 */
function showStatusMenu(ctx: TaskContext, date: LocalDate, card: BoardCard, status: Status, e: MouseEvent): void {
	if (card.kind !== "routine") return showTaskStatusMenu(ctx, e, card.key);
	const m = new Menu();
	for (const s of ROUTINE_RESULTS) {
		m.addItem((mi) =>
			mi
				.setTitle(s)
				.setChecked(s === status)
				.onClick(() => void setRoutineResult(ctx, date, card.key, s === "open" ? null : s)),
		);
	}
	m.showAtMouseEvent(e);
}

/** routine のその日の結果（ADR-0010） */
const ROUTINE_RESULTS = ["open", "closed", "canceled"] as const;

/** カード 1 枚（ADR-0137）。status のバッジ・題・再生・メニューだけ */
function TaskCard(props: { ctx: TaskContext; date: LocalDate; board: BoardState; lanes: BoardLanes; lane: LaneId; card: BoardCard; now: number }) {
	const { ctx, date, board, lanes, lane, card, now } = props;
	const index = ctx.store.index;
	const [dropBefore, setDropBefore] = useState(false);
	const key = card.key;
	const running = index.running(key);
	const elapsed = running.reduce((m, l) => Math.max(m, now - l.fromMs), 0);
	const status = cardStatus(board, card);
	const summary = cardSummary(card);
	const path = cardPath(card);
	const done = lane === "done";
	// 閉じた直後だけアイコンを動かす（status の記録から。ADR-0031）
	const last = card.kind === "issue" ? index.lastStatusLog(card.issue.id) : undefined;
	const enter = last !== undefined && last.to === status && Date.now() - last.atMs < ENTER_MS;
	const starred = board.stars.includes(key);

	const statusMenu = (e: MouseEvent) => showStatusMenu(ctx, date, card, status, e);
	const moreMenu = (e: MouseEvent) => {
		const m = new Menu();
		if (!done && card.kind !== "routine") {
			if (starred) m.addItem((mi) => mi.setTitle("Remove from Top 4").setIcon("star-off").onClick(() => void setStar(ctx, date, key, false)));
			else if (canStar(lanes)) m.addItem((mi) => mi.setTitle("Add to Top 4").setIcon("star").onClick(() => void setStar(ctx, date, key, true)));
		}
		const up = stepOps(lanes, board, key, -1, undefined);
		const down = stepOps(lanes, board, key, 1, undefined);
		if (up) m.addItem((mi) => mi.setTitle("Move up").setIcon("arrow-up").onClick(() => void stepCard(ctx, date, key, -1)));
		if (down) m.addItem((mi) => mi.setTitle("Move down").setIcon("arrow-down").onClick(() => void stepCard(ctx, date, key, 1)));
		m.addSeparator();
		m.addItem((mi) => mi.setTitle("Open").setIcon("file-text").onClick(() => void ctx.openPath(path)));
		if (card.kind !== "routine") m.addItem((mi) => mi.setTitle("Remove from board").setIcon("x").onClick(() => void removeFromBoard(ctx, date, key)));
		m.showAtMouseEvent(e);
	};
	const draggable = isDragLane(lane);
	return (
		<div
			class={`vt-task${card.kind === "sub" ? " is-sub" : ""}${isDoneStatus(status) ? " is-done" : ""}${running.length > 0 ? " is-running" : ""}${dropBefore ? " is-drop-before" : ""}`}
			data-key={key}
			draggable={draggable}
			{...(draggable
				? {
						onDragStart: (e: DragEvent) => e.dataTransfer?.setData(DRAG_TYPE, key),
						// 別のカードの上に落とすと、そのカードの前に入る（ADR-0114, 0137）
						onDragOver: (e: DragEvent) => {
							e.preventDefault();
							e.stopPropagation();
							setDropBefore(true);
						},
						onDragLeave: () => setDropBefore(false),
						onDrop: (e: DragEvent) => {
							e.preventDefault();
							e.stopPropagation();
							setDropBefore(false);
							const dragged = readDrag(e);
							if (dragged && dragged !== key) void moveCard(ctx, date, dragged, lane, key);
						},
					}
				: {})}
		>
			<StatusBadge status={status} enter={enter} onClick={statusMenu} />
			{card.kind !== "routine" && <StatusStepButton ctx={ctx} keyOf={key} />}
			<span class="vt-task-summary" title={card.kind === "sub" ? `${card.sub.parent} › ${summary}` : `${key} ${summary}`} {...linkProps((e) => void ctx.openPath(path, Keymap.isModEvent(e) !== false))}>
				{summary}
			</span>
			{!done && card.kind !== "routine" && (
				<button
					class={`vt-icon-button vt-star${starred ? " is-starred" : ""}`}
					aria-label={starred ? "Remove from Top 4" : "Add to Top 4"}
					aria-pressed={starred}
					title={starred ? "Remove from Top 4" : "Add to Top 4"}
					onClick={() => void setStar(ctx, date, key, !starred)}
				>
					<Icon name="star" />
				</button>
			)}
			<button
				class={`vt-play${running.length > 0 ? " is-running" : ""}`}
				aria-label={running.length > 0 ? "Stop timer" : "Start timer"}
				title={running.length > 0 ? "Stop timer" : "Start timer"}
				onClick={() => void (running.length > 0 ? stopTimer(ctx, [key]) : startTimer(ctx, [key]))}
			>
				<Icon name={running.length > 0 ? "square" : "play"} />
				{running.length > 0 && <span class="vt-num">{formatMinutes(elapsed / 60_000)}</span>}
			</button>
			<button class="vt-icon-button" aria-label="Card menu" title="Move and more" onClick={moreMenu}>
				<Icon name="more-horizontal" />
			</button>
		</div>
	);
}

/**
 * Watch のカード（ADR-0184）。status のバッジ・題・委任先・Resume・メニュー。★・再生・並べ替えはない。
 * Resume は in-progress に戻し、今日のボードになければ載せる
 */
function WatchCard(props: { ctx: TaskContext; date: LocalDate; card: BoardCard }) {
	const { ctx, date, card } = props;
	if (card.kind === "routine") return null;
	const status = card.kind === "issue" ? card.issue.status : card.sub.status;
	const summary = cardSummary(card);
	const path = cardPath(card);
	const delegatedTo = card.kind === "issue" ? card.issue.delegatedTo : card.sub.delegatedTo;
	const member = delegatedTo ? ctx.store.index.members.get(delegatedTo) : undefined;
	const moreMenu = (e: MouseEvent) => {
		const m = new Menu();
		m.addItem((mi) => mi.setTitle("Open").setIcon("file-text").onClick(() => void ctx.openPath(path)));
		m.showAtMouseEvent(e);
	};
	return (
		<div class={`vt-task vt-watch-task${card.kind === "sub" ? " is-sub" : ""}`} data-key={card.key}>
			<StatusBadge status={status} onClick={(e) => showStatusMenu(ctx, date, card, status, e)} />
			<span class="vt-task-summary" title={card.kind === "sub" ? `${card.sub.parent} › ${summary}` : `${card.key} ${summary}`} {...linkProps((e) => void ctx.openPath(path, Keymap.isModEvent(e) !== false))}>
				{summary}
			</span>
			{delegatedTo && (
				<span class="vt-chip-mini vt-watch-member" title={member ? memberLabel(member) : delegatedTo}>
					@{member?.alias ?? delegatedTo}
				</span>
			)}
			<button class="vt-button is-text" aria-label="Resume" title="Back to in-progress and add to today's board" onClick={() => void resumeCard(ctx, date, card)}>
				<Icon name="undo-2" />
				<span class="vt-watch-label">Resume</span>
			</button>
			<button class="vt-icon-button" aria-label="Card menu" title="More" onClick={moreMenu}>
				<Icon name="more-horizontal" />
			</button>
		</div>
	);
}

/** 隣り合った同じ親のサブの見出し（ADR-0137）。押すと親を開く */
export function ParentHead(props: { ctx: TaskContext; parentId: string }) {
	const parent = props.ctx.store.index.issues.get(props.parentId);
	return (
		<div class="vt-lane-parent">
			<span class="vt-badge vt-id">{props.parentId}</span>
			{parent ? (
				<span class="vt-lane-parent-summary" title={parent.summary} {...linkProps((e) => void props.ctx.openPath(parent.path, Keymap.isModEvent(e) !== false))}>
					{parent.summary}
				</span>
			) : (
				<span class="vt-lane-parent-summary">Deleted issue</span>
			)}
		</div>
	);
}

/** 欄 1 つ。★ と次にやる順は、カードを落とせる */
function Lane(props: { ctx: TaskContext; date: LocalDate; board: BoardState; lanes: BoardLanes; lane: LaneId; now: number }) {
	const { ctx, date, board, lanes, lane, now } = props;
	const cards = lanes[lane];
	const watch = lane === "watch";
	const [over, setOver] = useState(false);
	// routine は開いたまま、Done はたたんだまま始める
	const [open, setOpen] = useState(lane === "routine");
	const collapsible = lane === "done" || lane === "routine";
	const shown = !collapsible || open;
	// ★ が上限（TOP_LIMIT 件）あるときは、★ の外からは落とせない
	const accepts = isDragLane(lane) && (lane !== "top" || canStar(lanes));
	return (
		<section
			class={`vt-lane is-${lane}${over ? " is-over" : ""}`}
			aria-label={LANE_TITLE[lane]}
			{...(isDragLane(lane)
				? {
						onDragOver: (e: DragEvent) => {
							if (!accepts && !cards.some((c) => c.key === readDrag(e))) return;
							e.preventDefault();
							setOver(true);
						},
						onDragLeave: () => setOver(false),
						onDrop: (e: DragEvent) => {
							e.preventDefault();
							setOver(false);
							// 空いているところに落とすと末尾に入る
							const dragged = readDrag(e);
							if (dragged) void moveCard(ctx, date, dragged, lane as OrderedLane, null);
						},
					}
				: {})}
		>
			<header class="vt-lane-head">
				{collapsible ? (
					<button class="vt-lane-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
						<Icon name={open ? "chevron-down" : "chevron-right"} />
						<span class="vt-lane-name">{LANE_TITLE[lane]}</span>
					</button>
				) : (
					<span class="vt-lane-name">
						{lane === "top" && <Icon name="star" />}
						{LANE_TITLE[lane]}
					</span>
				)}
				<span class="vt-count">{lane === "top" ? `${cards.length}/${TOP_LIMIT}` : lane === "routine" ? `${cards.filter((c) => cardStatus(board, c) === "open").length}/${cards.length}` : cards.length}</span>
			</header>
			{shown && (
				<div class="vt-lane-cards">
					{cardRuns(cards).map((run) =>
						run.parent === null ? (
							run.cards.map((card) => (watch ? <WatchCard ctx={ctx} date={date} card={card} key={card.key} /> : <TaskCard ctx={ctx} date={date} board={board} lanes={lanes} lane={lane} card={card} now={now} key={card.key} />))
						) : (
							<div class="vt-lane-run" key={`${run.parent}/${run.cards[0]!.key}`}>
								<ParentHead ctx={ctx} parentId={run.parent} />
								{run.cards.map((card) =>
									watch ? <WatchCard ctx={ctx} date={date} card={card} key={card.key} /> : <TaskCard ctx={ctx} date={date} board={board} lanes={lanes} lane={lane} card={card} now={now} key={card.key} />,
								)}
							</div>
						),
					)}
					{cards.length === 0 && LANE_EMPTY[lane] && <div class="vt-drop-hint">{LANE_EMPTY[lane]}</div>}
				</div>
			)}
		</section>
	);
}

/** 「Add issue」の候補: ボードにない active な issue と、その日が Calendar の日でない active なサブ（今日の Calendar のものは自動で載る。ADR-0137, 0152） */
export function boardCandidates(index: TaskIndex, date: LocalDate, board: BoardState): Exclude<BoardChoice, { kind: "create" }>[] {
	const on = new Set(board.issues);
	const issues = [...index.issues.values()].filter((i) => isActive(i) && !on.has(i.id));
	const subs = index.data.subIssues.filter((s) => isActive(s) && !on.has(s.key) && s.scheduled !== date && index.sub(s.key) === s);
	return [...issues.map((issue) => ({ kind: "issue" as const, issue })), ...subs.map((sub) => ({ kind: "sub" as const, sub }))];
}

/** task board（ADR-0009, 0137）。status とタイマーで決まる欄、再生 / 停止、未完了の整理、締める */
export function Board(props: { ctx: TaskContext; index: TaskIndex; date: LocalDate; board: BoardState }) {
	const { ctx, index, date, board } = props;
	const now = useNow(30_000);
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const lanes = boardLanes(index, date, board);
	// Watch はボードの外のものも出すので、ボードが空かどうかには数えない（ADR-0184）
	const total = Object.values(lanes).reduce((n, l) => n + l.length, 0) - lanes.watch.length;
	const left = unfinished(index, date, board);
	const leftIssues = left.issues;
	const leftCount = unfinishedCount(left);
	const sel = leftIssues.filter((i) => selected.has(i.id));
	const addIssue = () => {
		new BoardIssueModal(ctx.app, boardCandidates(index, date, board), (choice) => {
			if (choice.kind === "issue") void addToBoard(ctx, date, [choice.issue.id]);
			else if (choice.kind === "sub") void addSubToBoard(ctx, date, choice.sub);
			else void createOnBoard(ctx, date, choice.summary);
		}).open();
	};
	const visibleLanes: LaneId[] = (["working", "top", "routine", "next", "watch", "done"] as LaneId[]).filter((l) => (l === "routine" ? showRoutineLane(board, lanes) : l === "top" || l === "next" || lanes[l].length > 0));
	return (
		<div class="vt-board">
			<div class="vt-board-head">
				<h3 class="vt-h">Task board · {formatShortDate(date)}</h3>
				<span class="vt-spacer" />
				<button class="vt-button" onClick={addIssue}>
					<Icon name="plus" /> Add issue
				</button>
			</div>
			{total === 0 ? (
				<>
					<div class="vt-empty">The board is empty. Issues and sub-issues with today's Do Date are added automatically. You can also add them with the button above.</div>
					{lanes.watch.length > 0 && (
						<div class="vt-lanes">
							<Lane ctx={ctx} date={date} board={board} lanes={lanes} lane="watch" now={now} />
						</div>
					)}
				</>
			) : (
				<div class="vt-lanes">
					{visibleLanes.map((lane) => (
						<Lane ctx={ctx} date={date} board={board} lanes={lanes} lane={lane} now={now} key={lane} />
					))}
				</div>
			)}

			<section class="vt-card vt-unfinished">
				<div class="vt-section-head">
					<span class="vt-field-label">Not done</span>
					<span class="vt-count">{leftCount}</span>
					<span class="vt-spacer" />
					{board.closed ? (
						<>
							<span class="vt-done-label">
								<Icon name="check-circle-2" /> Closed
							</span>
							<button class="vt-button is-text" onClick={() => void reopenBoard(ctx, date)}>
								Reopen
							</button>
						</>
					) : (
						<button
							class="vt-button is-primary"
							disabled={leftCount > 0 || total === 0}
							title="You can close the board when nothing is left"
							onClick={() => void closeBoard(ctx, date)}
						>
							<Icon name="check" /> Close board
						</button>
					)}
				</div>
				{leftCount === 0 ? (
					<div class="vt-empty">{total === 0 ? "—" : "All done"}</div>
				) : (
					<>
						{leftIssues.length > 0 && (
							<>
								<IssueTable ctx={ctx} issues={leftIssues} selected={selected} onSelect={setSelected} columns={["status-detail", "calendar", "deadline", "estimated"]} empty="All issues are done" />
								<ActionBar
									count={sel.length}
									actions={[
										...carryActions(ctx, date, sel, "next", () => setSelected(new Set())),
									]}
								/>
							</>
						)}
						<SubRows ctx={ctx} date={date} subs={left.subs} primary="next" />
						<RoutineRows ctx={ctx} date={date} routines={left.routines} />
					</>
				)}
			</section>
		</div>
	);
}

/**
 * 未完了の issue の片付け（ADR-0152）。primary が today なら今日のボードに載せる（前のボード）、next なら Next に戻す（今日のボード）。
 * Move date は Calendar の日（scheduled）を持つものだけのとき出す
 */
export function carryActions(ctx: TaskContext, date: LocalDate, sel: Issue[], primary: "today" | "next", done: () => void) {
	const run = (p: Promise<void>) => void p.then(done);
	const statuses = sel.map((i) => i.status);
	return [
		...(primary === "today" ? [{ label: "Add to today's board", icon: "calendar-check", tone: "primary" as const, run: () => run(carryIssues(ctx, date, sel, "today")) }] : []),
		{ label: "Back to Next", icon: "list-todo", ...(primary === "next" ? { tone: "primary" as const } : {}), run: () => run(carryIssues(ctx, date, sel, "next")) },
		{ label: "Tickler", icon: "alarm-clock", disabled: !canApplyAll(statuses, "tickler"), run: () => run(carryIssues(ctx, date, sel, "tickler")) },
		...(sel.length > 0 && sel.every((i) => i.scheduled !== null) ? [{ label: "Move date", icon: "calendar-clock", run: () => run(carryIssues(ctx, date, sel, "move")) }] : []),
		{ label: "Close", icon: "check", disabled: !canApplyAll(statuses, "closed"), run: () => run(closeIssues(ctx, sel)) },
		{ label: "Cancel", icon: "x", disabled: !canApplyAll(statuses, "canceled"), run: () => run(cancelIssues(ctx, sel)) },
		// Inbox に戻すのは open のものだけ（ADR-0183）
		{ label: "Inbox", icon: "inbox", disabled: !canApplyAll(statuses, "inbox"), run: () => run(carryIssues(ctx, date, sel, "inbox")) },
	];
}

/** 未完了のサブ（ADR-0137, 0152）。Close・Cancel・Next に戻す・Calendar の日を選び直す。Tickler と Inbox はない（サブは整理の対象外。ADR-0148） */
export function SubRows(props: { ctx: TaskContext; date: LocalDate; subs: SubIssue[]; primary: "today" | "next"; showDate?: boolean }) {
	const { ctx, date } = props;
	if (props.subs.length === 0) return null;
	return (
		<div class="vt-routine-rows vt-sub-rows">
			{props.subs.map((s) => (
				<div class="vt-routine-row" key={s.key}>
					{props.showDate && <span class="vt-date-chip">{formatShortDate(date)}</span>}
					<span class="vt-badge vt-id">{s.parent}</span>
					<span class="vt-cell-summary" title={`${s.parent} › ${s.summary}`}>
						{s.summary}
					</span>
					<span class="vt-spacer" />
					{props.primary === "today" && (
						<button class="vt-button" onClick={() => void carrySubs(ctx, date, [s], "today")}>
							Add to today's board
						</button>
					)}
					<button class={`vt-button${props.primary === "next" ? "" : " is-text"}`} onClick={() => void carrySubs(ctx, date, [s], "next")}>
						Back to Next
					</button>
					<button class="vt-button is-text" onClick={() => changeSubStatus(ctx, s, "closed")}>
						Close
					</button>
					{s.scheduled !== null && (
						<button class="vt-button is-text" onClick={() => void carrySubs(ctx, date, [s], "move")}>
							Move date
						</button>
					)}
					<button class="vt-button is-text" onClick={() => changeSubStatus(ctx, s, "canceled")}>
						Cancel
					</button>
				</div>
			))}
		</div>
	);
}

/** 結果のない routine。その日のうちに closed か canceled にする（ADR-0010） */
export function RoutineRows(props: { ctx: TaskContext; date: LocalDate; routines: Routine[]; showDate?: boolean }) {
	if (props.routines.length === 0) return null;
	return (
		<div class="vt-routine-rows">
			{props.routines.map((r) => (
				<div class="vt-routine-row">
					{props.showDate && <span class="vt-date-chip">{formatShortDate(props.date)}</span>}
					<span class="vt-badge vt-id vt-routine-id">{r.id}</span>
					<span class="vt-cell-summary">{r.summary}</span>
					<span class="vt-spacer" />
					<button class="vt-button" onClick={() => void setRoutineResult(props.ctx, props.date, r.id, "closed")}>
						Close
					</button>
					<button class="vt-button is-text" onClick={() => void setRoutineResult(props.ctx, props.date, r.id, "canceled")}>
						Cancel
					</button>
				</div>
			))}
		</div>
	);
}
