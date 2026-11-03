import { Icon } from "./Icon";
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
