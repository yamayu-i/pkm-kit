import { backToNextPatch, cancelPatch, closePatch, nextPatch, reschedulePatch, somedayPatch, ticklerPatch, type Patch, type RescheduleTarget } from "../core/actions";
import { addDays, localToday, type LocalDate } from "../core/dates";
import type { Issue } from "../core/schema";
import { DateForm } from "../ui/forms";
import type { TaskContext } from "./context";
import { PreactModal } from "./modals";

/** 日付を 1 つ選ばせる（キャンセルなら null） */
export function askDate(ctx: TaskContext, title: string, initial: LocalDate | null = null): Promise<LocalDate | null> {
	return new Promise((resolve) => {
		let done = false;
		const modal = new PreactModal(ctx.app, title, (close) => (
			<DateForm
				initial={initial}
				allowClear={false}
				onSubmit={(v) => {
					done = true;
					close();
					resolve(v);
				}}
			/>
		));
		const onClose = modal.onClose.bind(modal);
		modal.onClose = () => {
			onClose();
			if (!done) resolve(null);
		};
		modal.open();
	});
}

async function patchAll(ctx: TaskContext, issues: Issue[], patch: Patch | ((i: Issue) => Patch), label: string): Promise<void> {
	try {
		await ctx.writer.updateMany(
			issues.map((i) => i.path),
			(path) => {
				const issue = issues.find((i) => i.path === path)!;
				return typeof patch === "function" ? patch(issue) : patch;
			},
		);
	} catch (e) {
		ctx.report(`${label}できませんでした`, e);
	}
}

export const closeIssues = (ctx: TaskContext, issues: Issue[]) => patchAll(ctx, issues, closePatch(), "閉じることが");
export const cancelIssues = (ctx: TaskContext, issues: Issue[]) => patchAll(ctx, issues, cancelPatch(), "Cancel ");
export const somedayIssues = (ctx: TaskContext, issues: Issue[], revisit: LocalDate | null = null) =>
	patchAll(ctx, issues, somedayPatch(revisit), "Someday に移すことが");

/** Tickler（ADR-0152）: 日付を選び、その日まで出さずにその日に Inbox に戻す。既定は明日 */
export async function ticklerIssues(ctx: TaskContext, issues: Issue[]): Promise<void> {
	const date = await askDate(ctx, "Tickler (back to Inbox on this date)", addDays(localToday(), 1));
	if (date === null) return;
	await patchAll(ctx, issues, (i) => ticklerPatch(i, date), "Tickler を付けることが");
}

/** Next（ADR-0148）: 日付を決めずに整理済みにする */
export const nextIssues = (ctx: TaskContext, issues: Issue[]) => patchAll(ctx, issues, (i) => nextPatch(i), "Next にすることが");

/** Back to Next（ADR-0152）: Calendar と Tickler を消して、整理済みの次の行動に戻す */
export const backToNextIssues = (ctx: TaskContext, issues: Issue[]) => patchAll(ctx, issues, backToNextPatch(), "Next に戻すことが");

/** Move date / Change Deadline / Change Soft Deadline（ADR-0032, 0152）。選んだ日に置き換える */
export async function rescheduleIssues(ctx: TaskContext, issues: Issue[], target: RescheduleTarget): Promise<void> {
	const title = target === "scheduled" ? "Move date (must be done on this day)" : `Change ${target}`;
	const date = await askDate(ctx, title, localToday());
	if (date === null) return;
	await patchAll(ctx, issues, () => reschedulePatch(target, date), "日付を変えることが");
}
