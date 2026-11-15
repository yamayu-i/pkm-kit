/**
 * 0135 の migrate.mjs と check.mjs が共有するもの。依存なしの Node。
 * 項目の名前と書式は、この移行を書いた時点のもの（.kit/src/docs/adr/0135-sub-issues-in-issue-file.md）で、後で変えない
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "issue";
export const MARKER = "<!-- sub-issue";
/** サブに写す項目（ADR-0135 の表）。この順に書く */
const COPY = ["summary", "status", "delegated_to", "scheduled", "soft_deadline", "deadline", "estimated", "created"];
/** 写さず、残しもしない項目（issue としての管理用） */
const DROP = new Set(["schema", "type", "id", "parent", "updated"]);
const ISSUE_ID = /^i-[1-9]\d*$/;

export function read(root, path) {
	return readFileSync(join(root, path), "utf8");
}

/** issue/ の直下の md（Vault ルートからの相対） */
export function issueFiles(root) {
	const full = join(root, DIR);
	if (!existsSync(full)) return [];
	return readdirSync(full, { withFileTypes: true })
		.filter((d) => d.isFile() && d.name.endsWith(".md"))
		.map((d) => `${DIR}/${d.name}`)
		.sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

/** 先頭の frontmatter。行（行末なし）と、frontmatter の後ろの本文。なければ null */
export function splitFrontmatter(text) {
	const eol = /\r\n/.test(text) ? "\r\n" : "\n";
	const m = /^---[ \t]*\r?\n/.exec(text);
	if (!m) return null;
	const rest = text.slice(m[0].length);
	const end = /^---[ \t]*(\r?\n|$)/m.exec(rest);
	if (!end) return null;
	const inner = rest.slice(0, end.index);
	return { eol, lines: inner === "" ? [] : inner.replace(/\r?\n$/, "").split(/\r?\n/), body: rest.slice(end.index + end[0].length) };
}

function unquote(v) {
	if (v.startsWith('"')) {
		try {
			return JSON.parse(v);
		} catch {
			return undefined;
		}
	}
	if (v.startsWith("'")) return v.endsWith("'") && v.length >= 2 ? v.slice(1, -1).replace(/''/g, "'") : undefined;
	return v.replace(/\s+#.*$/, "");
}

/** `[a, "b, c"]` の中身を分ける。読めなければ undefined */
function flowList(v) {
	const inner = v.slice(1, -1).trim();
	if (inner === "") return [];
	const out = [];
	let cur = "";
	let quote = null;
	for (const ch of inner) {
		if (quote) {
			cur += ch;
			if (ch === quote) quote = null;
		} else if (ch === '"' || ch === "'") {
			quote = ch;
			cur += ch;
		} else if (ch === ",") {
			out.push(cur.trim());
			cur = "";
		} else if (ch === "[" || ch === "{") return undefined;
		else cur += ch;
	}
	if (quote) return undefined;
	out.push(cur.trim());
	const items = out.map(unquote);
	return items.some((x) => x === undefined) ? undefined : items;
}

/**
 * issue の frontmatter に要る範囲の YAML を読む: `key: 値`（引用符の文字列、数、`[a, b]`）と、`- a` のリスト。
 * 入れ子・複数行の値など、読めない項目は unreadable に入れる
 */
export function parseFields(lines) {
	const fields = new Map();
	const unreadable = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line.trim() === "" || /^\s*#/.test(line)) continue;
		const m = /^([A-Za-z_][\w-]*)[ \t]*:(.*)$/.exec(line);
		if (!m) {
			unreadable.push(`${i + 1} 行目`);
			continue;
		}
		const [, key, rawValue] = m;
		const v = rawValue.trim();
		if (v === "") {
			const items = [];
			while (i + 1 < lines.length && /^\s+-\s*/.test(lines[i + 1])) items.push(unquote(lines[++i].replace(/^\s+-\s*/, "").trim()));
			if (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) {
				unreadable.push(key);
				while (i + 1 < lines.length && /^\s/.test(lines[i + 1])) i++;
				continue;
			}
			if (items.some((x) => x === undefined)) unreadable.push(key);
			else fields.set(key, items.length > 0 ? items : null);
			continue;
		}
		if (/^[|>]/.test(v) || v.startsWith("{")) {
			unreadable.push(key);
			while (i + 1 < lines.length && /^\s/.test(lines[i + 1])) i++;
			continue;
		}
		const value = v.startsWith("[") ? (v.endsWith("]") ? flowList(v) : undefined) : unquote(v);
		if (value === undefined) unreadable.push(key);
		else fields.set(key, value === "" || value === "null" || value === "~" ? null : value);
	}
	return { fields, unreadable };
}

/** 読んだ issue。読めないファイルは error を持つ */
export function readIssue(root, path) {
	const text = read(root, path);
	const fm = splitFrontmatter(text);
	if (!fm) return { path, text, error: "frontmatter が読めない" };
	const { fields, unreadable } = parseFields(fm.lines);
	const id = fields.get("id");
	const parent = fields.get("parent") ?? null;
	return { path, text, fm, fields, unreadable, id: typeof id === "string" && ISSUE_ID.test(id) ? id : null, parent: typeof parent === "string" ? parent : parent === null ? null : String(parent) };
}

/** 子の ID から、サブの id を決める（英小文字と数字の 6 文字。何度実行しても同じ）。taken と重なれば次の候補 */
export function subIdFor(childId, taken) {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
	for (let n = 0; ; n++) {
		const hash = createHash("sha256").update(n === 0 ? childId : `${childId}#${n}`).digest();
		const id = Array.from(hash.subarray(0, 6), (b) => chars[b % 36]).join("");
		if (!taken.has(id)) return id;
	}
}

/** md の中のサブの id と migrated_from（ADR-0135 の書式。行頭のマーカーから --> まで） */
export function existingSubs(text) {
	const out = [];
	const lines = text.split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		if (!lines[i].startsWith(MARKER)) continue;
		const sub = { id: null, migratedFrom: null };
		for (let j = i + 1; j < lines.length && lines[j].trim() !== "-->"; j++) {
			const m = /^(id|migrated_from)[ \t]*:[ \t]*["']?([^"'\s]+)["']?\s*$/.exec(lines[j]);
			if (m) sub[m[1] === "id" ? "id" : "migratedFrom"] = m[2];
		}
		out.push(sub);
	}
	return out;
}

