/** 0072 が終わった状態か。終わっていなければ、残っているものを返す */
import { COMMUNITY, hasPlugin, HOTKEYS, INSERT_LINK, isObject, linkUnbound, PLUGIN, readJson } from "./common.mjs";

export function check(root) {
	const problems = [];
	const community = readJson(root, COMMUNITY);
	if (community.error) problems.push(community.error);
	else if (!hasPlugin(community.value)) problems.push(`${COMMUNITY}: ${PLUGIN} が入っていない`);
	const hotkeys = readJson(root, HOTKEYS);
	if (hotkeys.error) problems.push(hotkeys.error);
	else if (hotkeys.exists && !isObject(hotkeys.value)) problems.push(`${HOTKEYS} がオブジェクトではない`);
	else if (!linkUnbound(hotkeys.value)) problems.push(`${HOTKEYS}: ${INSERT_LINK} が [] ではない（Mod+K が Markdown リンクの挿入と衝突する）`);
	return problems;
}
