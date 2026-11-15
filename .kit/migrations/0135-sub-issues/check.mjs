/** 0135 が終わった状態か。終わっていなければ、残っているものを返す */
import { plan } from "./common.mjs";

export function check(root) {
	const { moves, related, problems } = plan(root);
	return [
		...problems.map((p) => `${p}（README の「スクリプトで扱えない場合」）`),
		...moves.map((m) => `${m.child.path}: parent（${m.child.parent}）が残っている`),
		...related.map((r) => `${r.issue.path}: related にサブにした issue の ID が残っている`),
	];
}
