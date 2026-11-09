/**
 * 編集用 XML のページから、SVG の描画を作る（ADR-0085）。
 * Draw.io と完全には同じにならない（正本は XML。Draw.io で開いて保存すれば描き直される）。
 * 文字は <text> で描く（foreignObject を使わない）。同じ入力からは同じバイト列を出す
 */
import { absoluteOrigin, type Cell, labelText, type Page, type Point } from "./model.ts";
import { escapeXml } from "./xml.ts";

export interface RenderResult {
	/** <svg> の中身（<g> の列） */
	body: string;
	/** 描いた範囲 */
	bounds: { x: number; y: number; width: number; height: number };
	/** 描けなかった形・書式 */
	warnings: string[];
}

interface Box {
	x: number;
	y: number;
	w: number;
	h: number;
}

const DEFAULT_FONT = "Helvetica";
const LINE_HEIGHT = 1.2;

export function fmt(n: number): string {
	const r = Math.round(n * 100) / 100;
	return Object.is(r, -0) ? "0" : String(r);
}

/** 文字の幅の見積もり（全角は 1 em、半角は 0.6 em） */
export function charWidth(ch: string, fontSize: number): number {
	const c = ch.codePointAt(0) ?? 0;
	if (ch === " ") return fontSize * 0.3;
	if (
		(c >= 0x1100 && c <= 0x115f) ||
		(c >= 0x2e80 && c <= 0xa4cf) ||
		(c >= 0xac00 && c <= 0xd7a3) ||
		(c >= 0xf900 && c <= 0xfaff) ||
		(c >= 0xfe30 && c <= 0xfe4f) ||
		(c >= 0xff00 && c <= 0xff60) ||
		(c >= 0xffe0 && c <= 0xffe6) ||
		c >= 0x1f300
	)
		return fontSize;
	if (/[A-Z@#%&mwMW]/.test(ch)) return fontSize * 0.72;
	if (/[il.,:;'|!]/.test(ch)) return fontSize * 0.3;
	return fontSize * 0.56;
}

export function textWidth(text: string, fontSize: number): number {
	let w = 0;
	for (const ch of text) w += charWidth(ch, fontSize);
	return w;
}

const NO_LINE_START = /^[)\]}）］｝〕〉》」』】、。，．,.:;：；!?！？ーぁぃぅぇぉっゃゅょァィゥェォッャュョ・]/u;

/** 幅に合わせて折り返す（全角はどこでも、半角は空白で切る） */
export function wrapLines(text: string, maxWidth: number, fontSize: number): string[] {
	const out: string[] = [];
	for (const para of text.split("\n")) {
		if (maxWidth <= 0 || textWidth(para, fontSize) <= maxWidth) {
			out.push(para);
			continue;
		}
		// 単位: 全角 1 文字、または半角の連続（空白を含めて後ろに付ける）
		const units = para.match(/[!-ɏ]+\s*|\s+|./gu) ?? [];
		let line = "";
		for (const u of units) {
			// 閉じかっこ・句読点で行を始めない（前の行にはみ出させる）
			if (line !== "" && !NO_LINE_START.test(u) && textWidth(line + u.trimEnd(), fontSize) > maxWidth) {
				out.push(line.trimEnd());
				line = u.trimStart();
			} else {
				line += u;
			}
		}
		out.push(line.trimEnd());
	}
	return out;
}

const COLOR = /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{1,20})$/;

function color(cell: Cell, key: string, fallback: string, warnings: Set<string>): string {
	const v = cell.style.get(key);
	if (v === undefined || v === "default" || v === "") return fallback;
	if (COLOR.test(v)) return v;
	warnings.add(`色 ${key} の値（${v.slice(0, 40)}）を読めない`);
	return fallback;
}

function num(cell: Cell, key: string, fallback: number): number {
	const v = cell.style.get(key);
	if (v === undefined) return fallback;
	const n = Number(v);
	return Number.isFinite(n) ? n : fallback;
}

function fontFamily(cell: Cell): string {
	const v = cell.style.get("fontFamily") ?? DEFAULT_FONT;
	const safe = v.replace(/[^\w\s,\-　-鿿]/g, "").trim();
	return safe === "" ? DEFAULT_FONT : safe;
}

/** 形の名前。style の先頭の名前か shape= */
export function shapeName(cell: Cell): string {
	const shape = cell.style.get("shape");
	if (shape) return shape;
	const first = cell.styleNames.find((n) => !n.includes("="));
	return first ?? "rect";
}

