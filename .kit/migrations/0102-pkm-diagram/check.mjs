/** 0102 が終わった状態か。終わっていなければ、残っているものを返す */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { COMMUNITY, FROM, HOTKEYS, PLUGINS, readJson, renameHotkeys, same, snippetPlan, TO } from "./common.mjs";

export function check(root) {
	const problems = [];
	const community = readJson(root, COMMUNITY);
	if (community.error) problems.push(community.error);
	else if (Array.isArray(community.value) && community.value.includes(FROM)) problems.push(`${COMMUNITY}: ${FROM} が残っている`);

	const hotkeys = readJson(root, HOTKEYS);
	if (hotkeys.error) problems.push(hotkeys.error);
	else if (hotkeys.exists && !same(renameHotkeys(hotkeys.value), hotkeys.value)) problems.push(`${HOTKEYS}: ${FROM}:* のコマンドのキーが残っている`);

	for (const plan of snippetPlan(root)) problems.push(`${plan.path}: command が ${FROM}:* のまま`);

	if (existsSync(join(root, PLUGINS, FROM, "data.json")) && !existsSync(join(root, PLUGINS, TO, "data.json"))) problems.push(`${PLUGINS}/${FROM}/data.json が ${TO} へ写されていない`);
	return problems;
}
