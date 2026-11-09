/**
 * D2 の図（ADR-0102）。D2 のソースの前に付ける、図の配色のテーマとクラス。DOM にも Node にも依存しない。
 * 描画は外部の d2 コマンドが行う（CLI の d2）。AI はノードに `class: blue` などを書く
 */
import { diagram } from "../../../design/generated/tokens.ts";
import { COLOR_NAMES } from "./plain-svg.ts";

type Palette = (typeof diagram)["light"] | (typeof diagram)["dark"];

/** D2 のテーマの色（N1〜N7、B1〜B6、AA*、AB*）に、図の配色の役割を当てる */
function themeOverrides(p: Palette): Record<string, string> {
	const n = p.neutral;
	return {
		N1: n.text,
		N2: n.muted,
		N3: n.muted,
		// N4〜N6 は、ひし形・六角形などの面に使われる
		N4: n.groupFill,
		N5: n.groupFill,
		N6: n.groupFill,
		N7: n.nodeFill,
		B1: n.nodeStroke,
		B2: n.edge,
		// B3 は人（person）の面
		B3: n.groupFill,
		B4: n.groupFill,
		B5: n.groupFill,
		B6: n.nodeFill,
		AA2: n.nodeStroke,
		AA4: n.groupFill,
		AA5: n.nodeFill,
		AB4: n.groupFill,
		AB5: n.nodeFill,
	};
}

function map(entries: Record<string, string>): string {
	return Object.entries(entries)
		.map(([k, v]) => `${k}: "${v}"`)
		.join("; ");
}

/** D2 のダークのテーマの ID（D2 の Dark Mauve）。上書きの土台にするだけ */
export const D2_DARK_THEME_ID = 200;

/** ソースの前に付ける、テーマとクラス */
export function d2Preamble(layout: "elk" | "dagre" = "elk"): string {
	const classes = COLOR_NAMES.map((name) => {
		const c = diagram.light.colors[name];
		return `  ${name}: { style: { fill: "${c.fill}"; stroke: "${c.stroke}"; font-color: "${c.text}" } }`;
	}).join("\n");
	return [
		"# pkm-diagram が付けたテーマ（ADR-0102）",
		"vars: {",
		"  d2-config: {",
		`    layout-engine: ${layout}`,
		`    dark-theme-id: ${D2_DARK_THEME_ID}`,
		`    theme-overrides: { ${map(themeOverrides(diagram.light))} }`,
		`    dark-theme-overrides: { ${map(themeOverrides(diagram.dark))} }`,
		"  }",
		"}",
		"classes: {",
		classes,
		"}",
		"",
	].join("\n");
}
