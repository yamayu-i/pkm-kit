/** 0004 が終わった状態か。終わっていなければ、残っているものを返す */
import { inspect, read, targetFiles } from "./common.mjs";

export function check(root) {
	const problems = [];
	for (const path of targetFiles(root)) {
		const { add, problem } = inspect(read(root, path));
		if (problem) problems.push(`${path}: ${problem}（README の「スクリプトで扱えない場合」）`);
		else if (add.length > 0) problems.push(`${path}: ${add.map((a) => a.line.split(":")[0]).join(" と ")} がない`);
	}
	return problems;
}
