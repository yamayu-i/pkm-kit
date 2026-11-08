import { inboxPatch, reschedulePatch } from "../core/actions";
import type { RoutineResult } from "../core/board";
import type { LocalDate } from "../core/dates";
import { UNGROUPED } from "../core/groups";
import type { Issue } from "../core/schema";
import type { TaskContext } from "./context";
import { askDate } from "./issue-actions";

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

/** その日を実行日にした issue を作って、ボードに載せる */
export async function createOnBoard(ctx: TaskContext, date: LocalDate, summary: string): Promise<void> {
	try {
		const { created } = await ctx.writer.createIssues([summary], null, [date]);
		const file = created[0];
		if (!file) throw new Error(`作成に失敗しました: ${summary}`);
		await addToBoard(ctx, date, [file.basename]);
	} catch (e) {
		ctx.report("issue を作れませんでした", e);
	}
}

export const removeFromBoard = (ctx: TaskContext, date: LocalDate, id: string) =>
	guard(ctx, "ボードから外せませんでした", ctx.writer.appendBoardOps(date, ctx.settings.deviceName, [{ op: "remove", task: id }]));

export const setPlacement = (ctx: TaskContext, date: LocalDate, id: string, group: string) =>
	guard(
		ctx,
		"グループを変えられませんでした",
		ctx.writer.appendBoardOps(date, ctx.settings.deviceName, [{ op: "place", task: id, group: group === UNGROUPED ? null : group }]),
	);

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

/**
 * ボードの issue をリスケ / Inbox で片付ける。ボードには残し、未完了に数えない（carried）。
 * fixedTo があれば日付を聞かずにそこへ移す（Do Today / Do Tomorrow。ADR-0018）
 */
export async function carryIssues(ctx: TaskContext, date: LocalDate, issues: Issue[], kind: "reschedule" | "inbox", fixedTo: LocalDate | null = null): Promise<void> {
	let to = fixedTo;
	if (kind === "reschedule" && to === null) {
		to = await askDate(ctx, "Move Do Date");
		if (to === null) return;
	}
	try {
		for (const issue of issues) {
			await ctx.writer.update(issue.path, kind === "inbox" ? inboxPatch() : reschedulePatch(issue, "scheduled", to!, date));
		}
		await ctx.writer.appendBoardOps(date, ctx.settings.deviceName, issues.map((i) => ({ op: "carry", task: i.id })));
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
	const running = ctx.store.index.running().filter((l) => ids.includes(l.taskId));
	if (running.length === 0) return Promise.resolve();
	return guard(ctx, "記録を止められませんでした", ctx.writer.stopTimer(running));
}
