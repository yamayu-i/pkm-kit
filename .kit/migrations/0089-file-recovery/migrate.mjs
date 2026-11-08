/**
 * 0089: コアプラグイン「ファイル回復」（file-recovery）を有効にする（.kit/src/docs/adr/0089-git-auto-sync.md）。
 * - .obsidian/core-plugins.json の file-recovery を true にする（ほかのキーは残す）
 * 何度実行しても同じ結果になる。読めない JSON、オブジェクトでない値は変えない（check が失敗して止まる）
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { CORE, isObject, readJson } from "./common.mjs";

// Obsidian と同じく 2 つの空白で字下げし、末尾に改行を付けない
function write(root, path, value) {
	mkdirSync(dirname(join(root, path)), { recursive: true });
	writeFileSync(join(root, path), JSON.stringify(value, null, 2));
}

export function migrate(root, { dryRun = false } = {}) {
	const core = readJson(root, CORE);
	if (core.error || (core.exists && !isObject(core.value))) return [];
	if (core.value?.["file-recovery"] === true) return [];
	if (!dryRun) write(root, CORE, { ...(core.value ?? {}), "file-recovery": true });
	return [`${CORE}: file-recovery を true にする（コアプラグインのファイル回復を有効にする）`];
}
