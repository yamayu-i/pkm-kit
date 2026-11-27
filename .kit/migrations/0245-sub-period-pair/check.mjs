import { read, remaining, targetFiles } from "./common.mjs";

export function check(root) {
	return targetFiles(root).flatMap((path) => remaining(read(root, path)).map((h) => `${path}: サブ ${h.id} の期間が ${h.have}（${h.value}）だけ`));
}
