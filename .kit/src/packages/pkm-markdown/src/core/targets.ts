/** Obsidian が描いた要素のうち、手を入れるものの見分け（ADR-0128）。DOM の Element の closest / matches だけを使う */

export interface ElementLike {
	matches(selector: string): boolean;
	closest(selector: string): unknown;
}

/** コピーボタンを付けるインラインコードか（コードブロックの code は除く） */
export function isInlineCode(el: ElementLike): boolean {
	return el.matches("code") && el.closest("pre") === null;
}

/** プロパティ欄（frontmatter）。ここのタグは変えない */
const PROPERTIES = ".metadata-container, .frontmatter-container";

/** 普通の文字に置き換える、本文のタグか */
export function isBodyTag(el: ElementLike): boolean {
	return el.matches("a.tag") && el.closest(PROPERTIES) === null;
}
