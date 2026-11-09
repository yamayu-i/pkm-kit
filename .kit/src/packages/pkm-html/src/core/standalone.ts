/**
 * Vault の中の HTML を、それだけで開ける 1 ファイルにする（ADR-0044）。
 * 取り除く処理と画像の埋め込みは表示（ADR-0037）と同じ関数を使い、トークンは prefers-color-scheme 版を埋め込む。
 * DOM の解析は呼ぶ側が渡す（Obsidian では DOMParser、CLI では linkedom）。Obsidian に依存しない
 */
import { toSharingSvg } from "../../../pkm-diagram/src/core/svg.ts";
import { CSP } from "./policy.ts";
import { inlineImages, MARK_ATTRIBUTE, stripDangerous, type ReadImage } from "./sanitize.ts";

/** HTML の文字列を Document にする（`new DOMParser().parseFromString(html, "text/html")` と同じ） */
export type ParseHtml = (html: string) => Document;

export interface StandaloneOptions {
	/** HTML ファイルの Vault の中のパス（相対パスの基準） */
	path: string;
	/** 共有用のトークンの CSS（packages/design の生成物 tokens-standalone.css） */
	standaloneCss: string;
	readImage: ReadImage;
	parse: ParseHtml;
}

/** <head> に置く要素（<html> の直下に迷い出たときに <head> へ戻す） */
const HEAD_ELEMENTS = new Set(["title", "meta", "style", "link", "base"]);

/**
 * <html> の直下に <head> と <body> 以外があれば、<head> か <body> に移す。
 * ブラウザの DOMParser は自分で補うので何もしない。linkedom は補わないので、ここで整える
 */
export function normalizeStructure(doc: Document): void {
	const html = doc.documentElement;
	const head = doc.head;
	const body = doc.body;
	for (const node of [...html.childNodes]) {
		if (node === head || node === body) continue;
		const name = node.nodeType === 1 ? (node as Element).tagName.toLowerCase() : "";
		if (HEAD_ELEMENTS.has(name)) head.append(node);
		else if (node.nodeType === 3 && (node.textContent ?? "").trim() === "") node.remove();
		else body.append(node);
	}
}

/** 図（*.drawio.svg）は、編集用 XML を除いた共有用の SVG にする（ADR-0064 と同じバイト列） */
function sharingImages(readImage: ReadImage): ReadImage {
	return async (candidates) => {
		const bytes = await readImage(candidates);
		if (bytes === null || !(candidates[0] ?? "").toLowerCase().endsWith(".drawio.svg")) return bytes;
		try {
			return new TextEncoder().encode(toSharingSvg(new TextDecoder().decode(bytes)));
		} catch {
			// 大きすぎる・読めない図は埋め込まない
			return null;
		}
	};
}

/** HTML が `<html>` を持たない断片なら、文書の形に包む（linkedom は断片を正しく解析しない） */
function asDocument(html: string): string {
	return /<html[\s>]/i.test(html) ? html : `<!DOCTYPE html>\n<html><head></head><body>${html}</body></html>`;
}

/** 書き出す HTML の文字列を作る。同じ入力（HTML・画像・CSS）からは同じバイト列になる */
export async function buildStandalone(html: string, options: StandaloneOptions): Promise<string> {
	const doc = options.parse(asDocument(html));
	normalizeStructure(doc);
	stripDangerous(doc);
	await inlineImages(doc, options.path, sharingImages(options.readImage));
	addStandaloneHead(doc, options.standaloneCss);
	return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}\n`;
}

/** CSP・charset・viewport・トークンを <head> の最初に入れる。テーマのクラスは付けない */
export function addStandaloneHead(doc: Document, standaloneCss: string): void {
	const head = doc.head;
	const meta = (attrs: Record<string, string>) => {
		const el = doc.createElement("meta");
		for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
		return el;
	};
	const first: Element[] = [];
	// charset は先頭 1024 バイトの中にある必要がある。元の HTML のものは消して、先頭に入れ直す
	for (const el of [...head.querySelectorAll("meta[charset]")]) el.remove();
	first.push(meta({ charset: "utf-8" }));
	first.push(meta({ "http-equiv": "Content-Security-Policy", content: CSP }));
	if (!head.querySelector('meta[name="viewport"]')) first.push(meta({ name: "viewport", content: "width=device-width, initial-scale=1" }));
	const style = doc.createElement("style");
	style.setAttribute(MARK_ATTRIBUTE, "tokens");
	style.textContent = standaloneCss;
	// HTML の側のスタイルが後に来て勝つように、差し込むものは先頭に置く
	first.push(style);
	head.prepend(...first);
	doc.body.classList.remove("theme-light", "theme-dark");
	if (doc.body.getAttribute("class") === "") doc.body.removeAttribute("class");
}
