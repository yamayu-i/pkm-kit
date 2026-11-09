/** 0102 の migrate.mjs と check.mjs が共有するもの。依存なしの Node。基準の値はこの移行を書いた時点のもので、後で変えない */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const COMMUNITY = ".obsidian/community-plugins.json";
export const HOTKEYS = ".obsidian/hotkeys.json";
export const PLUGINS = ".obsidian/plugins";
export const SNIPPET_DIR = "template/snippet";
export const FROM = "pkm-drawio";
export const TO = "pkm-diagram";

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
export function renameIds(ids) {
	if (!Array.isArray(ids)) return ids;
	const out = [];
	for (const id of ids) {
		const next = id === FROM ? TO : id;
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
		if (!key.startsWith(`${FROM}:`)) {
			out[key] = keys;
			continue;
		}
		const next = TO + key.slice(FROM.length);
		if (next in value) continue;
		out[next] = keys;
	}
	return out;
}

/** スニペットの frontmatter の `command: pkm-drawio:<コマンド>` の行（ADR-0094） */
const COMMAND_LINE = new RegExp(`^(command:\\s*["']?)${FROM}:`, "m");

/** template/snippet/*.md のうち、旧名のコマンドを呼ぶもの。{ path, text, next } */
export function snippetPlan(root) {
	const dir = join(root, SNIPPET_DIR);
	if (!existsSync(dir)) return [];
	const plans = [];
	for (const name of readdirSync(dir).filter((n) => n.endsWith(".md")).sort()) {
		const path = `${SNIPPET_DIR}/${name}`;
		const text = readFileSync(join(root, path), "utf8");
		const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
		if (!fm || !COMMAND_LINE.test(fm[1])) continue;
		const next = text.slice(0, fm.index) + fm[0].replace(COMMAND_LINE, `$1${TO}:`) + text.slice(fm.index + fm[0].length);
		plans.push({ path, next });
	}
	return plans;
}

/** 旧 ID の data.json の写し方。copy: 新しい方へ写す、remove: 古いフォルダを消してよい */
export function dataPlan(root) {
	const oldDir = join(root, PLUGINS, FROM);
	const oldData = join(oldDir, "data.json");
	if (!existsSync(oldData)) return null;
	const newData = join(root, PLUGINS, TO, "data.json");
	const copy = !existsSync(newData);
	const same = copy || readFileSync(newData, "utf8") === readFileSync(oldData, "utf8");
	const onlyData = readdirSync(oldDir).every((name) => name === "data.json");
	return { oldDir, oldData, newData, copy, remove: same && onlyData };
}

export const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
