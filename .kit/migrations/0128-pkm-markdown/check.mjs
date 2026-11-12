/** 0128 が終わった状態か。終わっていなければ、残っているものを返す */
import { COMMUNITY, CORE, hasPlugin, isObject, PLUGIN, readJson, TAG_PANE } from "./common.mjs";

export function check(root) {
	const problems = [];
	const community = readJson(root, COMMUNITY);
	if (community.error) problems.push(community.error);
	else if (!hasPlugin(community.value)) problems.push(`${COMMUNITY}: ${PLUGIN} が入っていない`);
	const core = readJson(root, CORE);
	if (core.error) problems.push(core.error);
	else if (!isObject(core.value)) problems.push(`${CORE}: キーと値のオブジェクトになっていない`);
	else if (core.value[TAG_PANE] !== false) problems.push(`${CORE}: ${TAG_PANE} が false になっていない`);
	return problems;
}
