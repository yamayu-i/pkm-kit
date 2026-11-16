import type { ComponentChild } from "preact";
import { useState } from "preact/hooks";
import { addDays, formatShortDate, localDateTime, localToday, WEEKDAY_NAMES, weekdayOf, type LocalDate } from "../core/dates";
import { dueLevel } from "../core/due";
import { formatMinutes } from "../core/format";
import type { TaskIndex } from "../core/index";
import type { Issue } from "../core/schema";
import { scheduledPatch, ticklerFieldPatch } from "../core/actions";
import type { TaskContext } from "../obsidian/context";
import { editLabels, editStatusDetail, estimateMenu, pickMember, priorityMenu } from "../obsidian/issue-editors";
import { PreactModal } from "../obsidian/modals";
import { PickTimer } from "../obsidian/pick-toggle";
import type { FieldValue } from "../obsidian/writer";
import { IdBadge, LabelBadge, PriorityBadge, StatusBadge } from "../ui/badges";
import { DateForm, DayCell, WorklogForm } from "../ui/forms";
import { Icon } from "../ui/Icon";
import type { WorklogEntry } from "../core/worklog";
import { useNow, useStoreVersion } from "../ui/hooks";
import { SubIssues } from "./SubIssues";
import { Pager } from "../ui/Pager";
import { showStatusMenu, StatusStepButton } from "../obsidian/status-change";

const WORKLOG_PAGE = 5;

export function formatDateTime(value: string | number | null): string {
	if (value === null) return "—";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return "—";
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** issue 画面のヘッダー（ADR-0012）。ページの一番上に差し込む（ADR-0077） */
export function IssueHeader(props: { ctx: TaskContext; path: string }) {
	const { ctx, path } = props;
	useStoreVersion(ctx.store);
	const now = useNow();
	const index = ctx.store.index;
	const issue = index.issuesByPath.get(path);
	if (!issue) {
		return <div class="vt-header-missing">issue の frontmatter を読めません（type / id / status を確認してください）</div>;
	}
	const save = (fields: Record<string, FieldValue>, target = path) =>
		void ctx.writer.update(target, fields).catch((e) => ctx.report("保存できませんでした", e));
	return (
		<div class="vt-issue">
			<div class="vt-meta">
				<span>created {formatDateTime(issue.created)}</span>
				<span>updated {formatDateTime(ctx.store.mtime(path))}</span>
			</div>
			<SummaryField badge={<IdBadge issue={issue} />} summary={issue.summary} save={save} />
			<section class="vt-card">
				<div class="vt-row vt-halves">
					<StatusField ctx={ctx} issue={issue} index={index} save={save} />
				</div>
				<div class="vt-row vt-chips">
					<PriorityBadge priority={issue.priority} onClick={(e) => priorityMenu(e, issue.priority, save)} />
					<LabelsField ctx={ctx} labels={issue.labels} index={index} save={save} />
				</div>
			</section>
			<section class="vt-card">
				<div class="vt-row vt-schedule">
					<ScheduleStrip ctx={ctx} issue={issue} save={save} />
					<DueFields ctx={ctx} issue={issue} save={save} />
				</div>
			</section>
			<SubIssues ctx={ctx} issue={issue} index={index} now={now} />
			<Effort ctx={ctx} issue={issue} index={index} save={save} />
			<hr class="vt-sep" />
			<Worklog ctx={ctx} taskId={issue.id} index={index} />
			<hr class="vt-sep" />
		</div>
	);
}

type Save = (fields: Record<string, FieldValue>, target?: string) => void;

/** ID と summary。summary はクリックで編集する（issue と routine で共通） */
export function SummaryField(props: { badge: ComponentChild; summary: string; save: Save }) {
	const { summary, save } = props;
	const [editing, setEditing] = useState(false);
	const commit = (value: string) => {
		setEditing(false);
		if (value.trim() && value.trim() !== summary) save({ summary: value.trim() });
	};
	return (
		<div class="vt-title">
			{props.badge}
			{editing ? (
				<input
					class="vt-summary-input"
					value={summary}
					ref={(el) => el?.focus()}
					onBlur={(e) => commit(e.currentTarget.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.isComposing) commit(e.currentTarget.value);
						if (e.key === "Escape") setEditing(false);
					}}
				/>
			) : (
				<span class="vt-summary" onClick={() => setEditing(true)} title="Click to edit">
					{summary || "(no summary)"}
					<Icon name="pencil" class="vt-hover-icon" />
				</span>
			)}
		</div>
	);
}

