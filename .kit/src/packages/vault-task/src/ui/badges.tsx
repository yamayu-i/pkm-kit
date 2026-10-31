import type { Issue, Priority, Status } from "../core/schema";

export function StatusBadge(props: { status: Status; wide?: boolean; onClick?: (e: MouseEvent) => void }) {
	return (
		<button class={`vt-badge vt-status vt-status-${props.status}${props.wide ? " is-wide" : ""}`} onClick={props.onClick} disabled={!props.onClick}>
			{props.status}
		</button>
	);
}

/** ID のバッジ。色は status と同じ */
export function IdBadge(props: { issue: Issue }) {
	return <span class={`vt-badge vt-id vt-status-${props.issue.status}`}>{props.issue.id}</span>;
}

export function PriorityBadge(props: { priority: Priority | null; onClick?: (e: MouseEvent) => void }) {
	return (
		<button class={`vt-badge vt-priority vt-priority-${props.priority ?? "none"}`} onClick={props.onClick} disabled={!props.onClick}>
			{props.priority ?? "priority"}
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
