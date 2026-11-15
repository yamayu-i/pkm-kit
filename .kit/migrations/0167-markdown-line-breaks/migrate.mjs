/** 通常の改行を Reading View でも残す。未設定は Obsidian の既定（false）なので変えない。 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { APP, readApp } from "./common.mjs";

export function migrate(root, { dryRun = false } = {}) {
	const app = readApp(root);
	if (app.error || app.value?.strictLineBreaks !== true) return [];
	if (!dryRun) writeFileSync(join(root, APP), JSON.stringify({ ...app.value, strictLineBreaks: false }, null, 2) + (app.text.endsWith("\n") ? "\n" : ""));
	return [`${APP}: strictLineBreaks を false にする（Reading View で通常の改行を残す）`];
}
