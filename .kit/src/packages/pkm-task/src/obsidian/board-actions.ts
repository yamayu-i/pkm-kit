import { Notice } from "obsidian";
import { backToNextPatch, inboxPatch, ticklerPatch } from "../core/actions";
import { emptyBoard, type RoutineResult } from "../core/board";
import { boardLanes, canStar, moveOps, stepOps, type OrderedLane } from "../core/board-lanes";
import type { BoardOp } from "../core/board-log";
import { addDays, localToday, type LocalDate } from "../core/dates";
import type { Issue } from "../core/schema";
import type { SubIssue } from "../core/sub-issue";
import type { TaskContext } from "./context";
import { askDate } from "./issue-actions";
import { workKey } from "../core/worklog";

function guard(ctx: TaskContext, label: string, p: Promise<unknown>): Promise<void> {
	return p.then(
		() => undefined,
		(e) => ctx.report(label, e),
	);
}

export const addToBoard = (ctx: TaskContext, date: LocalDate, ids: string[]) =>
	guard(
		ctx,
		"ボードに載せられませんでした",
		ctx.writer.appendBoardOps(date, ctx.settings.deviceName, ids.map((task) => ({ op: "add", task }))),
	);

/** issue を作って、その日のボードに載せる。ボードで作るのは今やると決めたものなので整理済みにする。日付は書かない（ADR-0152） */
export async function createOnBoard(ctx: TaskContext, date: LocalDate, summary: string): Promise<void> {
	try {
		const { created } = await ctx.writer.createIssues([summary], { clarified: true });
		const file = created[0];
		if (!file) throw new Error(`作成に失敗しました: ${summary}`);
		await addToBoard(ctx, date, [file.basename]);
	} catch (e) {
		ctx.report("issue を作れませんでした", e);
	}
}

export const removeFromBoard = (ctx: TaskContext, date: LocalDate, id: string) =>
	guard(ctx, "ボードから外せませんでした", ctx.writer.appendBoardOps(date, ctx.settings.deviceName, [{ op: "remove", task: id }]));

/** サブをボードに載せる。日付は書かない（今日やると選んだだけで、その日にやらなければならないわけではない。ADR-0152） */
export async function addSubToBoard(ctx: TaskContext, date: LocalDate, sub: SubIssue): Promise<void> {
	try {
		await ctx.writer.appendBoardOps(date, ctx.settings.deviceName, [{ op: "add", task: sub.key }]);
	} catch (e) {
		ctx.report("サブをボードに載せられませんでした", e);
	}
}

function lanesOn(ctx: TaskContext, date: LocalDate) {
	const index = ctx.store.index;
	const board = index.board(date)?.board ?? emptyBoard();
	return { board, lanes: boardLanes(index, date, board), previous: index.order(date) };
}

/** ★ 今日の最重要を付け外しする。3 件あるときは付けない（ADR-0137） */
export function setStar(ctx: TaskContext, date: LocalDate, key: string, on: boolean): Promise<void> {
	const { board, lanes } = lanesOn(ctx, date);
	if (on && !board.stars.includes(key) && !canStar(lanes)) {
		new Notice("★ は 3 件までです。ほかの ★ を外してから付けてください");
		return Promise.resolve();
	}
	return guard(ctx, "★ を変えられませんでした", ctx.writer.appendBoardOps(date, ctx.settings.deviceName, [{ op: "star", task: key, on }]));
}

/**
 * カードを欄（Top 3 / Up next / Waiting）の before の前（null なら末尾）へ動かす（ADR-0137）。
 * Top 3 に入れると ★ を付け、Top 3 から Up next に出すと外す。3 件あるときは Top 3 に入れない
 */
export function moveCard(ctx: TaskContext, date: LocalDate, key: string, lane: OrderedLane, before: string | null): Promise<void> {
	const { board, lanes, previous } = lanesOn(ctx, date);
	if (lane === "top" && !board.stars.includes(key) && !canStar(lanes)) {
		new Notice("★ は 3 件までです。ほかの ★ を外してから入れてください");
		return Promise.resolve();
	}
	return guard(ctx, "カードを動かせませんでした", ctx.writer.appendBoardOps(date, ctx.settings.deviceName, moveOps(lanes, board, key, lane, before, previous)));
}

/** 同じ欄の中で 1 つ上 / 下に動かす（Move up / Move down） */
export function stepCard(ctx: TaskContext, date: LocalDate, key: string, direction: -1 | 1): Promise<void> {
	const { board, lanes, previous } = lanesOn(ctx, date);
	const ops = stepOps(lanes, board, key, direction, previous);
	if (!ops) return Promise.resolve();
	return guard(ctx, "カードを動かせませんでした", ctx.writer.appendBoardOps(date, ctx.settings.deviceName, ops));
}

