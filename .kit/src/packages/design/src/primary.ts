/**
 * primary から作る色（ADR-0125 のスライド、ADR-0129 の子の基本の色）。
 * スライドと theme.mjs で同じ作り方にして、同じ Vault の中で色が食い違わないようにする
 */
import { contrastRatio, type Rgba } from "./color.ts";

/** 文字として読める比（WCAG 1.4.3） */
export const MIN_TEXT_CONTRAST = 4.5;
/** container は面に primary をこの割合で混ぜる */
export const CONTAINER_MIX = 0.16;

const WHITE: Rgba = { r: 255, g: 255, b: 255, a: 1 };

export function mix(a: Rgba, b: Rgba, t: number): Rgba {
	const ch = (x: number, y: number) => x + (y - x) * t;
	return { r: ch(a.r, b.r), g: ch(a.g, b.g), b: ch(a.b, b.b), a: 1 };
}

/** 選んだものの面（secondary-container / スライドの primary-container）: 面に primary を 16% 混ぜた色 */
export function containerOf(surface: Rgba, primary: Rgba): Rgba {
	return mix(surface, primary, CONTAINER_MIX);
}

/** primary の上の文字: 白と、暗い文字（ライトの on-surface）のうち、比が高い方 */
export function onColorOf(primary: Rgba, darkText: Rgba): Rgba {
	return contrastRatio(WHITE, primary) >= contrastRatio(darkText, primary) ? WHITE : darkText;
}

/** ライトの色を白に 5% ずつ寄せ、ok になった最初の色を返す（どれも ok でなければ白） */
export function lightenUntil(base: Rgba, ok: (c: Rgba) => boolean): Rgba {
	for (let t = 0; t <= 1.0001; t += 0.05) {
		const c = mix(base, WHITE, t);
		if (ok(c)) return c;
	}
	return { ...WHITE };
}

/** デッキの deck-primary-dark がないとき: ダークの面で読める（4.5:1）ところまで白に寄せる */
export function lightenForDark(base: Rgba, darkSurface: Rgba): Rgba {
	return lightenUntil(base, (c) => contrastRatio(c, darkSurface) >= MIN_TEXT_CONTRAST);
}
