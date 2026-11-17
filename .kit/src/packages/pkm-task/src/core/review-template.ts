/**
 * 振り返りの型（ADR-0206）。スニペット `daily-review.md` の本文を、デイリーノートの本文の冒頭に入れる。
 * 上流の既定（.kit/templates/snippet/）に、その Vault のもの（template/snippet/）を同じ名前で重ねる（ADR-0060）
 */

export const REVIEW_SNIPPET = "daily-review.md";
export const REVIEW_SNIPPET_PATHS = [`template/snippet/${REVIEW_SNIPPET}`, `.kit/templates/snippet/${REVIEW_SNIPPET}`] as const;

/** スニペットが読めないときの型（上流の既定と同じ） */
export const DEFAULT_REVIEW_TEMPLATE = "## 日次振り返り\n\n### 何をしたか\n- \n\n### Keep\n- \n\n### Problem → Try\n- \n\n---\n";

const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/;

/** スニペットのファイルから本文だけを取り出す（frontmatter を除く。前後の空行を詰めて、末尾は改行 1 つ） */
export function snippetBody(text: string): string {
	const body = text.replace(FRONTMATTER_RE, "").replace(/^(?:[ \t]*\r?\n)+/, "").replace(/\s+$/, "");
	return body ? `${body}\n` : "";
}

/** 型の最初の見出しの行（何度押しても 1 回だけ入れるための目印）。見出しがなければ最初の空でない行 */
export function templateMarker(template: string): string | null {
	const lines = template.split(/\r?\n/).map((l) => l.trimEnd());
	return lines.find((l) => /^#{1,6} /.test(l)) ?? lines.find((l) => l.trim() !== "") ?? null;
}

/**
 * 本文の先頭（frontmatter の直後）に型を入れた内容を返す。既にある内容は変えない。
 * 型の目印の行が本文にすでにあれば、そのまま返す
 */
export function insertReviewTemplate(text: string, template: string): string {
	const marker = templateMarker(template);
	if (marker === null) return text;
	const fm = FRONTMATTER_RE.exec(text);
	const head = fm ? fm[0] : "";
	const body = text.slice(head.length);
	if (body.split(/\r?\n/).some((l) => l.trimEnd() === marker)) return text;
	const block = template.endsWith("\n") ? template : `${template}\n`;
	const rest = body.replace(/^(?:[ \t]*\r?\n)+/, "");
	const headSep = head && !head.endsWith("\n") ? "\n" : "";
	return `${head}${headSep}${rest ? `${block}\n${rest}` : block}`;
}
