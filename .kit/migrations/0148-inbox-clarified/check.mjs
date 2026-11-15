/** 0148 が終わった状態か。終わっていなければ、残っているものを返す */
import { needsClarified, read, targetFiles } from "./common.mjs";

export function check(root) {
	return targetFiles(root)
		.filter((path) => needsClarified(read(root, path)))
		.map((path) => `${path}: 日付がある open の issue に clarified がない`);
}
