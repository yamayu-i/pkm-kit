import { cancelPatch, closePatch, inboxPatch, reschedulePatch, somedayPatch, type Patch, type RescheduleTarget } from "../core/actions";
import { localToday, type LocalDate } from "../core/dates";
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
export const inboxIssues = (ctx: TaskContext, issues: Issue[]) => patchAll(ctx, issues, inboxPatch(), "Inbox に戻すことが");
export const somedayIssues = (ctx: TaskContext, issues: Issue[], revisit: LocalDate | null = null) =>
	patchAll(ctx, issues, somedayPatch(revisit), "Someday に移すことが");

/** リスケ。実行日なら from（今日など）を外して選んだ日に移す */
export async function rescheduleIssues(ctx: TaskContext, issues: Issue[], target: RescheduleTarget, from: LocalDate | null = null): Promise<void> {
	const title = target === "scheduled" ? "実行日を移す" : `${target} をリスケ`;
	const date = await askDate(ctx, title, target === "scheduled" ? null : localToday());
	if (date === null) return;
	await patchAll(ctx, issues, (i) => reschedulePatch(i, target, date, from), "リスケ");
}
