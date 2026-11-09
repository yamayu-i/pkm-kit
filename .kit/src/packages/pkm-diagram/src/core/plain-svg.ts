/**
 * AI が書く SVG と D2 の SVG（ADR-0102）。DOM にも Node にも依存しない（CLI とプラグインで使う）。
 * - styleSvg: 決まったクラス（node / group / edge / label / 色の名前）に、図の配色のスタイルと矢印を差し込む
 * - darkenSvg: D2 の SVG の色（配色のライトの値）を、ダークのときにダークの値に置き換える CSS を足す
 * - checkPlainSvg: 安全性・色・ノートの幅での文字の大きさを検査する
 */
import { diagram, diagramColors } from "../../../design/generated/tokens.ts";
import { findSvgProblems } from "./svg.ts";

export type DiagramColor = (typeof diagramColors)[number];
type Palette = (typeof diagram)["light"] | (typeof diagram)["dark"];

export const COLOR_NAMES: readonly DiagramColor[] = diagramColors;

/** 差し込むスタイルと矢印の要素の id（差し込み直すときに、前のものを除く） */
export const STYLE_ID = "pkm-diagram-style";
export const DEFS_ID = "pkm-diagram-defs";
export const DARK_ID = "pkm-diagram-dark";

/** ノートの本文の幅の目安（px）と、その幅に縮めたときに読める文字の大きさの下限（px） */
export const NOTE_WIDTH = 700;
export const MIN_TEXT_PX = 9;

/** クラスごとの文字の大きさ（px）。font-size を書かない文字は BASE */
export const TEXT_PX = { base: 13, label: 12, small: 11 } as const;

const FONT = 'system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Noto Sans JP", sans-serif';
const SHAPES = ["rect", "ellipse", "circle", "polygon", "path"];

function shapeSel(scope: string): string {
	return SHAPES.map((s) => `${scope} > ${s}`).join(", ");
}

/** 1 つのモードのルール */
function rules(p: Palette): string[] {
	const n = p.neutral;
	const out = [
		`text { font-family: ${FONT}; font-size: ${TEXT_PX.base}px; fill: ${n.text}; }`,
		`.center { text-anchor: middle; dominant-baseline: central; }`,
		`.title { font-weight: 600; }`,
		`.muted { fill: ${n.muted}; }`,
		`.small { font-size: ${TEXT_PX.small}px; }`,
		`${shapeSel(".node")} { fill: ${n.nodeFill}; stroke: ${n.nodeStroke}; stroke-width: 1.5; }`,
		`${shapeSel(".group")} { fill: ${n.groupFill}; stroke: ${n.groupStroke}; stroke-width: 1.5; }`,
		`.edge { fill: none; stroke: ${n.edge}; stroke-width: 1.5; marker-end: url(#pkm-arrow); }`,
		`.edge.both { marker-start: url(#pkm-arrow); }`,
		`.edge.plain { marker-start: none; marker-end: none; }`,
		`.dashed, .dashed > * { stroke-dasharray: 6 4; }`,
		`.label { font-size: ${TEXT_PX.label}px; fill: ${n.muted}; paint-order: stroke; stroke: ${n.labelBg}; stroke-width: 5px; stroke-linejoin: round; }`,
		`.pkm-arrowhead { fill: ${n.edge}; stroke: none; }`,
	];
	for (const name of COLOR_NAMES) {
		const c = p.colors[name];
		out.push(
			`${shapeSel(`.node.${name}`)} { fill: ${c.fill}; stroke: ${c.stroke}; }`,
			`.node.${name} text { fill: ${c.text}; }`,
			`${shapeSel(`.group.${name}`)} { fill: ${c.fill}; fill-opacity: 0.45; stroke: ${c.stroke}; }`,
			`.group.${name} > text { fill: ${c.text}; }`,
			`.edge.${name} { stroke: ${c.stroke}; marker-end: url(#pkm-arrow-${name}); }`,
			`.edge.both.${name} { marker-start: url(#pkm-arrow-${name}); }`,
			`.edge.plain.${name} { marker-start: none; marker-end: none; }`,
			`text.${name}, .label.${name} { fill: ${c.text}; }`,
			`#pkm-arrow-${name} .pkm-arrowhead { fill: ${c.stroke}; }`,
		);
	}
	return out;
}

/** 差し込むスタイル（ライトと、prefers-color-scheme でダーク） */
export function diagramStyle(): string {
	const light = rules(diagram.light).join("\n");
	const dark = rules(diagram.dark)
		.map((r) => `  ${r}`)
		.join("\n");
	return `<style id="${STYLE_ID}">\n${light}\n@media (prefers-color-scheme: dark) {\n${dark}\n}\n</style>`;
}

