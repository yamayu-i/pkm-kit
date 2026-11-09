/**
 * 0102: 図のプラグインの名前を pkm-drawio から pkm-diagram にする（.kit/src/docs/adr/0102-diagram-three-methods.md）。
 * - community-plugins.json の ID、hotkeys.json のキー、template/snippet/ のスニペットが呼ぶコマンドを新しい名前にする
 * - この端末の .obsidian/plugins/pkm-drawio/data.json を pkm-diagram へ写し、data.json だけが残る古いフォルダを消す
 * 何度実行しても同じ結果になる。読めない JSON は変えない（check が失敗して止まる）
 */
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { COMMUNITY, dataPlan, FROM, HOTKEYS, PLUGINS, readJson, renameHotkeys, renameIds, same, snippetPlan, TO } from "./common.mjs";

// Obsidian と同じく 2 つの空白で字下げする。末尾の改行は元のファイルに合わせる
function write(root, path, value, newline) {
	writeFileSync(join(root, path), JSON.stringify(value, null, 2) + (newline ? "\n" : ""));
}

export function migrate(root, { dryRun = false } = {}) {
	const changes = [];

	const community = readJson(root, COMMUNITY);
	if (community.exists && !community.error) {
		const next = renameIds(community.value);
		if (!same(next, community.value)) {
			if (!dryRun) write(root, COMMUNITY, next, community.newline);
			changes.push(`${COMMUNITY}: ${FROM} を ${TO} にする`);
		}
	}

	const hotkeys = readJson(root, HOTKEYS);
	if (hotkeys.exists && !hotkeys.error) {
		const next = renameHotkeys(hotkeys.value);
		if (!same(next, hotkeys.value)) {
			if (!dryRun) write(root, HOTKEYS, next, hotkeys.newline);
			changes.push(`${HOTKEYS}: コマンドのキーを ${TO}:* にする`);
		}
	}

	for (const plan of snippetPlan(root)) {
		if (!dryRun) writeFileSync(join(root, plan.path), plan.next);
		changes.push(`${plan.path}: command を ${TO}:* にする`);
	}

	const data = dataPlan(root);
	if (data?.copy) {
		if (!dryRun) {
			mkdirSync(dirname(data.newData), { recursive: true });
			copyFileSync(data.oldData, data.newData);
		}
		changes.push(`${PLUGINS}/${FROM}/data.json を ${PLUGINS}/${TO}/ へ写す`);
	}
	if (data?.remove) {
		if (!dryRun) rmSync(data.oldDir, { recursive: true, force: true });
		changes.push(`${PLUGINS}/${FROM}/ を消す（data.json だけが残っていた）`);
	}
	return changes;
}
