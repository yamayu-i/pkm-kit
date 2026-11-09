/**
 * ノートの Mermaid の図（ADR-0102）。Obsidian が描いた SVG を写して、1 つで完結する SVG にする。
 * - 色はスニペット（pkm-theme.css）の CSS で付いているので、計算した値を要素に書き込む
 * - ラベルの foreignObject（HTML）は Canvas を汚染して PNG にできないので、<text> に置き換える
 * - light なら、ダークの配色の値をライトの配色の値に戻す（PNG は常にライトの色）
 * 元のノートの DOM は変えない（写したものだけを変える）
 */
import { cssColorToHex, darkToLightColors } from "../core/png.ts";

const SVG_NS = "http://www.w3.org/2000/svg";

/** 写す計算済みのスタイル */
const PROPS = ["fill", "stroke", "stroke-width", "stroke-dasharray", "fill-opacity", "stroke-opacity", "opacity", "font-family", "font-size", "font-weight", "font-style", "text-anchor", "dominant-baseline", "visibility"];
const COLOR_PROPS = new Set(["fill", "stroke"]);

/** 要素の中の Mermaid の図の SVG（`.mermaid` の中の <svg>） */
export function findMermaidSvg(el: Element | null): SVGSVGElement | null {
	const box = el?.closest(".mermaid");
	return box?.querySelector("svg") ?? null;
}

function viewBoxSize(svg: SVGSVGElement): { width: number; height: number } {
	const vb = (svg.getAttribute("viewBox") ?? "").trim().split(/[\s,]+/).map(Number);
	if (vb.length === 4 && (vb[2] as number) > 0 && (vb[3] as number) > 0) return { width: vb[2] as number, height: vb[3] as number };
	const r = svg.getBoundingClientRect();
	return { width: Math.max(1, Math.round(r.width)), height: Math.max(1, Math.round(r.height)) };
}

/** foreignObject の文字を <text> にする（行ごとに <tspan>）。背景の色があれば、後ろに <rect> を置く */
function textFromForeignObject(fo: Element, win: Window, mapColor: (c: string) => string): Element[] {
	const doc = fo.ownerDocument;
	const x = Number(fo.getAttribute("x") ?? 0) || 0;
	const y = Number(fo.getAttribute("y") ?? 0) || 0;
	const w = Number(fo.getAttribute("width") ?? 0) || 0;
	const h = Number(fo.getAttribute("height") ?? 0) || 0;
	const inner = fo.querySelector("span, p, div") ?? fo;
	const style = win.getComputedStyle(inner);
	const lines = ((inner as HTMLElement).innerText ?? inner.textContent ?? "")
		.split("\n")
		.map((l) => l.trim())
		.filter((l) => l.length > 0);
	const out: Element[] = [];
	const bgEl = fo.querySelector(".labelBkg, .edgeLabel, span") ?? inner;
	const bg = cssColorToHex(win.getComputedStyle(bgEl).backgroundColor);
	if (bg && w > 0 && h > 0 && lines.length > 0) {
		const rect = doc.createElementNS(SVG_NS, "rect");
		for (const [k, v] of Object.entries({ x, y, width: w, height: h })) rect.setAttribute(k, String(v));
		rect.setAttribute("fill", mapColor(bg));
		out.push(rect);
	}
	if (lines.length === 0) return out;
	const size = Number.parseFloat(style.fontSize) || 14;
	const lineHeight = size * 1.25;
	const text = doc.createElementNS(SVG_NS, "text");
	text.setAttribute("x", String(x + w / 2));
	text.setAttribute("y", String(y + h / 2 - ((lines.length - 1) * lineHeight) / 2));
	text.setAttribute("text-anchor", "middle");
	text.setAttribute("dominant-baseline", "central");
	text.setAttribute("font-size", String(size));
	text.setAttribute("font-family", style.fontFamily);
	if (style.fontWeight && style.fontWeight !== "400" && style.fontWeight !== "normal") text.setAttribute("font-weight", style.fontWeight);
	const color = cssColorToHex(style.color);
	if (color) text.setAttribute("fill", mapColor(color));
	lines.forEach((line, i) => {
		const t = doc.createElementNS(SVG_NS, "tspan");
		t.setAttribute("x", String(x + w / 2));
		if (i > 0) t.setAttribute("dy", String(lineHeight));
		t.textContent = line;
		text.appendChild(t);
	});
	out.push(text);
	return out;
}

/** Mermaid の図を、1 つで完結する SVG の文字列にする。light なら色をライトの配色に戻す */
export function mermaidSvgText(svg: SVGSVGElement, light: boolean): string {
	const win = svg.ownerDocument.defaultView ?? window;
	const toLight = light && svg.ownerDocument.body.classList.contains("theme-dark") ? darkToLightColors() : null;
	const mapColor = (hex: string) => toLight?.get(hex) ?? hex;
	const clone = svg.cloneNode(true) as SVGSVGElement;
	const originals = [svg, ...svg.querySelectorAll("*")];
	const copies = [clone, ...clone.querySelectorAll("*")];
	// 先に foreignObject を数えておき、置き換えは後でまとめて行う（並びの対応を崩さない）
	const replace: Array<[Element, Element[]]> = [];
	originals.forEach((orig, i) => {
		const copy = copies[i];
		if (!copy || copy.namespaceURI !== SVG_NS) return;
		if (orig.localName === "foreignObject") {
			replace.push([copy, textFromForeignObject(orig, win, mapColor)]);
			return;
		}
		if (orig.closest("foreignObject")) return;
		const cs = win.getComputedStyle(orig);
		const decls: string[] = [];
		for (const p of PROPS) {
			let v = cs.getPropertyValue(p);
			if (!v) continue;
			if (COLOR_PROPS.has(p)) {
				const hex = cssColorToHex(v);
				if (hex) v = mapColor(hex);
				else if (!/^(none|url\()/.test(v)) continue;
			}
			decls.push(`${p}:${v}`);
		}
		if (decls.length > 0) copy.setAttribute("style", decls.join(";"));
	});
	for (const [fo, items] of replace) {
		for (const item of items) fo.parentNode?.insertBefore(item, fo);
		fo.remove();
	}
	// Mermaid の <style> は id で書いた選択子で、写した先では要らない（計算した値を書き込んだ）
	for (const s of [...clone.querySelectorAll("style")]) s.remove();
	const size = viewBoxSize(svg);
	clone.setAttribute("width", String(size.width));
	clone.setAttribute("height", String(size.height));
	clone.removeAttribute("id");
	clone.setAttribute("xmlns", SVG_NS);
	return new XMLSerializer().serializeToString(clone);
}
