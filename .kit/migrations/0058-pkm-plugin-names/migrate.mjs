/**
 * 0058: 自作プラグインの名前を vault-* から pkm-* にする（.kit/src/docs/adr/0058-pkm-plugin-names.md）。
 * - community-plugins.json の ID、appearance.json のスニペット、hotkeys.json のキーを新しい名前にする
 * - この端末の .obsidian/plugins/vault-*\/data.json を pkm-* へ写し、data.json だけが残る古いフォルダを消す
 * 何度実行しても同じ結果になる。読めない JSON は変えない（check が失敗して止まる）
 */
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { APPEARANCE, COMMUNITY, dataPlan, HOTKEYS, PLUGINS, RENAMED, readJson, renameHotkeys, renameIds, SNIPPETS, same } from "./common.mjs";

// Obsidian と同じく 2 つの空白で字下げする。末尾の改行は元のファイルに合わせる
function write(root, path, value, newline) {
	writeFileSync(join(root, path), JSON.stringify(value, null, 2) + (newline ? "\n" : ""));
}

export function migrate(root, { dryRun = false } = {}) {
	const changes = [];

	const community = readJson(root, COMMUNITY);
	if (community.exists && !community.error) {
		const next = renameIds(community.value, RENAMED);
		if (!same(next, community.value)) {
			if (!dryRun) write(root, COMMUNITY, next, community.newline);
			changes.push(`${COMMUNITY}: プラグインの ID を pkm-* にする`);
		}
	}

	const appearance = readJson(root, APPEARANCE);
	const snippets = appearance.value?.enabledCssSnippets;
	if (appearance.exists && !appearance.error && Array.isArray(snippets)) {
		const next = renameIds(snippets, SNIPPETS);
		if (!same(next, snippets)) {
			if (!dryRun) write(root, APPEARANCE, { ...appearance.value, enabledCssSnippets: next }, appearance.newline);
			changes.push(`${APPEARANCE}: スニペット vault-theme を pkm-theme にする`);
		}
	}

	const hotkeys = readJson(root, HOTKEYS);
	if (hotkeys.exists && !hotkeys.error) {
		const next = renameHotkeys(hotkeys.value);
		if (!same(next, hotkeys.value)) {
			if (!dryRun) write(root, HOTKEYS, next, hotkeys.newline);
			changes.push(`${HOTKEYS}: コマンドのキーを pkm-* にする`);
		}
	}

	for (const plan of dataPlan(root)) {
		if (plan.copy) {
			if (!dryRun) {
				mkdirSync(dirname(plan.newData), { recursive: true });
				copyFileSync(plan.oldData, plan.newData);
			}
			changes.push(`${PLUGINS}/${plan.from}/data.json を ${PLUGINS}/${plan.to}/ へ写す`);
		}
		if (plan.remove) {
			if (!dryRun) rmSync(plan.oldDir, { recursive: true, force: true });
			changes.push(`${PLUGINS}/${plan.from}/ を消す（data.json だけが残っていた）`);
		}
	}
	return changes;
}