function StatusField(props: { ctx: TaskContext; issue: Issue; index: TaskIndex; save: Save }) {
	const { ctx, issue, index, save } = props;
	// メニューは遷移表の先だけ。付随の変更も表で決まる（ADR-0183）
	const menu = (e: MouseEvent) => showStatusMenu(ctx, e, issue.id);
	const editDetail = () => editStatusDetail(ctx, issue.statusDetail, save);
	const editRevisit = () =>
		new PreactModal(ctx.app, "revisit (shows up in Organize after this date)", (close) => (
			<DateForm
				initial={issue.revisit}
				onSubmit={(v) => {
					close();
					save({ revisit: v });
				}}
			/>
		)).open();
	const member = issue.delegatedTo === null ? null : index.members.get(issue.delegatedTo);
	return (
		<>
			<StatusBadge status={issue.status} wide onClick={menu} />
			<StatusStepButton ctx={ctx} keyOf={issue.id} />
			<div class="vt-status-detail">
				{issue.status === "delegated" && (
					<button class="vt-field-chip" onClick={() => pickMember(ctx, (id) => save({ delegated_to: id }))}>
						<Icon name="user" />
						{member ? member.nickname : issue.delegatedTo ?? "Choose delegate"}
					</button>
				)}
				{issue.status === "open" && (
					// 整理したか（ADR-0148）。open のときだけ Inbox に関わるので、そのときだけ出す
					<button
						class={`vt-field-chip${issue.clarified ? "" : " is-placeholder"}`}
						aria-pressed={issue.clarified}
						title={issue.clarified ? "Clarified. Click to return to Inbox" : "In Inbox (not clarified). Click to mark as clarified"}
						onClick={() => save({ clarified: issue.clarified ? null : true })}
					>
						<Icon name={issue.clarified ? "list-todo" : "inbox"} />
						{issue.clarified ? "Clarified" : "Inbox"}
					</button>
				)}
				{issue.status === "someday" && (
					<button class="vt-field-chip" onClick={editRevisit}>
						<Icon name="calendar-clock" />
						revisit {issue.revisit ? formatShortDate(issue.revisit) : "—"}
					</button>
				)}
				<button class={`vt-field-chip${issue.statusDetail ? "" : " is-placeholder"}`} onClick={editDetail}>
					<Icon name="pencil" />
					{issue.statusDetail || "Add detail"}
				</button>
			</div>
		</>
	);
}

export function LabelsField(props: { ctx: TaskContext; labels: string[]; index: TaskIndex; save: Save }) {
	const { ctx, labels, index, save } = props;
	const colors = new Map(index.data.labels.map((l) => [l.name, l.color]));
	return (
		<button class="vt-labels" onClick={() => editLabels(ctx, labels, save)} title="Edit labels">
			{labels.map((name) => (
				<LabelBadge name={name} color={colors.get(name) ?? "var(--background-modifier-border)"} />
			))}
			<span class="vt-badge vt-label is-empty">
				<Icon name={labels.length === 0 ? "tag" : "pencil"} />
				{labels.length === 0 ? "label" : ""}
			</span>
		</button>
	);
}

/**
 * Calendar（scheduled。その日にやらなければならない日 1 つ）と Tickler（この日に Inbox に戻す）。ADR-0152。
 * 7 日のセルで Calendar の日を選ぶ（同じ日をもう一度押すと消す）。先の日はカレンダーから選ぶ
 */
