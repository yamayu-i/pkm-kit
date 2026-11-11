/**
 * デッキごとの primary の色（ADR-0117 の 5）。値を書いてよいのは <meta name="deck-primary"> だけ。
 * 面とのコントラストを確かめ、primary の上の文字の色と container の色を作る
 */
import { colors } from "../../../design/generated/tokens.ts";
import { contrastRatio, parseHex, toHex, type Rgba } from "../../../design/src/color.ts";

export type Mode = "light" | "dark";

export interface PrimaryColors {
	primary: string;
	onPrimary: string;
	container: string;
	onContainer: string;
}

/** 文字として読める比（WCAG 1.4.3） */
export const MIN_CONTRAST = 4.5;

function mix(a: Rgba, b: Rgba, t: number): Rgba {
	const ch = (x: number, y: number) => x + (y - x) * t;
	return { r: ch(a.r, b.r), g: ch(a.g, b.g), b: ch(a.b, b.b), a: 1 };
}

export function isColorValue(text: string): boolean {
	return /^#[0-9a-fA-F]{6}$/.test(text);
}

/**
 * primary から 4 つの色を作る。面との比が足りなければ error を返す。
 * on-primary は白か、面の上の文字の色のうち、比が高い方。container は面に primary を 16% 混ぜたもの
 */
export function derivePrimary(hex: string, mode: Mode): PrimaryColors | { error: string } {
	const palette = colors[mode];
	const primary = parseHex(hex);
	const surface = parseHex(palette["color.surface"]);
	const onSurface = parseHex(palette["color.on-surface"]);
	const ratio = contrastRatio(primary, surface);
	if (ratio < MIN_CONTRAST) {
		return { error: `${hex} は${mode === "light" ? "ライト" : "ダーク"}の面との比が ${ratio.toFixed(2)}:1 で、${MIN_CONTRAST}:1 に足りない` };
	}
	const white = parseHex("#ffffff");
	const dark = parseHex(colors.light["color.on-surface"]);
	const onPrimary = contrastRatio(white, primary) >= contrastRatio(dark, primary) ? white : dark;
	const container = mix(surface, primary, 0.16);
	return { primary: toHex(primary), onPrimary: toHex(onPrimary), container: toHex(container), onContainer: toHex(onSurface) };
}

/** ダークの primary が書かれていないとき、ライトの primary を白に寄せて、ダークの面で読める色にする */
export function lightenForDark(hex: string): string {
	const surface = parseHex(colors.dark["color.surface"]);
	const base = parseHex(hex);
	const white = parseHex("#ffffff");
	for (let t = 0; t <= 1.0001; t += 0.05) {
		const c = mix(base, white, t);
		if (contrastRatio(c, surface) >= MIN_CONTRAST) return toHex(c);
	}
	return "#ffffff";
}
