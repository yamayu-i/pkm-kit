/** 0089 が終わった状態か。終わっていなければ、残っているものを返す */
import { CORE, isObject, readJson } from "./common.mjs";

export function check(root) {
	const core = readJson(root, CORE);
	if (core.error) return [core.error];
	if (!isObject(core.value)) return [`${CORE}: キーと値のオブジェクトになっていない`];
	if (core.value["file-recovery"] !== true) return [`${CORE}: file-recovery が true になっていない`];
	return [];
}