function ScheduleStrip(props: { ctx: TaskContext; issue: Issue; save: Save }) {
	const { ctx, issue, save } = props;
	const today = localToday();
	const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
	const setCalendar = (d: LocalDate | null) => save(scheduledPatch(issue, d));
	const pick = (title: string, initial: LocalDate | null, onPick: (d: LocalDate | null) => void) => () =>
		new PreactModal(ctx.app, title, (close) => (
			<DateForm
				initial={initial}
				onSubmit={(v) => {
					close();
					onPick(v);
				}}
			/>
		)).open();
	const later = issue.scheduled !== null && issue.scheduled > days[6]!;
	return (
		<div class="vt-strip">
			<div class="vt-strip-days">
				{days.map((d) => (
					<div class="vt-strip-col">
						<span class="vt-weekday">{WEEKDAY_NAMES[weekdayOf(d)]}</span>
						<DayCell date={d} scheduled={issue.scheduled === d} softDeadline={issue.softDeadline} deadline={issue.deadline} today={today} onClick={() => setCalendar(issue.scheduled === d ? null : d)} />
					</div>
				))}
			</div>
			<div class="vt-row">
				<button class="vt-text-button" onClick={pick("Calendar (must be done on this day)", issue.scheduled, setCalendar)}>
					calendar &gt;{issue.scheduled !== null && (later || issue.scheduled < today) ? ` (${formatShortDate(issue.scheduled)})` : ""}
				</button>
				<button
					class={`vt-field-chip${issue.tickler ? "" : " is-placeholder"}`}
					title="Tickler: hidden until this date, then back to Inbox"
					onClick={pick("Tickler (back to Inbox on this date)", issue.tickler ?? addDays(today, 1), (d) => save(ticklerFieldPatch(issue, d)))}
				>
					<Icon name="alarm-clock" />
					tickler {issue.tickler ? formatShortDate(issue.tickler) : "—"}
				</button>
			</div>
		</div>
	);
}

function DueFields(props: { ctx: TaskContext; issue: Issue; save: Save }) {
	const { ctx, issue, save } = props;
	const today = localToday();
	const edit = (key: "soft_deadline" | "deadline", current: LocalDate | null) => () =>
		new PreactModal(ctx.app, key, (close) => (
			<DateForm
				initial={current}
				onSubmit={(v) => {
					close();
					save({ [key]: v });
				}}
			/>
		)).open();
	const row = (label: string, key: "soft_deadline" | "deadline", value: LocalDate | null) => (
		<button class={`vt-due vt-due-${dueLevel(issue, value, today)}`} onClick={edit(key, value)}>
			<span class="vt-due-label">{label}</span>
			<span class="vt-due-value">{value ? formatShortDate(value) : "Not set"}</span>
			<Icon name="calendar" class="vt-trailing" />
		</button>
	);
	return (
		<div class="vt-dues">
			{row("soft_deadline", "soft_deadline", issue.softDeadline)}
			{row("deadline", "deadline", issue.deadline)}
		</div>
	);
}

function Effort(props: { ctx: TaskContext; issue: Issue; index: TaskIndex; save: Save }) {
	const { ctx, issue, index, save } = props;
	const actual = index.effortMinutes(Date.now()).get(issue.id) ?? 0;
	const menu = (e: MouseEvent) => estimateMenu(ctx, e, issue.estimated, save);
	return (
		<div class="vt-effort">
			<button class="vt-effort-cell is-editable" onClick={menu}>
				<span class="vt-field-label">
					estimated
					<Icon name="chevron-down" class="vt-trailing" />
				</span>
				<span class="vt-effort-value">{issue.estimated === null ? "—" : formatMinutes(issue.estimated)}</span>
			</button>
			<div class="vt-effort-cell is-readonly" title="Calculated from the worklog">
				<span class="vt-field-label">actual</span>
				<span class="vt-effort-value">{formatMinutes(actual)}</span>
			</div>
			<div class="vt-effort-cell is-readonly" title="estimated − actual">
				<span class="vt-field-label">remained</span>
				<span class="vt-effort-value">{issue.estimated === null ? "—" : formatMinutes(issue.estimated - actual)}</span>
			</div>
		</div>
	);
}

function formatTime(ms: number): string {
	return formatDateTime(ms).slice(11);
}

