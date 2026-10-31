import { useEffect, useRef, useState } from "preact/hooks";
import type { RescheduleTarget } from "../core/actions";
import { emptyBoard, unfinished, pendingBoards, type DailyBoard } from "../core/board";
import { cautionIssues, deadIssues, scheduledOn, type DueLists } from "../core/daily";
import { formatShortDate, localToday, type LocalDate } from "../core/dates";
import type { Issue } from "../core/schema";
import { boardSummary } from "../core/summary";
import { addToBoard, carryIssues } from "../obsidian/board-actions";
import type { TaskContext } from "../obsidian/context";
import { cancelIssues, closeIssues, inboxIssues, rescheduleIssues } from "../obsidian/issue-actions";
import { Icon } from "../ui/Icon";
import { ActionBar, IssueTable } from "../ui/IssueTable";
import { useNow, useStoreVersion } from "../ui/hooks";
import { Board, RoutineRows } from "./Board";

type Step = "dead" | "previous" | "caution" | "scheduled" | "board";

const STEPS: { key: Step; label: string; icon: string }[] = [
	{ key: "dead", label: "期限切れ", icon: "alarm-clock-off" },
	{ key: "previous", label: "前回のボード", icon: "history" },
	{ key: "caution", label: "期限が近い", icon: "alert-triangle" },
	{ key: "scheduled", label: "今日の予定", icon: "calendar-check" },
	{ key: "board", label: "ボード", icon: "layout-dashboard" },
];

/** deadline / mid_due の 2 つの表と操作（dead と caution で共通） */
function DueStep(props: { ctx: TaskContext; lists: DueLists; empty: string }) {
	const sections: { key: RescheduleTarget; title: string; issues: Issue[] }[] = [
		{ key: "deadline", title: "deadline", issues: props.lists.deadline },
		{ key: "mid_due", title: "mid_due", issues: props.lists.midDue },
	];
	return (
		<>
			{sections.map((s) => (
				<DueSection ctx={props.ctx} target={s.key} title={s.title} issues={s.issues} empty={props.empty} />
			))}
		</>
	);
}

function DueSection(props: { ctx: TaskContext; target: RescheduleTarget; title: string; issues: Issue[]; empty: string }) {
	const { ctx, target, issues } = props;
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const sel = issues.filter((i) => selected.has(i.id));
	const done = () => setSelected(new Set());
	return (
		<section class="vt-card">
			<div class="vt-section-head">
				<span class="vt-field-label">{props.title}</span>
				<span class="vt-count">{issues.length}</span>
			</div>
			<IssueTable ctx={ctx} issues={issues} selected={selected} onSelect={setSelected} empty={props.empty} />
			{issues.length > 0 && (
				<ActionBar
					count={sel.length}
					actions={[
						{ label: "Reschedule", icon: "calendar", run: () => void rescheduleIssues(ctx, sel, target).then(done) },
						{ label: "Cancel", icon: "x", run: () => void cancelIssues(ctx, sel).then(done) },
						{ label: "Inbox", icon: "inbox", run: () => void inboxIssues(ctx, sel).then(done) },
					]}
				/>
			)}
		</section>
	);
}

/** 締めていない過去のボードの未完了（ADR-0009） */
function PreviousStep(props: { ctx: TaskContext; boards: DailyBoard[] }) {
	const { ctx } = props;
	const index = ctx.store.index;
	return (
		<>
			{props.boards.map((b) => (
				<PreviousBoard ctx={ctx} board={b} key={b.date} issues={unfinished(index, b.date, b.board).issues} />
			))}
			{props.boards.map((b) => (
				<RoutineRows ctx={ctx} date={b.date} routines={unfinished(index, b.date, b.board).routines} showDate />
			))}
		</>
	);
}

function PreviousBoard(props: { ctx: TaskContext; board: DailyBoard; issues: Issue[] }) {
	const { ctx, board, issues } = props;
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const sel = issues.filter((i) => selected.has(i.id));
	const done = () => setSelected(new Set());
	if (issues.length === 0) return null;
	return (
		<section class="vt-card">
			<div class="vt-section-head">
				<span class="vt-field-label">{formatShortDate(board.date)} のボード</span>
				<span class="vt-count">{issues.length}</span>
			</div>
			<IssueTable ctx={ctx} issues={issues} selected={selected} onSelect={setSelected} columns={["status-detail", "deadline"]} />
			<ActionBar
				count={sel.length}
				actions={[
					{ label: "Close", icon: "check", run: () => void closeIssues(ctx, sel).then(done) },
					{ label: "Reschedule", icon: "calendar", run: () => void carryIssues(ctx, board.date, sel, "reschedule").then(done) },
					{ label: "Cancel", icon: "x", run: () => void cancelIssues(ctx, sel).then(done) },
					{ label: "Inbox", icon: "inbox", run: () => void carryIssues(ctx, board.date, sel, "inbox").then(done) },
				]}
			/>
		</section>
	);
}

