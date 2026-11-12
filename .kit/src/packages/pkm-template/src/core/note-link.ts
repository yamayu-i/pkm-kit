/**
 * 作ったノートへのリンク。Obsidian には依存しない。
 * 表示テキストは `title` → `name` → ファイル名（拡張子なし）の順（note-title.ts）。リンク先は Vault ルートからのパスで、`.md` まで書く。
 */
import { noteTitle, type Frontmatter } from "./note-title";

/** Markdown のリンクの表示テキストで特別な意味を持つ文字を `\` で退避する */
function escapeLabel(label: string): string {
	return label.replace(/([\\[\]])/g, "\\$1");
}

/** 空白と、リンク先を壊す文字だけをエンコードする（`/` と日本語はそのまま） */
function encodePath(path: string): string {
	return path.replace(/[ ()<>%]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);
}

export function noteLink(path: string, frontmatter: Frontmatter | undefined): string {
	const basename = (path.split("/").pop() ?? path).replace(/\.md$/i, "");
	return `[${escapeLabel(noteTitle(frontmatter, basename))}](${encodePath(path)})`;
}
