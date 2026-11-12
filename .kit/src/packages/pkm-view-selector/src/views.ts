/**
 * ダイアログの候補を、Obsidian に登録されたコマンドと View の種類から集める（ADR-0072）。
 * Obsidian の値は import しない（テストできるよう、純粋な関数だけを置く）
 */

/** 候補を出すプラグイン。View の種類は `<プラグイン>-<名前>`、開くコマンドは `<プラグイン>:open-<名前>` */
export const SOURCE_PLUGINS = ["pkm-task", "pkm-template", "pkm-updates", "pkm-slide"] as const;

/** 集めるのに使うコマンドの形（Obsidian の Command のうち、使う項目だけ） */
export interface CommandLike {
	id: string;
	name: string;
	icon?: string;
}

export interface ViewEntry {
	/** 開くコマンドの ID */
	commandId: string;
	/** View の種類 */
	viewType: string;
	/** 表示名（コマンド名から「Open 」を除いたもの。ADR-0076） */
	name: string;
	plugin: string;
	icon: string | undefined;
	open: boolean;
}

/** コマンド名は「Open <View>」（ADR-0076）。前の「<View> を開く」も読む */
const OPEN_PREFIX = /^Open\s+/;
const OPEN_SUFFIX = /\s*を開く$/;

/**
 * 一覧の View を開くコマンドを候補にする。View が登録されていない `open-*`（今日のデイリーノートなど）は除く。
 * 並びはプラグインの順、その中ではコマンドの登録順
 */
export function collectViews(commands: readonly CommandLike[], isViewType: (type: string) => boolean, isOpen: (type: string) => boolean): ViewEntry[] {
	const entries: ViewEntry[] = [];
	for (const plugin of SOURCE_PLUGINS) {
		const prefix = `${plugin}:open-`;
		for (const c of commands) {
			if (!c.id.startsWith(prefix)) continue;
			const viewType = `${plugin}-${c.id.slice(prefix.length)}`;
			if (!isViewType(viewType)) continue;
			// Obsidian はコマンド名の前に「プラグイン名: 」を付けて登録する
			const bare = c.name.replace(/^[^:]*:\s*/, "");
			entries.push({ commandId: c.id, viewType, name: bare.replace(OPEN_PREFIX, "").replace(OPEN_SUFFIX, "") || bare, plugin, icon: c.icon, open: isOpen(viewType) });
		}
	}
	return entries;
}

/**
 * 大文字と小文字を区別しないあいまい検索。文字が順に現れれば当たり（`iss` → Issues、`bg` → Board groups）。
 * 名前の先頭で当たるもの、続けて当たるものを上にする。空の検索は元の並び
 */
export function matchViews(query: string, entries: readonly ViewEntry[]): ViewEntry[] {
	const q = query.trim().toLowerCase().replace(/\s+/g, "");
	if (!q) return [...entries];
	const scored: { entry: ViewEntry; score: number; index: number }[] = [];
	entries.forEach((entry, index) => {
		const score = Math.max(scoreOf(q, entry.name.toLowerCase()), scoreOf(q, entry.plugin.toLowerCase()) - 100);
		if (score > Number.NEGATIVE_INFINITY) scored.push({ entry, score, index });
	});
	return scored.sort((a, b) => b.score - a.score || a.index - b.index).map((s) => s.entry);
}

/** 当たらなければ -Infinity。高いほどよく当たる */
function scoreOf(q: string, text: string): number {
	if (text.startsWith(q)) return 1000 - text.length;
	const at = text.indexOf(q);
	if (at >= 0) return 500 - at;
	let pos = 0;
	let gaps = 0;
	for (const ch of q) {
		const found = text.indexOf(ch, pos);
		if (found < 0) return Number.NEGATIVE_INFINITY;
		gaps += found - pos;
		pos = found + 1;
	}
	return 100 - gaps;
}
