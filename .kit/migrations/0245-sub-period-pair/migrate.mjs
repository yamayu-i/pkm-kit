/**
 * 0245: サブの期間は start と end を必ずそろえる（.kit/src/docs/adr/0245-sub-period-pair-and-range-dialog.md）。
 * 片方だけのサブは、もう片方を同じ日にする。何度実行しても同じ結果になる（片方だけのものがなければ何もしない）
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { fixText, read, targetFiles } from "./common.mjs";

export function migrate(root, { dryRun = false } = {}) {
	const changes = [];
	for (const path of targetFiles(root)) {
		const text = read(root, path);
		const r = fixText(text);
		if (r.notes.length === 0) continue;
		if (!dryRun) writeFileSync(join(root, path), r.text);
		changes.push(...r.notes.map((n) => `${path}: ${n}`));
	}
	return changes;
}
