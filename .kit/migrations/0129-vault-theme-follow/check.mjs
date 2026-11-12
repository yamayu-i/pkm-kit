/** 0129 が終わった状態か。終わっていなければ、残っているものを返す */
import { hasTheme, theme } from "./common.mjs";

export function check(root) {
	if (!hasTheme(root)) return [];
	const r = theme(root, "check");
	return r.ok ? [] : r.lines;
}