/** routine のその日の結果を変える。変わったら取り消しのトーストを出す（record が false のときは出さない。ADR-0031） */
export async function setRoutineResult(ctx: TaskContext, date: LocalDate, id: string, result: RoutineResult | null, record = true): Promise<void> {
	const before = ctx.store.index.board(date)?.board.routines[id] ?? null;
	try {
		await ctx.writer.appendBoardOps(date, ctx.settings.deviceName, [{ op: "routine", task: id, result }]);
	} catch (e) {
		ctx.report("routine を更新できませんでした", e);
		return;
	}
	if (record && before !== result) ctx.undo.push(`${date}/${id}`, () => setRoutineResult(ctx, date, id, before, false));
}

/** 持ち越しの片付け方（ADR-0152）。today: 今日のボードに載せる（日付を書かない）、next: Next に戻す、move: Calendar の日を選び直す、tickler・inbox は issue だけ */
export type CarryKind = "today" | "next" | "move" | "tickler" | "inbox";

/**
 * ボードのサブを片付ける（ADR-0137, 0152）。元のボードには残し、未完了に数えない（carried）。
 * サブは Tickler と Inbox を持たない（ADR-0148, 0152）
 */
export async function carrySubs(ctx: TaskContext, date: LocalDate, subs: SubIssue[], kind: "today" | "next" | "move"): Promise<void> {
	let to: LocalDate | null = null;
	if (kind === "move") {
		to = await askDate(ctx, "Move date (must be done on this day)", localToday());
		if (to === null) return;
	}
	try {
		for (const sub of subs) {
			if (kind === "next" && sub.scheduled !== null) await ctx.writer.updateSub(sub.key, { scheduled: null });
			if (kind === "move") await ctx.writer.updateSub(sub.key, { scheduled: to });
		}
		await ctx.writer.appendBoardOps(date, ctx.settings.deviceName, subs.map((s) => ({ op: "carry", task: s.key })));
		if (kind === "today") await ctx.writer.appendBoardOps(localToday(), ctx.settings.deviceName, subs.map((s) => ({ op: "add", task: s.key })));
	} catch (e) {
		ctx.report("片付けられませんでした", e);
	}
}

/**
 * ボードの issue を片付ける（ADR-0152）。元のボードには残し、未完了に数えない（carried）。
 * today は今日のボードに載せるだけで日付を書かない。move は Calendar の日、tickler は Tickler の日（既定は明日）を聞く
 */
export async function carryIssues(ctx: TaskContext, date: LocalDate, issues: Issue[], kind: CarryKind): Promise<void> {
	let to: LocalDate | null = null;
	if (kind === "move") to = await askDate(ctx, "Move date (must be done on this day)", localToday());
	if (kind === "tickler") to = await askDate(ctx, "Tickler (back to Inbox on this date)", addDays(localToday(), 1));
	if ((kind === "move" || kind === "tickler") && to === null) return;
	try {
		for (const issue of issues) {
			if (kind === "inbox") await ctx.writer.update(issue.path, inboxPatch());
			else if (kind === "next") await ctx.writer.update(issue.path, backToNextPatch());
			else if (kind === "move") await ctx.writer.update(issue.path, { scheduled: to });
			else if (kind === "tickler") await ctx.writer.update(issue.path, ticklerPatch(issue, to!));
		}
		await ctx.writer.appendBoardOps(date, ctx.settings.deviceName, issues.map((i) => ({ op: "carry", task: i.id })));
		if (kind === "today") await ctx.writer.appendBoardOps(localToday(), ctx.settings.deviceName, issues.map((i) => ({ op: "add", task: i.id })));
	} catch (e) {
		ctx.report("片付けられませんでした", e);
	}
}

/** ボードを締める: closed にして、デイリーノートに要約を書く（ADR-0009） */
export async function closeBoard(ctx: TaskContext, date: LocalDate): Promise<void> {
	try {
		await ctx.writer.closeBoard(date, ctx.settings.deviceName);
	} catch (e) {
		ctx.report("ボードを締められませんでした", e);
	}
}

export const reopenBoard = (ctx: TaskContext, date: LocalDate) =>
	guard(ctx, "ボードを開き直せませんでした", ctx.writer.appendBoardOps(date, ctx.settings.deviceName, [{ op: "reopen" }]));

export function startTimer(ctx: TaskContext, ids: string[]): Promise<void> {
	return guard(ctx, "記録を始められませんでした", ctx.writer.startTimer(ids, ctx.settings.deviceName));
}

export function stopTimer(ctx: TaskContext, ids: string[]): Promise<void> {
	const running = ctx.store.index.running().filter((l) => ids.includes(workKey(l)));
	if (running.length === 0) return Promise.resolve();
	return guard(ctx, "記録を止められませんでした", ctx.writer.stopTimer(running));
}
