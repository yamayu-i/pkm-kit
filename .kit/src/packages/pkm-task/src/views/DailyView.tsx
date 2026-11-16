import { Fragment } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import type { RescheduleTarget } from "../core/actions";
import { emptyBoard, unfinished, unfinishedCount } from "../core/board";
import { cautionIssues, cautionSubs, currentStep, deadIssues, deadSubs, missedIssues, missedSubs, pickCandidates, type DueLists, type SubDueLists } from "../core/daily";
import { formatShortDate, localToday } from "../core/dates";
import { stepperItems } from "../core/stepper";
import type { Issue } from "../core/schema";
import type { SubIssue } from "../core/sub-issue";
import { addSubToBoard, addToBoard } from "../obsidian/board-actions";
import type { TaskContext } from "../obsidian/context";
import { askDate, backToNextIssues, cancelIssues, closeIssues, rescheduleIssues, somedayIssues, ticklerIssues } from "../obsidian/issue-actions";
import { Icon } from "../ui/Icon";
import { ActionBar, IssueTable } from "../ui/IssueTable";
import { useNow, useStoreVersion } from "../ui/hooks";
import { Board, ParentHead } from "./Board";
import { canApplyAll } from "../core/transition";

type Step = "calendar" | "pick" | "board";

const STEPS: { key: Step; label: string; icon: string }[] = [
	{ key: "calendar", label: "Calendar", icon: "calendar" },
	{ key: "pick", label: "Pick", icon: "list-todo" },
	{ key: "board", label: "Board", icon: "layout-dashboard" },
];

/** サブの行（ADR-0150）。同じ親のサブは、親の小さい見出し（ID と短い題）の下にまとめる。主はサブの題 */
function SubLines(props: { ctx: TaskContext; subs: SubIssue[]; note?: (s: SubIssue) => string | null; actions: (s: SubIssue) => { label: string; run: () => void; primary?: boolean }[] }) {
	const { ctx, subs } = props;
	if (subs.length === 0) return null;
	const runs: { parent: string; subs: SubIssue[] }[] = [];
	for (const s of [...subs].sort((a, b) => a.parent.localeCompare(b.parent, "en", { numeric: true }) || a.order - b.order)) {
		const last = runs[runs.length - 1];
		if (last && last.parent === s.parent) last.subs.push(s);
		else runs.push({ parent: s.parent, subs: [s] });
	}
	return (
		<div class="vt-routine-rows vt-sub-rows">
			{runs.map((run) => (
				<div class="vt-lane-run" key={run.parent}>
					<ParentHead ctx={ctx} parentId={run.parent} />
					{run.subs.map((s) => {
						const note = props.note?.(s) ?? null;
						return (
							<div class="vt-routine-row" key={s.key}>
								<span class="vt-cell-summary" title={`${s.parent} › ${s.summary}`}>
									{s.summary}
								</span>
								{note && <span class="vt-muted vt-num">{note}</span>}
								<span class="vt-spacer" />
								{props.actions(s).map((a) => (
									<button class={`vt-button${a.primary ? "" : " is-text"}`} onClick={a.run}>
										{a.label}
									</button>
								))}
							</div>
						);
					})}
				</div>
			))}
		</div>
	);
}

