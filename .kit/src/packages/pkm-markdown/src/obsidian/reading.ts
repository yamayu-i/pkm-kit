/**
 * 閲覧モード（ADR-0128、ADR-0251）
 * - pre の外の code に、コピーボタンを付ける。ホバーのない端末では、コードをタップすると出す
 * - 一番外側の引用（blockquote）とコールアウトに、生の文（外側の > を外した Markdown）をコピーするボタンを付ける
 * - 本文のタグ（a.tag）を、同じ文字の普通のテキストに置き換える。プロパティ欄のタグは変えない
 */
import { Platform, type MarkdownPostProcessor, type MarkdownPostProcessorContext } from "obsidian";
import { quoteBlock, quotePrefix, quoteSource } from "../core/blockquote.ts";
import { isBodyTag, isInlineCode } from "../core/targets.ts";
import { createCopyButton } from "./copy-button.ts";

export const WRAP_CLASS = "vt-md-code";
export const QUOTE_CLASS = "vt-md-quote";
/** ホバーのない端末で、タップしてボタンを出している状態 */
export const ACTIVE_CLASS = "is-active";

/** ホバーのない端末では、タップでボタンを出す（ホバーのある端末では CSS の :hover が出す） */
function toggleOnTap(target: HTMLElement, holder: HTMLElement): void {
	if (!Platform.isMobile) return;
	const doc = holder.ownerDocument;
	target.addEventListener("click", () => {
		for (const other of Array.from(doc.querySelectorAll(`.${WRAP_CLASS}.${ACTIVE_CLASS}, .${QUOTE_CLASS}.${ACTIVE_CLASS}`))) {
			if (other !== holder) other.classList.remove(ACTIVE_CLASS);
		}
		holder.classList.toggle(ACTIVE_CLASS);
	});
}

function addCopyButtons(root: HTMLElement): void {
	for (const code of Array.from(root.querySelectorAll("code"))) {
		if (!isInlineCode(code) || code.parentElement?.classList.contains(WRAP_CLASS)) continue;
		const doc = code.ownerDocument;
		const wrap = doc.createElement("span");
		wrap.className = WRAP_CLASS;
		code.replaceWith(wrap);
		wrap.append(code, createCopyButton(doc, () => code.textContent ?? ""));
		toggleOnTap(code, wrap);
	}
}

/** 押したときに、その節のソースを読む。読めないとき（埋め込みなど）は表示されている文字 */
function quoteText(section: HTMLElement, quote: HTMLElement, ctx: MarkdownPostProcessorContext): string {
	const info = ctx.getSectionInfo(section);
	if (info) {
		const lines = info.text.split("\n").slice(info.lineStart, info.lineEnd + 1);
		const start = lines.findIndex((l) => quotePrefix(l) !== null);
		const range = start < 0 ? null : quoteBlock((n) => lines[n] ?? null, start);
		if (range) return quoteSource(lines.slice(range.first, range.last + 1));
	}
	const body = quote.matches(".callout") ? quote.querySelector(".callout-content") : quote;
	return (body instanceof HTMLElement ? body.innerText : quote.innerText).trim();
}

/** 節の直下の引用とコールアウトだけに付ける（入れ子やリストの中の引用は、節のソースと対応が取れないので付けない） */
function addQuoteButtons(section: HTMLElement, ctx: MarkdownPostProcessorContext): void {
	for (const quote of Array.from(section.querySelectorAll(":scope > blockquote, :scope > .callout"))) {
		if (!(quote instanceof HTMLElement) || quote.classList.contains(QUOTE_CLASS)) continue;
		quote.classList.add(QUOTE_CLASS);
		quote.append(createCopyButton(quote.ownerDocument, () => quoteText(section, quote, ctx)));
		toggleOnTap(quote, quote);
	}
}

function untag(root: HTMLElement): void {
	for (const tag of Array.from(root.querySelectorAll("a.tag"))) {
		if (isBodyTag(tag)) tag.replaceWith(tag.ownerDocument.createTextNode(tag.textContent ?? ""));
	}
}

export const readingProcessor: MarkdownPostProcessor = (el, ctx) => {
	untag(el);
	addCopyButtons(el);
	addQuoteButtons(el, ctx);
};
