/** 0089 の migrate.mjs と check.mjs が共有するもの。依存なしの Node */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const CORE = ".obsidian/core-plugins.json";

export function readJson(root, path) {
	const full = join(root, path);
	if (!existsSync(full)) return { exists: false, value: undefined };
	try {
		return { exists: true, value: JSON.parse(readFileSync(full, "utf8")) };
	} catch {
		return { exists: true, error: `${path} が JSON として読めない` };
	}
}

/** core-plugins.json が、キーと真偽値のオブジェクトか（古い配列の形などは扱わない） */
export function isObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
