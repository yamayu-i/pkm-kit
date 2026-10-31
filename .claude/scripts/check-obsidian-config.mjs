#!/usr/bin/env node
/**
 * .obsidian/ 直下の JSON に末尾改行がないことを検査する。
 * Obsidian は設定を末尾改行なしで保存するので、改行付きでコミットするとアプリで開いたときに差分が出る。
 *
 * 使い方: node .claude/scripts/check-obsidian-config.mjs [.obsidian のパス]
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export function checkObsidianConfig(dir) {
	return readdirSync(dir)
		.filter((f) => f.endsWith(".json") && !f.startsWith("workspace"))
		.filter((f) => readFileSync(join(dir, f), "utf8").endsWith("\n"))
		.map((f) => `${f}: 末尾の改行を取り除く（Obsidian は改行なしで保存するので、差分が出る）`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const dir = process.argv[2] ?? fileURLToPath(new URL("../../.obsidian", import.meta.url));
	const errors = checkObsidianConfig(dir);
	for (const e of errors) console.error(e);
	if (errors.length) process.exit(1);
	console.log("Obsidian の設定: OK");
}
