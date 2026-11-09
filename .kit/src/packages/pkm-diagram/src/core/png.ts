/**
 * PNG のコピーと保存（ADR-0102）の、DOM に依存しない部分。
 * - PNG は、ノートをダークテーマで見ていても常にライトの色で作る（貼り付け先の多くは白い背景）
 * - 保存先は、保存のダイアログ → 共有シート → tmp/ の順で、使えるものを選ぶ
 */
import { diagram } from "../../../design/generated/tokens.ts";

/** PNG の背景（ライトの面の色） */
export const PNG_BACKGROUND = diagram.light.neutral.labelBg;

/** `{` と `}` の対応を見て、start の位置の `{` に対応する `}` の次の位置 */
function blockEnd(css: string, open: number): number {
	let depth = 0;
	for (let i = open; i < css.length; i++) {
		if (css[i] === "{") depth++;
		else if (css[i] === "}") {
			depth--;
			if (depth === 0) return i + 1;
		}
	}
	return css.length;
}

/** CSS から、ダークのときだけ効く @media（prefers-color-scheme: dark）の塊を除く */
export function stripDarkMedia(css: string): string {
	let out = "";
	let pos = 0;
	const re = /@media[^{]*prefers-color-scheme\s*:\s*dark[^{]*\{/gi;
	for (let m = re.exec(css); m; m = re.exec(css)) {
		const open = m.index + m[0].length - 1;
		out += css.slice(pos, m.index);
		pos = blockEnd(css, open);
		re.lastIndex = pos;
	}
	return out + css.slice(pos);
}

/** SVG の <style> の中の、ダークのときだけ効く指定を除く（PNG をライトの色で作る） */
export function forceLightSvg(svg: string): string {
	return svg.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (_, open: string, body: string, close: string) => `${open}${stripDarkMedia(body)}${close}`);
}

/** ダークの配色の値 → ライトの配色の値（Obsidian のダークテーマで描いた Mermaid の色を戻す） */
export function darkToLightColors(): Map<string, string> {
	const map = new Map<string, string>();
	const add = (dark: string, light: string) => {
		const key = dark.toLowerCase();
		if (!map.has(key)) map.set(key, light.toLowerCase());
	};
	for (const role of Object.keys(diagram.dark.neutral) as Array<keyof typeof diagram.dark.neutral>) add(diagram.dark.neutral[role], diagram.light.neutral[role]);
	for (const name of Object.keys(diagram.dark.colors) as Array<keyof typeof diagram.dark.colors>) {
		const d = diagram.dark.colors[name];
		const l = diagram.light.colors[name];
		add(d.fill, l.fill);
		add(d.stroke, l.stroke);
		add(d.text, l.text);
	}
	return map;
}

/** CSS の色（rgb() / rgba() / #rgb / #rrggbb）を #rrggbb にする。透明や読めないものは null */
export function cssColorToHex(value: string): string | null {
	const v = value.trim().toLowerCase();
	const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(v);
	if (hex) {
		const h = hex[1] as string;
		return h.length === 3 ? `#${[...h].map((c) => c + c).join("")}` : `#${h}`;
	}
	const rgb = /^rgba?\(\s*(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(v);
	if (!rgb) return null;
	if (rgb[4] !== undefined) {
		const a = rgb[4].endsWith("%") ? Number(rgb[4].slice(0, -1)) / 100 : Number(rgb[4]);
		if (a === 0) return null;
	}
	return `#${[rgb[1], rgb[2], rgb[3]].map((n) => Math.round(Number(n)).toString(16).padStart(2, "0")).join("")}`;
}

export type SaveMethod = "picker" | "share" | "tmp";

/** 使える保存の方法を、優先する順に並べる（PC は保存のダイアログ、モバイルは共有シート、どちらもなければ tmp/） */
export function saveMethods(env: { picker: boolean; share: boolean }): SaveMethod[] {
	const out: SaveMethod[] = [];
	if (env.picker) out.push("picker");
	if (env.share) out.push("share");
	out.push("tmp");
	return out;
}

/** PNG のファイル名（拡張子なしの名前から）。ファイル名に使えない文字は - にする */
export function pngFileName(base: string): string {
	const stem = base
		.replace(/\.drawio\.svg$/i, "")
		.replace(/\.(svg|md|html?)$/i, "")
		.replace(/[\\/:*?"<>|#^[\]\u0000-\u001f]+/g, "-")
		.trim();
	return `${stem || "diagram"}.png`;
}
