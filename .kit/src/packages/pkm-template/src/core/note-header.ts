import { shortDate, tagList } from "./note-format";
import { WIKI_TYPES, type NoteInfo } from "./note-list";
import { dailyDate, noteTitle } from "./note-title";

export interface HeaderValue {
	text: string;
	/** Vault 内のノートへのリンク(Vault ルートからのパス) */
	path?: string;
	/** 外部リンク(http / https だけ) */
	url?: string;
}

export interface HeaderItem {
	label: string;
	values: HeaderValue[];
}

/** ヘッダーに出す内容(ADR-0026)。描画する側はこれをそのまま並べる */
export interface HeaderModel {
	title: string;
	/** daily の曜日(0 = 日曜)。7 枠のうちフォーカスを当てる枠。daily でなければ null */
	weekday: number | null;
	items: HeaderItem[];
	/** Obsidian の Properties 欄を隠すか。ヘッダーが代わりに表示する type(daily / note / source / wiki)だけ true */
	hideProperties: boolean;
}

export interface HeaderContext {
	/** Vault の全ノート(取り込み先・出典のタイトル解決に使う) */
	notes: readonly NoteInfo[];
	/** このノートを指しているノートの数 */
	backlinks: number;
}

/** 専用のヘッダーが frontmatter の主な項目を表示する type。Properties 欄は隠す */
const PROPERTY_HEADER_TYPES: readonly string[] = ["daily", "note", "source", ...WIKI_TYPES];

function isWebUrl(value: string): boolean {
	return /^https?:\/\/\S+$/i.test(value);
}

function item(label: string, values: HeaderValue[]): HeaderItem[] {
	return values.length > 0 ? [{ label, values }] : [];
}

/** ノートの種類ごとに、ヘッダーのタイトルと項目を決める。値のない項目は出さない */
export function buildHeader(note: NoteInfo, ctx: HeaderContext): HeaderModel {
	const fm = note.frontmatter;
	const type = typeof fm.type === "string" ? fm.type : "";
	const hideProperties = PROPERTY_HEADER_TYPES.includes(type);

	if (type === "daily") {
		const d = dailyDate(note.basename);
		if (d) return { title: d.label, weekday: d.weekday, items: [], hideProperties };
	}

	const title = noteTitle(fm, note.basename);
	let items: HeaderItem[] = [];

	if (type === "note") {
		const created = shortDate(fm.created);
		items = [...item("Tags", tagList(fm.tags).map((text) => ({ text }))), ...item("Created", created ? [{ text: created }] : [])];
	} else if (type === "source") {
		const origin = typeof fm.origin === "string" ? fm.origin.trim() : "";
		const retrieved = shortDate(fm.retrieved);
		const citedBy = ctx.notes
			.filter((n) => typeof n.frontmatter.type === "string" && WIKI_TYPES.includes(n.frontmatter.type) && Array.isArray(n.frontmatter.sources) && n.frontmatter.sources.includes(note.path))
			.map((n) => ({ text: noteTitle(n.frontmatter, n.basename), path: n.path }));
		items = [
			...item("Origin", origin ? [isWebUrl(origin) ? { text: origin, url: origin } : { text: origin }] : []),
			...item("Retrieved", retrieved ? [{ text: retrieved }] : []),
			...item("Cited by", citedBy),
		];
	} else if (WIKI_TYPES.includes(type)) {
		const byPath = new Map(ctx.notes.map((n) => [n.path, n]));
		const sources: HeaderValue[] = [];
		for (const s of Array.isArray(fm.sources) ? fm.sources : []) {
			if (typeof s !== "string" || s.trim() === "") continue;
			const found = byPath.get(s);
			if (found) sources.push({ text: noteTitle(found.frontmatter, found.basename), path: found.path });
			else sources.push(isWebUrl(s) ? { text: s, url: s } : { text: s });
		}
		items = [...item("Sources", sources), ...item("Backlinks", ctx.backlinks > 0 ? [{ text: String(ctx.backlinks) }] : [])];
	}

	return { title, weekday: null, items, hideProperties };
}