function ScheduledStep(props: { ctx: TaskContext; issues: Issue[]; today: LocalDate }) {
	const { ctx, issues, today } = props;
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const sel = issues.filter((i) => selected.has(i.id));
	const done = () => setSelected(new Set());
	return (
		<section class="vt-card">
			<div class="vt-section-head">
				<span class="vt-field-label">今日が実行日</span>
				<span class="vt-count">{issues.length}</span>
				<span class="vt-spacer" />
				<button class="vt-button is-text" disabled={issues.length === 0} onClick={() => void addToBoard(ctx, today, issues.map((i) => i.id))}>
					すべてボードへ
				</button>
			</div>
			<IssueTable ctx={ctx} issues={issues} selected={selected} onSelect={setSelected} />
			<ActionBar
				count={sel.length}
				actions={[
					{ label: "Move to Task Board", icon: "layout-dashboard", tone: "primary", run: () => void addToBoard(ctx, today, sel.map((i) => i.id)).then(done) },
					{ label: "Reschedule", icon: "calendar", run: () => void rescheduleIssues(ctx, sel, "scheduled", today).then(done) },
					{ label: "Cancel", icon: "x", run: () => void cancelIssues(ctx, sel).then(done) },
					{ label: "Inbox", icon: "inbox", run: () => void inboxIssues(ctx, sel).then(done) },
				]}
			/>
		</section>
	);
}

/**
 * DailyTaskView（ADR-0009）。期限切れ → 前回のボード → 期限が近い → 今日の予定 → ボード の順に進む。
 * 片付くと次へ進む。上の段階表示からいつでも移れる（スキップできる）
 */
export function DailyView(props: { ctx: TaskContext }) {
	const { ctx } = props;
	useStoreVersion(ctx.store);
	const now = useNow(60_000);
	const today = localToday(new Date(now));
	const index = ctx.store.index;
	const issues = [...index.issues.values()];
	const dead = deadIssues(issues, today);
	const pending = pendingBoards(index, index.data.boards, today);
	const caution = cautionIssues(issues, today);
	const todayBoard = index.board(today)?.board ?? emptyBoard();
	const scheduled = scheduledOn(issues, today, new Set(todayBoard.issues));
	const todayLeft = unfinished(index, today, todayBoard);

	const counts: Record<Step, number> = {
		dead: dead.deadline.length + dead.midDue.length,
		previous: pending.reduce((n, b) => {
			const u = unfinished(index, b.date, b.board);
			return n + u.issues.length + u.routines.length;
		}, 0),
		caution: caution.deadline.length + caution.midDue.length,
		scheduled: scheduled.length,
		board: todayLeft.issues.length + todayLeft.routines.length,
	};

	// 「次へ」で通り過ぎた段階（caution は片付けなくても進める）
	const [passed, setPassed] = useState<Set<Step>>(new Set());
	const [manual, setManual] = useState<Step | null>(null);
	const auto: Step = (["dead", "previous", "caution", "scheduled"] as Step[]).find((s) => counts[s] > 0 && !passed.has(s)) ?? "board";
	const step = manual ?? auto;

	// 手で選んだ段階でも、片付いたら（caution 以外）自動で次へ
	useEffect(() => {
		if (manual !== null && manual !== "caution" && manual !== "board" && counts[manual] === 0) setManual(null);
	});

	// 未完了がなくなった過去のボードは締めて要約を書く
	const closing = useRef(new Set<string>());
	useEffect(() => {
		for (const b of index.data.boards) {
			if (b.date >= today || b.board.closed || closing.current.has(b.date)) continue;
			const u = unfinished(index, b.date, b.board);
			if (u.issues.length + u.routines.length > 0) continue;
			closing.current.add(b.date);
			void ctx.writer
				.updateBoard(b.date, (x) => {
					x.closed = true;
				})
				.then(() => ctx.writer.writeSummary(b.date, boardSummary(index, b.date, { ...b.board, closed: true })))
				.catch((e) => ctx.report("前回のボードを締められませんでした", e));
		}
	});

	const next = () => {
		setPassed(new Set([...passed, step]));
		setManual(null);
	};

	return (
		<div class="vt-page">
			<header class="vt-page-head">
				<h2 class="vt-page-title">Daily · {formatShortDate(today)}</h2>
			</header>
			<nav class="vt-stepper">
				{STEPS.map((s, i) => {
					const state = s.key === step ? "is-current" : counts[s.key] === 0 || passed.has(s.key) ? "is-done" : "";
					return (
						<button class={`vt-step ${state}`} onClick={() => setManual(s.key)}>
							<span class="vt-step-icon">{state === "is-done" && s.key !== step ? <Icon name="check" /> : i + 1}</span>
							<span class="vt-step-label">{s.label}</span>
							{counts[s.key] > 0 && <span class="vt-step-count">{counts[s.key]}</span>}
						</button>
					);
				})}
			</nav>

			{step === "dead" && <DueStep ctx={ctx} lists={dead} empty="期限切れはありません" />}
			{step === "previous" && (pending.length > 0 ? <PreviousStep ctx={ctx} boards={pending} /> : <div class="vt-empty">片付いていないボードはありません</div>)}
			{step === "caution" && <DueStep ctx={ctx} lists={caution} empty="3 日以内の期限はありません" />}
			{step === "scheduled" && <ScheduledStep ctx={ctx} issues={scheduled} today={today} />}
			{step === "board" && <Board ctx={ctx} index={index} date={today} board={todayBoard} />}

			{step !== "board" && (
				<div class="vt-page-foot">
					{step === "dead" || step === "previous" ? (
						<button class="vt-button is-text" onClick={next}>
							あとで（スキップ）
						</button>
					) : (
						<span />
					)}
					<button class="vt-button is-primary" onClick={next}>
						次へ <Icon name="arrow-right" />
					</button>
				</div>
			)}
		</div>
	);
}
