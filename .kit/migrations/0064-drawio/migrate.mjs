/**
 * 0064: Draw.io の図を扱うプラグイン pkm-drawio を有効にする（.kit/src/docs/adr/0064-drawio-diagrams.md）。
 * - .obsidian/community-plugins.json に pkm-drawio を足す（ほかの要素と順は残す）
 * 何度実行しても同じ結果になる。読めない JSON は変えない（check が失敗して止まる）
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { COMMUNITY, DRAWIO, hasDrawio, readJson } from "./common.mjs";

export function migrate(root, { dryRun = false } = {}) {
	const changes = [];
	const community = readJson(root, COMMUNITY);
	if (!community.error && !hasDrawio(community.value)) {
		if (!dryRun) {
			mkdirSync(dirname(join(root, COMMUNITY)), { recursive: true });
			// Obsidian と同じく 2 つの空白で字下げし、末尾に改行を付けない
			writeFileSync(join(root, COMMUNITY), JSON.stringify([...(Array.isArray(community.value) ? community.value : []), DRAWIO], null, 2));
		}
		changes.push(`${COMMUNITY}: ${DRAWIO} を有効にする`);
	}
	return changes;
}