/** 期限の表 1 つ（deadline か soft_deadline）。issue とサブ */
function DueSection(props: { ctx: TaskContext; target: RescheduleTarget; title: string; issues: Issue[]; subs: SubIssue[]; empty: string }) {
	const { ctx, target, issues } = props;
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const sel = issues.filter((i) => selected.has(i.id));
	const done = () => setSelected(new Set());
	const today = localToday();
	return (
		<section class="vt-card">
			<div class="vt-section-head">
				<span class="vt-field-label">{props.title}</span>
				<span class="vt-count">{issues.length + props.subs.length}</span>
			</div>
			<IssueTable ctx={ctx} issues={issues} selected={selected} onSelect={setSelected} columns={["status-detail", "soft_deadline", "deadline"]} empty={props.subs.length > 0 ? "" : props.empty} />
			{issues.length > 0 && (
				<ActionBar
					count={sel.length}
					actions={[
						{ label: "Add to today's board", icon: "calendar-check", tone: "primary", run: () => void addToBoard(ctx, today, sel.map((i) => i.id)).then(done) },
						{ label: target === "deadline" ? "Change Deadline" : "Change Soft Deadline", icon: "flag", run: () => void rescheduleIssues(ctx, sel, target).then(done) },
						{ label: "Tickler", icon: "alarm-clock", disabled: !canApplyAll(sel.map((i) => i.status), "tickler"), run: () => void ticklerIssues(ctx, sel).then(done) },
						// 守れない期限は結び直す: 日を変える・保留する（Someday）・やめる（Cancel。ADR-0189）
						{ label: "Someday", icon: "cloud", disabled: !canApplyAll(sel.map((i) => i.status), "someday"), run: () => void somedayIssues(ctx, sel).then(done) },
						{ label: "Cancel", icon: "x", disabled: !canApplyAll(sel.map((i) => i.status), "canceled"), run: () => void cancelIssues(ctx, sel).then(done) },
					]}
				/>
			)}
			<SubLines
				ctx={ctx}
				subs={props.subs}
				note={(s) => {
					const d = target === "deadline" ? s.deadline : s.softDeadline;
					return d ? formatShortDate(d) : null;
				}}
				actions={(s) => [{ label: "Add to today's board", primary: true, run: () => void addSubToBoard(ctx, today, s) }]}
			/>
		</section>
	);
}

/** Calendar の段階（ADR-0150）: 期限切れ・期限が近い・Missed（過ぎた Calendar の日）。issue とサブ */
function CalendarStep(props: { ctx: TaskContext; dead: DueLists; deadSub: SubDueLists; caution: DueLists; cautionSub: SubDueLists; missed: Issue[]; missedSub: SubIssue[] }) {
	const { ctx } = props;
	const total = (l: DueLists, s: SubDueLists) => l.deadline.length + l.softDeadline.length + s.deadline.length + s.softDeadline.length;
	if (total(props.dead, props.deadSub) + total(props.caution, props.cautionSub) + props.missed.length + props.missedSub.length === 0) {
		return <div class="vt-empty">Nothing overdue, due soon, or missed</div>;
	}
	return (
		<>
			{total(props.dead, props.deadSub) > 0 && (
				<>
					<h3 class="vt-h">Overdue</h3>
					<DueSection ctx={ctx} target="deadline" title="deadline" issues={props.dead.deadline} subs={props.deadSub.deadline} empty="Nothing is overdue" />
					<DueSection ctx={ctx} target="soft_deadline" title="soft_deadline" issues={props.dead.softDeadline} subs={props.deadSub.softDeadline} empty="Nothing is overdue" />
				</>
			)}
			{total(props.caution, props.cautionSub) > 0 && (
				<>
					<h3 class="vt-h">Due soon</h3>
					<DueSection ctx={ctx} target="deadline" title="deadline" issues={props.caution.deadline} subs={props.cautionSub.deadline} empty="No deadlines in the next 3 days" />
					<DueSection ctx={ctx} target="soft_deadline" title="soft_deadline" issues={props.caution.softDeadline} subs={props.cautionSub.softDeadline} empty="No deadlines in the next 3 days" />
				</>
			)}
			{props.missed.length + props.missedSub.length > 0 && <MissedSection ctx={ctx} issues={props.missed} subs={props.missedSub} />}
		</>
	);
}

