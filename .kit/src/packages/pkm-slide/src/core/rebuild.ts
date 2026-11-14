/**
 * プラグインの中でのスライドのビルドと、発表者ノートの読み書き（ADR-0132）。
 * CLI（slide.mjs build）と同じバイト列にするため、DOM の解析は CLI と同じ linkedom、SHA-256 は同期の純 JS の実装を使う。
 * Obsidian に依存しない（ファイルの有無と theme.json の中身は、呼ぶ側が渡す）
 */
import { DOMParser } from "linkedom";
import { sha256 } from "../../../shared/src/sha256.ts";
import { buildDeck, type Assets, type BuildResult } from "../../../slide/src/core/build.ts";
import { NOTES_CLASS, notesFormatError, notesToText, replaceNotes, sectionSpans } from "../../../slide/src/core/notes.ts";
import { parseVaultPrimary } from "../../../slide/src/core/vault-primary.ts";

export const SOURCE_FILE = "deck.html";
export const INDEX_FILE = "index.html";

/** CLI の parse と同じ */
export const parse = (html: string) => new DOMParser().parseFromString(html, "text/html") as unknown as Document;

export interface DeckBuildInput {
	source: string;
	/** Vault のルートから見たデッキのフォルダ（slide/foo） */
	deckPath: string;
	assets: Assets;
	/** Vault のルートから見たパスのファイルがあるか */
	fileExists: (vaultPath: string) => boolean;
	/** .kit-local/theme.json の中身（なければ null） */
	themeJson: string | null;
}

/** デッキのフォルダから見たパスを、Vault のルートからのパスにする。デッキの外を指すなら null（CLI と同じく、ないものとして扱う） */
export function resolveInDeck(deckPath: string, relativePath: string): string | null {
	if (relativePath === "" || relativePath.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(relativePath)) return null;
	const parts: string[] = [];
	for (const part of relativePath.split("/")) {
		if (part === "" || part === ".") continue;
		if (part === "..") {
			if (parts.length === 0) return null;
			parts.pop();
			continue;
		}
		parts.push(part);
	}
	return parts.length === 0 ? null : `${deckPath}/${parts.join("/")}`;
}

export function buildDeckSource(input: DeckBuildInput): BuildResult {
	return buildDeck({
		source: input.source,
		deckPath: input.deckPath,
		assets: input.assets,
		parse,
		sha256,
		vaultPrimary: input.themeJson === null ? undefined : parseVaultPrimary(input.themeJson),
		exists: (rel) => {
			const path = resolveInDeck(input.deckPath, rel);
			return path !== null && input.fileExists(path);
		},
	});
}

export interface SlideNote {
	/** 1 始まり */
	n: number;
	/** スライドの見出し（なければ空） */
	title: string;
	/** 編集の画面に出す素の文字 */
	text: string;
}

/** 編集できないときの理由か、スライドごとのノート */
export type DeckNotes = { error: string } | { title: string; slides: SlideNote[] };

/**
 * deck.html から、スライドごとの見出しとノート（素の文字）を読む。
 * 書き換えの位置（ソースの文字列で探す）と、DOM で読んだスライドがそろわないとき、ノートが書式の範囲の外のときは、編集させない
 */
export function readDeckNotes(source: string): DeckNotes {
	const body = parse(`<!DOCTYPE html><html><head></head><body>${source}</body></html>`).body;
	const sections = [...body.children].filter((el) => el.tagName.toLowerCase() === "section");
	const spans = sectionSpans(source);
	if (sections.length === 0) return { error: "スライド（<section>）が 1 枚もありません" };
	if (sections.length !== spans.length) return { error: "deck.html のスライドを数えられません。PC で node .kit/bin/slide.mjs build を実行して、エラーを直してください" };
	const slides: SlideNote[] = [];
	for (const [i, section] of sections.entries()) {
		const n = i + 1;
		const asides = [...section.children].filter((el) => el.tagName.toLowerCase() === "aside" && el.classList.contains(NOTES_CLASS));
		const all = [...section.querySelectorAll("aside")].filter((el) => el.classList.contains(NOTES_CLASS));
		if (asides.length > 1 || all.length !== asides.length || (spans[i]?.notes.length ?? 0) !== asides.length) {
			return { error: `${n} 枚目の発表者ノートの書き方が規約と違います（1 枚に 1 つ、<section> の直下）。PC で node .kit/bin/slide.mjs build を実行して直してください` };
		}
		const aside = asides[0];
		if (aside) {
			const format = notesFormatError(aside);
			if (format !== null) return { error: `${n} 枚目の発表者ノート: ${format}` };
		}
		const heading = section.querySelector("h1, h2, h3");
		slides.push({ n, title: (heading?.textContent ?? "").replace(/\s+/g, " ").trim(), text: aside ? notesToText(aside) : "" });
	}
	return { title: (body.querySelector("title")?.textContent ?? "").trim(), slides };
}

/** 変えたスライドのノートだけを書き換えたソース。書き換えられなければ null */
export function applyNotes(source: string, changes: ReadonlyMap<number, string>): string | null {
	let out = source;
	for (const [n, text] of changes) {
		const next = replaceNotes(out, n, text);
		if (next === null) return null;
		out = next;
	}
	return out;
}
