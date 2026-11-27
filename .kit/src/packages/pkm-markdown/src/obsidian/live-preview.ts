/**
 * ライブプレビュー（ADR-0128、ADR-0251）
 * - Obsidian が描いたインラインコード（.cm-inline-code）にカーソルを合わせると、右上にコピーボタンを 1 つ浮かせる
 *   中身は、要素の位置の行を読み、前後の ` までを取る（構文木は使わない）。編集のカーソルがそのコードの中にある（` が見えている）間は出さない
 * - 引用の行（.cm-line.HyperMD-quote）とコールアウト（.cm-callout）にカーソルを合わせると、ひと続きの引用の右上（内側）に出す
 *   中身は、文書の行から外側の > を外した生の文。インラインコードの上では、インラインコードを優先する
 * ボタンはエディタの外枠（.cm-editor。CodeMirror が position: relative にしている）に 1 つだけ置き、文書の DOM は変えない
 */
import { ViewPlugin, type EditorView, type ViewUpdate } from "@codemirror/view";
import { quoteBlock, quoteSource } from "../core/blockquote.ts";
import { cursorInside, findInlineCode } from "../core/inline-code.ts";
import { createCopyButton } from "./copy-button.ts";

const CODE_SELECTOR = ".cm-inline-code";
const QUOTE_SELECTOR = ".cm-line.HyperMD-quote";
const CALLOUT_SELECTOR = ".cm-callout";
/** Obsidian がブロックの右上に出す「編集」のボタン。重ならないよう、その左に置く */
const EDIT_BUTTON_SELECTOR = ".edit-block-button";
/** コードからボタンへマウスを動かす間に消えないよう、少し待ってから隠す */
const HIDE_DELAY_MS = 200;
export const FLOATING_CLASS = "vt-md-copy-floating";
/** ブロックの右上の内側に置く（インラインコードは、コードの右上の外側に置く） */
export const INSIDE_CLASS = "is-inside";
/** 内側に置くときの、ブロックの端からの隙間（px） */
const INSET = 4;

interface Target {
	text: string;
	/** ボタンを置く基準の箱 */
	box: DOMRect;
	inside: boolean;
}

class MarkdownCopy {
	private readonly button: HTMLButtonElement;
	private current: string | null = null;
	private hideTimer: number | null = null;

	constructor(private readonly view: EditorView) {
		this.button = createCopyButton(view.dom.ownerDocument, () => this.current);
		this.button.classList.add(FLOATING_CLASS);
		this.button.hidden = true;
		this.button.addEventListener("mouseenter", () => this.cancelHide());
		this.button.addEventListener("mouseleave", () => this.scheduleHide());
		view.dom.appendChild(this.button);
		// 文書をスクロールするとボタンだけが元の位置に残るので隠す
		view.scrollDOM.addEventListener("scroll", this.onScroll, { passive: true });
	}

	private readonly onScroll = (): void => this.hide();

	update(update: ViewUpdate): void {
		if (update.docChanged || update.selectionSet || update.viewportChanged || update.geometryChanged) this.hide();
	}

	destroy(): void {
		this.cancelHide();
		this.view.scrollDOM.removeEventListener("scroll", this.onScroll);
		this.button.remove();
	}

	onPointer(target: EventTarget | null): void {
		if (target === this.button || this.button.contains(target as Node | null)) return this.cancelHide();
		const el = target instanceof Element ? target : null;
		const code = el?.closest(CODE_SELECTOR);
		const found =
			code instanceof HTMLElement ? this.codeAt(code) : (this.quoteLineAt(el?.closest(QUOTE_SELECTOR)) ?? this.calloutAt(el?.closest(CALLOUT_SELECTOR)));
		if (!found) {
			// インラインコードの上でカーソルが中にあるときは、すぐ隠す。それ以外は、ボタンへ動かす間を待つ
			if (code) return this.hide();
			return this.scheduleHide();
		}
		this.cancelHide();
		this.current = found.text;
		this.place(found);
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

	private posOf(el: HTMLElement): number | null {
		try {
			return this.view.posAtDOM(el);
		} catch {
			return null;
		}
	}

	/** コードの最初の行の箱の右上（折り返したコードでも、ボタンは 1 行目に出す） */
	private codeAt(el: HTMLElement): Target | null {
		const pos = this.posOf(el);
		if (pos === null) return null;
		const line = this.view.state.doc.lineAt(pos);
		const code = findInlineCode(line.text, pos - line.from);
		if (!code) return null;
		const span = { from: line.from + code.from, to: line.from + code.to };
		if (cursorInside(span, this.view.state.selection.ranges.map((r) => r.head))) return null;
		return { text: code.text, box: el.getClientRects()[0] ?? el.getBoundingClientRect(), inside: false };
	}

	/** pos を含む、ひと続きの引用の行の生の文 */
	private quoteTextAt(pos: number): { text: string; firstFrom: number } | null {
		const doc = this.view.state.doc;
		const lineAt = (n: number): string | null => (n >= 1 && n <= doc.lines ? doc.line(n).text : null);
		const range = quoteBlock(lineAt, doc.lineAt(pos).number);
		if (!range) return null;
		const lines: string[] = [];
		for (let n = range.first; n <= range.last; n++) lines.push(doc.line(n).text);
		return { text: quoteSource(lines), firstFrom: doc.line(range.first).from };
	}

	/** 引用の行。ボタンは、ひと続きの引用の 1 行目の右上に置く（1 行目が描かれていなければ、乗せた行） */
	private quoteLineAt(el: Element | null | undefined): Target | null {
		if (!(el instanceof HTMLElement)) return null;
		const pos = this.posOf(el);
		if (pos === null) return null;
		const quote = this.quoteTextAt(pos);
		if (!quote) return null;
		return { text: quote.text, box: this.lineBox(quote.firstFrom) ?? el.getBoundingClientRect(), inside: true };
	}

	/** 描かれたコールアウト（カーソルが外にあるとき）。ボタンは右上の「編集」のボタンの左に置く */
	private calloutAt(el: Element | null | undefined): Target | null {
		if (!(el instanceof HTMLElement)) return null;
		const pos = this.posOf(el);
		if (pos === null) return null;
		const quote = this.quoteTextAt(pos);
		if (!quote) return null;
		const box = el.getBoundingClientRect();
		const edit = el.querySelector(EDIT_BUTTON_SELECTOR);
		const right = edit instanceof HTMLElement && edit.offsetParent !== null ? edit.getBoundingClientRect().left : box.right;
		return { text: quote.text, box: new DOMRect(box.left, box.top, right - box.left, box.height), inside: true };
	}

	private lineBox(from: number): DOMRect | null {
		try {
			const { node } = this.view.domAtPos(from);
			const line = (node instanceof Element ? node : node.parentElement)?.closest(".cm-line");
			return line instanceof HTMLElement ? line.getBoundingClientRect() : null;
		} catch {
			return null;
		}
	}

	private place(target: Target): void {
		const base = this.view.dom.getBoundingClientRect();
		const inset = target.inside ? INSET : 0;
		this.button.classList.toggle(INSIDE_CLASS, target.inside);
		this.button.style.left = `${target.box.right - inset - base.left}px`;
		this.button.style.top = `${target.box.top + inset - base.top}px`;
		this.button.hidden = false;
	}
}

export const livePreviewCopy = ViewPlugin.fromClass(MarkdownCopy, {
	eventHandlers: {
		mouseover(event) {
			this.onPointer(event.target);
		},
		mouseleave() {
			this.scheduleHide();
		},
	},
});
