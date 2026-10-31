import { Keymap, Menu } from "obsidian";
import { useState } from "preact/hooks";
import { addDays, formatShortDate, localToday, WEEKDAY_NAMES, weekdayOf, type LocalDate } from "../core/dates";
import { dueLevel } from "../core/due";
import { formatMinutes, parseDaysInput } from "../core/format";
import { isActive, type TaskIndex } from "../core/index";
import { PRIORITIES, STATUSES, STATUS_DETAIL_MAX, type Issue, type Status } from "../core/schema";
import type { TaskContext } from "../obsidian/context";
import { IssueSuggestModal, MemberSuggestModal, PreactModal } from "../obsidian/modals";
import type { FieldValue } from "../obsidian/writer";
import { IdBadge, LabelBadge, PriorityBadge, StatusBadge } from "../ui/badges";
import { CalendarForm, DateForm, DayCell, TextForm } from "../ui/forms";
import { useStoreVersion } from "../ui/hooks";
import { LabelForm } from "../ui/LabelForm";

const ESTIMATE_PRESETS = [15, 30, 60, 120, 300, 480];
const WORKLOG_PAGE = 5;

function formatDateTime(value: string | number | null): string {
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
			<Title issue={issue} save={save} />
			<div class="vt-row vt-halves">
				<StatusField ctx={ctx} issue={issue} index={index} save={save} />
			</div>
			<div class="vt-row">
				<PriorityField issue={issue} save={save} />
				<LabelsField ctx={ctx} issue={issue} index={index} save={save} />
			</div>
			<div class="vt-row">
				<ScheduleStrip ctx={ctx} issue={issue} save={save} />
				<DueFields ctx={ctx} issue={issue} save={save} />
			</div>
			<Relations ctx={ctx} issue={issue} index={index} save={save} />
			<Effort ctx={ctx} issue={issue} index={index} save={save} />
			<hr class="vt-sep" />
			<Worklog issue={issue} index={index} />
			<hr class="vt-sep" />
		</div>
	);
}

type Save = (fields: Record<string, FieldValue>, target?: string) => void;

function Title(props: { issue: Issue; save: Save }) {
	const { issue, save } = props;
	const [editing, setEditing] = useState(false);
	const commit = (value: string) => {
		setEditing(false);
		if (value.trim() && value.trim() !== issue.summary) save({ summary: value.trim() });
	};
	return (
		<div class="vt-title">
			<IdBadge issue={issue} />
			{editing ? (
				<input
					class="vt-summary-input"
					value={issue.summary}
					ref={(el) => el?.focus()}
					onBlur={(e) => commit(e.currentTarget.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.isComposing) commit(e.currentTarget.value);
						if (e.key === "Escape") setEditing(false);
					}}
				/>
			) : (
				<span class="vt-summary" onClick={() => setEditing(true)}>
					{issue.summary || "（summary なし）"}
				</span>
			)}
		</div>
	);
}

function pickMember(ctx: TaskContext, index: TaskIndex, onPick: (id: string) => void): void {
	new MemberSuggestModal(ctx.app, [...index.members.values()], (choice) => {
		if (choice.kind === "member") onPick(choice.member.id);
		else
			void ctx.writer
				.createMember(choice.name)
				.then(onPick)
				.catch((e) => ctx.report("委任先を作れませんでした", e));
	}).open();
}

function StatusField(props: { ctx: TaskContext; issue: Issue; index: TaskIndex; save: Save }) {
	const { ctx, issue, index, save } = props;
	const change = (next: Status) => {
		if (next === issue.status) return;
		if (next === "delegated") {
			pickMember(ctx, index, (id) => save({ status: next, delegated_to: id }));
			return;
		}
		const fields: Record<string, FieldValue> = { status: next, delegated_to: null };
		// someday にするときは予定と期限を外す。someday 以外では revisit は使わない（ADR-0006）
		if (next === "someday") Object.assign(fields, { scheduled: null, mid_due: null, deadline: null });
		else fields.revisit = null;
		save(fields);
	};
	const menu = (e: MouseEvent) => {
		const m = new Menu();
		for (const s of STATUSES) m.addItem((item) => item.setTitle(s).setChecked(s === issue.status).onClick(() => change(s)));
		m.showAtMouseEvent(e);
	};
	const editDetail = () =>
		new PreactModal(ctx.app, "status-detail", (close) => (
			<TextForm
				initial={issue.statusDetail}
				maxLength={STATUS_DETAIL_MAX}
				placeholder="例: 返事待ち"
				onSubmit={(v) => {
					close();
					save({ "status-detail": v });
				}}
			/>
		)).open();
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
					<span class="vt-link" onClick={() => pickMember(ctx, index, (id) => save({ delegated_to: id }))}>
						→ {member ? member.name : issue.delegatedTo ?? "委任先を選ぶ"}
					</span>
				)}
				{issue.status === "someday" && (
					<span class="vt-link" onClick={editRevisit}>
						revisit {issue.revisit ? formatShortDate(issue.revisit) : "—"}
					</span>
				)}
				<span class="vt-link" onClick={editDetail}>
					{issue.statusDetail || "（詳細）"}
				</span>
			</div>
		</>
	);
}

function PriorityField(props: { issue: Issue; save: Save }) {
	const menu = (e: MouseEvent) => {
		const m = new Menu();
		for (const p of PRIORITIES) m.addItem((item) => item.setTitle(p).setChecked(p === props.issue.priority).onClick(() => props.save({ priority: p })));
		m.addItem((item) => item.setTitle("なし").onClick(() => props.save({ priority: null })));
		m.showAtMouseEvent(e);
	};
	return <PriorityBadge priority={props.issue.priority} onClick={menu} />;
}

