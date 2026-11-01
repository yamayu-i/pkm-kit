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
		ctx.writer.updateBoard(date, (b) => {
			for (const id of ids) if (!b.issues.includes(id)) b.issues.push(id);
			b.carried = b.carried.filter((id) => !ids.includes(id));
			b.closed = false;
		}),
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
	guard(
		ctx,
		"ボードから外せませんでした",
		ctx.writer.updateBoard(date, (b) => {
			b.issues = b.issues.filter((x) => x !== id);
			b.carried = b.carried.filter((x) => x !== id);
			delete b.groups[id];
		}),
	);

export const setPlacement = (ctx: TaskContext, date: LocalDate, id: string, group: string) =>
	guard(
		ctx,
		"グループを変えられませんでした",
		ctx.writer.updateBoard(date, (b) => {
			if (group === UNGROUPED) delete b.groups[id];
			else b.groups[id] = group;
		}),
	);

export const setRoutineResult = (ctx: TaskContext, date: LocalDate, id: string, result: RoutineResult | null) =>
	guard(
		ctx,
		"routine を更新できませんでした",
		ctx.writer.updateBoard(date, (b) => {
			if (result === null) delete b.routines[id];
			else b.routines[id] = result;
		}),
	);

/**
 * ボードの issue をリスケ / Inbox で片付ける。ボードには残し、未完了に数えない（carried）
 */
export async function carryIssues(ctx: TaskContext, date: LocalDate, issues: Issue[], kind: "reschedule" | "inbox"): Promise<void> {
	let to: LocalDate | null = null;
	if (kind === "reschedule") {
		to = await askDate(ctx, "実行日を移す");
		if (to === null) return;
	}
	try {
		for (const issue of issues) {
			await ctx.writer.update(issue.path, kind === "inbox" ? inboxPatch() : reschedulePatch(issue, "scheduled", to!, date));
		}
		await ctx.writer.updateBoard(date, (b) => {
			for (const i of issues) if (!b.carried.includes(i.id)) b.carried.push(i.id);
		});
	} catch (e) {
		ctx.report("片付けられませんでした", e);
	}
}

/** ボードを締める: closed にして、デイリーノートに要約を書く（ADR-0009） */
export async function closeBoard(ctx: TaskContext, date: LocalDate): Promise<void> {
	try {
		await ctx.writer.closeBoard(date);
	} catch (e) {
		ctx.report("ボードを締められませんでした", e);
	}
}

export const reopenBoard = (ctx: TaskContext, date: LocalDate) =>
	guard(
		ctx,
		"ボードを開き直せませんでした",
		ctx.writer.updateBoard(date, (b) => {
			b.closed = false;
		}),
	);

export function startTimer(ctx: TaskContext, ids: string[]): Promise<void> {
	return guard(ctx, "記録を始められませんでした", ctx.writer.startTimer(ids, ctx.settings.deviceName));
}

export function stopTimer(ctx: TaskContext, ids: string[]): Promise<void> {
	const running = ctx.store.index.running().filter((l) => ids.includes(l.taskId));
	if (running.length === 0) return Promise.resolve();
	return guard(ctx, "記録を止められませんでした", ctx.writer.stopTimer(running));
}
