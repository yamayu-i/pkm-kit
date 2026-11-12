/**
 * デッキごとの primary の色（ADR-0117 の 5）。値を書いてよいのは <meta name="deck-primary"> だけ。
 * 面とのコントラストを確かめ、primary の上の文字の色と container の色を作る
 */
import { colors } from "../../../design/generated/tokens.ts";
import { contrastRatio, parseHex, toHex } from "../../../design/src/color.ts";
import { containerOf, lightenForDark as lighten, MIN_TEXT_CONTRAST, onColorOf } from "../../../design/src/primary.ts";
import { loadTokens, type Token } from "../../../design/src/tokens.ts";
import tokensJson from "../../../design/tokens.json";

export type Mode = "light" | "dark";

/** 上流のトークン（子の基本の色を theme.mjs と同じ作り方で重ねるのに使う。ADR-0129） */
export const TOKENS: readonly Token[] = loadTokens(tokensJson);

export interface PrimaryColors {
	primary: string;
	onPrimary: string;
	container: string;
	onContainer: string;
}

/** 文字として読める比（WCAG 1.4.3） */
export const MIN_CONTRAST = MIN_TEXT_CONTRAST;

export function isColorValue(text: string): boolean {
	return /^#[0-9a-fA-F]{6}$/.test(text);
}

/**
 * primary から 4 つの色を作る。面との比が足りなければ error を返す。
 * on-primary は白か、面の上の文字の色のうち、比が高い方。container は面に primary を 16% 混ぜたもの（design の primary.ts。theme.mjs と同じ）
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
	const onPrimary = onColorOf(primary, parseHex(colors.light["color.on-surface"]));
	return { primary: toHex(primary), onPrimary: toHex(onPrimary), container: toHex(containerOf(surface, primary)), onContainer: toHex(onSurface) };
}

/** ダークの primary が書かれていないとき、ライトの primary を白に寄せて、ダークの面で読める色にする（deck-primary） */
export function lightenForDark(hex: string): string {
	return toHex(lighten(parseHex(hex), parseHex(colors.dark["color.surface"])));
}
