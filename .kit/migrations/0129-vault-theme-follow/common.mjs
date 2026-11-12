/** 0129 の migrate.mjs と check.mjs が共有するもの。依存なしの Node */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

export const THEME = ".kit-local/theme.json";
export const SNIPPET = ".obsidian/snippets/pkm-theme-local.css";
export const CLI = ".kit/bin/theme.mjs";

export const hasTheme = (root) => existsSync(join(root, THEME));

/** 上流の theme.mjs を、この Vault をルートにして実行する */
export function theme(root, command) {
	const cli = join(root, CLI);
	if (!existsSync(cli)) return { ok: false, lines: [`${CLI} がない（上流の取り込みが終わっていない）`] };
	const r = spawnSync(process.execPath, [cli, command], { encoding: "utf8", env: { ...process.env, KIT_VAULT_ROOT: root } });
	const lines = `${r.stdout ?? ""}${r.stderr ?? ""}`.split("\n").filter((l) => l.trim() !== "");
	return { ok: r.status === 0, lines };
}
