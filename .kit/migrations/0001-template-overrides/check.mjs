/** 0001 が終わった状態か。終わっていなければ、残っているものを返す */
import { CONFIG, identicalTemplates, reducedConfig } from "./common.mjs";

export function check(root) {
	const problems = identicalTemplates(root).map((p) => `${p}: 上流（切り出した時点）と同じ中身のまま残っている`);
	const config = reducedConfig(root);
	if (config === "delete") problems.push(`${CONFIG}: 上流と同じなのに残っている`);
	else if (config?.error) problems.push(config.error);
	else if (config?.text && config.text !== config.current) problems.push(`${CONFIG}: 上流と同じ項目が残っている（上流と違う項目だけにする）`);
	return problems;
}
