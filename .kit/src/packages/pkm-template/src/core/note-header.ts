import type { HeaderEdit } from "./note-edit";
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
	/** 空なら、値の位置に「Not set」を出す(編集できる項目だけ空で出る) */
	values: HeaderValue[];
	/** ヘッダーから直せる項目の指定(ADR-0238)。表示だけの項目にはない */
	edit?: HeaderEdit;
}

/** ヘッダーに出す内容(ADR-0026)。描画する側はこれをそのまま並べる */
export interface HeaderModel {
	title: string;
	/** タイトルを直す指定(ADR-0238)。note・source・wiki のページだけ */
	titleEdit?: HeaderEdit;
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

/** 編集できる項目。値がなくても出す(空の origin などを入れられるようにする。ADR-0238) */
function editable(label: string, values: HeaderValue[], edit: HeaderEdit): HeaderItem[] {
	return [{ label, values, edit }];
}

function stringList(value: unknown): string[] {
	return (Array.isArray(value) ? value : []).filter((s): s is string => typeof s === "string" && s.trim() !== "");
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
	const titleEdit: HeaderEdit = { field: "title", multiline: false, initial: title };

	if (type === "note") {
		const created = shortDate(fm.created);
		const tags = tagList(fm.tags);
		items = [
			...editable(
				"Tags",
				tags.map((text) => ({ text })),
				{ field: "tags", multiline: false, initial: tags.join(", ") },
			),
			...item("Created", created ? [{ text: created }] : []),
		];
	} else if (type === "source") {
		const origin = typeof fm.origin === "string" ? fm.origin.trim() : "";
		const retrieved = shortDate(fm.retrieved);
		const retrievedRaw = typeof fm.retrieved === "string" ? fm.retrieved.trim() : "";
		const citedBy = ctx.notes
			.filter((n) => typeof n.frontmatter.type === "string" && WIKI_TYPES.includes(n.frontmatter.type) && Array.isArray(n.frontmatter.sources) && n.frontmatter.sources.includes(note.path))
			.map((n) => ({ text: noteTitle(n.frontmatter, n.basename), path: n.path }));
		items = [
			...editable("Origin", origin ? [isWebUrl(origin) ? { text: origin, url: origin } : { text: origin }] : [], { field: "origin", multiline: false, initial: origin }),
			...editable("Retrieved", retrieved ? [{ text: retrieved }] : [], { field: "retrieved", multiline: false, initial: retrieved || retrievedRaw }),
			...item("Cited by", citedBy),
		];
	} else if (WIKI_TYPES.includes(type)) {
		const byPath = new Map(ctx.notes.map((n) => [n.path, n]));
		const sources: HeaderValue[] = [];
		const raw = stringList(fm.sources);
		for (const s of raw) {
			const found = byPath.get(s);
			if (found) sources.push({ text: noteTitle(found.frontmatter, found.basename), path: found.path });
			else sources.push(isWebUrl(s) ? { text: s, url: s } : { text: s });
		}
		items = [...editable("Sources", sources, { field: "sources", multiline: true, initial: raw.join("\n") }), ...item("Backlinks", ctx.backlinks > 0 ? [{ text: String(ctx.backlinks) }] : [])];
	}

	// daily(日付でないファイル名を含む)と、専用の項目がない type は直さない。Properties 欄か、ソースモードで直す
	const editableType = type === "note" || type === "source" || WIKI_TYPES.includes(type);
	return editableType ? { title, titleEdit, weekday: null, items, hideProperties } : { title, weekday: null, items, hideProperties };
}
