/** 0058 が終わった状態か。終わっていなければ、残っているものを返す */
import { existsSync } from "node:fs";
import { APPEARANCE, COMMUNITY, HOTKEYS, PLUGINS, RENAMED, readJson, renameHotkeys, SNIPPETS, same } from "./common.mjs";
import { join } from "node:path";

export function check(root) {
	const problems = [];
	const community = readJson(root, COMMUNITY);
	if (community.error) problems.push(community.error);
	else if (Array.isArray(community.value) && community.value.some((id) => id in RENAMED)) problems.push(`${COMMUNITY}: vault-* の ID が残っている`);

	const appearance = readJson(root, APPEARANCE);
	if (appearance.error) problems.push(appearance.error);
	else if (Array.isArray(appearance.value?.enabledCssSnippets) && appearance.value.enabledCssSnippets.some((s) => s in SNIPPETS)) problems.push(`${APPEARANCE}: スニペット vault-theme が残っている`);

	const hotkeys = readJson(root, HOTKEYS);
	if (hotkeys.error) problems.push(hotkeys.error);
	else if (hotkeys.exists && !same(renameHotkeys(hotkeys.value), hotkeys.value)) problems.push(`${HOTKEYS}: vault-* のコマンドのキーが残っている`);

	for (const [from, to] of Object.entries(RENAMED)) {
		if (existsSync(join(root, PLUGINS, from, "data.json")) && !existsSync(join(root, PLUGINS, to, "data.json"))) problems.push(`${PLUGINS}/${from}/data.json が ${to} へ写されていない`);
	}
	return problems;
}
