import { noteTitle, type Frontmatter } from "./note-title";

/** 一覧とヘッダーが使うノートの情報（`metadataCache` から作る） */
export interface NoteInfo {
	/** Vault ルートからのパス */
	path: string;
	/** 拡張子なしのファイル名 */
	basename: string;
	frontmatter: Frontmatter;
}

export type SortKey = "title" | "created" | "name";
export type SortOrder = "asc" | "desc";

/** wiki のページの type（ADR-0025） */
export const WIKI_TYPES: readonly string[] = ["concept", "entity", "topic", "answer"];

/** vault-task が自分のヘッダーを出す type */
const TASK_TYPES: readonly string[] = ["issue", "routine"];

export function notesOfType(notes: readonly NoteInfo[], type: string): NoteInfo[] {
	return notes.filter((n) => n.frontmatter.type === type);
}

/** 表示タイトルとファイル名に、大文字小文字を区別せず部分一致するもの。空の検索語はそのまま返す */
export function filterByQuery(notes: readonly NoteInfo[], query: string): NoteInfo[] {
	const q = query.trim().toLowerCase();
	if (q === "") return [...notes];
	return notes.filter((n) => noteTitle(n.frontmatter, n.basename).toLowerCase().includes(q) || n.basename.toLowerCase().includes(q));
}

function createdOf(n: NoteInfo): number | null {
	const v = n.frontmatter.created;
	const t = v instanceof Date ? v.getTime() : typeof v === "string" ? Date.parse(v) : NaN;
	return Number.isNaN(t) ? null : t;
}

/** 並べ替えた新しい配列を返す。created がないものは、順序によらず末尾 */
export function sortNotes(notes: readonly NoteInfo[], key: SortKey, order: SortOrder): NoteInfo[] {
	const sign = order === "asc" ? 1 : -1;
	const titleOf = (n: NoteInfo) => noteTitle(n.frontmatter, n.basename);
	return [...notes].sort((a, b) => {
		if (key === "created") {
			const [x, y] = [createdOf(a), createdOf(b)];
			if (x === null && y === null) return 0;
			if (x === null) return 1;
			if (y === null) return -1;
			return sign * (x - y);
		}
		const [x, y] = key === "title" ? [titleOf(a), titleOf(b)] : [a.basename, b.basename];
		return sign * x.localeCompare(y);
	});
}

/** wiki のページの `sources` に載っている出典のパス。元資料の取り込み状態の導出に使う */
export function importedSourcePaths(notes: readonly NoteInfo[]): Set<string> {
	const out = new Set<string>();
	for (const n of notes) {
		const type = n.frontmatter.type;
		if (typeof type !== "string" || !WIKI_TYPES.includes(type)) continue;
		const sources = n.frontmatter.sources;
		if (!Array.isArray(sources)) continue;
		for (const s of sources) if (typeof s === "string") out.add(s);
	}
	return out;
}

/** vault-template のヘッダーを出すか。issue と routine は vault-task のヘッダーがあるので出さない */
export function hasNoteHeader(path: string, frontmatter: Frontmatter | undefined): boolean {
	const type = frontmatter?.type;
	if (typeof type === "string" && TASK_TYPES.includes(type)) return false;
	return !/^(issue|routine)\/[^/]+\.md$/.test(path);
}
