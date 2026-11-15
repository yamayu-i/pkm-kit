import type { Scope } from "obsidian";
import { useEffect, useRef, useState } from "preact/hooks";
import { localToday } from "../core/dates";
import { formatMinutes } from "../core/format";
import {
	formatElapsed,
	formatNow,
	lastOrganizedMs,
	organizedCard,
	pausedCard,
	pausedTasks,
	restCard,
	runningTasks,
	todoTasks,
	type NowTask,
	type StateCard,
} from "../core/tasks-now";
import { startTimer, stopTimer } from "../obsidian/board-actions";
import type { TaskContext } from "../obsidian/context";
import { Icon } from "../ui/Icon";
import { linkProps } from "../ui/a11y";
import { useNow, useStoreVersion } from "../ui/hooks";

function StateCardView(props: { title: string; hint: string; card: StateCard }) {
	const { card } = props;
	const value = card.elapsedMs === null ? "–" : formatElapsed(card.elapsedMs);
	return (
		<div class={`vt-now-state is-${card.level}`} role="group" aria-label={props.title}>
			<div class="vt-now-state-title">{props.title}</div>
			<div class="vt-now-state-value vt-num">{value}</div>
			<div class="vt-now-state-label">{card.label ?? props.hint}</div>
		</div>
	);
}

function TaskRow(props: { ctx: TaskContext; task: NowTask; action: { icon: string; label: string; onClick: () => void; running?: boolean }; paused?: boolean }) {
	const { ctx, task, action } = props;
	const open = task.path ? () => void ctx.openPath(task.path!) : null;
	return (
		<div class={`vt-task${task.elapsedMs !== null ? " is-running" : ""}${props.paused ? " is-paused" : ""}`}>
			<span class="vt-routine-id">{task.id}</span>
			{open ? (
				<span class="vt-task-summary" title={`${task.id} ${task.summary}`} {...linkProps(open)}>
					{task.summary || task.key}
				</span>
			) : (
				<span class="vt-task-summary">{task.summary || task.key}</span>
			)}
			<button class={`vt-play${action.running ? " is-running" : ""}`} aria-label={action.label} title={action.label} onClick={action.onClick}>
				<Icon name={action.icon} />
				{task.elapsedMs !== null && <span class="vt-num">{formatMinutes(task.elapsedMs / 60_000)}</span>}
			</button>
		</div>
	);
}

/**
 * Tasks Now（ADR-0154）: リボンから開くダイアログ。今の日時・PKM State・実行中のタスク群・タスクリスト
 */
