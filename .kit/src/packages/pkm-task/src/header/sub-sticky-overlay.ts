import { render, type ComponentChild } from "preact";

/** 題の行の高さが測れないうちの見込み（`.vt-subissue-row` の最小の高さと枠） */
const ROW_HEIGHT_GUESS = 46;
/** 行の影（--vt-elevation-2）が切り抜きで切れないための余白 */
const SHADOW_ROOM = 4;

export interface StickyBox {
	/** スクロール領域の上端（画面の座標） */
	top: number;
	/** カードの左端と幅（画面の座標） */
	left: number;
	width: number;
}

/** 浮かべる行の位置: スクロール領域の上端に、カードの横の範囲で置く。スクロール領域の見えている幅からはみ出さない */
export function stickyBox(scroller: HTMLElement, card: { left: number; right: number }): StickyBox {
	const r = scroller.getBoundingClientRect();
	const left = Math.max(card.left, r.left);
	const right = Math.min(card.right, r.left + scroller.clientWidth);
	return { top: r.top, left, width: Math.max(0, right - left) };
}

/**
 * 開いたサブの題の行を、スクロール領域の上端に重ねて出す（ADR-0161 の追記）。
 * スクロール領域の外（その親）に置くので、スクロールしても位置を直すだけでよい。行の高さで切り抜き、押し出しは中身をずらす
 */
export class StickyOverlay {
	private readonly el: HTMLElement;
	private readonly inner: HTMLElement;
	private key: string | null = null;
	private height = ROW_HEIGHT_GUESS;

	constructor(container: HTMLElement) {
		this.el = document.createElement("div");
		this.el.className = "vt-sub-sticky";
		this.el.hidden = true;
		this.inner = document.createElement("div");
		this.inner.className = "vt-sub-sticky-inner";
		this.el.appendChild(this.inner);
		container.appendChild(this.el);
	}

	/** 浮かべる行の高さ（押し出しの計算に使う） */
	get rowHeight(): number {
		return this.height;
	}

	/** key が変わったときだけ描き直す */
	show(key: string, view: () => ComponentChild, box: StickyBox, offset: number): void {
		this.el.hidden = false;
		if (key !== this.key) {
			this.key = key;
			render(view(), this.inner);
		}
		this.height = this.inner.offsetHeight || this.height;
		const base = (this.el.offsetParent ?? this.el.parentElement)?.getBoundingClientRect();
		this.el.style.top = `${box.top - (base?.top ?? 0)}px`;
		this.el.style.left = `${box.left - (base?.left ?? 0)}px`;
		this.el.style.width = `${box.width}px`;
		// 影が切れないように、下に少し余白を足す
		this.el.style.height = `${this.height + SHADOW_ROOM}px`;
		this.inner.style.transform = offset === 0 ? "" : `translateY(${offset}px)`;
	}

	hide(): void {
		this.el.hidden = true;
	}

	destroy(): void {
		render(null, this.inner);
		this.el.remove();
	}
}
