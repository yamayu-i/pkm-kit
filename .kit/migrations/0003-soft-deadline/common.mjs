/** 0003 の migrate.mjs と check.mjs が共有するもの。依存なしの Node。キーの名前はこの移行を書いた時点のもので、後で変えない */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const OLD = "mid_due";
export const NEW = "soft_deadline";
export const TYPES = ".obsidian/types.json";
/** frontmatter を書き換えるフォルダ（直下の .md だけ。サブフォルダは作らない規約） */
const DIRS = ["issue", "template/file"];

/** 対象の md のパス（Vault ルートからの相対） */
export function targetFiles(root) {
	const out = [];
	for (const dir of DIRS) {
		const full = join(root, dir);
		if (!existsSync(full)) continue;
		for (const d of readdirSync(full, { withFileTypes: true })) {
			if (d.isFile() && d.name.endsWith(".md")) out.push(`${dir}/${d.name}`);
		}
	}
	return out.sort();
}

const KEY = (name) => new RegExp(`^${name}[ \\t]*:`, "m");

/**
 * frontmatter（先頭の --- から次の --- まで）を取り出す。なければ null。
 * 戻り値の start / end は、frontmatter の中身の位置
 */
export function frontmatter(text) {
	const m = /^---[ \t]*\r?\n/.exec(text);
	if (!m) return null;
	const start = m[0].length;
	const rest = text.slice(start);
	const end = rest.search(/^---[ \t]*(\r?\n|$)/m);
	if (end < 0) return null;
	return { start, end: start + end, body: rest.slice(0, end) };
}

/** ファイルの状態: none（旧名なし）、rename（書き換えられる）、conflict（新旧の両方がある） */
export function inspect(text) {
	const fm = frontmatter(text);
	if (fm === null || !KEY(OLD).test(fm.body)) return "none";
	return KEY(NEW).test(fm.body) ? "conflict" : "rename";
}

/** frontmatter の旧名のキーを新しい名前にする（値・行末・ほかの行は変えない） */
export function rename(text) {
	const fm = frontmatter(text);
	if (fm === null) return text;
	const body = fm.body.replace(new RegExp(`^${OLD}([ \\t]*:)`, "m"), `${NEW}$1`);
	return text.slice(0, fm.start) + body + text.slice(fm.end);
}

export function read(root, path) {
	return readFileSync(join(root, path), "utf8");
}

/** .obsidian/types.json（Obsidian のプロパティの型）。ないときは exists: false */
export function readTypes(root) {
	const full = join(root, TYPES);
	if (!existsSync(full)) return { exists: false };
	try {
		const value = JSON.parse(readFileSync(full, "utf8"));
		const types = value?.types;
		if (typeof types !== "object" || types === null || Array.isArray(types)) return { exists: true, value, types: null };
		return { exists: true, value, types };
	} catch {
		return { exists: true, error: `${TYPES} が JSON として読めない` };
	}
}
