import { Keymap, Menu } from "obsidian";
import { useState } from "preact/hooks";
import { closePatch, cancelPatch } from "../core/actions";
import { boardItems, placementOf, unfinished, type BoardState } from "../core/board";
import { formatShortDate, type LocalDate } from "../core/dates";
import { formatMinutes } from "../core/format";
import { UNGROUPED, groupKeys, inGroup, type GroupDef } from "../core/groups";
import { isActive, type TaskIndex } from "../core/index";
import type { Issue, Routine, Status } from "../core/schema";
import {
	addToBoard,
	carryIssues,
	closeBoard,
	removeFromBoard,
	reopenBoard,
	setPlacement,
	setRoutineResult,
	startTimer,
	stopTimer,
} from "../obsidian/board-actions";
import type { TaskContext } from "../obsidian/context";
import { cancelIssues, closeIssues } from "../obsidian/issue-actions";
import { IssueSuggestModal } from "../obsidian/modals";
import { PriorityBadge, StatusBadge } from "../ui/badges";
import { Icon } from "../ui/Icon";
import { ActionBar, IssueTable } from "../ui/IssueTable";
import { useNow } from "../ui/hooks";
import { linkProps } from "../ui/a11y";

type Item = { kind: "issue"; issue: Issue } | { kind: "routine"; routine: Routine };

const itemId = (it: Item) => (it.kind === "issue" ? it.issue.id : it.routine.id);
const QUICK_STATUSES: Status[] = ["open", "in-progress", "waiting", "closed", "canceled"];

function routineStatus(board: BoardState, r: Routine): Status {
	return board.routines[r.id] ?? "open";
}

