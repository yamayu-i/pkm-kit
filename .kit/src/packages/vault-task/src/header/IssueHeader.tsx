import { Keymap, Menu } from "obsidian";
import type { ComponentChild } from "preact";
import { useState } from "preact/hooks";
import { addDays, formatShortDate, localDateTime, localToday, WEEKDAY_NAMES, weekdayOf, type LocalDate } from "../core/dates";
import { dueLevel } from "../core/due";
import { formatMinutes } from "../core/format";
import { isActive, type TaskIndex } from "../core/index";
import { STATUSES, type Issue, type Status } from "../core/schema";
import type { TaskContext } from "../obsidian/context";
import { editLabels, editStatusDetail, estimateMenu, pickMember, priorityMenu } from "../obsidian/issue-editors";
import { IssueSuggestModal, PreactModal } from "../obsidian/modals";
import type { FieldValue } from "../obsidian/writer";
import { IdBadge, LabelBadge, PriorityBadge, StatusBadge } from "../ui/badges";
import { CalendarForm, DateForm, DayCell, TextForm, WorklogForm } from "../ui/forms";
import { Icon } from "../ui/Icon";
import type { WorklogEntry } from "../core/worklog";
import { useStoreVersion } from "../ui/hooks";
import { Pager } from "../ui/Pager";
import { linkProps } from "../ui/a11y";

const WORKLOG_PAGE = 5;

export function formatDateTime(value: string | number | null): string {
	if (value === null) return "—";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return "—";
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 親の候補: 循環しないもの。閉じたものは後ろ（ADR-0012） */
function sortCandidates(issues: Issue[]): Issue[] {
	return [...issues].sort((a, b) => Number(!isActive(a)) - Number(!isActive(b)) || a.id.localeCompare(b.id, "en", { numeric: true }));
}

/** issue 画面のヘッダー（ADR-0012）。md の先頭に CodeMirror の widget として差し込む */
export function IssueHeader(props: { ctx: TaskContext; path: string }) {
	const { ctx, path } = props;
	useStoreVersion(ctx.store);
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
			<section class="vt-card">
				<Relations ctx={ctx} issue={issue} index={index} save={save} />
			</section>
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
				<span class="vt-summary" onClick={() => setEditing(true)} title="クリックで編集">
					{summary || "（summary なし）"}
					<Icon name="pencil" class="vt-hover-icon" />
				</span>
			)}
		</div>
	);
}

