import { Icon } from "./Icon";

/** 絞り込み用のチップ（M3 の filter chip） */
export function FilterChip(props: { label: string; on: boolean; onClick: () => void }) {
	return (
		<button class={`vt-filter-chip${props.on ? " is-on" : ""}`} aria-pressed={props.on} onClick={props.onClick}>
			{props.on && <Icon name="check" />}
			{props.label}
		</button>
	);
}

/** リストにあれば外し、なければ足す */
export function toggle<T>(list: T[], v: T): T[] {
	return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}
