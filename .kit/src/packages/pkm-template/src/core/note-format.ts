/** 一覧とヘッダーに出す frontmatter の値の整形（ADR-0026）。Obsidian には依存しない。 */

/** `2026-11-01T09:00:00+09:00` → `2026-11-01`。日付の形でなければ空文字 */
export function shortDate(value: unknown): string {
	if (typeof value !== "string") return "";
	const m = /^(\d{4}-\d{2}-\d{2})(?:$|[T ])/.exec(value.trim());
	return m ? (m[1] ?? "") : "";
}

/** tags を文字列のリストにする。先頭の `#` は取る。文字列はカンマか空白で区切る */
export function tagList(value: unknown): string[] {
	const items = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[,\s]+/) : [];
	const out: string[] = [];
	for (const item of items) {
		if (typeof item !== "string") continue;
		const tag = item.trim().replace(/^#/, "");
		if (tag !== "") out.push(tag);
	}
	return out;
}
