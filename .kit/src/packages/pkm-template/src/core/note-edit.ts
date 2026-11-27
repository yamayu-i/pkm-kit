/** ヘッダーからその場で直す項目の、入力の解釈と検査（ADR-0238）。Obsidian には依存しない */

/** ヘッダーから直せる frontmatter の項目 */
export type EditField = "title" | "tags" | "origin" | "retrieved" | "sources";

/** 項目を直すための指定。initial は入力欄の初期値 */
export interface HeaderEdit {
	field: EditField;
	/** 複数行の入力欄にするか（sources だけ） */
	multiline: boolean;
	initial: string;
}

export type EditResult = { ok: true; value: string | string[] } | { ok: false; error: string };

function unique(items: string[]): string[] {
	return [...new Set(items.filter((s) => s !== ""))];
}

function isRealDate(value: string): boolean {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!m) return false;
	const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
	const date = new Date(Date.UTC(y, mo - 1, d));
	return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

/** 入力欄の文字列を、frontmatter に書く値にする。書けないときは日本語の説明を返す */
export function parseEdit(field: EditField, input: string): EditResult {
	const text = input.trim();
	switch (field) {
		case "title":
			return text === "" ? { ok: false, error: "タイトルは空にできません" } : { ok: true, value: text };
		case "tags":
			return { ok: true, value: unique(text.split(/[,\s]+/).map((t) => t.replace(/^#+/, ""))) };
		case "origin":
			return { ok: true, value: text };
		case "retrieved":
			if (text === "" || isRealDate(text)) return { ok: true, value: text };
			return { ok: false, error: `日付として読めません: ${text}（例: 2026-11-27）` };
		case "sources":
			return { ok: true, value: unique(input.split(/\r?\n/).map((l) => l.trim())) };
	}
}
