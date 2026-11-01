import { Keymap } from "obsidian";
import type { ComponentChild } from "preact";
import { formatShortDate, localToday } from "../core/dates";
import { dueLevel } from "../core/due";
import type { Issue } from "../core/schema";
import { formatMinutes } from "../core/format";
import type { TaskContext } from "../obsidian/context";
import { editDue, editLabels, editScheduled, editStatusDetail, estimateMenu, issueRowMenu, priorityMenu, saveIssue, statusMenu } from "../obsidian/issue-editors";
import { IdBadge, PriorityBadge, StatusBadge } from "./badges";
import { Icon } from "./Icon";
import { linkProps } from "./a11y";

export type Column = "status-detail" | "mid_due" | "deadline" | "labels" | "next" | "revisit" | "reviewed" | "created" | "estimated";

/** 選択できる issue の一覧（ADR-0009 の行表示）。summary をクリックすると issue を開き、ほかのセルと「…」で編集する（ADR-0018） */
export function IssueTable(props: {
	ctx: TaskContext;
	issues: Issue[];
	selected?: ReadonlySet<string>;
	onSelect?: (next: Set<string>) => void;
	columns?: Column[];
	/** 行の先頭に足す小さな情報（日付など） */
	lead?: (issue: Issue) => ComponentChild;
	empty?: string;
}) {
	const { ctx, issues, selected, onSelect } = props;
	const columns = props.columns ?? ["status-detail", "mid_due", "deadline"];
	const today = localToday();
	const toggle = (id: string) => {
		if (!selected || !onSelect) return;
		const next = new Set(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		onSelect(next);
	};
	const all = selected !== undefined && issues.length > 0 && issues.every((i) => selected.has(i.id));
	if (issues.length === 0) return <div class="vt-empty">{props.empty ?? "ありません"}</div>;
	const due = (issue: Issue, value: string | null) =>
		value ? <span class={`vt-due-chip vt-due-${dueLevel(issue, value, today)}`}>{formatShortDate(value)}</span> : <span class="vt-muted">—</span>;
	const editable = (issue: Issue, c: Column, open: (e: MouseEvent) => void, content: ComponentChild) => (
		<button class="vt-cell-edit" aria-label={`${issue.id} の ${c} を編集`} title={`${c} を編集`} onClick={open}>
			{content}
		</button>
	);
	const text = (value: string) => (value ? <span class="vt-cell-detail">{value}</span> : <span class="vt-muted">—</span>);
	const cell = (issue: Issue, c: Column): ComponentChild => {
		const save = saveIssue(ctx, issue);
		switch (c) {
			case "status-detail":
				return editable(issue, c, () => editStatusDetail(ctx, issue.statusDetail, save), text(issue.statusDetail));
			case "mid_due":
				return editable(issue, c, () => editDue(ctx, issue, "mid_due"), due(issue, issue.midDue));
			case "deadline":
				return editable(issue, c, () => editDue(ctx, issue, "deadline"), due(issue, issue.deadline));
			case "labels":
				return editable(issue, c, () => editLabels(ctx, issue.labels, save), text(issue.labels.join(", ")));
			case "estimated":
				return editable(issue, c, (e) => estimateMenu(ctx, e, issue.estimated, save), issue.estimated === null ? <span class="vt-muted">—</span> : <span class="vt-num">{formatMinutes(issue.estimated)}</span>);
			case "next": {
				const next = issue.scheduled.find((d) => d >= today);
				return editable(issue, c, () => editScheduled(ctx, issue), next ? <span class="vt-num">{formatShortDate(next)}</span> : <span class="vt-muted">—</span>);
			}
			case "revisit":
				return issue.revisit ? <span class="vt-num">{formatShortDate(issue.revisit)}</span> : <span class="vt-muted">—</span>;
			case "reviewed":
				return issue.reviewed ? <span class="vt-num">{formatShortDate(issue.reviewed)}</span> : <span class="vt-muted">未</span>;
			case "created":
				return issue.created ? <span class="vt-num">{issue.created.slice(0, 10)}</span> : <span class="vt-muted">—</span>;
		}
	};
	return (
		<div class="vt-table" role="table" style={{ "--vt-cols": String(columns.length) }}>
			<div class="vt-tr vt-thead" role="row">
				{onSelect && (
					<input type="checkbox" aria-label="すべて選択" checked={all} onChange={() => onSelect(all ? new Set() : new Set(issues.map((i) => i.id)))} />
				)}
				<span class="vt-th vt-col-main">issue</span>
				<span class="vt-th vt-col-priority">priority</span>
				<span class="vt-th vt-col-status">status</span>
				{columns.map((c) => (
					<span class={`vt-th vt-col-${c}`}>{c}</span>
				))}
				<span class="vt-th vt-col-menu" />
			</div>
			{issues.map((issue) => (
				<div class={`vt-tr${selected?.has(issue.id) ? " is-selected" : ""}`} role="row" key={issue.id}>
					{onSelect && <input type="checkbox" checked={selected?.has(issue.id) ?? false} onChange={() => toggle(issue.id)} aria-label={`${issue.id} を選択`} />}
					<span class="vt-col-main" {...linkProps((e) => void ctx.openPath(issue.path, Keymap.isModEvent(e) !== false))}>
						{props.lead?.(issue)}
						<IdBadge issue={issue} />
						<span class="vt-cell-summary" title={issue.summary}>
							{issue.summary}
						</span>
					</span>
					<span class="vt-col-priority">
						<PriorityBadge priority={issue.priority} onClick={(e) => priorityMenu(e, issue.priority, saveIssue(ctx, issue))} />
					</span>
					<span class="vt-col-status">
						<StatusBadge status={issue.status} onClick={(e) => statusMenu(ctx, e, issue)} />
					</span>
					{columns.map((c) => (
						<span class={`vt-col-${c}`}>{cell(issue, c)}</span>
					))}
					<span class="vt-col-menu">
						<button class="vt-icon-button" aria-label={`${issue.id} を編集`} title="編集" onClick={(e) => issueRowMenu(ctx, e, issue)}>
							<Icon name="more-horizontal" />
						</button>
					</span>
				</div>
			))}
		</div>
	);
}

export interface Action {
	label: string;
	icon: string;
	run: () => void;
	tone?: "primary" | "danger";
}

/** 選択した行への操作 */
export function ActionBar(props: { count: number; actions: Action[] }) {
	return (
		<div class={`vt-actionbar${props.count > 0 ? " is-active" : ""}`}>
			<span class="vt-actionbar-count">{props.count > 0 ? `${props.count} 件を選択中` : "行を選ぶと操作できます"}</span>
			<span class="vt-spacer" />
			{props.actions.map((a) => (
				<button class={`vt-button${a.tone ? ` is-${a.tone}` : ""}`} disabled={props.count === 0} onClick={a.run}>
					{a.label}
				</button>
			))}
		</div>
	);
}
