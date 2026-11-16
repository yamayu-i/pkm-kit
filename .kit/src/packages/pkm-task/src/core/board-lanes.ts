import { nextOrder, reorder, sortByOrder, type BoardState } from "./board";
import type { BoardOp } from "./board-log";
import type { LocalDate } from "./dates";
import { byPick } from "./daily";
import { isActive, isWatchStatus, type TaskIndex } from "./index";
import type { Issue, Routine, Status } from "./schema";
import { isDoneStatus } from "./status-log";
import type { SubIssue } from "./sub-issue";

/** ボードのカード 1 枚（ADR-0137）。key は issue の ID・サブの合成キー・routine の ID */
export type BoardCard =
	| { kind: "issue"; key: string; issue: Issue }
	| { kind: "sub"; key: string; sub: SubIssue; parent: Issue | undefined }
	| { kind: "routine"; key: string; routine: Routine };

/**
 * 欄（上から）。作業中・★今日の最重要・routine（issue と混ぜない別のまとまり）・次にやる順・Watch・片付いた。
 * Watch（ADR-0184）だけはボードに載っているかによらず、waiting / delegated のすべての issue とサブを出す
 */
export type LaneId = "working" | "top" | "routine" | "next" | "watch" | "done";
export const LANES: readonly LaneId[] = ["working", "top", "routine", "next", "watch", "done"];
/** 手で並べられる欄（1 つの並びを使う） */
export type OrderedLane = "top" | "next";

/** ★ の上限 */
export const TOP_LIMIT = 4;

export type BoardLanes = Record<LaneId, BoardCard[]>;

/** ボードに載っているカード。issue とサブは載せた順、routine はその後ろ。鍵が指すものがなくなったものは出さない */
export function boardCards(index: TaskIndex, date: LocalDate, board: BoardState): BoardCard[] {
	const cards: BoardCard[] = [];
	for (const key of board.issues) {
		const issue = index.issues.get(key);
		if (issue) {
			cards.push({ kind: "issue", key, issue });
			continue;
		}
		const sub = index.sub(key);
		if (sub) cards.push({ kind: "sub", key, sub, parent: index.issues.get(sub.parent) });
	}
	for (const routine of index.routinesOn(date)) cards.push({ kind: "routine", key: routine.id, routine });
	return cards;
}

export function cardStatus(board: BoardState, card: BoardCard): Status {
	if (card.kind === "issue") return card.issue.status;
	if (card.kind === "sub") return card.sub.status;
	return board.routines[card.routine.id] ?? "open";
}

export function cardSummary(card: BoardCard): string {
	return card.kind === "issue" ? card.issue.summary : card.kind === "sub" ? card.sub.summary : card.routine.summary;
}

export function cardPath(card: BoardCard): string {
	return card.kind === "issue" ? card.issue.path : card.kind === "sub" ? card.sub.path : card.routine.path;
}

/** 片付いたか: closed / canceled / someday、結果のある routine、持ち越したもの */
function isSettled(board: BoardState, card: BoardCard): boolean {
	if (card.kind === "routine") return board.routines[card.routine.id] !== undefined;
	const status = cardStatus(board, card);
	return !isActive({ status }) || isDoneStatus(status) || board.carried.includes(card.key);
}

/**
 * ボードのカードの欄。routine は常に routine の欄（issue・サブと混ぜない。★ も作業中も片付いたも使わない）。
 * ほかは作業中 → 片付いた → Watch（waiting / delegated。ADR-0184）→ ★ → 次にやる順 の順で、最初に当たったもの
 */
export function laneOf(index: TaskIndex, board: BoardState, card: BoardCard): LaneId {
	if (card.kind === "routine") return "routine";
	if (index.running(card.key).length > 0) return "working";
	if (isSettled(board, card)) return "done";
	const status = cardStatus(board, card);
	if (isWatchStatus(status)) return "watch";
	if (board.stars.includes(card.key)) return "top";
	return "next";
}

/** 欄ごとのカード。作業中はタイマーを始めた順、片付いたは載せた順、Watch は watchCards の順、ほかは並び（ADR-0114）の順 */
export function boardLanes(index: TaskIndex, date: LocalDate, board: BoardState): BoardLanes {
	const lanes: BoardLanes = { working: [], top: [], routine: [], next: [], watch: [], done: [] };
	const order = index.order(date);
	for (const card of sortByOrder(boardCards(index, date, board), (c) => c.key, order)) {
		const lane = laneOf(index, board, card);
		// Watch はボードの外のものも含めて下で作る
		if (lane !== "watch") lanes[lane].push(card);
	}
	lanes.watch = watchCards(index, new Set(lanes.working.map((c) => c.key)));
	const startedAt = (c: BoardCard) => Math.min(...index.running(c.key).map((l) => l.fromMs));
	lanes.working.sort((a, b) => startedAt(a) - startedAt(b));
	const added = boardCards(index, date, board).map((c) => c.key);
	lanes.done.sort((a, b) => added.indexOf(a.key) - added.indexOf(b.key));
	return lanes;
}

/**
 * Watch の欄（ADR-0184）: status が waiting / delegated の issue と、親が active なサブのすべて。ボードに載っているかによらない。
 * 記録中で作業中の欄に出ているもの（exclude）は除く。並びは Pick と同じ（サブは親の値）で、親の後ろに、同じ親のサブを親の中の順に続ける
 */
