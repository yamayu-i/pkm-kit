import type { Status } from "../core/schema";

/**
 * status のアイコン（ADR-0031）。○ を土台に、中の塗りで進み具合を表す。
 * Lucide にない形なので、design.md の「アイコンは Lucide」の例外として自作の SVG にしている。
 * 色は currentColor（`.vt-status-icon` が status の印の色を付ける）
 */
const SHAPES: Record<Status, preact.JSX.Element> = {
	open: <circle class="vt-si-ring" cx="12" cy="12" r="9" />,
	"in-progress": (
		<>
			<circle class="vt-si-ring" cx="12" cy="12" r="9" />
			<path class="vt-si-fill vt-si-spin" d="M12 7a5 5 0 0 1 0 10z" />
		</>
	),
	waiting: (
		<>
			<circle class="vt-si-ring" cx="12" cy="12" r="9" />
			<path class="vt-si-ring" d="M10 9.5v5M14 9.5v5" />
		</>
	),
	delegated: (
		<>
			<path class="vt-si-ring" d="M19.37 6.84A9 9 0 1 0 19.37 17.16" />
			<path class="vt-si-ring" d="M11 12h10M18 9l3 3-3 3" />
		</>
	),
	someday: <circle class="vt-si-ring" cx="12" cy="12" r="9" pathLength="48" stroke-dasharray="2.4 3.6" />,
	closed: (
		<>
			<circle class="vt-si-fill vt-si-pop" cx="12" cy="12" r="10" />
			<path class="vt-si-knock vt-si-draw" d="M8 12.3l2.8 2.8L16.2 9.6" pathLength="14" />
		</>
	),
	canceled: (
		<>
			<circle class="vt-si-ring" cx="12" cy="12" r="9" />
			<path class="vt-si-ring" d="M8.5 15.5l7-7" />
		</>
	),
};

export function StatusIcon(props: { status: Status; class?: string }) {
	return (
		<svg class={`vt-status-icon vt-si-${props.status} ${props.class ?? ""}`} viewBox="0 0 24 24" aria-hidden="true">
			{SHAPES[props.status]}
		</svg>
	);
}
