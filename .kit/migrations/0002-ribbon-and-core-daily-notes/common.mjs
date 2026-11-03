/** 0002 の migrate.mjs と check.mjs が共有するもの。依存なしの Node。基準の値はこの移行を書いた時点のもので、後で変えない */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const CORE = ".obsidian/core-plugins.json";
export const COMMUNITY = ".obsidian/community-plugins.json";
export const DAILY = ".obsidian/daily-notes.json";
export const RIBBON = "vault-ribbon";
/** 上流が以前求めていた daily-notes.json の値と、Obsidian の既定の値。これ以外の値があれば、子が変えたものとして残す */
const DAILY_DEFAULTS = { folder: "daily", format: "YYYY/MM/YYYY-MM-DD", template: "", autorun: false };

export function readJson(root, path) {
	const full = join(root, path);
	if (!existsSync(full)) return { exists: false, value: undefined };
	try {
		return { exists: true, value: JSON.parse(readFileSync(full, "utf8")) };
	} catch {
		return { exists: true, error: `${path} が JSON として読めない` };
	}
}

/** daily-notes.json が、既定の値だけを持つか（消してよいか） */
export function isDefaultDaily(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
	return Object.entries(value).every(([k, v]) => k in DAILY_DEFAULTS && DAILY_DEFAULTS[k] === v);
}