function StatusField(props: { ctx: TaskContext; issue: Issue; index: TaskIndex; save: Save }) {
	const { ctx, issue, index, save } = props;
	const change = (next: Status) => {
		if (next === issue.status) return;
		if (next === "delegated") {
			pickMember(ctx, (id) => save({ status: next, delegated_to: id }));
			return;
		}
		const fields: Record<string, FieldValue> = { status: next, delegated_to: null };
		// someday にするときは予定と期限を外す。someday 以外では revisit は使わない（ADR-0006）
		if (next === "someday") Object.assign(fields, { scheduled: null, soft_deadline: null, deadline: null });
		else fields.revisit = null;
		save(fields);
	};
	const menu = (e: MouseEvent) => {
		const m = new Menu();
		for (const s of STATUSES) m.addItem((item) => item.setTitle(s).setChecked(s === issue.status).onClick(() => change(s)));
		m.showAtMouseEvent(e);
	};
	const editDetail = () => editStatusDetail(ctx, issue.statusDetail, save);
	const editRevisit = () =>
		new PreactModal(ctx.app, "revisit（この日を過ぎたら Organize に出す）", (close) => (
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
			<div class="vt-status-detail">
				{issue.status === "delegated" && (
					<button class="vt-field-chip" onClick={() => pickMember(ctx, (id) => save({ delegated_to: id }))}>
						<Icon name="user" />
						{member ? member.name : issue.delegatedTo ?? "委任先を選ぶ"}
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
					{issue.statusDetail || "詳細を追加"}
				</button>
			</div>
		</>
	);
}

export function LabelsField(props: { ctx: TaskContext; labels: string[]; index: TaskIndex; save: Save }) {
	const { ctx, labels, index, save } = props;
	const colors = new Map(index.data.labels.map((l) => [l.name, l.color]));
	return (
		<button class="vt-labels" onClick={() => editLabels(ctx, labels, save)} title="label を編集">
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

function ScheduleStrip(props: { ctx: TaskContext; issue: Issue; save: Save }) {
	const { ctx, issue, save } = props;
	const today = localToday();
	const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
	const scheduled = new Set(issue.scheduled);
	const toggle = (d: LocalDate) => {
		const next = new Set(scheduled);
		if (next.has(d)) next.delete(d);
		else next.add(d);
		save({ scheduled: [...next].sort() });
	};
	const openCalendar = () =>
		new PreactModal(ctx.app, "実行日", (close) => (
			<CalendarForm
				initial={issue.scheduled}
				softDeadline={issue.softDeadline}
				deadline={issue.deadline}
				onSubmit={(dates) => {
					close();
					save({ scheduled: dates });
				}}
			/>
		)).open();
	const later = issue.scheduled.filter((d) => d > days[6]!).length;
	return (
		<div class="vt-strip">
			<div class="vt-strip-days">
				{days.map((d) => (
					<div class="vt-strip-col">
						<span class="vt-weekday">{WEEKDAY_NAMES[weekdayOf(d)]}</span>
						<DayCell date={d} scheduled={scheduled.has(d)} softDeadline={issue.softDeadline} deadline={issue.deadline} today={today} onClick={() => toggle(d)} />
					</div>
				))}
			</div>
			<button class="vt-text-button" onClick={openCalendar}>
				calendar &gt;{later > 0 ? `（ほか ${later} 日）` : ""}
			</button>
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
			<span class="vt-due-value">{value ? formatShortDate(value) : "未設定"}</span>
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

function IssueLink(props: { ctx: TaskContext; issue: Issue; onRemove?: () => void }) {
	return (
		<span class="vt-relation">
			<IdBadge issue={props.issue} />
			<span class="vt-link" {...linkProps((e) => void props.ctx.openPath(props.issue.path, Keymap.isModEvent(e) !== false))}>
				{props.issue.summary}
			</span>
			{props.onRemove && (
				<button class="vt-icon-button" aria-label="外す" title="外す" onClick={props.onRemove}>
					<Icon name="x" />
				</button>
			)}
		</span>
	);
}

function Relations(props: { ctx: TaskContext; issue: Issue; index: TaskIndex; save: Save }) {
	const { ctx, issue, index, save } = props;
	const parent = issue.parent === null ? null : index.issues.get(issue.parent);
	const children = index.children(issue.id);
	const pickParent = () => {
		const candidates = sortCandidates([...index.issues.values()].filter((c) => index.canSetParent(issue.id, c.id)));
		new IssueSuggestModal(ctx.app, candidates, (p) => save({ parent: p.id }), "親にする issue を検索").open();
	};
	const addChild = (e: MouseEvent) => {
		const m = new Menu();
		m.addItem((item) =>
			item.setTitle("既存の issue を子にする").onClick(() => {
				const candidates = sortCandidates([...index.issues.values()].filter((c) => c.parent !== issue.id && index.canSetParent(c.id, issue.id)));
				new IssueSuggestModal(ctx.app, candidates, (c) => save({ parent: issue.id }, c.path), "子にする issue を検索").open();
			}),
		);
		m.addItem((item) =>
			item.setTitle("新しく作る").onClick(() =>
				new PreactModal(ctx.app, "子 issue の summary", (close) => (
					<TextForm
						initial=""
						onSubmit={(summary) => {
							close();
							if (!summary) return;
							void ctx.writer
								.createIssues([summary], issue.id)
								.then((r) => r.failed.length > 0 && ctx.report("子 issue を作れませんでした"))
								.catch((err) => ctx.report("子 issue を作れませんでした", err));
						}}
					/>
				)).open(),
			),
		);
		m.showAtMouseEvent(e);
	};
	return (
		<div class="vt-row vt-halves vt-small vt-relations">
			<div class="vt-relation-col">
				<div class="vt-field-label">
					Parent
					<button class="vt-icon-button" aria-label="親を選ぶ" title="親を選ぶ" onClick={pickParent}>
						<Icon name="pencil" />
					</button>
				</div>
				{parent ? (
					<IssueLink ctx={ctx} issue={parent} onRemove={() => save({ parent: null })} />
				) : issue.parent !== null ? (
					<span class="vt-muted">{issue.parent}（見つかりません）</span>
				) : (
					<span class="vt-muted">—</span>
				)}
			</div>
			<div class="vt-relation-col">
				<div class="vt-field-label">
					Children
					<button class="vt-icon-button" aria-label="子を追加" title="子を追加" onClick={addChild}>
						<Icon name="plus" />
					</button>
				</div>
				<div class="vt-wrap">
					{children.length === 0 && <span class="vt-muted">—</span>}
					{children.map((c) => (
						<IssueLink ctx={ctx} issue={c} onRemove={() => save({ parent: null }, c.path)} />
					))}
				</div>
			</div>
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
			<div class="vt-effort-cell is-readonly" title="worklog から自動で計算">
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
	const edit = () =>
		new PreactModal(ctx.app, "worklog を編集", (close) => (
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
		<button class={`vt-log${running ? " is-running" : ""}`} onClick={edit} title="クリックで編集">
			<span class="vt-log-date">
				<span class="vt-log-day">{date.slice(5).replace("-", "/")}</span>
				<span class="vt-log-weekday">{WEEKDAY_NAMES[weekdayOf(date)]}</span>
			</span>
			<span class="vt-log-main">
				<span class="vt-log-time vt-num">
					{formatTime(log.fromMs)} – {running ? "記録中" : formatTime(log.toMs!)}
				</span>
				<span class={`vt-log-desc${log.description ? "" : " is-placeholder"}`}>{log.description || "内容なし"}</span>
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
		new PreactModal(ctx.app, "worklog を追加", (close) => (
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
				{logs.length > 0 && <span class="vt-count">{logs.length} 件</span>}
				<span class="vt-spacer" />
				<button class="vt-text-button" onClick={add}>
					<Icon name="plus" /> 追加
				</button>
			</div>
			{logs.length === 0 && <div class="vt-empty">まだ記録がありません</div>}
			<div class="vt-log-list">
				{shown.map((l) => (
					<WorklogItem ctx={props.ctx} log={l} key={l.id} />
				))}
			</div>
			{pages > 1 && <Pager current={current} pages={pages} onChange={setPage} />}
		</section>
	);
}
