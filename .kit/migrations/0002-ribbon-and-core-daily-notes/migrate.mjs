/**
 * 0002: リボンのボタンを vault-ribbon にまとめ、コアプラグインのデイリーノートを無効にする（.kit/src/docs/adr/0029-ribbon-plugin.md）。
 * - .obsidian/core-plugins.json の daily-notes を false にする（ほかのキーは残す）
 * - .obsidian/community-plugins.json に vault-ribbon を足す
 * - .obsidian/daily-notes.json が既定の値だけなら消す。子が値を変えていたら残す（使われないだけ）
 * 何度実行しても同じ結果になる。読めない JSON は変えない（check が失敗して止まる）
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { COMMUNITY, CORE, DAILY, hasRibbon, isDefaultDaily, RIBBON, readJson } from "./common.mjs";

// Obsidian と同じく 2 つの空白で字下げし、末尾に改行を付けない
function write(root, path, value) {
	mkdirSync(dirname(join(root, path)), { recursive: true });
	writeFileSync(join(root, path), JSON.stringify(value, null, 2));
}

export function migrate(root, { dryRun = false } = {}) {
	const changes = [];
	const core = readJson(root, CORE);
	if (!core.error && core.value?.["daily-notes"] !== false) {
		if (!dryRun) write(root, CORE, { ...(core.value ?? {}), "daily-notes": false });
		changes.push(`${CORE}: daily-notes を false にする（コアプラグインのデイリーノートを無効にする）`);
	}
	const community = readJson(root, COMMUNITY);
	if (!community.error && !hasRibbon(community.value)) {
		if (!dryRun) write(root, COMMUNITY, [...(Array.isArray(community.value) ? community.value : []), RIBBON]);
		changes.push(`${COMMUNITY}: ${RIBBON} を有効にする`);
	}
	const daily = readJson(root, DAILY);
	if (daily.exists && !daily.error && isDefaultDaily(daily.value)) {
		if (!dryRun) rmSync(join(root, DAILY));
		changes.push(`${DAILY}: 既定の値だけなので消す（コアプラグインを無効にしたので使わない）`);
	}
	return changes;
}