/** カード 1 枚（ADR-0009）。summary・priority・status・再生ボタン */
function TaskCard(props: { ctx: TaskContext; date: LocalDate; board: BoardState; item: Item; keys: string[]; now: number }) {
	const { ctx, date, board, item, now } = props;
	const id = itemId(item);
	const running = ctx.store.index.running(id);
	const elapsed = running.reduce((m, l) => Math.max(m, now - l.fromMs), 0);
	const issue = item.kind === "issue" ? item.issue : null;
	const status = issue ? issue.status : routineStatus(board, (item as { routine: Routine }).routine);
	const summary = issue ? issue.summary : (item as { routine: Routine }).routine.summary;
	const path = issue ? issue.path : (item as { routine: Routine }).routine.path;
	const done = status === "closed" || status === "canceled";

	const statusMenu = (e: MouseEvent) => {
		const m = new Menu();
		for (const s of QUICK_STATUSES) {
			if (!issue && s !== "open" && s !== "closed" && s !== "canceled") continue;
			m.addItem((mi) =>
				mi
					.setTitle(s)
					.setChecked(s === status)
					.onClick(() => {
						if (!issue) return void setRoutineResult(ctx, date, id, s === "open" ? null : (s as "closed" | "canceled"));
						const patch = s === "closed" ? closePatch() : s === "canceled" ? cancelPatch() : { status: s };
						void ctx.writer.update(issue.path, patch).catch((err) => ctx.report("status を変えられませんでした", err));
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
					.setTitle(key === UNGROUPED ? "→ 未分類" : `→ ${key}`)
					.setChecked((board.groups[id] ?? "") === key)
					.onClick(() => void setPlacement(ctx, date, id, key)),
			);
		}
		m.addSeparator();
		m.addItem((mi) => mi.setTitle("開く").setIcon("file-text").onClick(() => void ctx.openPath(path)));
		if (issue) m.addItem((mi) => mi.setTitle("ボードから外す").setIcon("x").onClick(() => void removeFromBoard(ctx, date, id)));
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
					aria-label={running.length > 0 ? "記録を止める" : "記録を始める"}
					title={running.length > 0 ? "記録を止める" : "記録を始める"}
					onClick={() => void (running.length > 0 ? stopTimer(ctx, [id]) : startTimer(ctx, [id]))}
				>
					<Icon name={running.length > 0 ? "square" : "play"} />
					{running.length > 0 && <span class="vt-num">{formatMinutes(elapsed / 60_000)}</span>}
				</button>
			</div>
			<div class="vt-task-bottom">
				{issue ? <PriorityBadge priority={issue.priority} /> : <span class="vt-badge vt-priority">routine</span>}
				<StatusBadge status={status} onClick={statusMenu} />
				<span class="vt-spacer" />
				<button class="vt-icon-button" aria-label="メニュー" title="グループの移動など" onClick={moreMenu}>
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
					<button class="vt-play is-running" title="このグループの記録をすべて止める" onClick={() => void stopTimer(ctx, runningIds)}>
						<Icon name="square" />
					</button>
				) : (
					<button class="vt-play" title="このグループをまとめて記録する" disabled={ids.length === 0} onClick={() => void startTimer(ctx, ids)}>
						<Icon name="play" />
					</button>
				)}
			</header>
			<div class="vt-group-cards">
				{own.map((it) => (
					<TaskCard ctx={ctx} date={date} board={props.board} item={it} keys={props.keys} now={props.now} key={itemId(it)} />
				))}
				{own.length === 0 && !props.children && <div class="vt-drop-hint">ここにカードを移せます</div>}
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
	const items: Item[] = [...issues.map((issue) => ({ kind: "issue" as const, issue })), ...routines.map((routine) => ({ kind: "routine" as const, routine }))];
	const placement = (it: Item) => placementOf(board, itemId(it), it.kind === "routine" ? it.routine.group : null, keys);
	const left = unfinished(index, date, board);
	const leftIssues = left.issues;
	const sel = leftIssues.filter((i) => selected.has(i.id));
	const addIssue = () => {
		const candidates = [...index.issues.values()].filter((i) => isActive(i) && !board.issues.includes(i.id));
		new IssueSuggestModal(ctx.app, candidates, (i) => void addToBoard(ctx, date, [i.id]), "ボードに載せる issue を検索").open();
	};
	const ungrouped = items.filter((it) => placement(it) === UNGROUPED);
	return (
		<div class="vt-board">
			<div class="vt-board-head">
				<h3 class="vt-h">Task board · {formatShortDate(date)}</h3>
				<span class="vt-spacer" />
				<button class="vt-button" onClick={addIssue}>
					<Icon name="plus" /> issue を載せる
				</button>
				<button class="vt-button is-text" onClick={() => void ctx.openView("vault-task-groups")}>
					<Icon name="layout-grid" /> グループを編集
				</button>
			</div>
			{items.length === 0 && <div class="vt-empty">ボードは空です。「今日の予定」から載せるか、上のボタンで追加します</div>}
			{/* 未分類はグループと並べず上に置く。すべてグループに入ったら出さない */}
			{ungrouped.length > 0 && (
				<GroupBox ctx={ctx} date={date} board={board} name="未分類" groupKey={UNGROUPED} items={items} placement={placement} keys={keys} now={now} ungrouped />
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

			<section class="vt-card vt-unfinished">
				<div class="vt-section-head">
					<span class="vt-field-label">未完了</span>
					<span class="vt-count">{leftIssues.length + left.routines.length}</span>
					<span class="vt-spacer" />
					{board.closed ? (
						<>
							<span class="vt-done-label">
								<Icon name="check-circle-2" /> 締めました
							</span>
							<button class="vt-button is-text" onClick={() => void reopenBoard(ctx, date)}>
								開き直す
							</button>
						</>
					) : (
						<button
							class="vt-button is-primary"
							disabled={leftIssues.length + left.routines.length > 0 || items.length === 0}
							title="未完了が 0 になると締められます"
							onClick={() => void closeBoard(ctx, date)}
						>
							<Icon name="check" /> ボードを締める
						</button>
					)}
				</div>
				{leftIssues.length + left.routines.length === 0 ? (
					<div class="vt-empty">{items.length === 0 ? "—" : "すべて片付きました"}</div>
				) : (
					<>
						<IssueTable ctx={ctx} issues={leftIssues} selected={selected} onSelect={setSelected} columns={["status-detail", "deadline"]} empty="issue はすべて片付きました" />
						{leftIssues.length > 0 && (
							<ActionBar
								count={sel.length}
								actions={[
									{ label: "Close", icon: "check", run: () => void closeIssues(ctx, sel).then(() => setSelected(new Set())) },
									{ label: "Reschedule", icon: "calendar", run: () => void carryIssues(ctx, date, sel, "reschedule").then(() => setSelected(new Set())) },
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
