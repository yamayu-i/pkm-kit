/** 0005 の migrate.mjs と check.mjs が共有するもの。依存なしの Node */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const COMMUNITY = ".obsidian/community-plugins.json";
export const HTML = "vault-html";
/** 0058 で改名した後の ID。入っていれば、有効になっているものとして扱う（ADR-0058） */
const HTML_IDS = [HTML, "pkm-html"];

/** community-plugins.json の値に、HTML のプラグインが入っているか */
export function hasHtml(value) {
	return Array.isArray(value) && value.some((id) => HTML_IDS.includes(id));
}

export function readJson(root, path) {
	const full = join(root, path);
	if (!existsSync(full)) return { exists: false, value: undefined };
	try {
		return { exists: true, value: JSON.parse(readFileSync(full, "utf8")) };
	} catch {
		return { exists: true, error: `${path} が JSON として読めない` };
	}
}
