import { useState } from "preact/hooks";
import { isOnBoard } from "../core/board";
import { localToday } from "../core/dates";
import { formatMinutes } from "../core/format";
import { isNext, isNextSub, needsPeriod } from "../core/index";
import { pickTimerControl } from "../core/pick";
import type { SubIssue } from "../core/sub-issue";
import { revealInTimeline } from "../header/sub-timeline-reveal";
import { Icon } from "../ui/Icon";
import { useNow, useStoreVersion } from "../ui/hooks";
import { addToBoard, startTimer, stopTimer } from "./board-actions";
import type { TaskContext } from "./context";

/** 今日のボードへ載せる。Next のものにだけ出すので、項目は書き換えない（ADR-0203） */
export function PickToggle(props: { ctx: TaskContext; keyOf: string }) {
	const { ctx, keyOf } = props;
	const [busy, setBusy] = useState(false);
	const run = async () => {
		setBusy(true);
		try {
			await addToBoard(ctx, localToday(), [keyOf]);
		} catch (e) {
			ctx.report("Pick できませんでした", e);
		} finally {
			setBusy(false);
		}
	};
	return (
		<button type="button" class="vt-play vt-pick" aria-label="Pick" title="Add to today's board" disabled={busy} onClick={() => void run()}>
			<Icon name="calendar-check" />
		</button>
	);
}

/** 期間を決めれば Next になるサブ（ADR-0203）。何も書き換えず、親の画面の Timeline でそのサブを見せる */
function TimelineButton(props: { ctx: TaskContext; sub: SubIssue }) {
	const { ctx, sub } = props;
	const open = () => {
		// 親の画面が開いていなければ開く。開いたら Sub-issues のカードが登録のときに見せる
		if (!revealInTimeline(sub)) void ctx.openPath(sub.path, false);
	};
	const title = "Today is outside this sub-issue's period. Open the Timeline to plan it";
	return (
		<button type="button" class="vt-play vt-pick" aria-label="Open Timeline" title={title} onClick={open}>
			<Icon name="calendar-range" />
		</button>
	);
}

/** Next は Pick、今日のボードに載せたら同じ位置にタイマー、期間の外のサブは Timeline（ADR-0203）。記録中は日付が変わっても停止できる。 */
export function PickTimer(props: { ctx: TaskContext; keyOf: string }) {
	const { ctx, keyOf } = props;
	useStoreVersion(ctx.store);
	const now = useNow();
	const running = ctx.store.index.running(keyOf);
	const index = ctx.store.index;
	const today = localToday();
	const issue = index.issues.get(keyOf);
	const sub = issue ? undefined : index.sub(keyOf);
	const task = issue ?? sub;
	if (!task) return null;
	const parent = sub ? index.issues.get(sub.parent) : undefined;
	const control = pickTimerControl({
		status: task.status,
		picked: isOnBoard(index, today, keyOf),
		running: running.length > 0,
		next: issue ? isNext(issue) : sub ? isNextSub(sub, parent, today) : false,
		needsPeriod: sub ? needsPeriod(sub, parent, today) : false,
	});
	if (control === null) return null;
	if (control === "pick") return <PickToggle {...props} />;
	if (control === "timeline" && sub) return <TimelineButton ctx={ctx} sub={sub} />;
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
