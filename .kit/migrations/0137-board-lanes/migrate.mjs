/**
 * 0137: task board のグループを廃止する（.kit/src/docs/adr/0137-board-lanes-and-sub-issue-cards.md）。
 * - issue/board-groups.json を消す
 * - routine/*.md と template/file/routine.md の frontmatter から group の行を消す（ほかの行と本文は変えない）
 * - board の jsonl（place と group 付きの order）は書き換えない（追記だけの記録。pkm-task が読んで捨てる）
 * 何度実行しても同じ結果になる。group が 1 行で読めないファイルは変えない（check が失敗して止まる）
 */
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GROUPS, groupLine, read, removeGroup, targetFiles } from "./common.mjs";

export function migrate(root, { dryRun = false } = {}) {
	const changes = [];
	if (existsSync(join(root, GROUPS))) {
		if (!dryRun) rmSync(join(root, GROUPS));
		changes.push(`${GROUPS}: グループを廃止したので消す`);
	}
	for (const path of targetFiles(root)) {
		const text = read(root, path);
		const line = groupLine(text);
		if (line === null || line.unreadable) continue;
		if (!dryRun) writeFileSync(join(root, path), removeGroup(text));
		changes.push(`${path}: frontmatter の group を消す`);
	}
	return changes;
}
