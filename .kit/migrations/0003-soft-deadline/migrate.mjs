/**
 * 0003: issue の frontmatter のキー mid_due を soft_deadline に改名する（.kit/src/docs/adr/0032-action-names-soft-deadline-board-delegate.md）。
 * - issue/*.md と template/file/*.md の frontmatter の mid_due: を soft_deadline: にする（値と、ほかの行は変えない）
 * - .obsidian/types.json の types に mid_due があれば soft_deadline に移す（soft_deadline がすでにあれば mid_due を消すだけ）
 * 何度実行しても同じ結果になる。新旧の両方を持つファイルと、読めない types.json は変えない（check が失敗して止まる）
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { inspect, NEW, OLD, read, readTypes, rename, targetFiles, TYPES } from "./common.mjs";

export function migrate(root, { dryRun = false } = {}) {
	const changes = [];
	for (const path of targetFiles(root)) {
		const text = read(root, path);
		if (inspect(text) !== "rename") continue;
		if (!dryRun) writeFileSync(join(root, path), rename(text));
		changes.push(`${path}: ${OLD} を ${NEW} に改名する`);
	}
	const t = readTypes(root);
	if (t.types && OLD in t.types) {
		const types = Object.fromEntries(
			Object.entries(t.types)
				.filter(([k]) => !(k === OLD && NEW in t.types))
				.map(([k, v]) => [k === OLD ? NEW : k, v]),
		);
		// Obsidian と同じく 2 つの空白で字下げし、末尾に改行を付けない
		if (!dryRun) writeFileSync(join(root, TYPES), JSON.stringify({ ...t.value, types }, null, 2));
		changes.push(`${TYPES}: プロパティ ${OLD} の型を ${NEW} に移す`);
	}
	return changes;
}
