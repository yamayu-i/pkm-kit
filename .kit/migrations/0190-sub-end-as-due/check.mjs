import { read, remaining, targetFiles } from "./common.mjs";

export function check(root) {
	return targetFiles(root).flatMap((path) => remaining(read(root, path)).map((id) => `${path}: サブ ${id} に soft_deadline か deadline が残っている`));
}