const SAFE = /^[\w:+.-]+$/;
const scalar = (v) => (typeof v === "string" && SAFE.test(v) ? v : JSON.stringify(String(v)));
const display = (v) => (Array.isArray(v) ? `[${v.join(", ")}]` : String(v));

/**
 * 子の issue を、親の md の末尾に置くサブのブロックにする。書けないものは problem を返す（ブロックは作らない）
 * - 写す項目は ADR-0135 の表の順。写さない項目は、サブの本文の先頭に 1 行で残す
 */
export function subBlock(child, subId, eol) {
	const f = child.fields;
	if (child.unreadable.length > 0) return { problem: `frontmatter の ${child.unreadable.join(", ")} が読めない` };
	const summary = f.get("summary");
	const lines = [MARKER, `id: ${subId}`, `summary: ${JSON.stringify(typeof summary === "string" && summary.trim() ? summary : child.id)}`, `status: ${scalar(f.get("status") ?? "open")}`];
	for (const key of COPY.slice(2)) {
		const v = f.get(key);
		if (v === undefined || v === null) continue;
		lines.push(key === "scheduled" ? `scheduled: ${JSON.stringify((Array.isArray(v) ? v : [v]).map(String))}` : `${key}: ${scalar(v)}`);
	}
	lines.push(`migrated_from: ${child.id}`);
	const kept = [...f].filter(([k, v]) => !DROP.has(k) && !COPY.includes(k) && v !== null).map(([k, v]) => `${k}: ${display(v)}`);
	if (lines.some((l) => l.includes("-->"))) return { problem: "項目の値に --> がある（サブの項目に書けない）" };
	const body = child.fm.body.replace(/^(?:[ \t]*\r?\n)+/, "").trimEnd();
	const bodyLines = body === "" ? [] : body.split(/\r?\n/);
	if (bodyLines.some((l) => l.startsWith(MARKER))) return { problem: `本文の行頭に ${MARKER} がある（サブの本文に書けない）` };
	const keptLine = kept.length > 0 ? [`（移行で残した項目）${kept.join(" / ")}`] : [];
	if (keptLine.some((l) => l.includes("-->"))) {
		// 残す値の --> は本文に書けるが、念のため崩しておく
		keptLine[0] = keptLine[0].replace(/-->/g, "-- >");
	}
	const content = [...keptLine, ...(keptLine.length > 0 && bodyLines.length > 0 ? [""] : []), ...bodyLines];
	return { block: [...lines, "-->", ...content].join(eol) + eol, kept };
}

/**
 * 移行の計画。
 * - moves: 子（と孫）ごとに { child, top, subId, block, kept }
 * - related: related を書き換える issue ごとに { issue, from, to }
 * - problems: 扱えないもの（変えない）
 */
