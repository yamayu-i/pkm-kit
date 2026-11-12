/**
 * slide/ のデッキと整理のフォルダ（ADR-0117、ADR-0120）。Obsidian の値は import しない（テストできるよう、純粋な関数だけを置く）
 * - デッキ: deck.html があるフォルダ。デッキの中にデッキを作らない
 * - 整理のフォルダ: slide/ の下の、デッキでもデッキの中でもないフォルダ
 */

export const SLIDE_ROOT = "slide";
const DECK_SOURCE = "deck.html";
const DECK_BUILD = "index.html";

/** フォルダ名の規則（vault-conventions.md の slide/）: 英小文字・数字・ハイフン */
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function nameError(name: string): string | null {
	if (name === "") return "名前を入れてください";
	if (!NAME.test(name)) return "名前は英小文字・数字・ハイフンで書きます（例: 2026-roadmap）";
	return null;
}

export function baseName(path: string): string {
	return path.slice(path.lastIndexOf("/") + 1);
}

export function parentOf(path: string): string {
	const i = path.lastIndexOf("/");
	return i === -1 ? "" : path.slice(0, i);
}

/** a が b そのものか、b の下にあるか */
export function isWithin(a: string, b: string): boolean {
	return a === b || a.startsWith(`${b}/`);
}

export interface DeckEntry {
	/** デッキのフォルダ（slide/…） */
	path: string;
	built: boolean;
}

export interface SlideTree {
	decks: DeckEntry[];
	/** 整理のフォルダ（SLIDE_ROOT を含む）。並びは名前の順 */
	folders: string[];
}

/** Vault のファイルとフォルダのパスから、デッキと整理のフォルダを見分ける */
export function classify(files: readonly string[], folders: readonly string[]): SlideTree {
	const fileSet = new Set(files);
	const deckPaths = files
		.filter((f) => isWithin(f, SLIDE_ROOT) && baseName(f) === DECK_SOURCE && parentOf(f) !== SLIDE_ROOT)
		.map(parentOf)
		// デッキの中のデッキは数えない（作らない決まり）
		.filter((d, _, all) => !all.some((o) => o !== d && isWithin(d, o)))
		.sort();
	const decks = deckPaths.map((path) => ({ path, built: fileSet.has(`${path}/${DECK_BUILD}`) }));
	const organizing = folders.filter((f) => isWithin(f, SLIDE_ROOT) && !deckPaths.some((d) => isWithin(f, d)));
	const set = new Set([SLIDE_ROOT, ...organizing]);
	return { decks, folders: [...set].sort() };
}

/** デッキの題（deck.html の <title>）。なければフォルダ名 */
export function deckTitle(source: string, path: string): string {
	const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(source);
	const title = decodeEntities((m?.[1] ?? "").replace(/\s+/g, " ").trim());
	return title || baseName(path);
}

/** deck.html のスライドの枚数（<section の数） */
export function slideCount(source: string): number {
	return source.replace(/<!--[\s\S]*?-->/g, "").match(/<section[\s>]/gi)?.length ?? 0;
}

function decodeEntities(text: string): string {
	return text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
}

/** slide のビルド（packages/slide/src/core/build.ts の escapeHtml）と同じ書き方 */
function escapeAttr(text: string): string {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * index.html の data-deck（デッキのパス）を書き換える。ビルドの出力のうちデッキのパスが入るのはここだけで、
 * ハッシュ（data-build）にも入らないので、書き換えた結果は新しい場所でビルドし直したものと同じになる。<html> の開始タグがなければ null
 */
export function retargetDeck(html: string, deckPath: string): string | null {
	const m = /<html\b[^>]*>/i.exec(html);
	if (m === null) return null;
	const tag = m[0];
	if (!/\sdata-deck="[^"]*"/.test(tag)) return null;
	const next = tag.replace(/(\sdata-deck=")[^"]*(")/, (_, a: string, b: string) => `${a}${escapeAttr(deckPath)}${b}`);
	return html.slice(0, m.index) + next + html.slice(m.index + tag.length);
}

/** 動かす前と後のパスから、動いた範囲のデッキの新しいパスを出す */
export function movedDecks(decks: readonly string[], from: string, to: string): { from: string; to: string }[] {
	return decks.filter((d) => isWithin(d, from)).map((d) => ({ from: d, to: to + d.slice(from.length) }));
}

/**
 * 動かせるか。動かすもの（デッキか整理のフォルダ）を、行き先の整理のフォルダの直下に、同じ名前で置く。
 * 動かせなければ理由、動かせれば新しいパス
 */
export function moveTarget(tree: SlideTree, source: string, destFolder: string, exists: (path: string) => boolean): { error: string } | { path: string } {
	if (!tree.folders.includes(destFolder)) return { error: "行き先は slide/ か、整理のフォルダにします（デッキの中には置けません）" };
	if (isWithin(destFolder, source)) return { error: "フォルダを、そのフォルダ自身やその下には動かせません" };
	if (parentOf(source) === destFolder) return { error: "すでにそのフォルダにあります" };
	const path = `${destFolder}/${baseName(source)}`;
	if (exists(path)) return { error: `${path} がすでにあります` };
	return { path };
}

/** 名前を変えられるか。変えられれば新しいパス */
export function renameTarget(source: string, name: string, exists: (path: string) => boolean): { error: string } | { path: string } {
	const bad = nameError(name);
	if (bad !== null) return { error: bad };
	const path = `${parentOf(source)}/${name}`;
	if (path === source) return { error: "同じ名前です" };
	if (exists(path)) return { error: `${path} がすでにあります` };
	return { path };
}

/** 木の 1 段: フォルダの直下にある整理のフォルダ（名前の順）とデッキのパス（ADR-0124） */
export function childrenOf(folders: readonly string[], decks: readonly string[], parent: string): { folders: string[]; decks: string[] } {
	const direct = (p: string) => p !== parent && parentOf(p) === parent;
	return { folders: folders.filter(direct).sort(), decks: decks.filter(direct) };
}

/** フォルダの表示名（slide/ は All） */
export function folderLabel(path: string): string {
	return path === SLIDE_ROOT ? "All" : baseName(path);
}

/** ノートに貼るリンク（vault-conventions.md: [題](slide/<フォルダ>/index.html)） */
export function markdownLink(title: string, deckPath: string): string {
	const text = title.replace(/[[\]]/g, (c) => `\\${c}`);
	return `[${text}](${deckPath.split("/").map(encodeURIComponent).join("/")}/${DECK_BUILD})`;
}
