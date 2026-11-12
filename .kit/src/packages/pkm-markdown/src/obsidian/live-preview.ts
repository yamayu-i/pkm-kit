/**
 * ライブプレビュー（ADR-0128）
 * - Obsidian が描いたインラインコード（.cm-inline-code）にカーソルを合わせると、右上にコピーボタンを 1 つ浮かせる
 * - 中身は、要素の位置の行を読み、前後の ` までを取る（構文木は使わない）
 * - 編集のカーソルがそのコードの中にある（` が見えている）間は出さない
 * ボタンはエディタの外枠（.cm-editor。CodeMirror が position: relative にしている）に 1 つだけ置き、文書の DOM は変えない
 */
import { ViewPlugin, type EditorView, type ViewUpdate } from "@codemirror/view";
import { cursorInside, findInlineCode, type InlineCode } from "../core/inline-code.ts";
import { createCopyButton } from "./copy-button.ts";

const CODE_SELECTOR = ".cm-inline-code";
/** コードからボタンへマウスを動かす間に消えないよう、少し待ってから隠す */
const HIDE_DELAY_MS = 200;
export const FLOATING_CLASS = "vt-md-copy-floating";

class InlineCodeCopy {
	private readonly button: HTMLButtonElement;
	private current: InlineCode | null = null;
	private hideTimer: number | null = null;

	constructor(private readonly view: EditorView) {
		this.button = createCopyButton(view.dom.ownerDocument, () => this.current?.text ?? null);
		this.button.classList.add(FLOATING_CLASS);
		this.button.hidden = true;
		this.button.addEventListener("mouseenter", () => this.cancelHide());
		this.button.addEventListener("mouseleave", () => this.scheduleHide());
		view.dom.appendChild(this.button);
	}

	update(update: ViewUpdate): void {
		if (update.docChanged || update.selectionSet || update.viewportChanged || update.geometryChanged) this.hide();
	}

	destroy(): void {
		this.cancelHide();
		this.button.remove();
	}

	onPointer(target: EventTarget | null): void {
		const el = target instanceof Element ? target.closest(CODE_SELECTOR) : null;
		if (!(el instanceof HTMLElement)) {
			if (target !== this.button && !this.button.contains(target as Node | null)) this.scheduleHide();
			return;
		}
		const code = this.codeAt(el);
		if (!code) return this.hide();
		this.cancelHide();
		this.current = code;
		this.place(el);
	}

	scheduleHide(): void {
		this.cancelHide();
		this.hideTimer = window.setTimeout(() => this.hide(), HIDE_DELAY_MS);
	}

	private cancelHide(): void {
		if (this.hideTimer !== null) window.clearTimeout(this.hideTimer);
		this.hideTimer = null;
	}

	private hide(): void {
		this.cancelHide();
		this.current = null;
		this.button.hidden = true;
	}

	private codeAt(el: HTMLElement): InlineCode | null {
		let pos: number;
		try {
			pos = this.view.posAtDOM(el);
		} catch {
			return null;
		}
		const line = this.view.state.doc.lineAt(pos);
		const code = findInlineCode(line.text, pos - line.from);
		if (!code) return null;
		const span = { from: line.from + code.from, to: line.from + code.to };
		if (cursorInside(span, this.view.state.selection.ranges.map((r) => r.head))) return null;
		return code;
	}

	/** コードの最初の行の箱の右上に置く（折り返したコードでも、ボタンは 1 行目に出す） */
	private place(el: HTMLElement): void {
		const box = el.getClientRects()[0] ?? el.getBoundingClientRect();
		const base = this.view.dom.getBoundingClientRect();
		this.button.style.left = `${box.right - base.left}px`;
		this.button.style.top = `${box.top - base.top}px`;
		this.button.hidden = false;
	}
}

export const livePreviewCopy = ViewPlugin.fromClass(InlineCodeCopy, {
	eventHandlers: {
		mouseover(event) {
			this.onPointer(event.target);
		},
		mouseleave() {
			this.scheduleHide();
		},
	},
});
