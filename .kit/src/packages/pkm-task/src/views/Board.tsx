import { Keymap, Menu } from "obsidian";
import { useState } from "preact/hooks";
import { statusPatch } from "../core/actions";
import { boardItems, unfinished, type BoardState } from "../core/board";
import { addDays, formatShortDate, type LocalDate } from "../core/dates";
import { formatMinutes } from "../core/format";
import { UNGROUPED, groupKeys, inGroup, type GroupDef } from "../core/groups";
import { isActive, type TaskIndex } from "../core/index";
import type { Issue, Routine, Status } from "../core/schema";
import { boardMenuStatuses, isDoneStatus, nextStatuses } from "../core/status-log";
import {
	addToBoard,
	carryIssues,
	closeBoard,
	removeFromBoard,
	reopenBoard,
	setPlacement,
	setRoutineResult,
	startTimer,
	createOnBoard,
	stopTimer,
} from "../obsidian/board-actions";
import type { TaskContext } from "../obsidian/context";
import { cancelIssues, closeIssues } from "../obsidian/issue-actions";
import { pickMember } from "../obsidian/issue-editors";
import { BoardIssueModal } from "../obsidian/modals";
import { PriorityBadge, StatusBadge } from "../ui/badges";
import { StatusIcon } from "../ui/StatusIcon";
import { Icon } from "../ui/Icon";
import { ActionBar, IssueTable } from "../ui/IssueTable";
import { useNow } from "../ui/hooks";
import { linkProps } from "../ui/a11y";

type Item = { kind: "issue"; issue: Issue } | { kind: "routine"; routine: Routine };

const itemId = (it: Item) => (it.kind === "issue" ? it.issue.id : it.routine.id);

function routineStatus(board: BoardState, r: Routine): Status {
	return board.routines[r.id] ?? "open";
}

/** 完了の欄に出すか（closed / canceled の issue と、結果のある routine。ADR-0031） */
function isDoneItem(board: BoardState, it: Item): boolean {
	return it.kind === "issue" ? isDoneStatus(it.issue.status) : board.routines[it.routine.id] !== undefined;
}

/** 閉じた直後の動きを付ける時間 */
const ENTER_MS = 3_000;

/** issue の status を変える。delegated にするときは委任先を選ぶ（ADR-0032）。ほかの status にすると delegated_to を外す */
function changeIssueStatus(ctx: TaskContext, issue: Issue, to: Status): void {
	const save = (patch: Record<string, string | null>) => void ctx.writer.update(issue.path, patch).catch((err) => ctx.report("status を変えられませんでした", err));
	if (to === "delegated") pickMember(ctx, (id) => save(statusPatch(to, id) as Record<string, string | null>));
	else save(statusPatch(to) as Record<string, string | null>);
}

/** delegated のカードの委任先（ADR-0032）。押すと委任先を選び直す */
function DelegateChip(props: { ctx: TaskContext; issue: Issue }) {
	const { ctx, issue } = props;
	const member = issue.delegatedTo === null ? undefined : ctx.store.index.members.get(issue.delegatedTo);
	const name = member?.nickname ?? issue.delegatedTo ?? "Choose delegate";
	const label = `Delegated to: ${name} (click to change)`;
	return (
		<button
			class="vt-badge vt-status-delegated vt-delegate"
			aria-label={label}
			title={label}
			onClick={() => pickMember(ctx, (to) => void ctx.writer.update(issue.path, { delegated_to: to }).catch((err) => ctx.report("委任先を変えられませんでした", err)))}
		>
			<Icon name="user" />
			<span class="vt-delegate-name">{name}</span>
		</button>
	);
}

/** 押すとすぐ次の status にするボタン（ADR-0031）。アイコンは押した後の status */
function NextButtons(props: { ctx: TaskContext; date: LocalDate; item: Item; status: Status }) {
	const { ctx, date, item, status } = props;
	if (isDoneStatus(status)) {
		const back: Status = item.kind === "issue" ? (ctx.store.index.statusBefore(item.issue.id) ?? "open") : "open";
		const label = `Back to ${back}`;
		return (
			<button
				class="vt-next is-undo"
				aria-label={label}
				title={label}
				onClick={() => void (item.kind === "issue" ? changeIssueStatus(ctx, item.issue, back) : setRoutineResult(ctx, date, item.routine.id, null))}
			>
				<Icon name="undo-2" />
			</button>
		);
	}
	const targets: Status[] = item.kind === "issue" ? nextStatuses(status) : ["closed"];
	return (
		<>
			{targets.map((to) => (
				<button
					class={`vt-next vt-status-${to}`}
					aria-label={`Set to ${to}`}
					title={`Set to ${to}`}
					onClick={() => void (item.kind === "issue" ? changeIssueStatus(ctx, item.issue, to) : setRoutineResult(ctx, date, item.routine.id, to as "closed"))}
				>
					<StatusIcon status={to} />
				</button>
			))}
		</>
	);
}

