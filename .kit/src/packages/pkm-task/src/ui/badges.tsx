import { Icon } from "./Icon";
import type { GtdList } from "../core/index";
import { formatShortDate } from "../core/dates";
import type { Issue, Priority, Status } from "../core/schema";
import { StatusIcon } from "./StatusIcon";

/** status のバッジ。先頭に status のアイコン（ADR-0031）。enter は閉じた直後の動きを付ける */
export function StatusBadge(props: { status: Status; wide?: boolean; enter?: boolean; onClick?: (e: MouseEvent) => void }) {
	return (
		<button class={`vt-badge vt-status vt-status-${props.status}${props.wide ? " is-wide" : ""}`} onClick={props.onClick} disabled={!props.onClick}>
			<StatusIcon status={props.status} class={props.enter ? "is-enter" : ""} />
			{props.status}
			{props.onClick && props.wide && <Icon name="chevron-down" class="vt-trailing" />}
		</button>
	);
}

/** ID のバッジ。色は status と同じ */
export function IdBadge(props: { issue: Issue }) {
	return <span class={`vt-badge vt-id vt-status-${props.issue.status}`}>{props.issue.id}</span>;
}

const PRIORITY_ICONS: Record<Priority | "none", string> = { high: "▲", mid: "■", low: "▼", chore: "·", none: "+" };

export function PriorityBadge(props: { priority: Priority | null; onClick?: (e: MouseEvent) => void }) {
	return (
		<button class={`vt-badge vt-priority vt-priority-${props.priority ?? "none"}`} onClick={props.onClick} disabled={!props.onClick}>
			<span class="vt-priority-icon" aria-hidden="true">{PRIORITY_ICONS[props.priority ?? "none"]}</span>
			{props.priority ?? "priority"}
			{props.onClick && <Icon name="chevron-down" class="vt-trailing" />}
		</button>
	);
}

export function LabelBadge(props: { name: string; color: string }) {
	return (
		<span class="vt-badge vt-label" style={{ backgroundColor: props.color }}>
			{props.name}
		</span>
	);
}

const GTD_LISTS: Record<GtdList, { label: string; icon: string; title: string }> = {
	inbox: { label: "Inbox", icon: "inbox", title: "In Inbox (not clarified). Clarify it in Inbox or Organize" },
	next: { label: "Next Action", icon: "list-todo", title: "In Next Actions. Pick it in Daily" },
	calendar: { label: "Calendar", icon: "calendar", title: "Must be done on this day" },
	tickler: { label: "Tickler", icon: "alarm-clock", title: "Hidden until this date" },
};

/**
 * GTD の分類（ADR-0210）。どの一覧に出るかを読み取り専用で出す。押しても何もしない（整理は Inbox・Organize で行う）。
 * Calendar と Tickler は日付を添える
 */
export function GtdListBadge(props: { issue: Issue; list: GtdList }) {
	const { label, icon, title } = GTD_LISTS[props.list];
	const date = props.list === "calendar" ? props.issue.scheduled : props.list === "tickler" ? props.issue.tickler : null;
	return (
		<span class={`vt-badge vt-gtd-list is-${props.list}`} title={title}>
			<Icon name={icon} />
			{date ? `${label} ${formatShortDate(date)}` : label}
		</span>
	);
}

/** Project（サブを持つ issue）のバッジ（ADR-0210）。読み取り専用 */
export function ProjectBadge() {
	return (
		<span class="vt-badge vt-gtd-list is-project" title="Project: has sub-issues">
			<Icon name="folder-kanban" fallback="folder" />
			Project
		</span>
	);
}
