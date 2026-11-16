/**
 * 0190: サブイシューの soft_deadline / deadline をなくし、end にまとめる（.kit/src/docs/adr/0190-sub-end-as-due.md）。
 * end がなければ deadline（なければ soft_deadline）を end にし、あれば期限を消すだけにする。
 * 何度実行しても同じ結果になる（なくした項目がなければ何もしない）
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
