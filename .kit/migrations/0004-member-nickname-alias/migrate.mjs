/**
 * 0004: member に nickname と alias を足す（.kit/src/docs/adr/0035-member-view-and-fields.md）。
 * - member/*.md の frontmatter に nickname がなければ、name と同じ値で name の後ろに足す
 * - alias がなければ、ID（id の値）で nickname の後ろに足す
 * 何度実行しても同じ結果になる。name / id が 1 行の値で読めないファイルは変えない（check が失敗して止まる）
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { apply, inspect, read, targetFiles } from "./common.mjs";

export function migrate(root, { dryRun = false } = {}) {
	const changes = [];
	for (const path of targetFiles(root)) {
		const text = read(root, path);
		const { add } = inspect(text);
		if (add.length === 0) continue;
		if (!dryRun) writeFileSync(join(root, path), apply(text));
		changes.push(`${path}: ${add.map((a) => a.line.split(":")[0]).join(" と ")} を足す`);
	}
	return changes;
}
