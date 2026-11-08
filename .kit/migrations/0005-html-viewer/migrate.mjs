/**
 * 0005: Vault の中の HTML を読み取り専用で表示するプラグイン vault-html を有効にする（.kit/src/docs/adr/0037-html-viewer.md）。
 * - .obsidian/community-plugins.json に vault-html を足す（ほかの要素と順は残す）
 * 何度実行しても同じ結果になる。読めない JSON は変えない（check が失敗して止まる）
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { COMMUNITY, hasHtml, HTML, readJson } from "./common.mjs";

export function migrate(root, { dryRun = false } = {}) {
	const changes = [];
	const community = readJson(root, COMMUNITY);
	if (!community.error && !hasHtml(community.value)) {
		if (!dryRun) {
			mkdirSync(dirname(join(root, COMMUNITY)), { recursive: true });
			// Obsidian と同じく 2 つの空白で字下げし、末尾に改行を付けない
			writeFileSync(join(root, COMMUNITY), JSON.stringify([...(Array.isArray(community.value) ? community.value : []), HTML], null, 2));
		}
		changes.push(`${COMMUNITY}: ${HTML} を有効にする`);
	}
	return changes;
}
