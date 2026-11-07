/** 0004 の migrate.mjs と check.mjs が共有するもの。依存なしの Node。キーの名前はこの移行を書いた時点のもので、後で変えない */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "member";

/** 対象の md のパス（Vault ルートからの相対。member/ の直下だけ） */
export function targetFiles(root) {
	const full = join(root, DIR);
	if (!existsSync(full)) return [];
	return readdirSync(full, { withFileTypes: true })
		.filter((d) => d.isFile() && d.name.endsWith(".md"))
		.map((d) => `${DIR}/${d.name}`)
		.sort();
}

export function read(root, path) {
	return readFileSync(join(root, path), "utf8");
}

/** 先頭の frontmatter の行（行末を含む）。なければ null */
function frontmatterLines(text) {
	const m = /^---[ \t]*\r?\n/.exec(text);
	if (!m) return null;
	const lines = [];
	let pos = m[0].length;
	while (pos < text.length) {
		const nl = text.indexOf("\n", pos);
		const line = nl < 0 ? text.slice(pos) : text.slice(pos, nl + 1);
		if (/^---[ \t]*(\r?\n)?$/.test(line)) return { start: m[0].length, end: pos, lines, eol: m[0].endsWith("\r\n") ? "\r\n" : "\n" };
		lines.push(line);
		pos += line.length;
	}
	return null;
}

const keyOf = (line) => /^([A-Za-z_][\w-]*)[ \t]*:/.exec(line)?.[1] ?? null;
/** 1 行に書いた値（引用符もそのまま）。値がない・ブロック（| / >）・複数行に続くときは null */
const scalarOf = (line) => {
	const v = line.replace(/^[^:]*:/, "").replace(/\r?\n$/, "").trim();
	return v === "" || /^[|>]/.test(v) ? null : v;
};

/**
 * ファイルの状態。
 * - add: 足す行（{ after: 何行目の後ろか, line }）。空なら何もしない
 * - problem: 足すべきなのに足せない理由（name や id が 1 行の値で読めない）。null なら問題なし
 */
export function inspect(text) {
	const fm = frontmatterLines(text);
	if (fm === null) return { add: [], problem: null };
	const index = (key) => fm.lines.findIndex((l) => keyOf(l) === key);
	const at = { id: index("id"), name: index("name"), nickname: index("nickname"), alias: index("alias") };
	if (at.nickname >= 0 && at.alias >= 0) return { add: [], problem: null };
	const name = at.name >= 0 ? scalarOf(fm.lines[at.name]) : null;
	const id = at.id >= 0 ? scalarOf(fm.lines[at.id]) : null;
	if (at.nickname < 0 && name === null) return { add: [], problem: "name が 1 行の値で読めないので nickname を足せない" };
	if (at.alias < 0 && id === null) return { add: [], problem: "id が 1 行の値で読めないので alias を足せない" };
	const add = [];
	if (at.nickname < 0) add.push({ after: at.name, line: `nickname: ${name}` });
	// alias は nickname の後ろ（nickname を足すなら、足した行の後ろ）に置く
	if (at.alias < 0) add.push({ after: at.nickname >= 0 ? at.nickname : at.name >= 0 ? at.name : at.id, line: `alias: ${id}` });
	return { add, problem: null, fm };
}

/** 足す行を入れた中身。ほかの行・行末・本文は変えない */
export function apply(text) {
	const { add, fm } = inspect(text);
	if (add.length === 0) return text;
	const out = [];
	fm.lines.forEach((line, i) => {
		out.push(line.endsWith("\n") ? line : line + fm.eol);
		for (const a of add) if (a.after === i) out.push(a.line + fm.eol);
	});
	return text.slice(0, fm.start) + out.join("") + text.slice(fm.end);
}
