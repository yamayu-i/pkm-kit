import { useState } from "preact/hooks";
import { isOnBoard } from "../core/board";
import { localToday } from "../core/dates";
import { formatMinutes } from "../core/format";
import { pickIssuePatch, pickSubPatch, pickTimerControl } from "../core/pick";
import { Icon } from "../ui/Icon";
import { useNow, useStoreVersion } from "../ui/hooks";
import { addToBoard, startTimer, stopTimer } from "./board-actions";
import type { TaskContext } from "./context";
import { confirmModal } from "./sub-editor";

/** Next でなければプロパティ変更を確認し、保存できてから今日のボードへ載せる。 */
export function PickToggle(props: { ctx: TaskContext; keyOf: string }) {
	const { ctx, keyOf } = props;
	const [busy, setBusy] = useState(false);
	const run = () => {
		const today = localToday();
		const issue = ctx.store.index.issues.get(keyOf);
		const sub = ctx.store.index.sub(keyOf);
		const issuePatch = issue ? pickIssuePatch(issue) : null;
		const subPatch = sub ? pickSubPatch(sub, today) : null;
		const patch = issuePatch ?? subPatch;
		const apply = async () => {
			setBusy(true);
			try {
				if (issue && issuePatch) await ctx.writer.update(issue.path, issuePatch);
				else if (sub && subPatch) await ctx.writer.updateSub(sub.key, subPatch);
				await addToBoard(ctx, today, [keyOf]);
			} catch (e) {
				ctx.report("Pick できませんでした", e);
			} finally {
				setBusy(false);
			}
		};
		if (!patch) return void apply();
		const fields = Object.entries(patch).map(([key, value]) => `${key}: ${value === null ? "解除" : value}`).join("、");
		confirmModal(ctx, "Next にして Pick", `Next にするため、次のプロパティを変更して今日のボードに載せます。${fields}`, "Pick", () => void apply());
	};
	return (
		<button type="button" class="vt-play vt-pick" aria-label="Pick" title="Add to today's board" disabled={busy} onClick={run}>
			<Icon name="calendar-check" />
		</button>
	);
}

/** 未 Pick は Pick、今日のボードに載せたら同じ位置にタイマー。記録中は日付が変わっても停止できる。 */
export function PickTimer(props: { ctx: TaskContext; keyOf: string }) {
	const { ctx, keyOf } = props;
	useStoreVersion(ctx.store);
	const now = useNow();
	const running = ctx.store.index.running(keyOf);
	const task = ctx.store.index.issues.get(keyOf) ?? ctx.store.index.sub(keyOf);
	if (!task) return null;
	const control = pickTimerControl(task.status, isOnBoard(ctx.store.index, localToday(), keyOf), running.length > 0);
	if (control === null) return null;
	if (control === "pick") return <PickToggle {...props} />;
	const elapsed = running.reduce((m, log) => Math.max(m, now - log.fromMs), 0);
	const label = running.length ? "Stop timer" : "Start timer";
	return (
		<button type="button" class={`vt-play${running.length ? " is-running" : ""}`} aria-label={label} title={label}
			onClick={() => void (running.length ? stopTimer(ctx, [keyOf]) : startTimer(ctx, [keyOf]))}>
			<Icon name={running.length ? "square" : "play"} />
			{running.length > 0 && <span class="vt-num">{formatMinutes(elapsed / 60_000)}</span>}
		</button>
	);
}