function marker(id: string): string {
	return `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="pkm-arrowhead" d="M0,0 L10,5 L0,10 z"/></marker>`;
}

export function diagramDefs(): string {
	return `<defs id="${DEFS_ID}">${[marker("pkm-arrow"), ...COLOR_NAMES.map((n) => marker(`pkm-arrow-${n}`))].join("")}</defs>`;
}

/** ルートの <svg> の開始タグの終わりの位置 */
function rootOpenEnd(svg: string): number {
	const m = /<svg\b[^>]*>/i.exec(svg);
	if (!m) throw new Error("ルートの <svg> がない");
	return m.index + m[0].length;
}

function removeById(svg: string, tag: string, id: string): string {
	return svg.replace(new RegExp(`\\s*<${tag}\\s+id="${id}"[^>]*>[\\s\\S]*?</${tag}>`, "g"), "");
}

/** AI が書いた SVG に、図の配色のスタイルと矢印を差し込む。何度実行しても同じ結果 */
export function styleSvg(svg: string): string {
	const clean = removeById(removeById(svg, "style", STYLE_ID), "defs", DEFS_ID);
	const at = rootOpenEnd(clean);
	return `${clean.slice(0, at)}\n${diagramStyle()}\n${diagramDefs()}${clean.slice(at)}`;
}

/**
 * D2 の SVG に、配色のライトの値をダークの値に置き換える CSS を足す（D2 はクラスの色を fill / stroke の属性に書く。
 * CSS は属性より強い）。テーマの色（N1 など）は D2 が自分でダークにする。何度実行しても同じ結果
 */
export function darkenSvg(svg: string): string {
	const clean = removeById(svg, "style", DARK_ID);
	const map = new Map<string, Set<string>>();
	const add = (prop: string, light: string, dark: string) => {
		if (light.toLowerCase() === dark.toLowerCase()) return;
		const key = `[${prop}="${light}" i]`;
		if (!map.has(key)) map.set(key, new Set());
		map.get(key)?.add(`${prop}: ${dark}`);
	};
	for (const name of COLOR_NAMES) {
		const l = diagram.light.colors[name];
		const d = diagram.dark.colors[name];
		add("fill", l.fill, d.fill);
		add("fill", l.text, d.text);
		add("stroke", l.stroke, d.stroke);
	}
	// 同じライトの値が 2 つのダークの値に当たるときは、最初のものだけを使う（どちらも読める色になる）
	const body = [...map].map(([sel, decls]) => `  ${sel} { ${[...decls][0]}; }`).join("\n");
	const style = `<style id="${DARK_ID}">\n@media (prefers-color-scheme: dark) {\n${body}\n}\n</style>`;
	const at = rootOpenEnd(clean);
	return `${clean.slice(0, at)}\n${style}${clean.slice(at)}`;
}

export interface PlainSvgProblems {
	errors: string[];
	warnings: string[];
	/** ノートの幅に縮めたときの、いちばん小さい文字の大きさ（px） */
	minTextPx: number | null;
	/** 図の幅（px） */
	width: number | null;
}

export interface CheckOptions {
	/** 色の値を書いてよいか（D2 の SVG は true。AI が書く SVG は false で、クラスだけを使う） */
	allowColors?: boolean;
	noteWidth?: number;
	minTextPx?: number;
}

