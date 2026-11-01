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
}

export interface HeaderContext {
	/** Vault の全ノート(取り込み先・出典のタイトル解決に使う) */
	notes: readonly NoteInfo[];
	/** このノートを指しているノートの数 */
	backlinks: number;
}

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

	if (type === "daily") {
		const d = dailyDate(note.basename);
		if (d) return { title: d.label, weekday: d.weekday, items: [] };
	}

	const title = noteTitle(fm, note.basename);
	let items: HeaderItem[] = [];

	if (type === "note") {
		const created = shortDate(fm.created);
		items = [...item("タグ", tagList(fm.tags).map((text) => ({ text }))), ...item("作成", created ? [{ text: created }] : [])];
	} else if (type === "source") {
		const origin = typeof fm.origin === "string" ? fm.origin.trim() : "";
		const retrieved = shortDate(fm.retrieved);
		const citedBy = ctx.notes
			.filter((n) => typeof n.frontmatter.type === "string" && WIKI_TYPES.includes(n.frontmatter.type) && Array.isArray(n.frontmatter.sources) && n.frontmatter.sources.includes(note.path))
			.map((n) => ({ text: noteTitle(n.frontmatter, n.basename), path: n.path }));
		items = [
			...item("出典", origin ? [isWebUrl(origin) ? { text: origin, url: origin } : { text: origin }] : []),
			...item("取得", retrieved ? [{ text: retrieved }] : []),
			...item("取り込み先", citedBy),
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
		items = [...item("出典", sources), ...item("被リンク", ctx.backlinks > 0 ? [{ text: String(ctx.backlinks) }] : [])];
	}

	return { title, weekday: null, items };
}
