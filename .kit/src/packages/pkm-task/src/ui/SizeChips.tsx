import { SIZES, XL_MESSAGE, sizeOf } from "../core/projects";

/**
 * 見積もりのサイズのチップ（ADR-0231）: S（30m）・M（2h）・L（4h）を押すとその値を入れる。今の値のチップは選んだ状態に見せる。
 * XL は値を入れず、サブを分けるよう促す（onXl）。clearable なら、選んだチップをもう一度押すと外す
 */
export function SizeChips(props: { minutes: number | null; onPick: (minutes: number | null) => void; onXl?: (message: string) => void; clearable?: boolean }) {
	const current = sizeOf(props.minutes);
	return (
		<div class="vt-segmented is-small vt-size-chips" role="group" aria-label="Size">
			{SIZES.map((s) => {
				const on = current === s.label;
				return (
					<button
						type="button"
						class={`vt-segmented-button${on ? " is-on" : ""}`}
						aria-pressed={on}
						title={`${s.label}: ${s.minutes >= 60 ? `${s.minutes / 60}h` : `${s.minutes}m`}`}
						onClick={() => (on ? props.clearable && props.onPick(null) : props.onPick(s.minutes))}
					>
						{s.label}
					</button>
				);
			})}
			{props.onXl && (
				<button type="button" class="vt-segmented-button" title="XL: split into smaller sub-issues" onClick={() => props.onXl!(XL_MESSAGE)}>
					XL
				</button>
			)}
		</div>
	);
}
