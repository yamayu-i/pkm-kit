/** 0190 の migrate.mjs と check.mjs が共有するもの。依存なしの Node。パスとキーはこの移行を書いた時点のもので、後で変えない */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "issue";
const SUB_MARKER = "<!-- sub-issue";
const SUB_END = "-->";
/** サブでなくした項目。deadline を先に見る（end にするのは deadline、なければ soft_deadline） */
const REMOVED = ["deadline", "soft_deadline"];
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

/** ブロック 1 つの項目の行の範囲（マーカーの次の行から、閉じの --> の前まで）。閉じがなければ null */
function headRange(lines) {
	const end = lines.findIndex((l, i) => i > 0 && l.trim() === SUB_END);
	return end < 0 ? null : { from: 1, to: end };
}

/**
 * ブロック 1 つを直す。なくした項目の行を消し、end がなければ deadline（なければ soft_deadline）を end にする。
 * start がその日より後なら end を start にする。直すものがなければ null
 */
function fixBlock(raw) {
	const lines = raw.split("\n");
	const range = headRange(lines);
	if (range === null) return null;
	const head = lines.slice(range.from, range.to);
	const removed = head.map((l, i) => ({ i, key: REMOVED.find((k) => valueOf(l, k) !== null) })).filter((r) => r.key !== undefined);
	if (removed.length === 0) return null;
	const get = (key) => head.map((l) => valueOf(l, key)).find((v) => v !== null) ?? null;
	const id = get("id") ?? "?";
	const end = get("end");
	const start = get("start");
	const values = REMOVED.map((k) => [k, get(k)]).filter(([, v]) => v !== null);
	const shown = values.map(([k, v]) => `${k} ${v}`).join("、");
	const cr = head[removed[0].i].endsWith("\r") ? "\r" : "";
	let endLine = null;
	let note;
	if (end !== null && end !== "" && end !== "null") {
		note = `サブ ${id}: ${shown} を消す（end ${end} を期限にする）`;
	} else {
		const due = values.map(([, v]) => v).find(isDate) ?? null;
		if (due === null) note = `サブ ${id}: ${shown} を消す（日付として読めないので end にしない）`;
		else {
			const to = isDate(start) && start > due ? start : due;
			endLine = `end: ${to}${cr}`;
			note = `サブ ${id}: ${shown} を消し、end を ${to} にする${to !== due ? `（start ${start} より前にできないため）` : ""}`;
		}
	}
	const drop = new Set(removed.map((r) => r.i));
	// end の行がもともとあれば（空の値）置き換える。なければ、消した最初の行の位置に置く
	const endAt = head.findIndex((l) => valueOf(l, "end") !== null);
	const next = [];
	head.forEach((l, i) => {
		if (endLine !== null && i === endAt) return next.push(endLine);
		if (drop.has(i)) {
			if (endLine !== null && endAt < 0 && i === removed[0].i) next.push(endLine);
			return;
		}
		next.push(l);
	});
	return { text: [...lines.slice(0, range.from), ...next, ...lines.slice(range.to)].join("\n"), note };
}

/** md のサブのなくした項目を直す。変えたことの文（なければ空）と、直した md */
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

/** なくした項目が残っているサブの id */
export function remaining(text) {
	const at = starts(text);
	const out = [];
	at.forEach((s, i) => {
		const lines = text.slice(s, at[i + 1] ?? text.length).split("\n");
		const range = headRange(lines);
		if (range === null) return;
		const head = lines.slice(range.from, range.to);
		if (head.some((l) => REMOVED.some((k) => valueOf(l, k) !== null))) out.push(head.map((l) => valueOf(l, "id")).find((v) => v !== null) ?? "?");
	});
	return out;
}
