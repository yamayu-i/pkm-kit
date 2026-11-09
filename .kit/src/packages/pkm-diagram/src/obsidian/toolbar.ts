/**
 * 図に浮かべる操作バー（ADR-0064、ADR-0102）。「コピー」「PNG で保存」「拡大」と、Draw.io の図だけ「編集」。
 * 対象は、Vault の SVG の図の画像（.drawio.svg と、AI が書く / D2 で描く .svg）と、ノートの Mermaid の図。
 * Obsidian の描いた DOM（Reading view、Live Preview の widget）は書き換えず、body に置く 1 つの要素を図の右上に重ねる。
 * マウスは図に載せると出る。タッチは図を押すと出て、ほかの場所を押すと消える
 */
import { setIcon, type TFile } from "obsidian";

export type DiagramTarget = { kind: "file"; file: TFile; drawio: boolean } | { kind: "mermaid"; svg: SVGSVGElement };

export interface FoundDiagram {
	/** 操作バーを重ねる要素（画像か、Mermaid の SVG） */
	el: Element;
	target: DiagramTarget;
}

export interface ToolbarHost {
	/** 要素が図（またはその中）なら、その図 */
	resolve(el: Element): FoundDiagram | null;
	copy(target: DiagramTarget, anchor: HTMLElement): void;
	save(target: DiagramTarget): void;
	expand(target: DiagramTarget): void;
	edit(file: TFile): void;
}

type Register = <K extends keyof DocumentEventMap>(doc: Document, type: K, cb: (e: DocumentEventMap[K]) => void, capture?: boolean) => void;

/** 消すまでの猶予（ms）。画像から操作バーへマウスを動かす間に消えないように */
const HIDE_DELAY = 300;
/** 画像の端からの間隔（px） */
const INSET = 8;

function asElement(el: EventTarget | null): Element | null {
	return el && typeof (el as Element).closest === "function" ? (el as Element) : null;
}

class DocToolbar {
	readonly el: HTMLDivElement;
	private current: FoundDiagram | null = null;
	private readonly editButton: HTMLButtonElement;
	private hideTimer: number | null = null;
	private pinned = false;

	constructor(
		private readonly doc: Document,
		private readonly host: ToolbarHost,
	) {
		this.el = doc.body.createDiv({ cls: "vt-drawio-toolbar", attr: { role: "toolbar", "aria-label": "Diagram actions" } });
		this.el.hidden = true;
		const button = (icon: string, label: string, onClick: (target: DiagramTarget, anchor: HTMLElement) => void) => {
			const b = this.el.createEl("button", { cls: "vt-drawio-tool", attr: { type: "button", "aria-label": label, title: label } });
			setIcon(b, icon);
			b.createSpan({ cls: "vt-drawio-tool-label", text: label });
			// 押してもエディタのカーソルと選択を動かさない
			b.addEventListener("mousedown", (e) => e.preventDefault());
			b.addEventListener("click", (e) => {
				e.preventDefault();
				e.stopPropagation();
				if (this.current) onClick(this.current.target, b);
			});
			return b;
		};
		button("copy", "Copy", (target, anchor) => this.host.copy(target, anchor));
		button("download", "Save PNG", (target) => this.host.save(target));
		button("maximize-2", "Expand", (target) => {
			this.hide();
			this.host.expand(target);
		});
		this.editButton = button("pencil", "Edit", (target) => {
			if (target.kind !== "file") return;
			this.hide();
			this.host.edit(target.file);
		});
		this.el.addEventListener("pointerenter", () => this.cancelHide());
		this.el.addEventListener("pointerleave", (e) => {
			if (e.pointerType === "mouse" && !this.pinned) this.scheduleHide();
		});
		this.el.addEventListener("focusout", (e) => {
			if (!this.el.contains(e.relatedTarget as Node | null)) this.scheduleHide();
		});
	}

	show(found: FoundDiagram, pinned: boolean): void {
		this.cancelHide();
		this.current = found;
		this.pinned = pinned;
		this.editButton.hidden = !(found.target.kind === "file" && found.target.drawio);
		this.el.hidden = false;
		this.place();
	}

	hide(): void {
		this.cancelHide();
		this.current = null;
		this.pinned = false;
		this.el.hidden = true;
	}

	scheduleHide(): void {
		this.cancelHide();
		this.hideTimer = this.doc.defaultView?.setTimeout(() => this.hide(), HIDE_DELAY) ?? null;
	}

	cancelHide(): void {
		if (this.hideTimer !== null) this.doc.defaultView?.clearTimeout(this.hideTimer);
		this.hideTimer = null;
	}

	/** 画像の右上の内側に置く。画像が小さければ画像の上に出す */
	private place(): void {
		if (!this.current) return;
		const rect = this.current.el.getBoundingClientRect();
		if (rect.width === 0 && rect.height === 0) {
			this.hide();
			return;
		}
		const bar = this.el.getBoundingClientRect();
		const top = rect.height >= bar.height + 2 * INSET ? rect.top + INSET : rect.top - bar.height - INSET / 2;
		const left = Math.max(INSET, rect.right - bar.width - INSET);
		this.el.style.top = `${Math.max(INSET, Math.round(top))}px`;
		this.el.style.left = `${Math.round(left)}px`;
	}

	onPointerOver(e: PointerEvent): void {
		if (e.pointerType !== "mouse" || this.pinned) return;
		const target = e.target;
		if (this.el.contains(target as Node)) {
			this.cancelHide();
			return;
		}
		const el = asElement(target);
		const found = el ? this.host.resolve(el) : null;
		if (found) {
			if (this.current?.el === found.el) {
				this.cancelHide();
				return;
			}
			this.show(found, false);
			return;
		}
		if (this.current) this.scheduleHide();
	}

	onPointerDown(e: PointerEvent): void {
		const target = e.target;
		if (this.el.contains(target as Node)) return;
		const el = asElement(target);
		if (e.pointerType !== "mouse" && el) {
			const found = this.host.resolve(el);
			if (found) {
				this.show(found, true);
				return;
			}
		}
		if (this.pinned || this.current) this.hide();
	}

	onScroll(): void {
		if (this.current) this.hide();
	}

	destroy(): void {
		this.cancelHide();
		this.el.remove();
	}
}

export class DiagramToolbar {
	private readonly bars = new Map<Document, DocToolbar>();

	constructor(private readonly host: ToolbarHost) {}

	/** 文書（本体とポップアウトのウィンドウ）ごとに 1 つ。イベントは register に渡す（プラグインの終了で外れる） */
	attach(doc: Document, register: Register): void {
		if (this.bars.has(doc)) return;
		const bar = new DocToolbar(doc, this.host);
		this.bars.set(doc, bar);
		register(doc, "pointerover", (e) => bar.onPointerOver(e));
		register(doc, "pointerdown", (e) => bar.onPointerDown(e), true);
		register(doc, "scroll", () => bar.onScroll(), true);
		register(doc, "keydown", (e) => {
			if (e.key === "Escape") bar.hide();
		});
	}

	detach(doc: Document): void {
		this.bars.get(doc)?.destroy();
		this.bars.delete(doc);
	}

	hideAll(): void {
		for (const bar of this.bars.values()) bar.hide();
	}

	destroy(): void {
		for (const bar of this.bars.values()) bar.destroy();
		this.bars.clear();
	}
}
