/** 0152 の migrate.mjs と check.mjs が共有するもの。依存なしの Node。パスとキーはこの移行を書いた時点のもので、後で変えない */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "issue";
const SUB_MARKER = "<!-- sub-issue";
const SUB_END = "-->";
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** issue の md のパス（Vault ルートからの相対）。サブフォルダとシンボリックリンクは見ない */
export function targetFiles(root) {
	const full = join(root, DIR);
	if (!existsSync(full)) return [];
	return readdirSync(full, { withFileTypes: true })
		.filter((d) => d.isFile() && /^i-\d+\.md$/.test(d.name))
		.map((d) => `${DIR}/${d.name}`)
		.sort();
}

/** 移行した日（ローカルの日付）。これより前の日付は消す */
export function localToday(now = new Date()) {
	const p = (n) => String(n).padStart(2, "0");
	return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

const unquote = (s) => s.trim().replace(/^["']|["']$/g, "");
const bare = (line) => line.replace(/\r$/, "");

/** 項目を読む範囲（行番号の [from, to)）: frontmatter と、本文のサブイシューのブロック（ADR-0135） */
function ranges(lines) {
	const out = [];
	if (bare(lines[0] ?? "").trim() === "---") {
		const end = lines.findIndex((l, i) => i > 0 && /^---[ \t]*$/.test(bare(l)));
		if (end > 0) out.push([1, end]);
	}
	for (let i = 0; i < lines.length; i++) {
		if (!lines[i].startsWith(SUB_MARKER)) continue;
		const end = lines.findIndex((l, k) => k > i && bare(l).trim() === SUB_END);
		if (end < 0) break;
		out.push([i + 1, end]);
		i = end;
	}
	return out;
}

/**
 * lines[i] が `scheduled:` のリストなら、その行の数（count）と日付（values）。今の形（日付 1 つ）なら null。
 * 日付でない要素があれば unreadable
 */
function listAt(lines, i) {
	const m = /^scheduled[ \t]*:(.*)$/.exec(bare(lines[i]));
	if (!m) return null;
	const rest = m[1].replace(/[ \t]+#.*$/, "").trim();
	if (rest.startsWith("[")) {
		if (!rest.endsWith("]")) return { count: 1, unreadable: true };
		const inner = rest.slice(1, -1).trim();
		const values = inner === "" ? [] : inner.split(",").map(unquote);
		return values.every((v) => DATE.test(v)) ? { count: 1, values } : { count: 1, unreadable: true };
	}
	if (rest !== "") return null;
	// ブロックのリスト（字下げした `- ` の行）。値のない `scheduled:` は日付なしとして消す
	const values = [];
	let count = 1;
	while (i + count < lines.length && /^[ \t]+-[ \t]*\S/.test(lines[i + count])) {
		values.push(unquote(bare(lines[i + count]).replace(/^[ \t]+-[ \t]*/, "")));
		count++;
	}
	return values.every((v) => DATE.test(v)) ? { count, values } : { count, unreadable: true };
}

/** 範囲の中のリストの scheduled（行番号の昇順） */
function lists(lines) {
	const out = [];
	for (const [from, to] of ranges(lines)) {
		for (let i = from; i < to; i++) {
			const hit = listAt(lines, i);
			if (hit) {
				out.push({ line: i, ...hit });
				i += hit.count - 1;
			}
		}
	}
	return out;
}

/**
 * issue の md の frontmatter とサブイシューのブロックの、リストの scheduled を、移行日（today）以降の最も早い日 1 つにする。
 * 過去の日付だけなら行を消す。読めないリストは変えない。戻り値: { text, changed, unreadable }
 */
export function migrateText(text, today) {
	const crlf = text.includes("\r\n");
	const lines = text.split("\n");
	const hits = lists(lines);
	let changed = false;
	let unreadable = false;
	// 後ろから置き換えて、前の行番号をずらさない
	for (const hit of [...hits].reverse()) {
		if (hit.unreadable) {
			unreadable = true;
			continue;
		}
		const next = hit.values.filter((d) => d >= today).sort()[0];
		lines.splice(hit.line, hit.count, ...(next ? [`scheduled: ${next}${crlf ? "\r" : ""}`] : []));
		changed = true;
	}
	return { text: lines.join("\n"), changed, unreadable };
}

/** リストの scheduled が残っているか。読めないものは unreadable */
export function remaining(text) {
	const hits = lists(text.split("\n"));
	return { any: hits.length > 0, unreadable: hits.some((h) => h.unreadable) };
}

export function read(root, path) {
	return readFileSync(join(root, path), "utf8");
}
