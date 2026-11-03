/** 0003 が終わった状態か。終わっていなければ、残っているものを返す */
import { inspect, NEW, OLD, read, readTypes, targetFiles, TYPES } from "./common.mjs";

export function check(root) {
	const problems = [];
	for (const path of targetFiles(root)) {
		const state = inspect(read(root, path));
		if (state === "rename") problems.push(`${path}: frontmatter に ${OLD} が残っている`);
		if (state === "conflict") problems.push(`${path}: frontmatter に ${OLD} と ${NEW} の両方がある（README の「スクリプトで扱えない場合」）`);
	}
	const t = readTypes(root);
	if (t.error) problems.push(t.error);
	else if (t.types && OLD in t.types) problems.push(`${TYPES}: types に ${OLD} が残っている`);
	return problems;
}