const COLOR_PROPS = ["fill", "stroke", "color", "stop-color", "flood-color", "lighting-color"];
const ALLOWED_COLOR = /^(none|transparent|currentcolor|inherit|url\(#[\w.-]+\))$/i;

/** 図の幅（ルートの viewBox、なければ width。px）。読めなければ null */
export function rootWidth(svg: string): number | null {
	const m = /<svg\b([^>]*)>/i.exec(svg);
	if (!m) return null;
	const attrs = m[1] as string;
	const vb = /\bviewBox\s*=\s*["']([^"']*)["']/i.exec(attrs);
	if (vb) {
		const parts = (vb[1] as string).trim().split(/[\s,]+/).map(Number);
		if (parts.length === 4 && Number.isFinite(parts[2]) && (parts[2] as number) > 0) return parts[2] as number;
	}
	const w = /\bwidth\s*=\s*["']\s*([\d.]+)(px)?\s*["']/i.exec(attrs);
	return w ? Number(w[1]) : null;
}

/** 文字の大きさ（px）を集める。font-size の属性と style、label / small のクラス */
function textSizes(body: string): number[] {
	const sizes: number[] = [];
	let sawText = false;
	for (const m of body.matchAll(/<(text|tspan)\b([^>]*)>/gi)) {
		sawText = true;
		const attrs = m[2] as string;
		const fs = /\bfont-size\s*=\s*["']\s*([\d.]+)(px)?\s*["']/i.exec(attrs) ?? /font-size\s*:\s*([\d.]+)px/i.exec(attrs);
		if (fs) sizes.push(Number(fs[1]));
		else {
			const cls = /\bclass\s*=\s*["']([^"']*)["']/i.exec(attrs)?.[1]?.split(/\s+/) ?? [];
			if (cls.includes("small")) sizes.push(TEXT_PX.small);
			else if (cls.includes("label")) sizes.push(TEXT_PX.label);
			else if ((m[1] as string).toLowerCase() === "text") sizes.push(TEXT_PX.base);
		}
	}
	for (const m of body.matchAll(/font-size\s*:\s*([\d.]+)px/gi)) sizes.push(Number(m[1]));
	return sawText ? sizes : [];
}

export function checkPlainSvg(svg: string, options: CheckOptions = {}): PlainSvgProblems {
	const noteWidth = options.noteWidth ?? NOTE_WIDTH;
	const minPx = options.minTextPx ?? MIN_TEXT_PX;
	const errors = new Set<string>();
	const warnings = new Set<string>();
	const base = findSvgProblems(svg);
	for (const e of base.errors) errors.add(e);
	// 外部の読み込みは、ほかの端末やモバイルで出ず、閲覧を知られるので、警告ではなく誤りにする
	for (const w of base.warnings) errors.add(w);
	if (/<foreignObject\b/i.test(svg)) errors.add("<foreignObject>（PNG にできない。文字は <text> で書く）");
	if (!/<svg\b/i.test(svg)) errors.add("ルートの <svg> がない");

	// 差し込んだスタイルは検査しない
	const body = removeById(removeById(removeById(svg, "style", STYLE_ID), "defs", DEFS_ID), "style", DARK_ID);
	if (!options.allowColors) {
		if (/<style\b/i.test(body)) errors.add("独自の <style>（スタイルは svg-style が差し込む。クラスだけを使う）");
		const bad = new Set<string>();
		for (const m of body.matchAll(new RegExp(`\\s(${COLOR_PROPS.join("|")})\\s*=\\s*["']([^"']*)["']`, "gi"))) {
			if (!ALLOWED_COLOR.test((m[2] as string).trim())) bad.add(`${m[1]}="${m[2]}"`);
		}
		for (const m of body.matchAll(/\sstyle\s*=\s*["']([^"']*)["']/gi)) {
			for (const d of (m[1] as string).split(";")) {
				const [k, v] = d.split(":").map((s) => s.trim());
				if (k && v && COLOR_PROPS.includes(k.toLowerCase()) && !ALLOWED_COLOR.test(v)) bad.add(`style の ${k}: ${v}`);
			}
		}
		if (bad.size > 0) errors.add(`色の値を直接書いている（クラスの色の名前を使う: ${COLOR_NAMES.join(" / ")}）: ${[...bad].slice(0, 5).join(", ")}${bad.size > 5 ? " ほか" : ""}`);
	}

	const width = rootWidth(svg);
	if (width === null) errors.add("図の幅がない（ルートの <svg> に viewBox か width を書く）");
	const sizes = textSizes(body);
	let minTextPx: number | null = null;
	if (width !== null && sizes.length > 0) {
		minTextPx = Math.min(...sizes) * Math.min(1, noteWidth / width);
		if (minTextPx < minPx) {
			warnings.add(
				`ノートの幅（${noteWidth}px）に縮めると、いちばん小さい文字が ${minTextPx.toFixed(1)}px になる（${minPx}px 未満）。図を分けるか、向きを変えて幅を ${Math.floor((Math.min(...sizes) / minPx) * noteWidth)}px 以下にする`,
			);
		}
	}
	return { errors: [...errors], warnings: [...warnings], minTextPx, width };
}

/** 図の中のいちばん小さい文字の大きさ（図の座標での px）。文字がなければ null */
export function minTextSize(svg: string): number | null {
	const body = removeById(removeById(removeById(svg, "style", STYLE_ID), "defs", DEFS_ID), "style", DARK_ID);
	const sizes = textSizes(body).filter((n) => n > 0);
	return sizes.length > 0 ? Math.min(...sizes) : null;
}

/** 幅 natural の図を幅 shown で出したときの、いちばん小さい文字の大きさ（px） */
export function shownTextPx(minText: number, natural: number, shown: number): number {
	if (natural <= 0 || shown <= 0) return minText;
	return (minText * shown) / natural;
}

/**
 * ノートの中で縮めすぎて文字が読めないか（ADR-0102 の「拡大して見る」の印）。
 * 拡大して出している図（shown >= natural）は読めるものとする
 */
export function tooSmallToRead(minText: number | null, natural: number, shown: number, minPx = MIN_TEXT_PX): boolean {
	if (minText === null || shown >= natural) return false;
	return shownTextPx(minText, natural, shown) < minPx;
}
