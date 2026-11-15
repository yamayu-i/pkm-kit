/** 0167 の migrate と check の共有処理。依存なしの Node。 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const APP = ".obsidian/app.json";

export function readApp(root) {
	const path = join(root, APP);
	if (!existsSync(path)) return { value: null, text: "" };
	try {
		const text = readFileSync(path, "utf8");
		const value = JSON.parse(text);
		if (typeof value !== "object" || value === null || Array.isArray(value)) return { error: `${APP}: キーと値のオブジェクトになっていない` };
		if (Object.hasOwn(value, "strictLineBreaks") && typeof value.strictLineBreaks !== "boolean") return { error: `${APP}: strictLineBreaks が真偽値でない` };
		return { value, text };
	} catch {
		return { error: `${APP} が JSON として読めない` };
	}
}
