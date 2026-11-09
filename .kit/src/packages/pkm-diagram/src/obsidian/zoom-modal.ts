/**
 * 図の拡大表示（ADR-0102）。全画面のモーダルに図を出し、ホイール・ピンチで拡大・縮小し、ドラッグで動かす。
 * PC とモバイルで同じ部品。計算は core/viewport.ts（DOM なしでテストする）
 */
import { Modal, setIcon, type App } from "obsidian";
import { actualSize, fit, pan, pinch, wheelFactor, zoomAt, ZOOM_STEP, type Point, type Size, type View } from "../core/viewport.ts";

/** 大きさが分からない図（幅と高さのない SVG）の仮の大きさ */
const FALLBACK: Size = { width: 800, height: 600 };

export interface ZoomSource {
	/** <img> の src（Vault のファイルの URL か、SVG の data URI） */
	src: string;
	/** 図の名前（モーダルの見出しと、画像の代わりの文字） */
	title: string;
}

export class DiagramZoomModal extends Modal {
	private view: View = { scale: 1, x: 0, y: 0 };
	private content: Size = FALLBACK;
	private img: HTMLImageElement | null = null;
	private stage: HTMLDivElement | null = null;
	private percent: HTMLSpanElement | null = null;
	/** 画面に触れている指（pointerId → 位置） */
	private readonly pointers = new Map<number, Point>();
	private gesture: { view: View; a: Point; b: Point } | null = null;
	private resizeObserver: ResizeObserver | null = null;

	constructor(
		app: App,
		private readonly source: ZoomSource,
	) {
		super(app);
	}

	override onOpen(): void {
		this.modalEl.addClass("vt-diagram-zoom");
		this.titleEl.setText(this.source.title);
		const bar = this.contentEl.createDiv({ cls: "vt-diagram-zoom-bar", attr: { role: "toolbar", "aria-label": "Zoom" } });
		const button = (icon: string, label: string, onClick: () => void) => {
			const b = bar.createEl("button", { cls: "vt-diagram-zoom-button", attr: { type: "button", "aria-label": label, title: label } });
			setIcon(b, icon);
			b.addEventListener("click", onClick);
		};
		button("zoom-out", "Zoom out", () => this.zoomBy(1 / ZOOM_STEP));
		this.percent = bar.createSpan({ cls: "vt-diagram-zoom-percent", attr: { "aria-live": "polite" } });
		button("zoom-in", "Zoom in", () => this.zoomBy(ZOOM_STEP));
		button("maximize", "Fit", () => this.fit());
		button("scan", "100%", () => this.actual());

		const stage = this.contentEl.createDiv({ cls: "vt-diagram-zoom-stage" });
		this.stage = stage;
		const img = stage.createEl("img", { cls: "vt-diagram-zoom-image", attr: { alt: this.source.title, draggable: "false" } });
		this.img = img;
		img.src = this.source.src;
		void img
			.decode()
			.catch(() => undefined)
			.then(() => {
				this.content = img.naturalWidth > 0 && img.naturalHeight > 0 ? { width: img.naturalWidth, height: img.naturalHeight } : FALLBACK;
				img.style.width = `${this.content.width}px`;
				img.style.height = `${this.content.height}px`;
				this.fit();
			});

		stage.addEventListener("wheel", (e) => this.onWheel(e), { passive: false });
		stage.addEventListener("pointerdown", (e) => this.onPointerDown(e));
		stage.addEventListener("pointermove", (e) => this.onPointerMove(e));
		for (const type of ["pointerup", "pointercancel", "lostpointercapture"] as const) stage.addEventListener(type, (e) => this.onPointerUp(e));
		stage.addEventListener("dblclick", (e) => this.apply(zoomAt(this.view, 2, this.local(e))));

		this.scope.register([], "0", () => (this.fit(), false));
		this.scope.register([], "1", () => (this.actual(), false));
		for (const key of ["+", "="]) this.scope.register([], key, () => (this.zoomBy(ZOOM_STEP), false));
		this.scope.register([], "-", () => (this.zoomBy(1 / ZOOM_STEP), false));

		// 画面の大きさが変わったら（回転・ウィンドウの大きさ）、全体を表示し直す
		const win = this.modalEl.ownerDocument.defaultView;
		if (win && "ResizeObserver" in win) {
			let first = true;
			this.resizeObserver = new win.ResizeObserver(() => {
				if (first) {
					first = false;
					return;
				}
				this.fit();
			});
			this.resizeObserver.observe(stage);
		}
	}

	override onClose(): void {
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
		this.pointers.clear();
		this.contentEl.empty();
	}

	private stageSize(): Size {
		const r = this.stage?.getBoundingClientRect();
		return { width: r?.width ?? 0, height: r?.height ?? 0 };
	}

	private local(e: { clientX: number; clientY: number }): Point {
		const r = this.stage?.getBoundingClientRect();
		return { x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) };
	}

	private apply(view: View): void {
		this.view = view;
		if (this.img) this.img.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
		if (this.percent) this.percent.setText(`${Math.round(view.scale * 100)}%`);
	}

	private fit(): void {
		this.apply(fit(this.content, this.stageSize()));
	}

	private actual(): void {
		this.apply(actualSize(this.content, this.stageSize()));
	}

	private zoomBy(factor: number): void {
		const s = this.stageSize();
		this.apply(zoomAt(this.view, factor, { x: s.width / 2, y: s.height / 2 }));
	}

	private onWheel(e: WheelEvent): void {
		e.preventDefault();
		// トラックパッドの 2 本指の移動（ctrl なし・横の量あり）は動かす。それ以外は拡大・縮小
		if (!e.ctrlKey && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
			this.apply(pan(this.view, -e.deltaX, -e.deltaY));
			return;
		}
		this.apply(zoomAt(this.view, wheelFactor(e.deltaY, e.deltaMode), this.local(e)));
	}

	private onPointerDown(e: PointerEvent): void {
		if (e.pointerType === "mouse" && e.button !== 0) return;
		this.stage?.setPointerCapture(e.pointerId);
		this.pointers.set(e.pointerId, this.local(e));
		this.stage?.addClass("is-dragging");
		this.startGesture();
	}

	/** 指の数が変わるたびに、そのときの表示と指の位置を起点にする */
	private startGesture(): void {
		const [a, b] = [...this.pointers.values()];
		this.gesture = a ? { view: this.view, a, b: b ?? a } : null;
	}

	private onPointerMove(e: PointerEvent): void {
		if (!this.pointers.has(e.pointerId) || !this.gesture) return;
		this.pointers.set(e.pointerId, this.local(e));
		const [a, b] = [...this.pointers.values()];
		if (!a) return;
		if (b) this.apply(pinch(this.gesture.view, this.gesture.a, this.gesture.b, a, b));
		else this.apply(pan(this.gesture.view, a.x - this.gesture.a.x, a.y - this.gesture.a.y));
	}

	private onPointerUp(e: PointerEvent): void {
		if (!this.pointers.delete(e.pointerId)) return;
		if (this.pointers.size === 0) this.stage?.removeClass("is-dragging");
		this.startGesture();
	}
}
