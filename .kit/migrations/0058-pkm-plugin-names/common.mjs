/** 0058 の migrate.mjs と check.mjs が共有するもの。依存なしの Node。基準の値はこの移行を書いた時点のもので、後で変えない */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const COMMUNITY = ".obsidian/community-plugins.json";
export const APPEARANCE = ".obsidian/appearance.json";
export const HOTKEYS = ".obsidian/hotkeys.json";
export const PLUGINS = ".obsidian/plugins";
/** 改名したプラグイン（旧 ID → 新 ID） */
export const RENAMED = { "vault-git": "pkm-git", "vault-task": "pkm-task", "vault-template": "pkm-template", "vault-ribbon": "pkm-ribbon", "vault-html": "pkm-html" };
export const SNIPPETS = { "vault-theme": "pkm-theme" };

export function readJson(root, path) {
	const full = join(root, path);
	if (!existsSync(full)) return { exists: false, value: undefined };
	try {
		const text = readFileSync(full, "utf8");
		return { exists: true, value: JSON.parse(text), newline: text.endsWith("\n") };
	} catch {
		return { exists: true, error: `${path} が JSON として読めない` };
	}
}

/** ID の配列の旧名を新名にする。新旧の両方があれば新しい方だけを残す。順は残す */
export function renameIds(ids, table) {
	if (!Array.isArray(ids)) return ids;
	const out = [];
	for (const id of ids) {
		const next = typeof id === "string" && id in table ? table[id] : id;
		if (next !== id && ids.includes(next)) continue;
		if (!out.includes(next)) out.push(next);
	}
	return out;
}

/** hotkeys.json のキー（`<プラグイン ID>:<コマンド>`）の旧名を新名にする。新旧の両方があれば新しい方を残す */
export function renameHotkeys(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return value;
	const out = {};
	for (const [key, keys] of Object.entries(value)) {
		const at = key.indexOf(":");
		const plugin = at < 0 ? key : key.slice(0, at);
		if (!(plugin in RENAMED)) {
			out[key] = keys;
			continue;
		}
		const next = RENAMED[plugin] + key.slice(at);
		if (next in value) continue;
		out[next] = keys;
	}
	return out;
}

/** 旧 ID の data.json の写し方。copy: 新しい方へ写す、remove: 古いフォルダを消してよい */
export function dataPlan(root) {
	const plans = [];
	for (const [from, to] of Object.entries(RENAMED)) {
		const oldDir = join(root, PLUGINS, from);
		const oldData = join(oldDir, "data.json");
		if (!existsSync(oldData)) continue;
		const newData = join(root, PLUGINS, to, "data.json");
		const copy = !existsSync(newData);
		const same = copy || readFileSync(newData, "utf8") === readFileSync(oldData, "utf8");
		const onlyData = readdirSync(oldDir).every((name) => name === "data.json");
		plans.push({ from, to, oldDir, oldData, newData, copy, remove: same && onlyData });
	}
	return plans;
}

export const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
