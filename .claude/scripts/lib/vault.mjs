// Vault のパスの区分。定義は .claude/docs/llm-wiki.md の「所有の区分」と
// .claude/docs/adr/0004-human-notes-append-only.md を参照。
import { walk } from "./markdown.mjs";

export const WIKI_INDEX = "wiki/index.md";
export const WIKI_LOG = "wiki/log.md";
export const WIKI_FEEDBACK = "wiki/feedback.md";

/**
 * パスの区分を返す。
 * - hidden: `.` で始まる要素を含む（.claude、.obsidian など。ノートではない）
 * - asset: 添付。追加のみ
 * - source: 取り込んだ元資料。追加のみ
 * - wiki: LLM が管理するページ（index と log を含む）
 * - human: 人が書くノート（daily/、wiki/feedback.md、その他）。LLM は追記のみ
 */
export function classify(path) {
	if (path.split("/").some((s) => s.startsWith("."))) return "hidden";
	if (path.startsWith("asset/")) return "asset";
	if (path.startsWith("sources/")) return "source";
	if (path === WIKI_FEEDBACK) return "human";
	if (path.startsWith("wiki/")) return "wiki";
	return "human";
}

/** wiki のページのうち、frontmatter と index への掲載が必要なもの。 */
export function isWikiPage(path) {
	return classify(path) === "wiki" && path.endsWith(".md") && path !== WIKI_INDEX && path !== WIKI_LOG;
}

export const DAILY_RE = /^daily\/(\d{4})\/(\d{2})\/(\d{4})-(\d{2})-(\d{2})\.md$/;

/** Vault のファイル（隠しパスと node_modules を除く）。 */
export function vaultFiles(root) {
	return walk(root, (rel) => rel.split("/").some((s) => s.startsWith(".") || s === "node_modules"));
}