export function plan(root) {
	const issues = issueFiles(root).map((p) => readIssue(root, p));
	const problems = [];
	const byId = new Map();
	for (const i of issues) {
		if (i.error) {
			if (/^parent[ \t]*:/m.test(i.text)) problems.push(`${i.path}: ${i.error}（parent がありそう）`);
			continue;
		}
		if (i.unreadable.includes("parent")) {
			problems.push(`${i.path}: frontmatter の parent が読めない`);
			continue;
		}
		if (i.id && !byId.has(i.id)) byId.set(i.id, i);
	}
	const children = [...byId.values()].filter((i) => i.parent !== null);
	/** いちばん上の祖先。ない親・循環なら problem */
	const topOf = (issue) => {
		const seen = new Set([issue.id]);
		let cur = issue;
		while (cur.parent !== null) {
			const next = byId.get(cur.parent);
			if (!next) return { problem: `parent の ${cur.parent} がない${cur === issue ? "" : `（${cur.id} の親）`}` };
			if (seen.has(next.id)) return { problem: "親子関係が循環している" };
			seen.add(next.id);
			cur = next;
		}
		return { top: cur };
	};
	const moves = [];
	const blocked = new Set();
	const takenByTop = new Map();
	// 親の md の中の並び: いちばん上の祖先ごとに、子の ID の順に、その子の孫を続ける（深さ優先）
	const kids = new Map();
	for (const c of children) kids.set(c.parent, [...(kids.get(c.parent) ?? []), c]);
	const num = (id) => Number(id.slice(2));
	for (const list of kids.values()) list.sort((a, b) => num(a.id) - num(b.id));
	const order = [];
	const visit = (id, depth) => {
		for (const c of kids.get(id) ?? []) {
			if (depth > byId.size) return;
			order.push(c);
			visit(c.id, depth + 1);
		}
	};
	for (const root_ of [...byId.values()].filter((i) => i.parent === null).sort((a, b) => num(a.id) - num(b.id))) visit(root_.id, 0);
	for (const c of children) if (!order.includes(c)) order.push(c);
	for (const child of order) {
		const t = topOf(child);
		if (t.problem) {
			problems.push(`${child.path}: ${t.problem}`);
			blocked.add(child.id);
			continue;
		}
		const top = t.top;
		if (!takenByTop.has(top.id)) takenByTop.set(top.id, { ids: new Set(existingSubs(top.text).map((s) => s.id).filter(Boolean)), migrated: new Map(existingSubs(top.text).filter((s) => s.migratedFrom).map((s) => [s.migratedFrom, s.id])) });
		const taken = takenByTop.get(top.id);
		const done = taken.migrated.get(child.id);
		if (done) {
			// 前の実行で親に足し終え、子のファイルを消す前に止まったもの
			moves.push({ child, top, subId: done, block: null, kept: [] });
			continue;
		}
		const subId = subIdFor(child.id, taken.ids);
		const r = subBlock(child, subId, top.fm.eol);
		if (r.problem) {
			problems.push(`${child.path}: ${r.problem}`);
			blocked.add(child.id);
			continue;
		}
		taken.ids.add(subId);
		moves.push({ child, top, subId, block: r.block, kept: r.kept });
	}
	// 孫が止まったら、その祖先の子も消さない（孫の親が消えて読めなくなるため）
	const keep = new Set(blocked);
	for (const id of blocked) {
		let cur = byId.get(id);
		while (cur && cur.parent !== null && !keep.has(cur.parent)) {
			keep.add(cur.parent);
			cur = byId.get(cur.parent);
		}
	}
	const finalMoves = moves.filter((m) => !keep.has(m.child.id));
	for (const m of moves) if (keep.has(m.child.id) && !blocked.has(m.child.id)) problems.push(`${m.child.path}: 子か孫を変換できないので、この issue も変えない`);
	const keyOf = new Map(finalMoves.map((m) => [m.child.id, `${m.top.id}#${m.subId}`]));
	// 前の実行でサブにし終えた子（ファイルはもうない）も、related を書き換える
	for (const i of byId.values()) {
		for (const s of existingSubs(i.text)) {
			if (s.id && s.migratedFrom && !byId.has(s.migratedFrom) && !keyOf.has(s.migratedFrom)) keyOf.set(s.migratedFrom, `${i.id}#${s.id}`);
		}
	}
	const moved = new Set(keyOf.keys());
	const related = [];
	for (const i of byId.values()) {
		if (moved.has(i.id)) continue;
		const rel = i.fields.get("related");
		if (rel === undefined || rel === null) continue;
		const list = Array.isArray(rel) ? rel.map(String) : [String(rel)];
		const next = list.map((r) => keyOf.get(r) ?? r);
		if (next.some((r, n) => r !== list[n])) related.push({ issue: i, from: list, to: next });
	}
	return { moves: finalMoves, related, problems };
}

/** frontmatter の related の行（ブロックのリストなら続く行も）を、合成キーを入れた 1 行にする。ほかの行は変えない */
export function rewriteRelated(issue, to) {
	const { text } = issue;
	const eol = issue.fm.eol;
	const m = /^---[ \t]*\r?\n/.exec(text);
	const rest = text.slice(m[0].length);
	const end = /^---[ \t]*(\r?\n|$)/m.exec(rest);
	const lines = rest.slice(0, end.index).replace(/\r?\n$/, "").split(/\r?\n/);
	const at = lines.findIndex((l) => /^related[ \t]*:/.test(l));
	let n = 1;
	if (/^related[ \t]*:[ \t]*$/.test(lines[at])) while (at + n < lines.length && /^\s+-/.test(lines[at + n])) n++;
	lines.splice(at, n, `related: ${JSON.stringify(to)}`);
	return `${m[0]}${lines.join(eol)}${eol}${rest.slice(end.index)}`;
}

/** 親の md の末尾にブロックを足す（親の本文とほかのサブは変えない） */
export function appendBlocks(text, blocks, eol) {
	return `${text.replace(/\s+$/, "")}${eol}${eol}${blocks.join(eol)}`;
}
