/**
 * 図の画像に浮かべる操作バー（ADR-0064）。「コピー」「編集」の 2 つ。
 * Obsidian の描いた DOM（Reading view、Live Preview の widget）は書き換えず、body に置く 1 つの要素を画像の右上に重ねる。
 * マウスは画像に載せると出る。タッチは画像を押すと出て、ほかの場所を押すと消える
 */
import { setIcon, type TFile } from "obsidian";

export interface ToolbarHost {
	/** 画像が図のファイルを指していれば、そのファイル */
	resolve(img: HTMLImageElement): TFile | null;
	copy(file: TFile, anchor: HTMLElement): void;
	edit(file: TFile): void;
}

type Register = <K extends keyof DocumentEventMap>(doc: Document, type: K, cb: (e: DocumentEventMap[K]) => void, capture?: boolean) => void;

/** 消すまでの猶予（ms）。画像から操作バーへマウスを動かす間に消えないように */
const HIDE_DELAY = 300;
/** 画像の端からの間隔（px） */
const INSET = 8;

function isImg(el: EventTarget | null): el is HTMLImageElement {
	return !!el && (el as Element).tagName === "IMG";
}

class DocToolbar {
	readonly el: HTMLDivElement;
	private current: { img: HTMLImageElement; file: TFile } | null = null;
	private hideTimer: number | null = null;
	private pinned = false;

	constructor(
		private readonly doc: Document,
		private readonly host: ToolbarHost,
	) {
		this.el = doc.body.createDiv({ cls: "vt-drawio-toolbar", attr: { role: "toolbar", "aria-label": "Diagram actions" } });
		this.el.hidden = true;
		const button = (icon: string, label: string, onClick: (file: TFile, anchor: HTMLElement) => void) => {
			const b = this.el.createEl("button", { cls: "vt-drawio-tool", attr: { type: "button", "aria-label": label, title: label } });
			setIcon(b, icon);
			b.createSpan({ cls: "vt-drawio-tool-label", text: label });
			// 押してもエディタのカーソルと選択を動かさない
			b.addEventListener("mousedown", (e) => e.preventDefault());
			b.addEventListener("click", (e) => {
				e.preventDefault();
				e.stopPropagation();
				if (this.current) onClick(this.current.file, b);
			});
		};
		button("copy", "Copy", (file, anchor) => this.host.copy(file, anchor));
		button("pencil", "Edit", (file) => {
			this.hide();
			this.host.edit(file);
		});
		this.el.addEventListener("pointerenter", () => this.cancelHide());
		this.el.addEventListener("pointerleave", (e) => {
			if (e.pointerType === "mouse" && !this.pinned) this.scheduleHide();
		});
		this.el.addEventListener("focusout", (e) => {
			if (!this.el.contains(e.relatedTarget as Node | null)) this.scheduleHide();
		});
	}

	show(img: HTMLImageElement, file: TFile, pinned: boolean): void {
		this.cancelHide();
		this.current = { img, file };
		this.pinned = pinned;
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
		const rect = this.current.img.getBoundingClientRect();
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
		if (isImg(target)) {
			if (this.current?.img === target) {
				this.cancelHide();
				return;
			}
			const file = this.host.resolve(target);
			if (file) {
				this.show(target, file, false);
				return;
			}
		}
		if (this.current) this.scheduleHide();
	}

	onPointerDown(e: PointerEvent): void {
		const target = e.target;
		if (this.el.contains(target as Node)) return;
		if (e.pointerType !== "mouse" && isImg(target)) {
			const file = this.host.resolve(target);
			if (file) {
				this.show(target, file, true);
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
