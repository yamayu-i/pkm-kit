/** 0137 の migrate.mjs と check.mjs が共有するもの。依存なしの Node。パスとキーはこの移行を書いた時点のもので、後で変えない */
import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** 廃止したグループの定義 */
export const GROUPS = "issue/board-groups.json";
/** routine と、子が重ねた routine のテンプレート */
const DIRS = ["routine"];
const TEMPLATES = ["template/file/routine.md"];

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
	// シンボリックリンクはたどらない（Vault の外に書かない）
	for (const path of TEMPLATES) if (existsSync(join(root, path)) && lstatSync(join(root, path)).isFile()) out.push(path);
	return out.sort();
}

/** frontmatter（先頭の --- から次の --- まで）の中身の位置。なければ null */
function frontmatter(text) {
	const m = /^---[ \t]*\r?\n/.exec(text);
	if (!m) return null;
	const start = m[0].length;
	const end = text.slice(start).search(/^---[ \t]*(\r?\n|$)/m);
	return end < 0 ? null : { start, end: start + end };
}

/**
 * frontmatter の group の行（1 行の値）。字下げした続きの行（入れ子・複数行の値）があれば unreadable。
 * なければ null
 */
export function groupLine(text) {
	const fm = frontmatter(text);
	if (fm === null) return null;
	const body = text.slice(fm.start, fm.end);
	const m = /^group[ \t]*:[^\r\n]*(\r?\n|$)/m.exec(body);
	if (!m) return null;
	const after = body.slice(m.index + m[0].length);
	if (/^[ \t]+\S/.test(after) || /^group[ \t]*:[ \t]*[|>]/.test(m[0])) return { unreadable: true };
	return { from: fm.start + m.index, to: fm.start + m.index + m[0].length };
}

/** group の行だけを消す（ほかの行と行末は変えない） */
export function removeGroup(text) {
	const line = groupLine(text);
	if (line === null || line.unreadable) return text;
	return text.slice(0, line.from) + text.slice(line.to);
}

export function read(root, path) {
	return readFileSync(join(root, path), "utf8");
}
