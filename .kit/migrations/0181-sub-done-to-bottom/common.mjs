/** 0181 の migrate.mjs と check.mjs が共有するもの。依存なしの Node。パスとキーはこの移行を書いた時点のもので、後で変えない */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "issue";
const SUB_MARKER = "<!-- sub-issue";
const SUB_END = "-->";
const DONE = new Set(["closed", "canceled"]);

/** issue の md のパス（Vault ルートからの相対）。サブフォルダとシンボリックリンクは見ない */
export function targetFiles(root) {
	const full = join(root, DIR);
	if (!existsSync(full)) return [];
	return readdirSync(full, { withFileTypes: true })
		.filter((d) => d.isFile() && /^i-\d+\.md$/.test(d.name))
		.map((d) => `${DIR}/${d.name}`)
		.sort();
}

export const read = (root, path) => readFileSync(join(root, path), "utf8");

/** サブのブロックの先頭の位置（frontmatter の後ろの、行頭のマーカー） */
function starts(text) {
	const fm = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.exec(text);
	const out = [];
	let pos = fm ? fm[0].length : 0;
	while (pos <= text.length) {
		if (text.startsWith(SUB_MARKER, pos)) {
			const next = text[pos + SUB_MARKER.length];
			if (next === undefined || next === "\n" || next === "\r" || next === " ") out.push(pos);
		}
		const nl = text.indexOf("\n", pos);
		if (nl < 0) break;
		pos = nl + 1;
	}
	return out;
}

/** ブロックが終わったサブか。閉じの --> がない・status が読めないブロックは、終わっていないものとして扱う */
function isDone(raw) {
	const lines = raw.split(/\r?\n/);
	const end = lines.findIndex((l, i) => i > 0 && l.trim() === SUB_END);
	if (end < 0) return false;
	const status = [lines[0].slice(SUB_MARKER.length), ...lines.slice(1, end)].map((l) => /^status:\s*["']?([a-z-]+)["']?\s*$/.exec(l)?.[1]).find((s) => s !== undefined);
	return status !== undefined && DONE.has(status);
}

/** md を、親の部分とサブのブロックに分ける。サブがなければ blocks は空 */
export function split(text) {
	const at = starts(text);
	if (at.length === 0) return { head: text, blocks: [] };
	return { head: text.slice(0, at[0]), blocks: at.map((s, i) => text.slice(s, at[i + 1] ?? text.length)) };
}

/** 終わったサブが、終わっていないサブより前にあるか */
export function needsMove(text) {
	const flags = split(text).blocks.map(isDone);
	const firstDone = flags.indexOf(true);
	return firstDone >= 0 && flags.slice(firstDone).includes(false);
}

/** 終わったサブのブロックを、元の順のまま末尾へ移す（終わっていないものも元の順）。本文とブロックの中身は変えない */
export function moveDoneToEnd(text) {
	if (!needsMove(text)) return text;
	const { head, blocks } = split(text);
	const eol = text.includes("\r\n") ? "\r\n" : "\n";
	const whole = blocks.map((b) => (/\n$/.test(b) ? b : `${b}${eol}`));
	return head + [...whole.filter((b) => !isDone(b)), ...whole.filter(isDone)].join("");
}
