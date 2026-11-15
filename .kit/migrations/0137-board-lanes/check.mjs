/** 0137 が終わった状態か。終わっていなければ、残っているものを返す */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { GROUPS, groupLine, read, targetFiles } from "./common.mjs";

export function check(root) {
	const problems = [];
	if (existsSync(join(root, GROUPS))) problems.push(`${GROUPS} が残っている`);
	for (const path of targetFiles(root)) {
		const line = groupLine(read(root, path));
		if (line === null) continue;
		problems.push(line.unreadable ? `${path}: group が 1 行の値ではなく、消せない（README の「スクリプトで扱えない場合」）` : `${path}: frontmatter に group が残っている`);
	}
	return problems;
}
