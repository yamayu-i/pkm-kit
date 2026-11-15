/** 0152 が終わった状態か。終わっていなければ、残っているものを返す */
import { read, remaining, targetFiles } from "./common.mjs";

export function check(root) {
	const problems = [];
	for (const path of targetFiles(root)) {
		const r = remaining(read(root, path));
		if (!r.any) continue;
		problems.push(r.unreadable ? `${path}: scheduled のリストに日付でない値があり、直せない（README の「スクリプトで扱えない場合」）` : `${path}: scheduled がリストのまま残っている`);
	}
	return problems;
}
