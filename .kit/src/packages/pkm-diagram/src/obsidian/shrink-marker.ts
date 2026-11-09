/**
 * ノートの中で縮めすぎて文字が読めない図に、「Expand to read」の印を出す（ADR-0102 の段階 3）。
 * 図（Vault の SVG の図の画像、Mermaid の図）を見つけたら、表示の幅を見張り、
 * いちばん小さい文字が MIN_TEXT_PX 未満に縮んでいれば、図を囲む要素にクラスを付ける（印は CSS の ::after）。
 * Obsidian の描いた DOM は、そのクラスの付け外しだけを行う（要素は足さない・動かさない）
 */
import { tooSmallToRead } from "../core/plain-svg.ts";
import type { DiagramTarget, FoundDiagram } from "./toolbar.ts";

export const SHRUNK_CLASS = "vt-diagram-shrunk";

/** 図を探す範囲（Reading view と Live Preview） */
const CANDIDATES = ":is(.markdown-preview-view, .markdown-source-view) :is(img, .mermaid > svg)";
/** DOM が変わってから探し直すまでの間（ms）。打っている間に何度も探さない */
const SCAN_DELAY = 300;

export interface ShrinkHost {
	resolve(el: Element): FoundDiagram | null;
	/** 図の中のいちばん小さい文字の大きさ（図の座標での px）。文字がなければ null */
	minTextSize(target: DiagramTarget): Promise<number | null>;
}

interface Tracked {
	target: DiagramTarget;
	/** クラスを付ける要素 */
	box: Element;
	minText: number | null | undefined;
}

/** 図の幅（図の座標での px） */
function naturalWidth(el: Element): number {
	if (el.tagName === "IMG") return (el as HTMLImageElement).naturalWidth;
	const vb = (el.getAttribute("viewBox") ?? "").trim().split(/[\s,]+/).map(Number);
	return vb.length === 4 && (vb[2] as number) > 0 ? (vb[2] as number) : 0;
}

/** 印を付ける要素。画像は埋め込みの入れ物、Mermaid は .mermaid */
function boxOf(el: Element): Element {
	if (el.tagName === "IMG") return el.closest(".image-embed, .internal-embed") ?? el.parentElement ?? el;
	return el.closest(".mermaid") ?? el;
}

class DocMarker {
	private readonly tracked = new Map<Element, Tracked>();
	private readonly mutations: MutationObserver | null;
	private readonly resizes: ResizeObserver | null;
	private timer: number | null = null;

	constructor(
		private readonly doc: Document,
		private readonly host: ShrinkHost,
	) {
		// 窓のない文書（テストの偽の文書など）では何もしない
		const win = doc.defaultView;
		this.resizes = win && "ResizeObserver" in win ? new win.ResizeObserver((entries) => entries.forEach((e) => this.evaluate(e.target))) : null;
		this.mutations = win && "MutationObserver" in win ? new win.MutationObserver(() => this.schedule()) : null;
		if (!this.mutations) return;
		this.mutations.observe(doc.body, { childList: true, subtree: true });
		this.schedule();
	}

	private schedule(): void {
		if (this.timer !== null) return;
		this.timer = this.doc.defaultView?.setTimeout(() => {
			this.timer = null;
			this.scan();
		}, SCAN_DELAY) ?? null;
	}

	/** 新しく出た図を見張り始め、消えた図をやめる */
	scan(): void {
		for (const [el, t] of this.tracked) {
			if (!el.isConnected) {
				this.resizes?.unobserve(el);
				t.box.classList.remove(SHRUNK_CLASS);
				this.tracked.delete(el);
			}
		}
		for (const el of this.doc.querySelectorAll(CANDIDATES)) {
			if (this.tracked.has(el)) continue;
			const found = this.host.resolve(el);
			if (!found) continue;
			const t: Tracked = { target: found.target, box: boxOf(el), minText: undefined };
			this.tracked.set(el, t);
			this.resizes?.observe(el);
			if (el.tagName === "IMG" && !(el as HTMLImageElement).complete) el.addEventListener("load", () => this.evaluate(el), { once: true });
			void this.host.minTextSize(found.target).then(
				(n) => {
					t.minText = n;
					this.evaluate(el);
				},
				() => (t.minText = null),
			);
		}
	}

	evaluate(el: Element): void {
		const t = this.tracked.get(el);
		if (!t || t.minText === undefined) return;
		const shown = el.getBoundingClientRect().width;
		const small = shown > 0 && tooSmallToRead(t.minText, naturalWidth(el), shown);
		t.box.classList.toggle(SHRUNK_CLASS, small);
	}

	destroy(): void {
		if (this.timer !== null) this.doc.defaultView?.clearTimeout(this.timer);
		this.mutations?.disconnect();
		this.resizes?.disconnect();
		for (const t of this.tracked.values()) t.box.classList.remove(SHRUNK_CLASS);
		this.tracked.clear();
	}
}

export class ShrinkMarker {
	private readonly docs = new Map<Document, DocMarker>();

	constructor(private readonly host: ShrinkHost) {}

	/** 文書（本体とポップアウトのウィンドウ）ごとに 1 つ */
	attach(doc: Document): void {
		if (!this.docs.has(doc)) this.docs.set(doc, new DocMarker(doc, this.host));
	}

	detach(doc: Document): void {
		this.docs.get(doc)?.destroy();
		this.docs.delete(doc);
	}

	/** すぐに探し直す（テストと、レイアウトが変わったとき） */
	rescan(): void {
		for (const m of this.docs.values()) m.scan();
	}

	destroy(): void {
		for (const m of this.docs.values()) m.destroy();
		this.docs.clear();
	}
}

/** Mermaid の図の中のいちばん小さい文字の大きさ（計算済みのスタイル。図の座標での px） */
export function mermaidMinTextSize(svg: SVGSVGElement): number | null {
	const win = svg.ownerDocument.defaultView ?? window;
	let min = Number.POSITIVE_INFINITY;
	const labels = svg.querySelectorAll(".nodeLabel, .edgeLabel, .cluster-label, text");
	for (const el of [...labels].slice(0, 300)) {
		if (!(el.textContent ?? "").trim()) continue;
		const px = Number.parseFloat(win.getComputedStyle(el).fontSize);
		if (px > 0) min = Math.min(min, px);
	}
	return Number.isFinite(min) ? min : null;
}
