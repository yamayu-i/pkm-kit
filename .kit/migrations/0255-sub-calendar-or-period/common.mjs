/** 0255 の migrate.mjs と check.mjs が共有するもの。依存なしの Node。パスとキーはこの移行を書いた時点のもので、後で変えない */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "issue";
const SUB_MARKER = "<!-- sub-issue";
const SUB_END = "-->";

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

/** 項目の行の値（引用符を外す）。キーがその行のものでなければ null */
function valueOf(line, key) {
	const m = new RegExp(`^${key}:\\s*(.*?)\\s*$`).exec(line.replace(/\r$/, ""));
	if (!m) return null;
	return m[1].replace(/^(["'])(.*)\1$/, "$2");
}

/** 値がない（行がない・空・null・~） */
const isEmpty = (v) => v === null || v === "" || v === "null" || v === "~";

/**
 * Calendar の日（scheduled）と期間（start・end）の両方を持つサブ（ADR-0255）。
 * どちらが正しいかは機械で決められないので、直さずに報告する（id・scheduled・期間の文字）
 */
export function remaining(text) {
	const at = starts(text);
	const out = [];
	at.forEach((s, i) => {
		const lines = text.slice(s, at[i + 1] ?? text.length).split("\n");
		const end = lines.findIndex((l, j) => j > 0 && l.trim() === SUB_END);
		if (end < 0) return;
		const head = lines.slice(1, end);
		const get = (key) => head.map((l) => valueOf(l, key)).find((v) => v !== null) ?? null;
		const scheduled = get("scheduled");
		const start = get("start");
		const finish = get("end");
		if (isEmpty(scheduled) || (isEmpty(start) && isEmpty(finish))) return;
		out.push({ id: get("id") ?? "?", scheduled, period: `${isEmpty(start) ? "" : start}–${isEmpty(finish) ? "" : finish}` });
	});
	return out;
}
