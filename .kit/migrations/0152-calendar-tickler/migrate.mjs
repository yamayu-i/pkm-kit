/**
 * 0152: scheduled を Calendar（その日にやらなければならない日 1 つ）にする（.kit/src/docs/adr/0152-calendar-and-tickler.md）。
 * - issue/i-N.md の frontmatter と、本文のサブイシューのブロックの scheduled のリストを、移行した日以降の最も早い日 1 つにする
 * - 過去の日付だけのリストは、行を消す。日付 1 つの scheduled は変えない
 * 何度実行しても同じ結果になる。日付でない要素のあるリストは変えない（check が失敗して止まる）
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { localToday, migrateText, read, targetFiles } from "./common.mjs";

export function migrate(root, { dryRun = false } = {}) {
	const today = localToday();
	const changes = [];
	for (const path of targetFiles(root)) {
		const r = migrateText(read(root, path), today);
		if (!r.changed) continue;
		if (!dryRun) writeFileSync(join(root, path), r.text);
		changes.push(`${path}: scheduled のリストを、${today} 以降の最も早い日 1 つにする（過去だけなら消す）`);
	}
	return changes;
}
