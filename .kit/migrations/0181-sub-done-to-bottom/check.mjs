import { needsMove, read, targetFiles } from "./common.mjs";

export function check(root) {
	return targetFiles(root)
		.filter((path) => needsMove(read(root, path)))
		.map((path) => `${path}: 終わったサブ（closed / canceled）が、終わっていないサブより前にある`);
}
