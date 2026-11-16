/**
 * 0181: 終わった（closed / canceled の）サブを、md の末尾へ移す（.kit/src/docs/adr/0181-sub-done-to-bottom-and-hidden.md）。
 * issue/i-N.md のサブのブロックのうち、終わったものを元の順のまま末尾に集める。本文とブロックの中身は変えない。
 * 何度実行しても同じ結果になる（終わったものがすでに末尾なら何もしない）
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { moveDoneToEnd, read, targetFiles } from "./common.mjs";

export function migrate(root, { dryRun = false } = {}) {
	const changes = [];
	for (const path of targetFiles(root)) {
		const text = read(root, path);
		const next = moveDoneToEnd(text);
		if (next === text) continue;
		if (!dryRun) writeFileSync(join(root, path), next);
		changes.push(`${path}: 終わったサブ（closed / canceled）を末尾へ移す`);
	}
	return changes;
}
