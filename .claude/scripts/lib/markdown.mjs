// Markdown を検査するための小さな道具。依存パッケージを使わない（.claude/docs/adr/0005-checks-in-ci.md）。
import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/** コードブロックとインラインコードを空白に置き換える（行番号を保つ）。 */
export function stripCode(text) {
	const lines = text.split("\n");
	let fence = null;
	const out = [];
	for (const line of lines) {
		const m = line.match(/^\s*(`{3,}|~{3,})/);
		if (fence) {
			if (m && m[1][0] === fence[0] && m[1].length >= fence.length) fence = null;
			out.push("");
			continue;
		}
		if (m) {
			fence = m[1];
			out.push("");
			continue;
		}
		out.push(line.replace(/`+[^`]*`+/g, (s) => " ".repeat(s.length)));
	}
	return out.join("\n");
}

/** frontmatter を読む。対応するのは `key: value`、`key: [a, b]`、`- item` のリストだけ。 */
export function parseFrontmatter(text) {
	if (!text.startsWith("---\n") && !text.startsWith("---\r\n")) return { data: null, body: text, bodyLine: 1 };
	const lines = text.split(/\r?\n/);
	const end = lines.indexOf("---", 1);
	if (end === -1) return { data: null, body: text, bodyLine: 1, error: "frontmatter が閉じていない" };
	const data = {};
	let key = null;
	for (const raw of lines.slice(1, end)) {
		if (!raw.trim() || raw.trimStart().startsWith("#")) continue;
		const item = raw.match(/^\s+-\s*(.*)$/);
		if (item && key) {
			if (!Array.isArray(data[key])) data[key] = [];
			data[key].push(unquote(item[1]));
			continue;
		}
		const kv = raw.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
		if (!kv) continue;
		key = kv[1];
		const value = kv[2].trim();
		if (value === "") data[key] = [];
		else if (value.startsWith("[") && value.endsWith("]"))
			data[key] = value
				.slice(1, -1)
				.split(",")
				.map((s) => unquote(s.trim()))
				.filter(Boolean);
		else data[key] = unquote(value);
	}
	return { data, body: lines.slice(end + 1).join("\n"), bodyLine: end + 2 };
}

function unquote(s) {
	const m = s.match(/^(["'])(.*)\1$/);
	return m ? m[2] : s;
}

/** Markdown リンクを取り出す。`![…](…)` は embed: true。行番号は 1 始まり。 */
export function extractLinks(text) {
	const links = [];
	const lines = stripCode(text).split("\n");
	lines.forEach((line, i) => {
		for (const m of line.matchAll(/(!?)\[(?:[^\]\\]|\\.)*\]\(\s*(<[^>]*>|[^\s)]+)(?:\s+"[^"]*")?\s*\)/g)) {
			let target = m[2];
			if (target.startsWith("<")) target = target.slice(1, -1);
			links.push({ embed: m[1] === "!", target, line: i + 1 });
		}
	});
	return links;
}

/** wiki リンク（`[[…]]`、`![[…]]`）の行番号。 */
export function findWikiLinks(text) {
	const found = [];
	stripCode(text)
		.split("\n")
		.forEach((line, i) => {
			if (/!?\[\[[^\]]+\]\]/.test(line)) found.push(i + 1);
		});
	return found;
}

export function isExternal(target) {
	return /^[a-z][a-z0-9+.-]*:/i.test(target);
}

/** リンク先からアンカーを外し、%エンコードを戻す。 */
export function splitTarget(target) {
	const hash = target.indexOf("#");
	const path = hash === -1 ? target : target.slice(0, hash);
	const anchor = hash === -1 ? "" : target.slice(hash + 1);
	let decoded = path;
	try {
		decoded = decodeURIComponent(path);
	} catch {
		// そのまま使う
	}
	return { path: decoded, anchor };
}

/** dir 以下のファイルを列挙する。skip(relPath, isDir) が true のものは辿らない。パスは / 区切り。 */
export function walk(root, skip = () => false, dir = root) {
	const out = [];
	for (const name of readdirSync(dir).sort()) {
		const abs = join(dir, name);
		const rel = relative(root, abs).split(sep).join("/");
		const isDir = statSync(abs).isDirectory();
		if (skip(rel, isDir)) continue;
		if (isDir) out.push(...walk(root, skip, abs));
		else out.push(rel);
	}
	return out;
}
