/**
 * 0072: 一覧の View を探すダイアログ pkm-view-selector を有効にし、Mod+K を空ける（.kit/src/docs/adr/0072-view-selector.md）。
 * - .obsidian/community-plugins.json に pkm-view-selector を足す（ほかの要素と順は残す）
 * - .obsidian/hotkeys.json の editor:insert-link を [] にする（子が割り当てていても上書きする。ほかのキーは残す）
 * 何度実行しても同じ結果になる。読めない JSON は変えない（check が失敗して止まる）
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { COMMUNITY, hasPlugin, HOTKEYS, INSERT_LINK, isObject, linkUnbound, PLUGIN, readJson } from "./common.mjs";

// Obsidian と同じく 2 つの空白で字下げし、末尾に改行を付けない
function writeJson(root, path, value) {
	mkdirSync(dirname(join(root, path)), { recursive: true });
	writeFileSync(join(root, path), JSON.stringify(value, null, 2));
}

export function migrate(root, { dryRun = false } = {}) {
	const changes = [];
	const community = readJson(root, COMMUNITY);
	if (!community.error && !hasPlugin(community.value)) {
		if (!dryRun) writeJson(root, COMMUNITY, [...(Array.isArray(community.value) ? community.value : []), PLUGIN]);
		changes.push(`${COMMUNITY}: ${PLUGIN} を有効にする`);
	}
	const hotkeys = readJson(root, HOTKEYS);
	if (!hotkeys.error && (hotkeys.value === undefined || isObject(hotkeys.value)) && !linkUnbound(hotkeys.value)) {
		if (!dryRun) writeJson(root, HOTKEYS, { ...(hotkeys.value ?? {}), [INSERT_LINK]: [] });
		changes.push(`${HOTKEYS}: ${INSERT_LINK}（Markdown リンクを挿入）のホットキーを外し、Mod+K を ${PLUGIN} に空ける`);
	}
	return changes;
}