/** Missed（ADR-0152）: その日にやるはずだった Calendar の日が過ぎて、片付いていないもの */
function MissedSection(props: { ctx: TaskContext; issues: Issue[]; subs: SubIssue[] }) {
	const { ctx, issues } = props;
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const sel = issues.filter((i) => selected.has(i.id));
	const done = () => setSelected(new Set());
	const today = localToday();
	return (
		<>
			<h3 class="vt-h">Missed</h3>
			<section class="vt-card">
				<div class="vt-section-head">
					<span class="vt-field-label">Calendar</span>
					<span class="vt-count">{issues.length + props.subs.length}</span>
				</div>
				<IssueTable ctx={ctx} issues={issues} selected={selected} onSelect={setSelected} columns={["calendar", "deadline", "estimated"]} empty="" />
				{issues.length > 0 && (
					<ActionBar
						count={sel.length}
						actions={[
							{ label: "Add to today's board", icon: "calendar-check", tone: "primary", run: () => void addToBoard(ctx, today, sel.map((i) => i.id)).then(done) },
							{ label: "Move date", icon: "calendar-clock", run: () => void rescheduleIssues(ctx, sel, "scheduled").then(done) },
							{ label: "Back to Next", icon: "list-todo", run: () => void backToNextIssues(ctx, sel).then(done) },
							{ label: "Close", icon: "check", disabled: !canApplyAll(sel.map((i) => i.status), "closed"), run: () => void closeIssues(ctx, sel).then(done) },
							{ label: "Cancel", icon: "x", disabled: !canApplyAll(sel.map((i) => i.status), "canceled"), run: () => void cancelIssues(ctx, sel).then(done) },
						]}
					/>
				)}
				<SubLines
					ctx={ctx}
					subs={props.subs}
					note={(s) => (s.scheduled ? formatShortDate(s.scheduled) : null)}
					actions={(s) => [
						{ label: "Add to today's board", primary: true, run: () => void addSubToBoard(ctx, today, s) },
						{
							label: "Move date",
							run: () =>
								void askDate(ctx, "Move date (must be done on this day)", today).then((d) => {
									if (d) void ctx.writer.updateSub(s.key, { scheduled: d }).catch((e) => ctx.report("日付を変えられませんでした", e));
								}),
						},
						{ label: "Back to Next", run: () => void ctx.writer.updateSub(s.key, { scheduled: null }).catch((e) => ctx.report("Next に戻せませんでした", e)) },
					]}
				/>
			</section>
		</>
	);
}

/** Pick（ADR-0150）: Next から今日やるものを選んでボードに載せる。サブは親の小さい見出しの下に並べる */
function PickStep(props: { ctx: TaskContext; issues: Issue[]; groups: { parent: Issue; subs: SubIssue[] }[] }) {
	const { ctx, issues } = props;
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const sel = issues.filter((i) => selected.has(i.id));
	const done = () => setSelected(new Set());
	const today = localToday();
	if (issues.length === 0 && props.groups.length === 0) return <div class="vt-empty">No next actions to pick</div>;
	return (
		<>
			{issues.length > 0 && (
				<section class="vt-card">
					<div class="vt-section-head">
						<span class="vt-field-label">Next actions</span>
						<span class="vt-count">{issues.length}</span>
					</div>
					<IssueTable ctx={ctx} issues={issues} selected={selected} onSelect={setSelected} columns={["labels", "estimated", "deadline", "reviewed"]} />
					<ActionBar
						count={sel.length}
						actions={[
							{ label: "Add to board", icon: "calendar-check", tone: "primary", run: () => void addToBoard(ctx, today, sel.map((i) => i.id)).then(done) },
							{ label: "Tickler", icon: "alarm-clock", disabled: !canApplyAll(sel.map((i) => i.status), "tickler"), run: () => void ticklerIssues(ctx, sel).then(done) },
							{ label: "Someday", icon: "cloud", disabled: !canApplyAll(sel.map((i) => i.status), "someday"), run: () => void somedayIssues(ctx, sel).then(done) },
							{ label: "Cancel", icon: "x", disabled: !canApplyAll(sel.map((i) => i.status), "canceled"), run: () => void cancelIssues(ctx, sel).then(done) },
						]}
					/>
				</section>
			)}
			{props.groups.length > 0 && (
				<section class="vt-card">
					<div class="vt-section-head">
						<span class="vt-field-label">Sub-issues</span>
						<span class="vt-count">{props.groups.reduce((n, g) => n + g.subs.length, 0)}</span>
					</div>
					<SubLines ctx={ctx} subs={props.groups.flatMap((g) => g.subs)} actions={(s) => [{ label: "Add to board", primary: true, run: () => void addSubToBoard(ctx, today, s) }]} />
				</section>
			)}
		</>
	);
}

/**
 * DailyTaskView（ADR-0009, 0150）。Calendar → Previous boards → Pick → Board の順に、件数のある段階を通る。
 * どの段階も Next で飛ばせ、上の段階表示からいつでも移れる。
 * 今日が Calendar の日の issue とサブは、開いているあいだ自動でボードに載せる（ADR-0034, 0152）
 */
