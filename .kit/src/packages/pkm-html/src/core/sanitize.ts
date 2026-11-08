/**
 * HTML を iframe の srcdoc に入れる文字列にする（ADR-0037 の 2 と 3）。
 * DOMParser で解析し、危険なものを取り除き、Vault の中の画像を data: に置き換え、
 * CSP・トークン・テーマを入れる。Obsidian に依存しない（tmp/ への書き出しでも使う。Issue #44）
 */
import { bytesToBase64, candidatePaths, CSP, firstSrcsetUrl, imageType, isScriptUrl, MAX_IMAGE_BYTES } from "./policy.ts";

export type Theme = "light" | "dark";

/** Vault の中の画像を読む。candidates を順に試し、最初に見つかったものを返す。なければ null */
export type ReadImage = (candidates: string[]) => Promise<Uint8Array | null>;

export interface BuildOptions {
	/** HTML ファイルの Vault の中のパス（相対パスの基準） */
	path: string;
	theme: Theme;
	/** デザイントークンの CSS（packages/design の生成物。body と body.theme-dark に変数を置く） */
	tokensCss: string;
	/** Obsidian のフォントの変数（--font-interface など）。トークンがこれを参照する */
	fontVars?: Readonly<Record<string, string>>;
	readImage: ReadImage;
}

/** まるごと取り除く要素 */
const REMOVED_ELEMENTS = ["script", "noscript", "base", "meta[http-equiv]", "link", "iframe", "frame", "frameset", "object", "embed", "portal", "applet"];

/** URL を値に取る属性（javascript: を消す）。to / from / values / by は SVG のアニメーションで href を書き換えるもの */
const URL_ATTRIBUTES = new Set(["href", "src", "action", "formaction", "data", "poster", "background", "xlink:href", "srcset", "ping", "cite", "longdesc", "to", "from", "values", "by"]);

/** 差し込んだ要素の目印（テーマを付け直すときに探す） */
export const MARK_ATTRIBUTE = "data-pkm-html";

/** スクリプトを動かすもの、外部を読み込むもの、遷移させるものを取り除く */
export function stripDangerous(doc: Document): void {
	for (const el of [...doc.querySelectorAll(REMOVED_ELEMENTS.join(","))]) el.remove();
	for (const el of [...doc.querySelectorAll("*")]) {
		for (const attr of [...el.attributes]) {
			const name = attr.name.toLowerCase();
			if (name.startsWith("on") || name === "srcdoc" || (URL_ATTRIBUTES.has(name) && isScriptUrl(attr.value))) {
				el.removeAttribute(attr.name);
			}
		}
	}
}

/** Vault の中の画像を data: に置き換える（<img src>・<img srcset>・<source srcset>） */
export async function inlineImages(doc: Document, from: string, readImage: ReadImage): Promise<void> {
	const toDataUrl = async (ref: string): Promise<string | null> => {
		const candidates = candidatePaths(from, ref).filter((p) => imageType(p) !== null);
		if (candidates.length === 0) return null;
		const bytes = await readImage(candidates);
		if (bytes === null || bytes.length > MAX_IMAGE_BYTES) return null;
		// readImage は candidates のどれかを読む。MIME は拡張子で決まるので、同じ拡張子の候補しかない
		const type = imageType(candidates[0] as string) as string;
		return `data:${type};base64,${bytesToBase64(bytes)}`;
	};
	for (const img of [...doc.querySelectorAll("img[src]")]) {
		const src = img.getAttribute("src") ?? "";
		const url = await toDataUrl(src);
		if (url !== null) img.setAttribute("src", url);
	}
	for (const el of [...doc.querySelectorAll("img[srcset], source[srcset]")]) {
		const first = firstSrcsetUrl(el.getAttribute("srcset") ?? "");
		const url = first === null ? null : await toDataUrl(first);
		// 置き換えられない srcset は残す（CSP で読み込まれない）。置き換えたら 1 つの候補だけにする
		if (url !== null) el.setAttribute("srcset", url);
	}
}

/** テーマの色の切り替え（color-scheme）。トークンを使わない HTML の既定の文字と背景の色も、テーマに合わせる */
export function schemeCss(theme: Theme): string {
	return `:root { color-scheme: ${theme}; }`;
}

function fontCss(fontVars: Readonly<Record<string, string>>): string {
	const decls = Object.entries(fontVars)
		.filter(([name, value]) => /^--font-[\w-]+$/.test(name) && !/[;{}<>]/.test(value) && value.trim() !== "")
		.map(([name, value]) => `\t${name}: ${value.trim()};`);
	return decls.length === 0 ? "" : `body {\n${decls.join("\n")}\n}`;
}

/** CSP・トークン・テーマを入れる。CSP は <head> の最初 */
export function addGuards(doc: Document, { theme, tokensCss, fontVars = {} }: Pick<BuildOptions, "theme" | "tokensCss" | "fontVars">): void {
	const head = doc.head;
	const style = (kind: string, css: string) => {
		const el = doc.createElement("style");
		el.setAttribute(MARK_ATTRIBUTE, kind);
		el.textContent = css;
		return el;
	};
	const meta = doc.createElement("meta");
	meta.setAttribute("http-equiv", "Content-Security-Policy");
	meta.setAttribute("content", CSP);
	// HTML の側のスタイルが後に来て勝つように、差し込むものは先頭に置く
	head.prepend(meta, style("scheme", schemeCss(theme)), style("tokens", `${tokensCss}\n${fontCss(fontVars)}`));
	doc.body.classList.remove("theme-light", "theme-dark");
	doc.body.classList.add(`theme-${theme}`);
}

/** HTML の文字列から srcdoc の文字列を作る */
export async function buildSrcdoc(html: string, options: BuildOptions): Promise<string> {
	const doc = new DOMParser().parseFromString(html, "text/html");
	stripDangerous(doc);
	await inlineImages(doc, options.path, options.readImage);
	addGuards(doc, options);
	return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
}
