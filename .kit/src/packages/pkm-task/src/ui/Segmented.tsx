import { Icon } from "./Icon";

export interface SegmentedOption<T extends string> {
	value: T;
	/** 名前。icon があれば読み上げとツールチップにだけ使い、なければ文字で出す */
	label: string;
	icon?: string;
	/** icon が Obsidian の Lucide にないときに使う別名 */
	iconFallback?: string;
}

/** 表示の切り替え（M3 の segmented button。1 つだけ選ぶ）。絞り込みチップ（FilterChip）と分け、切り替えだと見て分かるようにする */
export function Segmented<T extends string>(props: { label: string; options: SegmentedOption<T>[]; value: T; onChange: (v: T) => void; size?: "small" }) {
	return (
		<div class={`vt-segmented${props.size === "small" ? " is-small" : ""}`} role="group" aria-label={props.label}>
			{props.options.map((o) => (
				<button
					type="button"
					class={`vt-segmented-button${o.value === props.value ? " is-on" : ""}${o.icon ? " is-icon" : ""}`}
					aria-pressed={o.value === props.value}
					aria-label={o.icon ? o.label : undefined}
					title={o.icon ? o.label : undefined}
					onClick={() => o.value !== props.value && props.onChange(o.value)}
				>
					{o.icon ? <Icon name={o.icon} fallback={o.iconFallback} /> : o.label}
				</button>
			))}
		</div>
	);
}