function LabelsField(props: { ctx: TaskContext; issue: Issue; index: TaskIndex; save: Save }) {
	const { ctx, issue, index, save } = props;
	const colors = new Map(index.data.labels.map((l) => [l.name, l.color]));
	const edit = () =>
		new PreactModal(ctx.app, "label", (close) => (
			<LabelForm
				labels={index.data.labels}
				initial={issue.labels}
				onCreate={(name) => ctx.writer.addLabel(name)}
				onSubmit={(names) => {
					close();
					save({ label: names });
				}}
				onError={(e) => ctx.report("label を追加できませんでした", e)}
			/>
		)).open();
	return (
		<div class="vt-labels" onClick={edit}>
			{issue.labels.length === 0 && <span class="vt-badge vt-label is-empty">label</span>}
			{issue.labels.map((name) => (
				<LabelBadge name={name} color={colors.get(name) ?? "var(--background-modifier-border)"} />
			))}
		</div>
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
				midDue={issue.midDue}
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
						<DayCell date={d} scheduled={scheduled.has(d)} midDue={issue.midDue} deadline={issue.deadline} today={today} onClick={() => toggle(d)} />
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
	const edit = (key: "mid_due" | "deadline", current: LocalDate | null) => () =>
		new PreactModal(ctx.app, key, (close) => (
			<DateForm
				initial={current}
				onSubmit={(v) => {
					close();
					save({ [key]: v });
				}}
			/>
		)).open();
	const row = (label: string, key: "mid_due" | "deadline", value: LocalDate | null) => (
		<button class={`vt-due vt-due-${dueLevel(issue, value, today)}`} onClick={edit(key, value)}>
			<span class="vt-due-label">{label}</span>
			<span>{value ? formatShortDate(value) : "—"}</span>
		</button>
	);
	return (
		<div class="vt-dues">
			{row("mid_due", "mid_due", issue.midDue)}
			{row("deadline", "deadline", issue.deadline)}
		</div>
	);
}

function IssueLink(props: { ctx: TaskContext; issue: Issue; onRemove?: () => void }) {
	return (
		<span class="vt-relation">
			<IdBadge issue={props.issue} />
			<span class="vt-link" onClick={(e) => void props.ctx.openPath(props.issue.path, Keymap.isModEvent(e) !== false)}>
				{props.issue.summary}
			</span>
			{props.onRemove && (
				<button class="vt-icon-button" aria-label="外す" onClick={props.onRemove}>
					×
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
		<div class="vt-row vt-halves vt-small">
			<div>
				<div class="vt-field-label">
					Parent
					<button class="vt-icon-button" aria-label="親を選ぶ" onClick={pickParent}>
						✎
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
			<div>
				<div class="vt-field-label">
					Children
					<button class="vt-icon-button" aria-label="子を追加" onClick={addChild}>
						＋
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
	const menu = (e: MouseEvent) => {
		const m = new Menu();
		for (const min of ESTIMATE_PRESETS) m.addItem((item) => item.setTitle(formatMinutes(min)).onClick(() => save({ estimated: min })));
		m.addItem((item) =>
			item.setTitle("日数で入力…").onClick(() =>
				new PreactModal(ctx.app, "estimated（日数。1d = 8h）", (close) => (
					<TextForm
						initial={issue.estimated === null ? "" : String(issue.estimated / 480)}
						placeholder="例: 0.5"
						onSubmit={(v) => {
							const min = parseDaysInput(v);
							if (min === null) return ctx.report(`日数として読めません: ${v}`);
							close();
							save({ estimated: min });
						}}
					/>
				)).open(),
			),
		);
		m.addItem((item) => item.setTitle("クリア").onClick(() => save({ estimated: null })));
		m.showAtMouseEvent(e);
	};
	return (
		<div class="vt-row vt-thirds vt-effort">
			<button class="vt-effort-cell" onClick={menu}>
				<span class="vt-field-label">estimated</span>
				<span>{issue.estimated === null ? "—" : formatMinutes(issue.estimated)}</span>
			</button>
			<div class="vt-effort-cell">
				<span class="vt-field-label">actual</span>
				<span>{formatMinutes(actual)}</span>
			</div>
			<div class="vt-effort-cell">
				<span class="vt-field-label">remained</span>
				<span>{issue.estimated === null ? "—" : formatMinutes(issue.estimated - actual)}</span>
			</div>
		</div>
	);
}

function Worklog(props: { issue: Issue; index: TaskIndex }) {
	const [page, setPage] = useState(0);
	const logs = props.index.data.worklogs.filter((l) => l.taskId === props.issue.id).sort((a, b) => b.fromMs - a.fromMs);
	const pages = Math.max(1, Math.ceil(logs.length / WORKLOG_PAGE));
	const current = Math.min(page, pages - 1);
	const shown = logs.slice(current * WORKLOG_PAGE, (current + 1) * WORKLOG_PAGE);
	return (
		<div class="vt-worklog vt-small">
			<div class="vt-field-label">worklog</div>
			{logs.length === 0 && <span class="vt-muted">まだ記録がありません</span>}
			{shown.map((l) => (
				<div class="vt-worklog-row">
					<span>{formatDateTime(l.fromMs)}</span>
					<span>– {l.toMs === null ? "記録中" : formatDateTime(l.toMs).slice(11)}</span>
					<span class="vt-muted">{l.toMs === null ? "" : formatMinutes((l.toMs - l.fromMs) / 60_000)}</span>
					<span>{l.description}</span>
				</div>
			))}
			{pages > 1 && (
				<div class="vt-pager">
					<button disabled={current === 0} onClick={() => setPage(current - 1)}>
						‹
					</button>
					<span>
						{current + 1} / {pages}
					</span>
					<button disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
						›
					</button>
				</div>
			)}
		</div>
	);
}
