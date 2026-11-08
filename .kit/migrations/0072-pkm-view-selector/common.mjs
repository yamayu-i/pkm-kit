/** 0072 の migrate.mjs と check.mjs が共有するもの。依存なしの Node */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const COMMUNITY = ".obsidian/community-plugins.json";
export const HOTKEYS = ".obsidian/hotkeys.json";
export const PLUGIN = "pkm-view-selector";
/** Obsidian の既定で Mod+K の「Markdown リンクを挿入」。空の配列でホットキーを外す */
export const INSERT_LINK = "editor:insert-link";

export function readJson(root, path) {
	const full = join(root, path);
	if (!existsSync(full)) return { exists: false, value: undefined };
	try {
		return { exists: true, value: JSON.parse(readFileSync(full, "utf8")) };
	} catch {
		return { exists: true, error: `${path} が JSON として読めない` };
	}
}

export function hasPlugin(value) {
	return Array.isArray(value) && value.includes(PLUGIN);
}

export function isObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function linkUnbound(value) {
	const keys = isObject(value) ? value[INSERT_LINK] : undefined;
	return Array.isArray(keys) && keys.length === 0;
}