export function watchCards(index: TaskIndex, exclude: ReadonlySet<string> = new Set()): BoardCard[] {
	const cards: BoardCard[] = [];
	for (const issue of index.issues.values()) if (isWatchStatus(issue.status)) cards.push({ kind: "issue", key: issue.id, issue });
	for (const sub of index.data.subIssues) {
		if (!isWatchStatus(sub.status) || index.sub(sub.key) !== sub) continue;
		const parent = index.issues.get(sub.parent);
		if (parent && isActive(parent)) cards.push({ kind: "sub", key: sub.key, sub, parent });
	}
	const owner = (c: BoardCard) => (c.kind === "issue" ? c.issue : (c as Extract<BoardCard, { kind: "sub" }>).parent!);
	const rank = (c: BoardCard) => (c.kind === "sub" ? c.sub.order : -1);
	return cards.filter((c) => !exclude.has(c.key)).sort((a, b) => byPick(owner(a), owner(b)) || rank(a) - rank(b));
}

/** status を to にしたときに書くボードの操作（ADR-0184）: waiting / delegated にしたら、その日のボードの ★ を外す */
export function unstarOps(index: TaskIndex, date: LocalDate, key: string, to: Status): BoardOp[] {
	if (!isWatchStatus(to)) return [];
	return index.board(date)?.board.stars.includes(key) ? [{ op: "star", task: key, on: false }] : [];
}

/** 隣り合った同じ親のサブのまとまり（ADR-0137）。parent はサブのまとまりなら親の ID、ほかは null */
export interface CardRun {
	parent: string | null;
	cards: BoardCard[];
}

export function cardRuns(cards: readonly BoardCard[]): CardRun[] {
	const runs: CardRun[] = [];
	for (const card of cards) {
		const parent = card.kind === "sub" ? card.sub.parent : null;
		const last = runs[runs.length - 1];
		if (parent !== null && last && last.parent === parent) last.cards.push(card);
		else runs.push({ parent, cards: [card] });
	}
	return runs;
}

/** routine の欄を出すか: 結果のない（まだ片付いていない）routine があるとき。すべて片付いたら欄ごと隠す */
export function showRoutineLane(board: BoardState, lanes: BoardLanes): boolean {
	return lanes.routine.some((c) => cardStatus(board, c) === "open");
}

/** ★ をもう 1 件付けられるか */
export function canStar(lanes: BoardLanes): boolean {
	return lanes.top.length < TOP_LIMIT;
}

/** 手で並べる欄の、画面の並び（★ → 次にやる順） */
function orderedKeys(lanes: BoardLanes): string[] {
	return [...lanes.top, ...lanes.next].map((c) => c.key);
}

/** 欄の末尾に入れるときの、前に来る鍵（次の欄の先頭。なければ null） */
function endOf(lanes: BoardLanes, lane: OrderedLane, key: string): string | null {
	const after: OrderedLane[] = lane === "top" ? ["next"] : [];
	for (const l of after) {
		const first = lanes[l].find((c) => c.key !== key);
		if (first) return first.key;
	}
	return null;
}

/**
 * カードを欄（lane）の before の前（null なら欄の末尾）に動かす操作（ADR-0137）。
 * ★ の欄に入れると ★ を付け、★ の欄から次にやる順に出すと ★ を外す。並びは今日いないものの位置を残す（ADR-0114）
 */
export function moveOps(lanes: BoardLanes, board: BoardState, key: string, lane: OrderedLane, before: string | null, previous: readonly string[] | undefined): BoardOp[] {
	const ops: BoardOp[] = [];
	const starred = board.stars.includes(key);
	if (lane === "top" && !starred) ops.push({ op: "star", task: key, on: true });
	if (lane === "next" && starred) ops.push({ op: "star", task: key, on: false });
	const visible = orderedKeys(lanes);
	const target = before ?? endOf(lanes, lane, key);
	ops.push({ op: "order", tasks: nextOrder(reorder(visible.includes(key) ? visible : [...visible, key], key, target), previous) });
	return ops;
}

/** 同じ欄の中で 1 つ上 / 下に動かす操作。動かせなければ null */
export function stepOps(lanes: BoardLanes, board: BoardState, key: string, direction: -1 | 1, previous: readonly string[] | undefined): BoardOp[] | null {
	const lane = (["top", "next"] as const).find((l) => lanes[l].some((c) => c.key === key));
	if (!lane) return null;
	const keys = lanes[lane].map((c) => c.key);
	const at = keys.indexOf(key);
	if (direction === -1) {
		if (at <= 0) return null;
		return moveOps(lanes, board, key, lane, keys[at - 1]!, previous);
	}
	if (at >= keys.length - 1) return null;
	return moveOps(lanes, board, key, lane, keys[at + 2] ?? null, previous);
}

/** 未完了の一覧などに出す題。サブは `i-12 › 題` */
export function cardLabel(card: BoardCard): string {
	return card.kind === "sub" ? `${card.sub.parent} › ${card.sub.summary}` : `${card.key} ${cardSummary(card)}`;
}
