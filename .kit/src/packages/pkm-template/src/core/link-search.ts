/**
 * @note・@heading・@daily・@slide の検索と、ノートへのリンクの印（ADR-0194）。Obsidian に依存しない
 */
import { markdownLink, parseLinkQuery, searchItems } from "../../../shared/src/link-query.ts";
import { WIKI_TYPES, type NoteInfo } from "./note-list";
import { dailyDate, noteTitle } from "./note-title";

/** @note に出さないフォルダ。専用の種類があるか（issue など）、リンクしないもの（tmp・template） */
const NOTE_EXCLUDED = ["issue/", "routine/", "member/", "daily/", "tmp/", "template/"];

/** pkm-task がチップに描くフォルダ。pkm-template は印を足さない */
const TASK_FOLDERS = ["issue/", "routine/", "member/"];

function aliasesOf(fm: Record<string, unknown>): string[] {
	const a = fm.aliases;
	return Array.isArray(a) ? a.filter((x): x is string => typeof x === "string") : typeof a === "string" ? [a] : [];
}

export function isLinkableNote(path: string): boolean {
	return !path.startsWith(".") && !NOTE_EXCLUDED.some((f) => path.startsWith(f));
}

/** ノートを探す。`t:` は type（`t:wiki` は wiki の 4 つの type）、`f:` はフォルダの前方一致 */
export function searchNotes(notes: readonly NoteInfo[], input: string, recency: (path: string) => number): NoteInfo[] {
	const q = parseLinkQuery(input, ["t", "f"]);
	const types = (q.filters.t ?? []).flatMap((t) => (t === "wiki" ? [...WIKI_TYPES] : [t]));
	const folders = (q.filters.f ?? []).map((f) => f.replace(/^\/+/, ""));
	const words = q.number !== null ? [q.number] : q.words;
	const pool = notes.filter(
		(n) =>
			isLinkableNote(n.path) &&
			(types.length === 0 || types.includes(String(n.frontmatter.type ?? ""))) &&
			(folders.length === 0 || folders.some((f) => n.path.toLowerCase().startsWith(f))),
	);
	return searchItems(pool, { ...q, words, number: null }, {
		haystacks: (n) => [noteTitle(n.frontmatter, n.basename), ...aliasesOf(n.frontmatter), n.path],
		recency: (n) => recency(n.path),
	});
}

export function noteLinkOf(n: NoteInfo): string {
	return markdownLink(noteTitle(n.frontmatter, n.basename), n.path);
}

export interface HeadingInfo {
	heading: string;
	level: number;
}

/** 見出しを探す（md の順） */
export function searchHeadings(headings: readonly HeadingInfo[], input: string): HeadingInfo[] {
	const q = parseLinkQuery(input);
	const words = q.number !== null ? [q.number] : q.words;
	return searchItems(headings, { ...q, words, number: null }, { haystacks: (h) => [h.heading] });
}

export function headingLink(n: NoteInfo, heading: string): string {
	return markdownLink(`${noteTitle(n.frontmatter, n.basename)} › ${heading}`, n.path, heading);
}

export interface DailyEntry {
	path: string;
	/** `YYYY-MM-DD` */
	date: string;
	/** `2026-11-20 FRI` */
	label: string;
}

/** daily/ のノートのうち、ファイル名が日付のもの */
export function dailyEntries(paths: readonly string[]): DailyEntry[] {
	return paths.flatMap((path) => {
		if (!path.startsWith("daily/") || !path.endsWith(".md")) return [];
		const d = dailyDate((path.split("/").pop() ?? "").replace(/\.md$/, ""));
		return d ? [{ path, date: d.date, label: d.label }] : [];
	});
}

/** daily を探す（新しい順）。数字は `-` を除いた日付に含まれるもの（`1120`・`202611`） */
export function searchDailies(entries: readonly DailyEntry[], input: string): DailyEntry[] {
	const q = parseLinkQuery(input);
	const words = q.number !== null ? [q.number] : q.words;
	const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
	return sorted.filter((e) => words.every((w) => e.label.toLowerCase().includes(w) || e.date.replace(/-/g, "").includes(w.replace(/-/g, ""))));
}

export function dailyLink(e: DailyEntry): string {
	return markdownLink(e.label, e.path);
}

export interface DeckInfo {
	/** `slide/…/index.html` */
	path: string;
	title: string;
	mtime: number;
}

/** スライドのデッキを探す（新しい順）。題とフォルダ */
export function searchDecks(decks: readonly DeckInfo[], input: string): DeckInfo[] {
	const q = parseLinkQuery(input);
	const words = q.number !== null ? [q.number] : q.words;
	return searchItems(decks, { ...q, words, number: null }, { haystacks: (d) => [d.title, d.path], recency: (d) => d.mtime });
}

/**
 * ノートへのリンクの前に足す印のアイコン（Lucide の名前）。pkm-task がチップにするもの（issue など）は null
 */
export function linkIcon(path: string, anchor: string, type: unknown): string | null {
	if (TASK_FOLDERS.some((f) => path.startsWith(f))) return null;
	if (path.startsWith("slide/")) return "presentation";
	if (!path.endsWith(".md")) return null;
	if (anchor !== "") return "hash";
	if (path.startsWith("daily/")) return "calendar";
	if (typeof type === "string" && WIKI_TYPES.includes(type)) return "book-open";
	if (type === "source") return "library";
	return "file-text";
}