/** カード 1 枚（ADR-0009）。summary・priority・status・再生ボタン */
function TaskCard(props: { ctx: TaskContext; date: LocalDate; board: BoardState; item: Item; keys: string[]; placed: string; now: number }) {
	const { ctx, date, board, item, now } = props;
	const id = itemId(item);
	const running = ctx.store.index.running(id);
	const elapsed = running.reduce((m, l) => Math.max(m, now - l.fromMs), 0);
	const issue = item.kind === "issue" ? item.issue : null;
	const status = issue ? issue.status : routineStatus(board, (item as { routine: Routine }).routine);
	const summary = issue ? issue.summary : (item as { routine: Routine }).routine.summary;
	const path = issue ? issue.path : (item as { routine: Routine }).routine.path;
	const done = isDoneStatus(status);
	// 閉じた直後だけアイコンを動かす（status の記録から。ADR-0031）
	const last = issue ? ctx.store.index.lastStatusLog(issue.id) : undefined;
	const enter = last !== undefined && last.to === status && Date.now() - last.atMs < ENTER_MS;

	const statusMenu = (e: MouseEvent) => {
		const m = new Menu();
		for (const s of boardMenuStatuses(issue ? "issue" : "routine")) {
			m.addItem((mi) =>
				mi
					.setTitle(s === "delegated" ? "delegated…" : s)
					.setChecked(s === status)
					.onClick(() => {
						if (!issue) return void setRoutineResult(ctx, date, id, s === "open" ? null : (s as "closed" | "canceled"));
						// delegated をもう一度選んだときは、委任先を選び直す
						if (s === status && s !== "delegated") return;
						changeIssueStatus(ctx, issue, s);
					}),
			);
		}
		m.showAtMouseEvent(e);
	};
	const moreMenu = (e: MouseEvent) => {
		const m = new Menu();
		for (const key of [UNGROUPED, ...props.keys]) {
			m.addItem((mi) =>
				mi
					.setTitle(key === UNGROUPED ? "→ Unsorted" : `→ ${key}`)
					.setChecked(props.placed === key)
					.onClick(() => void setPlacement(ctx, date, id, key)),
			);
		}
		m.addSeparator();
		m.addItem((mi) => mi.setTitle("Open").setIcon("file-text").onClick(() => void ctx.openPath(path)));
		if (issue) m.addItem((mi) => mi.setTitle("Remove from board").setIcon("x").onClick(() => void removeFromBoard(ctx, date, id)));
		m.showAtMouseEvent(e);
	};
	return (
		<div
			class={`vt-task${done ? " is-done" : ""}${running.length > 0 ? " is-running" : ""}`}
			draggable
			onDragStart={(e) => e.dataTransfer?.setData("text/plain", id)}
		>
			<div class="vt-task-top">
				<span class="vt-task-summary" title={`${id} ${summary}`} {...linkProps((e) => void ctx.openPath(path, Keymap.isModEvent(e) !== false))}>
					{summary}
				</span>
				<button
					class={`vt-play${running.length > 0 ? " is-running" : ""}`}
					aria-label={running.length > 0 ? "Stop timer" : "Start timer"}
					title={running.length > 0 ? "Stop timer" : "Start timer"}
					onClick={() => void (running.length > 0 ? stopTimer(ctx, [id]) : startTimer(ctx, [id]))}
				>
					<Icon name={running.length > 0 ? "square" : "play"} />
					{running.length > 0 && <span class="vt-num">{formatMinutes(elapsed / 60_000)}</span>}
				</button>
			</div>
			<div class="vt-task-bottom">
				{issue ? <PriorityBadge priority={issue.priority} /> : <span class="vt-badge vt-priority">routine</span>}
				<StatusBadge status={status} enter={enter} onClick={statusMenu} />
				{issue && issue.status === "delegated" && <DelegateChip ctx={ctx} issue={issue} />}
				<span class="vt-spacer" />
				<NextButtons ctx={ctx} date={date} item={item} status={status} />
				<button class="vt-icon-button" aria-label="Menu" title="Move to group and more" onClick={moreMenu}>
					<Icon name="more-horizontal" />
				</button>
			</div>
		</div>
	);
}

