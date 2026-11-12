/**
 * 閲覧モード（ADR-0128）
 * - pre の外の code に、コピーボタンを付ける。ホバーのない端末では、コードをタップすると出す
 * - 本文のタグ（a.tag）を、同じ文字の普通のテキストに置き換える。プロパティ欄のタグは変えない
 */
import { Platform, type MarkdownPostProcessor } from "obsidian";
import { isBodyTag, isInlineCode } from "../core/targets.ts";
import { createCopyButton } from "./copy-button.ts";

export const WRAP_CLASS = "vt-md-code";
/** ホバーのない端末で、タップしてボタンを出している状態 */
export const ACTIVE_CLASS = "is-active";

function addCopyButtons(root: HTMLElement): void {
	for (const code of Array.from(root.querySelectorAll("code"))) {
		if (!isInlineCode(code) || code.parentElement?.classList.contains(WRAP_CLASS)) continue;
		const doc = code.ownerDocument;
		const wrap = doc.createElement("span");
		wrap.className = WRAP_CLASS;
		code.replaceWith(wrap);
		wrap.append(code, createCopyButton(doc, () => code.textContent ?? ""));
		// ホバーのない端末では、タップでボタンを出す（ホバーのある端末では CSS の :hover が出す）
		if (!Platform.isMobile) continue;
		code.addEventListener("click", () => {
			for (const other of Array.from(doc.querySelectorAll(`.${WRAP_CLASS}.${ACTIVE_CLASS}`))) if (other !== wrap) other.classList.remove(ACTIVE_CLASS);
			wrap.classList.toggle(ACTIVE_CLASS);
		});
	}
}

function untag(root: HTMLElement): void {
	for (const tag of Array.from(root.querySelectorAll("a.tag"))) {
		if (isBodyTag(tag)) tag.replaceWith(tag.ownerDocument.createTextNode(tag.textContent ?? ""));
	}
}

export const readingProcessor: MarkdownPostProcessor = (el) => {
	untag(el);
	addCopyButtons(el);
};

