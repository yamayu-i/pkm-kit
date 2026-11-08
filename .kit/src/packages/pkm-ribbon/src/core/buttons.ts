/**
 * リボンのボタンの並びの表（ADR-0029、ADR-0070 の 5）。自作プラグインのリボンのボタンは、ここだけで登録する。
 * 並びはこの表の順で決まり、プラグインの読み込み順に左右されない。押したらコマンドを ID で呼ぶだけ
 */
export interface RibbonButton {
	icon: string;
	title: string;
	/** `<プラグインの ID>:<コマンド>` */
	command: string;
}

export const BUTTONS: readonly RibbonButton[] = [
	{ icon: "calendar", title: "Open today's daily note", command: "pkm-template:open-todays-daily" },
	{ icon: "sun", title: "Open Today", command: "pkm-task:open-daily" },
	{ icon: "bell", title: "Open PKM Updates", command: "pkm-updates:open-view" },
	{ icon: "list-plus", title: "Capture issues", command: "pkm-task:capture-issues" },
	// pull と push を 1 つの同期にした（ADR-0089 の 3）
	{ icon: "refresh-cw", title: "Git: Sync", command: "pkm-git:sync" },
];

/** 数が変わったことを、数を持つプラグインが知らせるイベント（引数はコマンドの ID。ADR-0070 の 6） */
export const BADGE_CHANGED_EVENT = "pkm-ribbon:badge-changed";

/** コマンドの ID の接頭辞が、そのコマンドを持つプラグインの ID */
export function pluginIdOf(command: string): string {
	const i = command.indexOf(":");
	return i < 0 ? command : command.slice(0, i);
}

/** バッジに出す文字。1〜99 はその数、100 以上は 99+、0・null・数でないものは出さない（null） */
export function badgeText(count: unknown): string | null {
	if (typeof count !== "number" || !Number.isFinite(count)) return null;
	const n = Math.floor(count);
	if (n <= 0) return null;
	return n >= 100 ? "99+" : String(n);
}
