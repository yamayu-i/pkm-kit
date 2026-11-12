/** 0120 の migrate.mjs と check.mjs が共有するもの。依存なしの Node */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const COMMUNITY = ".obsidian/community-plugins.json";
export const SLIDE = "pkm-slide";

export function readJson(root, path) {
	const full = join(root, path);
	if (!existsSync(full)) return { exists: false, value: undefined };
	try {
		return { exists: true, value: JSON.parse(readFileSync(full, "utf8")) };
	} catch {
		return { exists: true, error: `${path} が JSON として読めない` };
	}
}

export function hasSlide(value) {
	return Array.isArray(value) && value.includes(SLIDE);
}
