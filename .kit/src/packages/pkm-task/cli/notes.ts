/**
 * MCP の note_ / daily_ / wiki_ の読み取り（ADR-0156）。
 * Vault の md を mtime と大きさで覚えておき、変わったファイルだけを読み直す（ADR-0156 の 5）。
 * 検索は外部依存のない単純一致（ADR-0156 の 4）。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { pathArea } from "./mcp-log";

export const DAILY_RE = /^daily\/(\d{4})\/(\d{2})\/(\d{4}-\d{2}-\d{2})\.md$/;
/** note_ の群で読まない場所（ADR-0156 の 2） */
const SKIP_AREAS = new Set(["hidden", "tmp", "template", "slide"]);

export interface FileStat {
	mtimeMs: number;
	size: number;
}

export interface Note {
	path: string;
	title: string;
	type: string | null;
	tags: string[];
	aliases: string[];
	created: string | null;
	updated: string | null;
	/** 絞り込みと並べ替えの日付。daily はファイル名の日付、ほかは updated（なければ created）の日付 */
	date: string | null;
	frontmatter: Record<string, unknown>;
	body: string;
	/** 本文が始まる行（1 始まり） */
	bodyLine: number;
	/** Vault 内のリンク先（アンカーを除き、重複を除く） */
	links: string[];
	norm: { title: string; aliases: string[]; tags: string[]; body: string };
}