/** グループの枠。カードを落とすとそのグループに移る。まとめて再生 / 停止できる */
function GroupBox(props: {
	ctx: TaskContext;
	date: LocalDate;
	board: BoardState;
	name: string;
	groupKey: string;
	items: Item[];
	placement: (it: Item) => string;
	keys: string[];
	now: number;
	sub?: boolean;
	/** 未分類（ボードの上に横長に置く） */
	ungrouped?: boolean;
	children?: preact.ComponentChildren;
}) {
	const { ctx, date, groupKey } = props;
	const [over, setOver] = useState(false);
	const all = props.items.filter((it) => groupKey === UNGROUPED ? props.placement(it) === UNGROUPED : inGroup(props.placement(it), groupKey));
	const own = props.items.filter((it) => props.placement(it) === groupKey);
	const ids = all.filter((it) => (it.kind === "issue" ? isActive(it.issue) : routineStatus(props.board, it.routine) === "open")).map(itemId);
	const runningIds = ctx.store.index.running().map((l) => l.taskId).filter((id) => all.some((it) => itemId(it) === id));
	return (
		<section
			class={`vt-group${props.sub ? " is-sub" : ""}${props.ungrouped ? " is-ungrouped" : ""}${over ? " is-over" : ""}`}
			onDragOver={(e) => {
				e.preventDefault();
				e.stopPropagation();
				setOver(true);
			}}
			onDragLeave={() => setOver(false)}
			onDrop={(e) => {
				e.preventDefault();
				e.stopPropagation();
				setOver(false);
				const id = e.dataTransfer?.getData("text/plain");
				if (id) void setPlacement(ctx, date, id, groupKey);
			}}
		>
			<header class="vt-group-head">
				<span class="vt-group-name">{props.name}</span>
				<span class="vt-count">{all.length}</span>
				<span class="vt-spacer" />
				{runningIds.length > 0 ? (
					<button class="vt-play is-running" title="Stop all timers in this group" onClick={() => void stopTimer(ctx, runningIds)}>
						<Icon name="square" />
					</button>
				) : (
					<button class="vt-play" title="Start timers for this group" disabled={ids.length === 0} onClick={() => void startTimer(ctx, ids)}>
						<Icon name="play" />
					</button>
				)}
			</header>
			<div class="vt-group-cards">
				{own.map((it) => (
					<TaskCard ctx={ctx} date={date} board={props.board} item={it} keys={props.keys} placed={props.placement(it)} now={props.now} key={itemId(it)} />
				))}
				{own.length === 0 && !props.children && <div class="vt-drop-hint">Drop cards here</div>}
			</div>
			{props.children && <div class="vt-subgroups">{props.children}</div>}
		</section>
	);
}