export function TasksNowDialog(props: { ctx: TaskContext; scope?: Scope }) {
	const { ctx } = props;
	useStoreVersion(ctx.store);
	const now = useNow(1000);
	const index = ctx.store.index;
	// 保留した群は端末ごとの設定に持つ。画面はこの state で更新する
	const [pausedKeys, setPausedKeys] = useState<string[]>(ctx.settings.pausedTasks);
	const [busy, setBusy] = useState(false);

	const running = runningTasks(index, now);
	const paused = running.length === 0 ? pausedTasks(index, pausedKeys) : [];
	const worklogs = index.data.worklogs;
	const todo = todoTasks(index, localToday(new Date(now)), new Set([...running.map((t) => t.key), ...paused.map((t) => t.key)]));

	const remember = async (keys: string[]) => {
		ctx.settings.pausedTasks = keys;
		setPausedKeys(keys);
		await ctx.saveSettings();
	};
	const guarded = async (label: string, run: () => Promise<void>) => {
		if (busy) return;
		setBusy(true);
		try {
			await run();
		} catch (e) {
			ctx.report(label, e);
		} finally {
			setBusy(false);
		}
	};
	/** 実行中の群の記録を止める。一時停止なら群を保持し、停止なら捨てる */
	const stopGroup = (keepGroup: boolean) =>
		guarded(keepGroup ? "一時停止できませんでした" : "停止できませんでした", async () => {
			const keys = running.map((t) => t.key);
			const entries = index.running();
			if (entries.length === 0) return;
			await ctx.writer.stopTimer(entries);
			await remember(keepGroup ? keys : []);
		});
	const resume = () =>
		guarded("再開できませんでした", async () => {
			await ctx.writer.startTimer(paused.map((t) => t.key), ctx.settings.deviceName);
			await remember([]);
		});
	const discardPaused = () => guarded("破棄できませんでした", () => remember([]));

	// キー操作（ダイアログを開いているあいだ）: Space は一時停止 / 再開、Shift + Space は停止 / 破棄。
	// 描画のたびに最新の操作を ref に入れ、登録は 1 回だけにする
	const keyActions = useRef({ toggle: () => {}, end: () => {} });
	keyActions.current = {
		toggle: () => void (running.length > 0 ? stopGroup(true) : paused.length > 0 ? resume() : undefined),
		end: () => void (running.length > 0 ? stopGroup(false) : paused.length > 0 ? discardPaused() : undefined),
	};
	useEffect(() => {
		const scope = props.scope;
		if (!scope) return;
		const handlers = [
			scope.register([], " ", () => (keyActions.current.toggle(), false)),
			scope.register(["Shift"], " ", () => (keyActions.current.end(), false)),
		];
		return () => handlers.forEach((handler) => scope.unregister(handler));
	}, [props.scope]);

	return (
		<div class="vt-now">
			<section class="vt-now-clock" aria-live="off">
				<Icon name="clock" />
				<span class="vt-now-clock-text vt-num">{formatNow(now)}</span>
			</section>

			<section class="vt-now-section" aria-label="PKM State">
				<h3 class="vt-now-heading">PKM State</h3>
				<div class="vt-now-states">
					<StateCardView title="Organized" hint="since last Organize" card={organizedCard(lastOrganizedMs(index, ctx.settings.lastOrganizedAt), now)} />
					<StateCardView title="Worklog Paused" hint="since last worklog" card={pausedCard(worklogs, now)} />
					<StateCardView title="Focus Streak" hint="timer running" card={restCard(worklogs, now)} />
				</div>
			</section>

			<section class="vt-now-section" aria-label="Running tasks">
				<div class="vt-now-heading-row">
					<h3 class="vt-now-heading">{paused.length > 0 ? "Paused" : "Running"}</h3>
					<span class="vt-spacer" />
					{running.length > 0 && (
						<>
							<button class="vt-button" disabled={busy} onClick={() => void stopGroup(true)} title="Pause all: save the worklog and keep this group to resume later">
								<Icon name="pause" /> Pause
							</button>
							<button class="vt-button" disabled={busy} onClick={() => void stopGroup(false)} title="Stop all: save the worklog and drop this group">
								<Icon name="square" /> Stop
							</button>
						</>
					)}
					{paused.length > 0 && (
						<>
							<button class="vt-button is-primary" disabled={busy} onClick={() => void resume()} title="Start all paused tasks again">
								<Icon name="play" /> Resume
							</button>
							<button class="vt-button" disabled={busy} onClick={() => void discardPaused()} title="Drop the paused group">
								<Icon name="x" /> Discard
							</button>
						</>
					)}
				</div>
				<div class="vt-now-list">
					{running.map((t) => (
						<TaskRow ctx={ctx} task={t} action={{ icon: "square", label: "Stop timer", running: true, onClick: () => void stopTimer(ctx, [t.key]) }} />
					))}
					{paused.map((t) => (
						<TaskRow ctx={ctx} task={t} paused action={{ icon: "play", label: "Start timer", onClick: () => void startTimer(ctx, [t.key]) }} />
					))}
					{running.length === 0 && paused.length === 0 && <div class="vt-now-empty">No running tasks</div>}
				</div>
			</section>

			<section class="vt-now-section" aria-label="Task list">
				<h3 class="vt-now-heading">Tasks</h3>
				<div class="vt-now-list">
					{todo.map((t) => (
						<TaskRow ctx={ctx} task={t} action={{ icon: "play", label: "Start timer", onClick: () => void startTimer(ctx, [t.key]) }} />
					))}
					{todo.length === 0 && <div class="vt-now-empty">Nothing left on today's board</div>}
				</div>
			</section>
		</div>
	);
}
