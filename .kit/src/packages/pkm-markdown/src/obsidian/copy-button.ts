/** コピーボタン（ADR-0128）。閲覧モードとライブプレビューで同じ見た目と動きにする */
import { Notice, setIcon } from "obsidian";
import { copyText } from "../core/copy.ts";

export const BUTTON_CLASS = "vt-md-copy";

/** text() は押したときに読む（ライブプレビューでは、ボタンを使い回すので中身が変わる） */
export function createCopyButton(doc: Document, text: () => string | null): HTMLButtonElement {
	const button = doc.createElement("button");
	button.type = "button";
	button.className = BUTTON_CLASS;
	button.setAttribute("aria-label", "コピー");
	setIcon(button, "copy");
	// 押してもエディタにカーソルを置かない・リンクを開かない
	button.addEventListener("mousedown", (e) => e.preventDefault());
	button.addEventListener("click", (e) => {
		e.preventDefault();
		e.stopPropagation();
		const value = text();
		if (value === null) return;
		void copyText(value, navigator.clipboard, (m) => new Notice(m));
	});
	return button;
}