function WorklogItem(props: { ctx: TaskContext; log: WorklogEntry }) {
	const { ctx, log } = props;
	const date = formatDateTime(log.fromMs).slice(0, 10);
	const running = log.toMs === null;
	// サブで記録した行は、どのサブかを出す（ADR-0135。消したサブは Deleted sub-issue）
	const sub = log.sub ? (ctx.store.index.sub(`${log.taskId}#${log.sub}`) ?? { summary: "Deleted sub-issue" }) : null;
	const edit = () =>
		new PreactModal(ctx.app, "Edit worklog", (close) => (
			<WorklogForm
				initial={{ fromMs: log.fromMs, toMs: log.toMs, description: log.description }}
				onSubmit={(d) => {
					close();
					void ctx.writer
						.updateWorklog(log, {
							from: localDateTime(new Date(d.fromMs)),
							to: d.toMs === null ? null : localDateTime(new Date(d.toMs)),
							description: d.description,
						})
						.catch((e) => ctx.report("worklog を保存できませんでした", e));
				}}
				onDelete={() => {
					close();
					void ctx.writer.updateWorklog(log, null).catch((e) => ctx.report("worklog を削除できませんでした", e));
				}}
			/>
		)).open();
	return (
		<button class={`vt-log${running ? " is-running" : ""}`} onClick={edit} title="Click to edit">
			<span class="vt-log-date">
				<span class="vt-log-day">{date.slice(5).replace("-", "/")}</span>
				<span class="vt-log-weekday">{WEEKDAY_NAMES[weekdayOf(date)]}</span>
			</span>
			<span class="vt-log-main">
				<span class="vt-log-time vt-num">
					{formatTime(log.fromMs)} – {running ? "running" : formatTime(log.toMs!)}
				</span>
				{sub && <span class="vt-log-sub">{sub.summary}</span>}
				<span class={`vt-log-desc${log.description ? "" : " is-placeholder"}`}>{log.description || "No description"}</span>
			</span>
			<span class="vt-log-duration vt-num">
				{running && <span class="vt-live-dot" />}
				{formatMinutes(((log.toMs ?? Date.now()) - log.fromMs) / 60_000)}
			</span>
			<Icon name="pencil" class="vt-log-edit" />
		</button>
	);
}

/** worklog の一覧と追加（issue と routine で共通） */
export function Worklog(props: { ctx: TaskContext; taskId: string; index: TaskIndex }) {
	const { ctx, taskId } = props;
	const [page, setPage] = useState(0);
	const add = () => {
		const now = Date.now();
		new PreactModal(ctx.app, "Add worklog", (close) => (
			<WorklogForm
				initial={{ fromMs: now - 3_600_000, toMs: now, description: "" }}
				onSubmit={(d) => {
					close();
					const from = new Date(d.fromMs);
					void ctx.writer
						.addWorklog(taskId, ctx.settings.deviceName, { from: localDateTime(from), to: d.toMs === null ? null : localDateTime(new Date(d.toMs)), description: d.description }, from)
						.catch((e) => ctx.report("worklog を追加できませんでした", e));
				}}
			/>
		)).open();
	};
	const logs = props.index.data.worklogs.filter((l) => l.taskId === taskId).sort((a, b) => b.fromMs - a.fromMs);
	const pages = Math.max(1, Math.ceil(logs.length / WORKLOG_PAGE));
	const current = Math.min(page, pages - 1);
	const shown = logs.slice(current * WORKLOG_PAGE, (current + 1) * WORKLOG_PAGE);
	return (
		<section class="vt-worklog">
			<div class="vt-section-head">
				<span class="vt-field-label">worklog</span>
				{props.index.issues.has(taskId) && <PickTimer ctx={ctx} keyOf={taskId} />}
				{logs.length > 0 && <span class="vt-count">{logs.length}</span>}
				<span class="vt-spacer" />
				<button class="vt-text-button" onClick={add}>
					<Icon name="plus" /> Add
				</button>
			</div>
			{logs.length === 0 && <div class="vt-empty">No worklog yet</div>}
			<div class="vt-log-list">
				{shown.map((l) => (
					<WorklogItem ctx={props.ctx} log={l} key={l.id} />
				))}
			</div>
			{pages > 1 && <Pager current={current} pages={pages} onChange={setPage} />}
		</section>
	);
}
