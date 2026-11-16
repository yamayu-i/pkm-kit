import { h } from "preact";
import { localDateTime } from "../core/dates";
import type { WorklogTimesPlan } from "../core/worklog-times";
import { workKey, type WorklogEntry } from "../core/worklog";
import { WorklogTimesForm } from "../ui/WorklogTimesForm";
import type { TaskContext } from "./context";
import { PreactModal } from "./modals";

type Plan = Exclude<WorklogTimesPlan, { kind: "error" }>;

/** その鍵の記録中の行。新しいものから */
function runningOf(ctx: TaskContext, key: string): WorklogEntry[] {
	return ctx.store.index
		.running()
		.filter((l) => workKey(l) === key)
		.sort((a, b) => b.fromMs - a.fromMs);
}

/**
 * ダイアログの決めたことを書く（ADR-0193 の 2）。記録中なら、いちばん新しい記録中の行を直す。
 * 止めるときは、同じ鍵のほかの記録中の行もふだんの停止で止める
 */
export async function applyWorklogTimes(ctx: TaskContext, key: string, plan: Plan): Promise<void> {
	const iso = (ms: number) => localDateTime(new Date(ms));
	if (plan.kind === "start") return ctx.writer.startTimer([key], ctx.settings.deviceName, plan.fromMs);
	if (plan.kind === "add") return ctx.writer.addWorklog(key, ctx.settings.deviceName, { from: iso(plan.fromMs), to: iso(plan.toMs), description: "" }, new Date(plan.fromMs));
	const [entry, ...others] = runningOf(ctx, key);
	if (!entry) throw new Error("記録中の worklog が見つかりません。開き直してください");
	await ctx.writer.updateWorklog(entry, { from: iso(plan.fromMs), to: plan.kind === "stop" ? iso(plan.toMs) : null, description: entry.description });
	if (plan.kind === "stop" && others.length > 0) await ctx.writer.stopTimer(others);
}

/** 記録の開始・終了を直すダイアログを開く（ADR-0193）。ボードのカードと Tasks Now の行から */
export function openWorklogTimes(ctx: TaskContext, key: string, summary: string): void {
	const entry = runningOf(ctx, key)[0] ?? null;
	new PreactModal(ctx.app, "Edit worklog times", (close) =>
		h(WorklogTimesForm, {
			summary,
			running: entry !== null,
			initialFromMs: entry?.fromMs ?? null,
			onSubmit: (plan) => {
				close();
				applyWorklogTimes(ctx, key, plan).catch((e) => ctx.report("worklog を直せませんでした", e));
			},
		}),
	).open();
}
