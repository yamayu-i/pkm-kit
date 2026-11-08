/** 0061 が終わった状態か。template/config.json が残っていれば、それを返す */
import { CONFIG, readConfig } from "./common.mjs";

export function check(root) {
	const config = readConfig(root);
	if (!config) return [];
	return [config.error ?? `${CONFIG}: 残っている`];
}
