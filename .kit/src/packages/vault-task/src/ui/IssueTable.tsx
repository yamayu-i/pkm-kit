import { Keymap } from "obsidian";
import type { ComponentChild } from "preact";
import { formatShortDate, localToday } from "../core/dates";
import { dueLevel } from "../core/due";
import type { Issue } from "../core/schema";
import type { TaskContext } from "../obsidian/context";
import { IdBadge, PriorityBadge, StatusBadge } from "./badges";
import { linkProps } from "./a11y";

export type Column = "status-detail" | "mid_due" | "deadline" | "labels" | "next" | "revisit" | "reviewed" | "created";

/** 選択できる issue の一覧（ADR-0009 の行表示）。行をクリックすると issue を開く */
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
	const cell = (issue: Issue, c: Column): ComponentChild => {
		switch (c) {
			case "status-detail":
				return <span class="vt-cell-detail">{issue.statusDetail}</span>;
			case "mid_due":
				return due(issue, issue.midDue);
			case "deadline":
				return due(issue, issue.deadline);
			case "labels":
				return <span class="vt-cell-detail">{issue.labels.join(", ")}</span>;
			case "next": {
				const next = issue.scheduled.find((d) => d >= today);
				return next ? <span class="vt-num">{formatShortDate(next)}</span> : <span class="vt-muted">—</span>;
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
						<PriorityBadge priority={issue.priority} />
					</span>
					<span class="vt-col-status">
						<StatusBadge status={issue.status} />
					</span>
					{columns.map((c) => (
						<span class={`vt-col-${c}`}>{cell(issue, c)}</span>
					))}
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