export function DailyView(props: { ctx: TaskContext }) {
	const { ctx } = props;
	useStoreVersion(ctx.store);
	const now = useNow(60_000);
	const today = localToday(new Date(now));
	const index = ctx.store.index;
	const issues = [...index.issues.values()];
	const dead = deadIssues(issues, today);
	const deadSub = deadSubs(index, today);
	const caution = cautionIssues(issues, today);
	const cautionSub = cautionSubs(index, today);
	const missed = missedIssues(issues, today);
	const missedSub = missedSubs(index, today);
	const todayBoard = index.board(today)?.board ?? emptyBoard();
	const pick = pickCandidates(index, today, todayBoard);
	const toAdd = index.toAutoAdd(today);
	const todayLeft = unfinished(index, today, todayBoard);
	const lists = (l: DueLists, s: SubDueLists) => l.deadline.length + l.softDeadline.length + s.deadline.length + s.softDeadline.length;

	const counts: Record<Step, number> = {
		calendar: lists(dead, deadSub) + lists(caution, cautionSub) + missed.length + missedSub.length,
		pick: pick.issues.length + pick.groups.reduce((n, g) => n + g.subs.length, 0),
		board: unfinishedCount(todayLeft),
	};

	// 「Next」で通り過ぎた段階と、手で選んだ段階（ADR-0150。段階ごとの特例はない）
	const [passed, setPassed] = useState<Set<Step>>(new Set());
	const [manual, setManual] = useState<Step | null>(null);
	const step = currentStep(
		STEPS.map((s) => s.key),
		counts,
		passed,
		manual,
	);

	// 今日が Calendar の日で、まだ載っておらず、今日外してもいない issue とサブをボードに載せる（ADR-0034, 0137, 0152）
	const adding = useRef(new Set<string>());
	useEffect(() => {
		const ids = toAdd.filter((id) => !adding.current.has(`${today}/${id}`));
		if (ids.length === 0) return;
		for (const id of ids) adding.current.add(`${today}/${id}`);
		void addToBoard(ctx, today, ids).finally(() => {
			for (const id of ids) adding.current.delete(`${today}/${id}`);
		});
	});

	// 未完了がなくなった過去のボードは締めて要約を書く
	const closing = useRef(new Set<string>());
	useEffect(() => {
		for (const b of index.data.boards) {
			if (b.date >= today || b.board.closed || closing.current.has(b.date)) continue;
			if (unfinishedCount(unfinished(index, b.date, b.board)) > 0) continue;
			closing.current.add(b.date);
			void ctx.writer
				.closeBoard(b.date, ctx.settings.deviceName)
				.catch((e) => ctx.report("前回のボードを締められませんでした", e))
				.finally(() => closing.current.delete(b.date));
		}
	});

	const next = () => {
		setPassed(new Set([...passed, step]));
		setManual(null);
	};

	return (
		<div class="vt-page">
			<header class="vt-page-head">
				<h2 class="vt-page-title">Today · {formatShortDate(today)}</h2>
			</header>
			<nav class="vt-stepper" aria-label="Steps">
				{stepperItems(STEPS, step, counts, passed).map((s, i) => (
					<Fragment key={s.key}>
						{i > 0 && <span class="vt-step-line" aria-hidden="true" />}
						<button
							class={`vt-step is-${s.state}${s.compact ? " is-compact" : ""}`}
							aria-current={s.state === "current" ? "step" : undefined}
							aria-label={s.compact ? s.title : undefined}
							title={s.compact ? s.title : undefined}
							onClick={() => setManual(s.key)}
						>
							<span class="vt-step-icon">{s.state === "done" ? <Icon name="check" /> : s.number}</span>
							{!s.compact && <span class="vt-step-label">{s.label}</span>}
							{s.count > 0 && (s.compact ? <span class="vt-step-dot" /> : <span class="vt-step-count">{s.count}</span>)}
						</button>
					</Fragment>
				))}
			</nav>

			{step === "calendar" && <CalendarStep ctx={ctx} dead={dead} deadSub={deadSub} caution={caution} cautionSub={cautionSub} missed={missed} missedSub={missedSub} />}
			{step === "pick" && <PickStep ctx={ctx} issues={pick.issues} groups={pick.groups} />}
			{step === "board" && <Board ctx={ctx} index={index} date={today} board={todayBoard} />}

			{step !== "board" && (
				<div class="vt-page-foot">
					<span />
					<button class="vt-button is-primary" onClick={next}>
						Next <Icon name="arrow-right" />
					</button>
				</div>
			)}
		</div>
	);
}
