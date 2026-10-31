/**
 * 色の計算（WCAG 2.2 の相対輝度とコントラスト比）。
 * 定義: https://www.w3.org/TR/WCAG22/#dfn-relative-luminance / #dfn-contrast-ratio
 */

export interface Rgba {
	/** 0〜255 */
	r: number;
	g: number;
	b: number;
	/** 0〜1 */
	a: number;
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function isHex(text: string): boolean {
	return HEX.test(text);
}

/** `#rgb` / `#rgba` / `#rrggbb` / `#rrggbbaa` を読む */
export function parseHex(text: string): Rgba {
	if (!isHex(text)) throw new Error(`色の書式が違います: ${text}`);
	let h = text.slice(1);
	if (h.length <= 4) h = [...h].map((c) => c + c).join("");
	const n = (i: number) => Number.parseInt(h.slice(i, i + 2), 16);
	return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
}

export function toHex(c: Rgba): string {
	const p = (v: number) => Math.round(v).toString(16).padStart(2, "0");
	const alpha = c.a >= 1 ? "" : p(c.a * 255);
	return `#${p(c.r)}${p(c.g)}${p(c.b)}${alpha}`;
}

/** 上の色（半透明でもよい）を下の不透明な色に重ねる（sRGB でのアルファ合成。ブラウザの描画と同じ） */
export function over(top: Rgba, bottom: Rgba): Rgba {
	const a = top.a;
	return {
		r: top.r * a + bottom.r * (1 - a),
		g: top.g * a + bottom.g * (1 - a),
		b: top.b * a + bottom.b * (1 - a),
		a: 1,
	};
}

/** 下から順に重ねる。最初の色は不透明でなければならない */
export function stack(layers: readonly Rgba[]): Rgba {
	const [first, ...rest] = layers;
	if (!first) throw new Error("重ねる色がありません");
	if (first.a < 1) throw new Error("一番下の色は不透明にしてください");
	return rest.reduce((acc, c) => over(c, acc), first);
}

function channel(v: number): number {
	const s = v / 255;
	return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(c: Rgba): number {
	return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

/** コントラスト比（1〜21）。半透明の前景は背景に重ねてから測る */
export function contrastRatio(foreground: Rgba, background: Rgba): number {
	if (background.a < 1) throw new Error("背景は不透明にしてください");
	const fg = foreground.a < 1 ? over(foreground, background) : foreground;
	const l1 = relativeLuminance(fg);
	const l2 = relativeLuminance(background);
	return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** 表示や比較のための切り捨て（2 桁）。基準を満たすかの判定には切り捨て前の値を使う */
export function formatRatio(ratio: number): string {
	return (Math.floor(ratio * 100) / 100).toFixed(2);
}