/** 検索のための正規化: NFKC、英字の小文字、カタカナをひらがなに */
export function normalize(s: string): string {
	return s
		.normalize("NFKC")
		.toLowerCase()
		.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

function strList(v: unknown): string[] {
	if (Array.isArray(v)) return v.filter((x) => typeof x === "string" || typeof x === "number").map(String);
	if (typeof v === "string" && v.trim()) return [v];
	return [];
}

function str(v: unknown): string | null {
	return typeof v === "string" && v.trim() ? v : typeof v === "number" ? String(v) : null;
}

/** コードブロックとインラインコードを除いた本文から、Markdown リンクの先を取り出す */
export function extractLinkTargets(body: string): string[] {
	const out = new Set<string>();
	let fence: string | null = null;
	for (const raw of body.split("\n")) {
		const f = /^\s*(`{3,}|~{3,})/.exec(raw);
		if (fence) {
			if (f && f[1]![0] === fence[0] && f[1]!.length >= fence.length) fence = null;
			continue;
		}
		if (f) {
			fence = f[1]!;
			continue;
		}
		const line = raw.replace(/`+[^`]*`+/g, "");
		for (const m of line.matchAll(/!?\[(?:[^\]\\]|\\.)*\]\(\s*(<[^>]*>|[^\s)]+)(?:\s+"[^"]*")?\s*\)/g)) {
			let target = m[1]!;
			if (target.startsWith("<")) target = target.slice(1, -1);
			if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("#")) continue;
			const hash = target.indexOf("#");
			let path = hash === -1 ? target : target.slice(0, hash);
			try {
				path = decodeURIComponent(path);
			} catch {
				// そのまま使う
			}
			path = path.replace(/^\.?\//, "");
			if (path) out.add(path);
		}
	}
	return [...out];
}

export function parseNote(path: string, text: string): Note {
	const m = FRONTMATTER_RE.exec(text);
	let fm: Record<string, unknown> = {};
	if (m) {
		try {
			const v: unknown = parse(m[1]!);
			if (v && typeof v === "object" && !Array.isArray(v)) fm = v as Record<string, unknown>;
		} catch {
			// 読めない frontmatter は空として扱う（検査は check_ の群で出す）
		}
	}
	const body = m ? text.slice(m[0].length) : text;
	const bodyLine = m ? m[0].split("\n").length : 1;
	const daily = DAILY_RE.exec(path);
	const base = path.split("/").pop()!.replace(/\.md$/, "");
	const title = str(fm.title) ?? str(fm.name) ?? (daily ? daily[3]! : base);
	const created = str(fm.created);
	const updated = str(fm.updated);
	const tags = strList(fm.tags);
	const aliases = [...strList(fm.aliases), ...strList(fm.alias)];
	return {
		path,
		title,
		type: str(fm.type),
		tags,
		aliases,
		created,
		updated,
		date: daily ? daily[3]! : (updated ?? created)?.slice(0, 10) ?? null,
		frontmatter: fm,
		body,
		bodyLine,
		links: extractLinkTargets(body),
		norm: { title: normalize(title), aliases: aliases.map(normalize), tags: tags.map(normalize), body: normalize(body) },
	};
}

/** Vault のファイル（隠しパスと node_modules を除く）を、mtime と大きさ付きで列挙する */
export function walkStats(root: string, dir = "", out = new Map<string, FileStat>()): Map<string, FileStat> {
	let names: string[];
	try {
		names = readdirSync(join(root, dir));
	} catch {
		return out;
	}
	for (const name of names) {
		if (name.startsWith(".") || name === "node_modules") continue;
		const rel = dir ? `${dir}/${name}` : name;
		let st;
		try {
			st = statSync(join(root, rel));
		} catch {
			continue;
		}
		if (st.isDirectory()) walkStats(root, rel, out);
		else out.set(rel, { mtimeMs: st.mtimeMs, size: st.size });
	}
	return out;
}

export function isNotePath(path: string): boolean {
	return path.endsWith(".md") && !SKIP_AREAS.has(pathArea(path));
}

/** ノートの索引。refresh() で、変わったファイルだけを読み直す */
export class NoteStore {
	files = new Map<string, FileStat>();
	notes = new Map<string, Note>();
	private stats = new Map<string, FileStat>();

	constructor(private readonly root: string) {}

	/** ファイルの一覧を取り直す（呼び出しごとに 1 回）。読み直したノートの数を返す */
	refresh(files = walkStats(this.root)): number {
		this.files = files;
		let changed = 0;
		for (const path of [...this.notes.keys()]) {
			if (!files.has(path)) {
				this.notes.delete(path);
				this.stats.delete(path);
			}
		}
		for (const [path, st] of files) {
			if (!isNotePath(path)) continue;
			const prev = this.stats.get(path);
			if (prev && prev.mtimeMs === st.mtimeMs && prev.size === st.size) continue;
			try {
				this.notes.set(path, parseNote(path, readFileSync(join(this.root, path), "utf8")));
				this.stats.set(path, st);
				changed++;
			} catch {
				this.notes.delete(path);
			}
		}
		return changed;
	}

	get(path: string): Note | undefined {
		return this.notes.get(path);
	}

	exists(path: string): boolean {
		return this.files.has(path);
	}
}

// ---- 一覧と検索 ----

export interface NoteFilter {
	type?: string;
	tags?: string[];
	pathPrefix?: string;
	from?: string;
	to?: string;
}

export function matchesFilter(n: Note, f: NoteFilter): boolean {
	if (f.type !== undefined && n.type !== f.type) return false;
	if (f.pathPrefix !== undefined && !n.path.startsWith(f.pathPrefix)) return false;
	if (f.tags?.length) {
		const set = new Set(n.norm.tags);
		if (!f.tags.every((t) => set.has(normalize(t)))) return false;
	}
	if (f.from !== undefined && (n.date === null || n.date < f.from)) return false;
	if (f.to !== undefined && (n.date === null || n.date > f.to)) return false;
	return true;
}

export interface Page<T> {
	total: number;
	items: T[];
	truncated: boolean;
	cursor: string | null;
}

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export function pageOf<T>(all: T[], limit: unknown, cursor: unknown): Page<T> {
	const n = typeof limit === "number" && limit > 0 ? Math.min(Math.trunc(limit), MAX_LIMIT) : DEFAULT_LIMIT;
	const start = typeof cursor === "string" && /^\d+$/.test(cursor) ? Number(cursor) : 0;
	const items = all.slice(start, start + n);
	const more = start + n < all.length;
	return { total: all.length, items, truncated: more, cursor: more ? String(start + n) : null };
}

export function summaryOf(n: Note) {
	return { path: n.path, title: n.title, type: n.type, tags: n.tags, date: n.date };
}

export interface SearchHit {
	path: string;
	title: string;
	type: string | null;
	date: string | null;
	/** 当たった場所（title / aliases / tags / body）。上にあるほど順位が高い */
	matched: string[];
	line: number | null;
	snippet: string | null;
}

const FIELD_SCORE = { title: 8, aliases: 4, tags: 2, body: 1 } as const;
const SNIPPET_RADIUS = 80;

/** 空白で区切った語の AND。title → aliases → tags → 本文の順に当たったものを上にし、同じなら date が新しい順 */
export function searchNotes(notes: Iterable<Note>, query: string, filter: NoteFilter = {}): SearchHit[] {
	const terms = normalize(query).split(/\s+/).filter(Boolean);
	if (terms.length === 0) return [];
	const scored: { hit: SearchHit; score: number }[] = [];
	for (const n of notes) {
		if (!matchesFilter(n, filter)) continue;
		let score = 0;
		const matched = new Set<string>();
		let ok = true;
		for (const t of terms) {
			let best = 0;
			if (n.norm.title.includes(t)) {
				best = Math.max(best, FIELD_SCORE.title);
				matched.add("title");
			}
			if (n.norm.aliases.some((a) => a.includes(t))) {
				best = Math.max(best, FIELD_SCORE.aliases);
				matched.add("aliases");
			}
			if (n.norm.tags.some((a) => a.includes(t))) {
				best = Math.max(best, FIELD_SCORE.tags);
				matched.add("tags");
			}
			if (n.norm.body.includes(t)) {
				best = Math.max(best, FIELD_SCORE.body);
				matched.add("body");
			}
			if (best === 0) {
				ok = false;
				break;
			}
			score += best;
		}
		if (!ok) continue;
		const snip = matched.has("body") ? snippetOf(n, terms) : null;
		scored.push({
			score,
			hit: {
				path: n.path,
				title: n.title,
				type: n.type,
				date: n.date,
				matched: (["title", "aliases", "tags", "body"] as const).filter((f) => matched.has(f)),
				line: snip?.line ?? null,
				snippet: snip?.text ?? null,
			},
		});
	}
	scored.sort((a, b) => b.score - a.score || (b.hit.date ?? "").localeCompare(a.hit.date ?? "") || a.hit.path.localeCompare(b.hit.path));
	return scored.map((s) => s.hit);
}

/** 最初に当たった行の前後を、元の表記のまま抜き出す */
function snippetOf(n: Note, terms: string[]): { line: number; text: string } | null {
	const lines = n.body.split("\n");
	for (const t of terms) {
		for (let i = 0; i < lines.length; i++) {
			const norm = normalize(lines[i]!);
			const pos = norm.indexOf(t);
			if (pos === -1) continue;
			const line = lines[i]!;
			const start = Math.max(0, pos - SNIPPET_RADIUS);
			const end = Math.min(line.length, pos + t.length + SNIPPET_RADIUS);
			const text = `${start > 0 ? "…" : ""}${line.slice(start, end).trim()}${end < line.length ? "…" : ""}`;
			return { line: n.bodyLine + i, text };
		}
	}
	return null;
}

export function backlinksOf(notes: Iterable<Note>, path: string): Note[] {
	const out: Note[] = [];
	for (const n of notes) if (n.path !== path && n.links.includes(path)) out.push(n);
	return out;
}

/** wiki のページ（frontmatter の sources か本文のリンク）から参照されていない元資料 */
export function unprocessedSources(notes: Iterable<Note>): Note[] {
	const all = [...notes];
	const referenced = new Set<string>();
	for (const n of all) {
		if (!n.path.startsWith("wiki/")) continue;
		for (const s of strList(n.frontmatter.sources)) referenced.add(s.replace(/^\.?\//, ""));
		for (const l of n.links) referenced.add(l);
	}
	return all.filter((n) => /^sources\/[^/]+\.md$/.test(n.path) && !referenced.has(n.path));
}

export const BODY_LIMIT = 8000;

/** 本文を既定で 8,000 字に切る（ADR-0156 の 3） */
export function bodyOf(n: Note, full: unknown): { body: string; length: number; truncated: boolean } {
	if (full === true || n.body.length <= BODY_LIMIT) return { body: n.body, length: n.body.length, truncated: false };
	return { body: n.body.slice(0, BODY_LIMIT), length: n.body.length, truncated: true };
}

/** wiki/log.md の `## ` で始まる記録を、新しいものから limit 件 */
export function recentLogEntries(body: string, limit: number): { heading: string; text: string }[] {
	const entries: { heading: string; text: string }[] = [];
	let cur: { heading: string; lines: string[] } | null = null;
	for (const line of body.split("\n")) {
		if (line.startsWith("## ")) {
			if (cur) entries.push({ heading: cur.heading, text: cur.lines.join("\n").trim() });
			cur = { heading: line.slice(3).trim(), lines: [] };
		} else if (cur) cur.lines.push(line);
	}
	if (cur) entries.push({ heading: cur.heading, text: cur.lines.join("\n").trim() });
	return entries
		.slice(-limit)
		.reverse()
		.map((e) => ({ heading: e.heading, text: e.text.length > 1000 ? `${e.text.slice(0, 1000)}…` : e.text }));
}
