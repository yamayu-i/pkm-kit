/** 0245 の migrate.mjs と check.mjs が共有するもの。依存なしの Node。パスとキーはこの移行を書いた時点のもので、後で変えない */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "issue";
const SUB_MARKER = "<!-- sub-issue";
const SUB_END = "-->";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

const isDate = (v) => typeof v === "string" && DATE_RE.test(v) && !Number.isNaN(Date.parse(v));
/** 値がない（行がない・空・null・~） */
const isEmpty = (v) => v === null || v === "" || v === "null" || v === "~";

/** ブロック 1 つの項目の行の範囲（マーカーの次の行から、閉じの --> の前まで）。閉じがなければ null */
function headRange(lines) {
	const end = lines.findIndex((l, i) => i > 0 && l.trim() === SUB_END);
	return end < 0 ? null : { from: 1, to: end };
}

/** 項目の行から、期間の片方だけを持つか（start / end のどちらが空か）を調べる。片方だけでなければ null */
function half(head) {
	const get = (key) => head.map((l) => valueOf(l, key)).find((v) => v !== null) ?? null;
	const start = get("start");
	const end = get("end");
	if (isEmpty(start) === isEmpty(end)) return null;
	const have = isEmpty(start) ? "end" : "start";
	return { id: get("id") ?? "?", have, missing: have === "start" ? "end" : "start", value: have === "start" ? start : end };
}

/**
 * ブロック 1 つを直す。期間が片方だけなら、もう片方を同じ日にする（Timeline が描いていた 1 日の棒と同じ）。
 * 残っている値が日付として読めなければ直さない（check に残す）。直すものがなければ null
 */
function fixBlock(raw) {
	const lines = raw.split("\n");
	const range = headRange(lines);
	if (range === null) return null;
	const head = lines.slice(range.from, range.to);
	const h = half(head);
	if (h === null || !isDate(h.value)) return null;
	const haveAt = head.findIndex((l) => valueOf(l, h.have) !== null);
	const cr = head[haveAt].endsWith("\r") ? "\r" : "";
	const line = `${h.missing}: ${h.value}${cr}`;
	// 空の行がもともとあれば置き換える。なければ、残っている方の行の前（start）か後ろ（end）に置く
	const missingAt = head.findIndex((l) => valueOf(l, h.missing) !== null);
	const next = [...head];
	if (missingAt >= 0) next[missingAt] = line;
	else next.splice(h.missing === "start" ? haveAt : haveAt + 1, 0, line);
	return { text: [...lines.slice(0, range.from), ...next, ...lines.slice(range.to)].join("\n"), note: `サブ ${h.id}: ${h.have} ${h.value} だけなので、${h.missing} も ${h.value} にする` };
}

/** md のサブの片方だけの期間をそろえる。変えたことの文（なければ空）と、直した md */
export function fixText(text) {
	const at = starts(text);
	if (at.length === 0) return { text, notes: [] };
	const notes = [];
	let out = text.slice(0, at[0]);
	at.forEach((s, i) => {
		const raw = text.slice(s, at[i + 1] ?? text.length);
		const r = fixBlock(raw);
		if (r === null) out += raw;
		else {
			out += r.text;
			notes.push(r.note);
		}
	});
	return { text: out, notes };
}

/** 期間が片方だけのサブ（id と、残っている方）。直せなかった値も含む */
export function remaining(text) {
	const at = starts(text);
	const out = [];
	at.forEach((s, i) => {
		const lines = text.slice(s, at[i + 1] ?? text.length).split("\n");
		const range = headRange(lines);
		if (range === null) return;
		const h = half(lines.slice(range.from, range.to));
		if (h !== null) out.push(h);
	});
	return out;
}
