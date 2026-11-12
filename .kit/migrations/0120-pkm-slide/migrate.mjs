/**
 * 0120: スライドの一覧のプラグイン pkm-slide を有効にする（.kit/src/docs/adr/0120-slide-list-view-and-patterns.md）。
 * - .obsidian/community-plugins.json に pkm-slide を足す（ほかの要素と順は残す）
 * 何度実行しても同じ結果になる。読めない JSON は変えない（check が失敗して止まる）
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { COMMUNITY, hasSlide, readJson, SLIDE } from "./common.mjs";

export function migrate(root, { dryRun = false } = {}) {
	const changes = [];
	const community = readJson(root, COMMUNITY);
	if (!community.error && !hasSlide(community.value)) {
		if (!dryRun) {
			mkdirSync(dirname(join(root, COMMUNITY)), { recursive: true });
			// Obsidian と同じく 2 つの空白で字下げし、末尾に改行を付けない
			writeFileSync(join(root, COMMUNITY), JSON.stringify([...(Array.isArray(community.value) ? community.value : []), SLIDE], null, 2));
		}
		changes.push(`${COMMUNITY}: ${SLIDE} を有効にする`);
	}
	return changes;
}