const SHAPES = new Set([
	"rect",
	"rectangle",
	"label",
	"ellipse",
	"doubleEllipse",
	"rhombus",
	"hexagon",
	"parallelogram",
	"triangle",
	"cylinder",
	"cylinder3",
	"note",
	"document",
	"umlActor",
	"actor",
	"text",
	"swimlane",
	"group",
	"process",
	"step",
	"cloud",
]);

/** 辺かどうか（edge="1"） */
function isEdge(cell: Cell): boolean {
	return cell.edge && !cell.vertex;
}

interface Ctx {
	byId: Map<string, Cell>;
	warnings: Set<string>;
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

function extend(ctx: Ctx, x: number, y: number, w = 0, h = 0): void {
	ctx.minX = Math.min(ctx.minX, x);
	ctx.minY = Math.min(ctx.minY, y);
	ctx.maxX = Math.max(ctx.maxX, x + w);
	ctx.maxY = Math.max(ctx.maxY, y + h);
}

/** 頂点の絶対の箱 */
export function vertexBox(cell: Cell, byId: Map<string, Cell>): Box | null {
	if (!cell.vertex || !cell.geometry || cell.geometry.relative) return null;
	const o = absoluteOrigin(cell.parent ? byId.get(cell.parent) : undefined, byId);
	return { x: o.x + cell.geometry.x, y: o.y + cell.geometry.y, w: cell.geometry.width, h: cell.geometry.height };
}

function strokeAttrs(cell: Cell, ctx: Ctx, fallbackStroke = "#000000"): string {
	const stroke = color(cell, "strokeColor", fallbackStroke, ctx.warnings);
	const width = num(cell, "strokeWidth", 1);
	let s = ` stroke="${escapeXml(stroke)}"`;
	if (width !== 1) s += ` stroke-width="${fmt(width)}"`;
	if (cell.style.get("dashed") === "1") {
		const pattern = (cell.style.get("dashPattern") ?? "3 3").replace(/[^\d.\s]/g, "").trim() || "3 3";
		s += ` stroke-dasharray="${pattern
			.split(/\s+/)
			.map((p) => fmt(Number(p) * width))
			.join(" ")}"`;
	}
	return s;
}

function opacityAttr(cell: Cell): string {
	const o = num(cell, "opacity", 100);
	return o < 100 ? ` opacity="${fmt(Math.max(0, o) / 100)}"` : "";
}

function poly(points: Array<[number, number]>): string {
	return points.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(" ");
}

function drawShape(cell: Cell, b: Box, ctx: Ctx): string {
	const name = shapeName(cell);
	if (name === "text" || name === "group") return "";
	if (!SHAPES.has(name)) ctx.warnings.add(`形 ${name.slice(0, 40)} は描けない（四角で描いた）`);
	const fillDefault = name === "swimlane" ? "#ffffff" : "#ffffff";
	const fill = color(cell, "fillColor", fillDefault, ctx.warnings);
	const common = ` fill="${escapeXml(fill)}"${strokeAttrs(cell, ctx)}${opacityAttr(cell)}`;
	const { x, y, w, h } = b;
	switch (name) {
		case "ellipse":
			return `<ellipse cx="${fmt(x + w / 2)}" cy="${fmt(y + h / 2)}" rx="${fmt(w / 2)}" ry="${fmt(h / 2)}"${common}/>`;
		case "doubleEllipse":
			return `<ellipse cx="${fmt(x + w / 2)}" cy="${fmt(y + h / 2)}" rx="${fmt(w / 2)}" ry="${fmt(h / 2)}"${common}/><ellipse cx="${fmt(x + w / 2)}" cy="${fmt(y + h / 2)}" rx="${fmt(Math.max(0, w / 2 - 4))}" ry="${fmt(Math.max(0, h / 2 - 4))}" fill="none"${strokeAttrs(cell, ctx)}/>`;
		case "rhombus":
			return `<polygon points="${poly([
				[x + w / 2, y],
				[x + w, y + h / 2],
				[x + w / 2, y + h],
				[x, y + h / 2],
			])}"${common}/>`;
		case "hexagon": {
			const s = cell.style.get("fixedSize") === "1" ? num(cell, "size", 20) : w * num(cell, "size", 0.25);
			return `<polygon points="${poly([
				[x + s, y],
				[x + w - s, y],
				[x + w, y + h / 2],
				[x + w - s, y + h],
				[x + s, y + h],
				[x, y + h / 2],
			])}"${common}/>`;
		}
		case "parallelogram": {
			const s = cell.style.get("fixedSize") === "1" ? num(cell, "size", 20) : w * num(cell, "size", 0.2);
			return `<polygon points="${poly([
				[x + s, y],
				[x + w, y],
				[x + w - s, y + h],
				[x, y + h],
			])}"${common}/>`;
		}
		case "step": {
			const s = cell.style.get("fixedSize") === "1" ? num(cell, "size", 20) : w * num(cell, "size", 0.2);
			return `<polygon points="${poly([
				[x, y],
				[x + w - s, y],
				[x + w, y + h / 2],
				[x + w - s, y + h],
				[x, y + h],
				[x + s, y + h / 2],
			])}"${common}/>`;
		}
		case "triangle": {
			const dir = cell.style.get("direction") ?? "east";
			const pts: Array<[number, number]> =
				dir === "north"
					? [
							[x, y + h],
							[x + w / 2, y],
							[x + w, y + h],
						]
					: dir === "south"
						? [
								[x, y],
								[x + w, y],
								[x + w / 2, y + h],
							]
						: dir === "west"
							? [
									[x + w, y],
									[x + w, y + h],
									[x, y + h / 2],
								]
							: [
									[x, y],
									[x + w, y + h / 2],
									[x, y + h],
								];
			return `<polygon points="${poly(pts)}"${common}/>`;
		}
		case "cylinder":
		case "cylinder3": {
			const s = Math.min(num(cell, "size", 15), h / 2);
			const rx = w / 2;
			return `<path d="M ${fmt(x)} ${fmt(y + s)} A ${fmt(rx)} ${fmt(s)} 0 0 1 ${fmt(x + w)} ${fmt(y + s)} L ${fmt(x + w)} ${fmt(y + h - s)} A ${fmt(rx)} ${fmt(s)} 0 0 1 ${fmt(x)} ${fmt(y + h - s)} Z"${common}/><path d="M ${fmt(x)} ${fmt(y + s)} A ${fmt(rx)} ${fmt(s)} 0 0 0 ${fmt(x + w)} ${fmt(y + s)}" fill="none"${strokeAttrs(cell, ctx)}/>`;
		}
		case "note": {
			const s = Math.min(num(cell, "size", 30), w, h);
			return `<polygon points="${poly([
				[x, y],
				[x + w - s, y],
				[x + w, y + s],
				[x + w, y + h],
				[x, y + h],
			])}"${common}/><polyline points="${poly([
				[x + w - s, y],
				[x + w - s, y + s],
				[x + w, y + s],
			])}" fill="none"${strokeAttrs(cell, ctx)}/>`;
		}
		case "document": {
			const d = h * num(cell, "size", 0.3) * 0.5;
			return `<path d="M ${fmt(x)} ${fmt(y)} L ${fmt(x + w)} ${fmt(y)} L ${fmt(x + w)} ${fmt(y + h - d)} C ${fmt(x + w * 0.75)} ${fmt(y + h - 3 * d)} ${fmt(x + w * 0.25)} ${fmt(y + h + d)} ${fmt(x)} ${fmt(y + h - d)} Z"${common}/>`;
		}
		case "cloud":
			return `<path d="M ${fmt(x + 0.25 * w)} ${fmt(y + 0.25 * h)} C ${fmt(x + 0.05 * w)} ${fmt(y + 0.25 * h)} ${fmt(x)} ${fmt(y + 0.5 * h)} ${fmt(x + 0.16 * w)} ${fmt(y + 0.55 * h)} C ${fmt(x)} ${fmt(y + 0.66 * h)} ${fmt(x + 0.18 * w)} ${fmt(y + 0.9 * h)} ${fmt(x + 0.31 * w)} ${fmt(y + 0.8 * h)} C ${fmt(x + 0.4 * w)} ${fmt(y + h)} ${fmt(x + 0.7 * w)} ${fmt(y + h)} ${fmt(x + 0.8 * w)} ${fmt(y + 0.8 * h)} C ${fmt(x + w)} ${fmt(y + 0.8 * h)} ${fmt(x + w)} ${fmt(y + 0.6 * h)} ${fmt(x + 0.875 * w)} ${fmt(y + 0.5 * h)} C ${fmt(x + w)} ${fmt(y + 0.3 * h)} ${fmt(x + 0.8 * w)} ${fmt(y + 0.1 * h)} ${fmt(x + 0.625 * w)} ${fmt(y + 0.2 * h)} C ${fmt(x + 0.5 * w)} ${fmt(y + 0.05 * h)} ${fmt(x + 0.3 * w)} ${fmt(y + 0.05 * h)} ${fmt(x + 0.25 * w)} ${fmt(y + 0.25 * h)} Z"${common}/>`;
		case "umlActor":
		case "actor": {
			const headR = Math.min(w / 4, h / 8);
			const cx = x + w / 2;
			const neck = y + 2 * headR;
			const hip = y + h * 0.6;
			const arms = y + h / 3;
			return `<ellipse cx="${fmt(cx)}" cy="${fmt(y + headR)}" rx="${fmt(headR)}" ry="${fmt(headR)}"${common}/><path d="M ${fmt(cx)} ${fmt(neck)} L ${fmt(cx)} ${fmt(hip)} M ${fmt(x)} ${fmt(arms)} L ${fmt(x + w)} ${fmt(arms)} M ${fmt(cx)} ${fmt(hip)} L ${fmt(x)} ${fmt(y + h)} M ${fmt(cx)} ${fmt(hip)} L ${fmt(x + w)} ${fmt(y + h)}" fill="none"${strokeAttrs(cell, ctx)}/>`;
		}
		case "process": {
			const s = w * 0.1;
			return `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}"${common}/><path d="M ${fmt(x + s)} ${fmt(y)} L ${fmt(x + s)} ${fmt(y + h)} M ${fmt(x + w - s)} ${fmt(y)} L ${fmt(x + w - s)} ${fmt(y + h)}" fill="none"${strokeAttrs(cell, ctx)}/>`;
		}
		case "swimlane": {
			const start = num(cell, "startSize", 23);
			const horizontal = cell.style.get("horizontal") !== "0";
			const body = color(cell, "swimlaneFillColor", "none", ctx.warnings);
			const outline = `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" fill="${escapeXml(body)}"${strokeAttrs(cell, ctx)}${opacityAttr(cell)}/>`;
			const head = horizontal
				? `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(Math.min(start, h))}"${common}/>`
				: `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(Math.min(start, w))}" height="${fmt(h)}"${common}/>`;
			return outline + head;
		}
		default: {
			const rounded = cell.style.get("rounded") === "1";
			let r = "";
			if (rounded) {
				const arc = cell.style.get("absoluteArcSize") === "1" ? num(cell, "arcSize", 10) / 2 : (Math.min(w, h) * num(cell, "arcSize", 15)) / 100;
				r = ` rx="${fmt(arc)}" ry="${fmt(arc)}"`;
			}
			return `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}"${r}${common}/>`;
		}
	}
}

/** 箱の中に文字を置く */
function drawText(
	cell: Cell,
	text: string,
	box: Box,
	ctx: Ctx,
	opts: { align?: string; valign?: string; background?: string | null; wrap?: boolean } = {},
): string {
	if (text === "") return "";
	const fontSize = num(cell, "fontSize", 12);
	const fontColor = color(cell, "fontColor", "#000000", ctx.warnings);
	const fontStyle = num(cell, "fontStyle", 0);
	const align = opts.align ?? cell.style.get("align") ?? "center";
	const valign = opts.valign ?? cell.style.get("verticalAlign") ?? "middle";
	const spacing = num(cell, "spacing", 2);
	const left = box.x + spacing + num(cell, "spacingLeft", 0);
	const right = box.x + box.w - spacing - num(cell, "spacingRight", 0);
	const top = box.y + spacing + num(cell, "spacingTop", 0);
	const bottom = box.y + box.h - spacing - num(cell, "spacingBottom", 0);
	const wrap = opts.wrap ?? cell.style.get("whiteSpace") === "wrap";
	const lines = wrap ? wrapLines(text, right - left, fontSize) : text.split("\n");
	const lh = fontSize * LINE_HEIGHT;
	const blockH = lines.length * lh;
	const y0 = valign === "top" ? top : valign === "bottom" ? bottom - blockH : (top + bottom) / 2 - blockH / 2;
	const anchor = align === "left" ? "start" : align === "right" ? "end" : "middle";
	const tx = align === "left" ? left : align === "right" ? right : (left + right) / 2;
	const widest = Math.max(...lines.map((l) => textWidth(l, fontSize)));
	const bx = anchor === "start" ? tx : anchor === "end" ? tx - widest : tx - widest / 2;
	extend(ctx, bx, y0, widest, blockH);
	let attrs = ` font-family="${escapeXml(fontFamily(cell))}" font-size="${fmt(fontSize)}px" fill="${escapeXml(fontColor)}" text-anchor="${anchor}"`;
	if (fontStyle & 1) attrs += ` font-weight="bold"`;
	if (fontStyle & 2) attrs += ` font-style="italic"`;
	if (fontStyle & 4) attrs += ` text-decoration="underline"`;
	let out = "";
	if (opts.background) {
		out += `<rect x="${fmt(bx - 2)}" y="${fmt(y0)}" width="${fmt(widest + 4)}" height="${fmt(blockH)}" fill="${escapeXml(opts.background)}" stroke="none"/>`;
	}
	const tspans = lines
		.map((l, i) => `<tspan x="${fmt(tx)}" y="${fmt(y0 + i * lh + lh / 2 + fontSize * 0.35)}">${escapeXml(l)}</tspan>`)
		.join("");
	out += `<text${attrs}>${tspans}</text>`;
	return out;
}

function labelBox(cell: Cell, b: Box): { box: Box; valign?: string; align?: string } {
	const name = shapeName(cell);
	const vpos = cell.style.get("verticalLabelPosition");
	const hpos = cell.style.get("labelPosition");
	if (vpos === "bottom") return { box: { x: b.x - b.w, y: b.y + b.h, w: b.w * 3, h: 0 }, valign: "top" };
	if (vpos === "top") return { box: { x: b.x - b.w, y: b.y - 0, w: b.w * 3, h: 0 }, valign: "bottom" };
	if (hpos === "right") return { box: { x: b.x + b.w, y: b.y, w: b.w * 2, h: b.h }, align: "left" };
	if (hpos === "left") return { box: { x: b.x - b.w * 2, y: b.y, w: b.w * 2, h: b.h }, align: "right" };
	if (name === "swimlane") {
		const start = num(cell, "startSize", 23);
		if (cell.style.get("horizontal") === "0") return { box: { x: b.x, y: b.y, w: Math.min(start, b.w), h: b.h } };
		return { box: { x: b.x, y: b.y, w: b.w, h: Math.min(start, b.h) } };
	}
	if (cell.style.get("container") === "1" && cell.style.get("verticalAlign") === undefined) return { box: b, valign: "top" };
	return { box: b };
}

function center(b: Box): Point {
	return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

/** 箱の中心から p に向かう線と、箱（楕円なら楕円）の縁の交点 */
function perimeter(b: Box, toward: Point, elliptic: boolean): Point {
	const c = center(b);
	const dx = toward.x - c.x;
	const dy = toward.y - c.y;
	if (dx === 0 && dy === 0) return c;
	if (elliptic) {
		const a = b.w / 2;
		const bb = b.h / 2;
		const t = 1 / Math.sqrt((dx * dx) / (a * a || 1) + (dy * dy) / (bb * bb || 1));
		return { x: c.x + dx * t, y: c.y + dy * t };
	}
	const tx = dx === 0 ? Infinity : b.w / 2 / Math.abs(dx);
	const ty = dy === 0 ? Infinity : b.h / 2 / Math.abs(dy);
	const t = Math.min(tx, ty);
	return { x: c.x + dx * t, y: c.y + dy * t };
}

function isElliptic(cell: Cell | undefined): boolean {
	if (!cell) return false;
	const n = shapeName(cell);
	return n === "ellipse" || n === "doubleEllipse";
}

function fixedPort(cell: Cell, b: Box, prefix: "exit" | "entry"): Point | null {
	const px = cell.style.get(`${prefix}X`);
	const py = cell.style.get(`${prefix}Y`);
	if (px === undefined || py === undefined) return null;
	const x = Number(px);
	const y = Number(py);
	if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
	return { x: b.x + b.w * x, y: b.y + b.h * y };
}

/** 直交の経路: a から b へ、縦か横の向きを先に */
function elbow(a: Point, b: Point, verticalFirst: boolean): Point[] {
	if (Math.abs(a.x - b.x) < 0.5 || Math.abs(a.y - b.y) < 0.5) return [a, b];
	if (verticalFirst) {
		const my = (a.y + b.y) / 2;
		return [a, { x: a.x, y: my }, { x: b.x, y: my }, b];
	}
	const mx = (a.x + b.x) / 2;
	return [a, { x: mx, y: a.y }, { x: mx, y: b.y }, b];
}

function routeEdge(cell: Cell, ctx: Ctx): Point[] | null {
	const src = cell.source ? ctx.byId.get(cell.source) : undefined;
	const tgt = cell.target ? ctx.byId.get(cell.target) : undefined;
	const sb = src ? vertexBox(src, ctx.byId) : null;
	const tb = tgt ? vertexBox(tgt, ctx.byId) : null;
	const o = absoluteOrigin(cell.parent ? ctx.byId.get(cell.parent) : undefined, ctx.byId);
	const g = cell.geometry;
	const way = (g?.points ?? []).map((p) => ({ x: p.x + o.x, y: p.y + o.y }));
	const sp = g?.sourcePoint ? { x: g.sourcePoint.x + o.x, y: g.sourcePoint.y + o.y } : null;
	const tp = g?.targetPoint ? { x: g.targetPoint.x + o.x, y: g.targetPoint.y + o.y } : null;
	if (!sb && !sp) return null;
	if (!tb && !tp) return null;
	const es = cell.style.get("edgeStyle") ?? "";
	const orthogonal = /orthogonal|elbow|entityRelation|segment/.test(es);
	const exit = sb ? fixedPort(cell, sb, "exit") : null;
	const entry = tb ? fixedPort(cell, tb, "entry") : null;

	if (!orthogonal) {
		const firstToward = way[0] ?? (tb ? center(tb) : (tp as Point));
		const start = exit ?? (sb ? perimeter(sb, firstToward, isElliptic(src)) : (sp as Point));
		const lastFrom = way[way.length - 1] ?? start;
		const end = entry ?? (tb ? perimeter(tb, way.length > 0 ? lastFrom : sb ? center(sb) : start, isElliptic(tgt)) : (tp as Point));
		return [start, ...way, end];
	}

	// 直交
	const sBox = sb ?? { x: (sp as Point).x, y: (sp as Point).y, w: 0, h: 0 };
	const tBox = tb ?? { x: (tp as Point).x, y: (tp as Point).y, w: 0, h: 0 };
	if (way.length === 0) {
		const gapY = Math.max(tBox.y - (sBox.y + sBox.h), sBox.y - (tBox.y + tBox.h));
		const gapX = Math.max(tBox.x - (sBox.x + sBox.w), sBox.x - (tBox.x + tBox.w));
		const vertical = exit && entry ? exit.y === sBox.y || exit.y === sBox.y + sBox.h : gapY >= gapX;
		const sc = center(sBox);
		const tc = center(tBox);
		let a: Point;
		let b: Point;
		if (vertical) {
			const down = tc.y >= sc.y;
			a = exit ?? { x: sc.x, y: down ? sBox.y + sBox.h : sBox.y };
			b = entry ?? { x: tc.x, y: down ? tBox.y : tBox.y + tBox.h };
		} else {
			const rightward = tc.x >= sc.x;
			a = exit ?? { x: rightward ? sBox.x + sBox.w : sBox.x, y: sc.y };
			b = entry ?? { x: rightward ? tBox.x : tBox.x + tBox.w, y: tc.y };
		}
		if (!sb) a = sp as Point;
		if (!tb) b = tp as Point;
		return elbow(a, b, vertical);
	}
	// 経由点あり: 最初と最後の点に向かう辺の中点から出入りする
	const first = way[0] as Point;
	const last = way[way.length - 1] as Point;
	const sideToward = (b: Box, p: Point): { point: Point; vertical: boolean } => {
		const c = center(b);
		if (p.x >= b.x && p.x <= b.x + b.w) return { point: { x: p.x, y: p.y >= c.y ? b.y + b.h : b.y }, vertical: true };
		if (p.y >= b.y && p.y <= b.y + b.h) return { point: { x: p.x >= c.x ? b.x + b.w : b.x, y: p.y }, vertical: false };
		const vertical = Math.abs(p.y - c.y) > Math.abs(p.x - c.x);
		return vertical
			? { point: { x: c.x, y: p.y >= c.y ? b.y + b.h : b.y }, vertical }
			: { point: { x: p.x >= c.x ? b.x + b.w : b.x, y: c.y }, vertical };
	};
	const s = exit ? { point: exit, vertical: false } : sb ? sideToward(sb, first) : { point: sp as Point, vertical: false };
	const t = entry ? { point: entry, vertical: false } : tb ? sideToward(tb, last) : { point: tp as Point, vertical: false };
	const pts: Point[] = [s.point];
	let prev = s.point;
	let vert = s.vertical;
	for (const p of [...way, t.point]) {
		const seg = elbow(prev, p, vert);
		pts.push(...seg.slice(1));
		vert = !vert;
		prev = p;
	}
	return pts;
}

function arrowHead(tip: Point, from: Point, kind: string, filled: boolean, size: number, stroke: string, strokeAttrs: string): { svg: string; inset: number } {
	if (kind === "none" || kind === "") return { svg: "", inset: 0 };
	const dx = tip.x - from.x;
	const dy = tip.y - from.y;
	const len = Math.hypot(dx, dy) || 1;
	const ux = dx / len;
	const uy = dy / len;
	const nx = -uy;
	const ny = ux;
	const back = { x: tip.x - ux * size, y: tip.y - uy * size };
	const l = { x: back.x + nx * size * 0.5, y: back.y + ny * size * 0.5 };
	const r = { x: back.x - nx * size * 0.5, y: back.y - ny * size * 0.5 };
	const fill = filled ? escapeXml(stroke) : "#ffffff";
	if (kind === "open") {
		return { svg: `<polyline points="${poly([[l.x, l.y], [tip.x, tip.y], [r.x, r.y]])}" fill="none"${strokeAttrs}/>`, inset: 0 };
	}
	if (kind === "classic" || kind === "classicThin") {
		const notch = { x: tip.x - ux * size * 0.7, y: tip.y - uy * size * 0.7 };
		return {
			svg: `<polygon points="${poly([[tip.x, tip.y], [l.x, l.y], [notch.x, notch.y], [r.x, r.y]])}" fill="${fill}"${strokeAttrs.replace(/ stroke-dasharray="[^"]*"/, "")}/>`,
			inset: size * 0.7,
		};
	}
	if (kind === "oval") {
		const c = { x: tip.x - ux * size * 0.5, y: tip.y - uy * size * 0.5 };
		return { svg: `<ellipse cx="${fmt(c.x)}" cy="${fmt(c.y)}" rx="${fmt(size / 2)}" ry="${fmt(size / 2)}" fill="${fill}"${strokeAttrs}/>`, inset: size };
	}
	// block と、それ以外（三角で描く）
	return {
		svg: `<polygon points="${poly([[tip.x, tip.y], [l.x, l.y], [r.x, r.y]])}" fill="${fill}"${strokeAttrs.replace(/ stroke-dasharray="[^"]*"/, "")}/>`,
		inset: size,
	};
}

function pointAlong(pts: Point[], fraction: number): Point {
	const lens: number[] = [];
	let total = 0;
	for (let i = 1; i < pts.length; i++) {
		const l = Math.hypot((pts[i] as Point).x - (pts[i - 1] as Point).x, (pts[i] as Point).y - (pts[i - 1] as Point).y);
		lens.push(l);
		total += l;
	}
	let want = total * Math.min(1, Math.max(0, fraction));
	for (let i = 0; i < lens.length; i++) {
		const l = lens[i] as number;
		if (want <= l || i === lens.length - 1) {
			const a = pts[i] as Point;
			const b = pts[i + 1] as Point;
			const t = l === 0 ? 0 : want / l;
			return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
		}
		want -= l;
	}
	return pts[0] as Point;
}

const KNOWN_ARROWS = new Set(["none", "classic", "classicThin", "block", "blockThin", "open", "openThin", "oval", ""]);

function drawEdge(cell: Cell, pts: Point[], ctx: Ctx, labels: Cell[]): string {
	const stroke = color(cell, "strokeColor", "#000000", ctx.warnings);
	const sAttrs = strokeAttrs(cell, ctx);
	const width = num(cell, "strokeWidth", 1);
	const size = (num(cell, "endSize", 6) + 2) * Math.max(1, width * 0.75);
	const endKind = cell.style.get("endArrow") ?? "classic";
	const startKind = cell.style.get("startArrow") ?? "none";
	for (const k of [endKind, startKind]) if (!KNOWN_ARROWS.has(k)) ctx.warnings.add(`矢印 ${k.slice(0, 40)} は描けない（三角で描いた）`);
	const kindOf = (k: string) => k.replace(/Thin$/, "");
	const line = pts.map((p) => ({ ...p }));
	let heads = "";
	if (line.length >= 2) {
		const end = arrowHead(line[line.length - 1] as Point, line[line.length - 2] as Point, kindOf(endKind), cell.style.get("endFill") !== "0", size, stroke, sAttrs.replace(/ stroke-dasharray="[^"]*"/, ""));
		const start = arrowHead(line[0] as Point, line[1] as Point, kindOf(startKind), cell.style.get("startFill") !== "0", size, stroke, sAttrs.replace(/ stroke-dasharray="[^"]*"/, ""));
		heads = end.svg + start.svg;
		const shorten = (i: number, j: number, by: number) => {
			const a = line[i] as Point;
			const b = line[j] as Point;
			const len = Math.hypot(a.x - b.x, a.y - b.y);
			if (len === 0 || by === 0) return;
			const t = Math.min(by, len) / len;
			line[i] = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
		};
		shorten(line.length - 1, line.length - 2, end.inset);
		shorten(0, 1, start.inset);
	}
	for (const p of pts) extend(ctx, p.x - size, p.y - size, size * 2, size * 2);
	let out = `<path d="M ${line.map((p) => `${fmt(p.x)} ${fmt(p.y)}`).join(" L ")}" fill="none"${sAttrs}${opacityAttr(cell)}/>${heads}`;
	const bg = cell.style.get("labelBackgroundColor");
	const background = bg === "none" ? null : bg && COLOR.test(bg) ? bg : "#ffffff";
	const own = labelText(cell);
	if (own !== "") {
		const frac = cell.geometry ? (cell.geometry.x + 1) / 2 : 0.5;
		const p = pointAlong(pts, Number.isFinite(frac) ? frac : 0.5);
		const off = cell.geometry?.offset ?? { x: 0, y: 0 };
		out += drawText(cell, own, { x: p.x + off.x - 200, y: p.y + off.y, w: 400, h: 0 }, ctx, { background, wrap: false });
	}
	for (const lc of labels) {
		const t = labelText(lc);
		if (t === "") continue;
		const frac = lc.geometry ? (lc.geometry.x + 1) / 2 : 0.5;
		const p = pointAlong(pts, Number.isFinite(frac) ? frac : 0.5);
		const off = lc.geometry?.offset ?? { x: 0, y: 0 };
		const lbg = lc.style.get("labelBackgroundColor");
		const lbackground = lbg === "none" ? null : lbg && COLOR.test(lbg) ? lbg : "#ffffff";
		out += `<g data-cell-id="${escapeXml(lc.id)}">${drawText(lc, t, { x: p.x + off.x - 200, y: p.y + off.y, w: 400, h: 0 }, ctx, { background: lbackground, wrap: false })}</g>`;
	}
	return out;
}

/** ページを描く */
export function renderPage(page: Page): RenderResult {
	const byId = new Map(page.cells.map((c) => [c.id, c]));
	const ctx: Ctx = { byId, warnings: new Set(), minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
	// 辺に付いたラベル（親が辺の、相対の頂点）
	const edgeLabels = new Map<string, Cell[]>();
	for (const c of page.cells) {
		const parent = c.parent ? byId.get(c.parent) : undefined;
		if (c.vertex && parent && isEdge(parent)) {
			const list = edgeLabels.get(parent.id) ?? [];
			list.push(c);
			edgeLabels.set(parent.id, list);
		}
	}
	const hidden = (c: Cell): boolean => {
		const seen = new Set<string>();
		let x: Cell | undefined = c;
		while (x && !seen.has(x.id)) {
			if (x.style.get("visible") === "0") return true;
			seen.add(x.id);
			x = x.parent ? byId.get(x.parent) : undefined;
		}
		return false;
	};
	const parts: string[] = [];
	for (const c of page.cells) {
		if (hidden(c)) continue;
		if (c.style.has("image") || shapeName(c) === "image") ctx.warnings.add("画像のセルは描けない（四角で描いた）");
		if (isEdge(c)) {
			const pts = routeEdge(c, ctx);
			if (!pts) {
				ctx.warnings.add(`辺 ${c.id.slice(0, 40)} の端がない（描かなかった）`);
				continue;
			}
			parts.push(`<g data-cell-id="${escapeXml(c.id)}">${drawEdge(c, pts, ctx, edgeLabels.get(c.id) ?? [])}</g>`);
			continue;
		}
		if (!c.vertex) continue;
		const parent = c.parent ? byId.get(c.parent) : undefined;
		if (parent && isEdge(parent)) continue;
		const b = vertexBox(c, byId);
		if (!b) continue;
		extend(ctx, b.x, b.y, b.w, b.h);
		const shape = drawShape(c, b, ctx);
		const lb = labelBox(c, b);
		const text = drawText(c, labelText(c), lb.box, ctx, { align: lb.align, valign: lb.valign, wrap: lb.box === b ? undefined : false });
		parts.push(`<g data-cell-id="${escapeXml(c.id)}">${shape}${text}</g>`);
	}
	if (!Number.isFinite(ctx.minX)) {
		ctx.minX = 0;
		ctx.minY = 0;
		ctx.maxX = 10;
		ctx.maxY = 10;
	}
	const x = Math.floor(ctx.minX) - 1;
	const y = Math.floor(ctx.minY) - 1;
	return {
		body: parts.join(""),
		bounds: { x, y, width: Math.ceil(ctx.maxX) + 1 - x, height: Math.ceil(ctx.maxY) + 1 - y },
		warnings: [...ctx.warnings].sort(),
	};
}

/** 図のファイル（編集可能 SVG）の全体。xml はそのまま content に入れる */
export function drawioSvg(xml: string, rendered: RenderResult): string {
	const { x, y, width, height } = rendered.bounds;
	return (
		`<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<!-- Rendered by pkm-kit (drawio.mjs). Open in draw.io to re-render exactly. -->\n` +
		`<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n` +
		`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="${width}px" height="${height}px" viewBox="${x} ${y} ${width} ${height}" content="${escapeXml(xml)}">` +
		`<defs/><g>${rendered.body}</g></svg>\n`
	);
}