/** task board（ADR-0009）。グループ別のカード、再生 / 停止、未完了の整理、締める */
export function Board(props: { ctx: TaskContext; index: TaskIndex; date: LocalDate; board: BoardState }) {
	const { ctx, index, date, board } = props;
	const now = useNow(30_000);
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const groups: GroupDef[] = index.data.groups;
	const keys = groupKeys(groups);
	const { issues, routines } = boardItems(index, date, board);
	const all: Item[] = [...issues.map((issue) => ({ kind: "issue" as const, issue })), ...routines.map((routine) => ({ kind: "routine" as const, routine }))];
	// 完了したものはグループから外し、下の「完了」の欄に出す（ADR-0031）
	const items = all.filter((it) => !isDoneItem(board, it));
	const doneItems = all.filter((it) => isDoneItem(board, it));
	const placement = (it: Item) => index.placement(date, board, itemId(it), it.kind === "routine" ? it.routine.group : null, keys);
	const left = unfinished(index, date, board);
	const leftIssues = left.issues;
	const sel = leftIssues.filter((i) => selected.has(i.id));
	const addIssue = () => {
		const candidates = [...index.issues.values()].filter((i) => isActive(i) && !board.issues.includes(i.id));
		new BoardIssueModal(ctx.app, candidates, (choice) => void (choice.kind === "issue" ? addToBoard(ctx, date, [choice.issue.id]) : createOnBoard(ctx, date, choice.summary))).open();
	};
	const ungrouped = items.filter((it) => placement(it) === UNGROUPED);
	return (
		<div class="vt-board">
			<div class="vt-board-head">
				<h3 class="vt-h">Task board · {formatShortDate(date)}</h3>
				<span class="vt-spacer" />
				<button class="vt-button" onClick={addIssue}>
					<Icon name="plus" /> Add issue
				</button>
				<button class="vt-button is-text" onClick={() => void ctx.openView("pkm-task-groups")}>
					<Icon name="layout-grid" /> Edit groups
				</button>
			</div>
			{all.length === 0 && <div class="vt-empty">The board is empty. Issues with today's Do Date are added automatically. You can also add them with the button above.</div>}
			{/* 未分類はグループと並べず上に置く。すべてグループに入ったら出さない */}
			{ungrouped.length > 0 && (
				<GroupBox ctx={ctx} date={date} board={board} name="Unsorted" groupKey={UNGROUPED} items={items} placement={placement} keys={keys} now={now} ungrouped />
			)}
			{/* 1 階層目は横に並べ、2 階層目はグループの中に縦に並べる（ADR-0015） */}
			<div class="vt-board-columns">
				{groups.map((g) => (
					<GroupBox ctx={ctx} date={date} board={board} name={g.name} groupKey={g.name} items={items} placement={placement} keys={keys} now={now}>
						{g.children.length > 0 &&
							g.children.map((c) => (
								<GroupBox
									ctx={ctx}
									date={date}
									board={board}
									name={c.name}
									groupKey={`${g.name}/${c.name}`}
									items={items}
									placement={placement}
									keys={keys}
									now={now}
									sub
								/>
							))}
					</GroupBox>
				))}
			</div>

			{doneItems.length > 0 && (
				<section class="vt-card vt-done">
					<div class="vt-section-head">
						<span class="vt-field-label">Done</span>
						<span class="vt-count">{doneItems.length}</span>
					</div>
					<div class="vt-done-cards">
						{doneItems.map((it) => (
							<TaskCard ctx={ctx} date={date} board={board} item={it} keys={keys} placed={placement(it)} now={now} key={itemId(it)} />
						))}
					</div>
				</section>
			)}

			<section class="vt-card vt-unfinished">
				<div class="vt-section-head">
					<span class="vt-field-label">Not done</span>
					<span class="vt-count">{leftIssues.length + left.routines.length}</span>
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
							disabled={leftIssues.length + left.routines.length > 0 || all.length === 0}
							title="You can close the board when nothing is left"
							onClick={() => void closeBoard(ctx, date)}
						>
							<Icon name="check" /> Close board
						</button>
					)}
				</div>
				{leftIssues.length + left.routines.length === 0 ? (
					<div class="vt-empty">{all.length === 0 ? "—" : "All done"}</div>
				) : (
					<>
						<IssueTable ctx={ctx} issues={leftIssues} selected={selected} onSelect={setSelected} columns={["status-detail", "next", "deadline", "estimated"]} empty="All issues are done" />
						{leftIssues.length > 0 && (
							<ActionBar
								count={sel.length}
								actions={[
									{ label: "Do Tomorrow", icon: "sunrise", tone: "primary", run: () => void carryIssues(ctx, date, sel, "reschedule", addDays(date, 1)).then(() => setSelected(new Set())) },
									{ label: "Close", icon: "check", run: () => void closeIssues(ctx, sel).then(() => setSelected(new Set())) },
									{ label: "Move Do Date", icon: "calendar-clock", run: () => void carryIssues(ctx, date, sel, "reschedule").then(() => setSelected(new Set())) },
									{ label: "Cancel", icon: "x", run: () => void cancelIssues(ctx, sel).then(() => setSelected(new Set())) },
									{ label: "Inbox", icon: "inbox", run: () => void carryIssues(ctx, date, sel, "inbox").then(() => setSelected(new Set())) },
								]}
							/>
						)}
						<RoutineRows ctx={ctx} date={date} routines={left.routines} />
					</>
				)}
			</section>
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
