/**
 * 0128: ノートの表示を整えるプラグイン pkm-markdown を有効にし、コアプラグイン「タグ」を無効にする（.kit/src/docs/adr/0128-markdown-view.md）。
 * - .obsidian/community-plugins.json に pkm-markdown を足す（ほかの要素と順は残す）
 * - .obsidian/core-plugins.json の tag-pane を false にする（ほかのキーは残す。ファイルがなければ作る）
 * 何度実行しても同じ結果になる。読めない JSON、形の違う値は変えない（check が失敗して止まる）
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { COMMUNITY, CORE, hasPlugin, isObject, PLUGIN, readJson, TAG_PANE } from "./common.mjs";

// Obsidian と同じく 2 つの空白で字下げし、末尾に改行を付けない
function writeJson(root, path, value) {
	mkdirSync(dirname(join(root, path)), { recursive: true });
	writeFileSync(join(root, path), JSON.stringify(value, null, 2));
}

export function migrate(root, { dryRun = false } = {}) {
	const changes = [];
	const community = readJson(root, COMMUNITY);
	if (!community.error && (community.value === undefined || Array.isArray(community.value)) && !hasPlugin(community.value)) {
		if (!dryRun) writeJson(root, COMMUNITY, [...(community.value ?? []), PLUGIN]);
		changes.push(`${COMMUNITY}: ${PLUGIN} を有効にする`);
	}
	const core = readJson(root, CORE);
	if (!core.error && (core.value === undefined || isObject(core.value)) && core.value?.[TAG_PANE] !== false) {
		if (!dryRun) writeJson(root, CORE, { ...(core.value ?? {}), [TAG_PANE]: false });
		changes.push(`${CORE}: ${TAG_PANE} を false にする（コアプラグインのタグを無効にする）`);
	}
	return changes;
}
