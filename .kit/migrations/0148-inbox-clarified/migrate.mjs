/**
 * 0148: Inbox を日付ではなく clarified（整理済み）で決める（.kit/src/docs/adr/0148-inbox-clarified.md）。
 * - issue/i-N.md のうち、status が open で、scheduled・soft_deadline・deadline のどれかがあり、clarified がないものに
 *   clarified: true を足す（以前は日付があれば Inbox に出なかった。見た目を変えない）
 * - 日付のない open の issue は変えない（今も Inbox に出る）。サブイシューは対象にしない
 * 何度実行しても同じ結果になる
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { addClarified, needsClarified, read, targetFiles } from "./common.mjs";

export function migrate(root, { dryRun = false } = {}) {
	const changes = [];
	for (const path of targetFiles(root)) {
		const text = read(root, path);
		if (!needsClarified(text)) continue;
		if (!dryRun) writeFileSync(join(root, path), addClarified(text));
		changes.push(`${path}: 日付があるので整理済み（clarified: true）にする`);
	}
	return changes;
}
