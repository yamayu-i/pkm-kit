/**
 * Claude Code が図を作る・直すための処理（ADR-0085）。build / render / inspect の本体。
 * 書く前に、既存の検査（extractDiagramXml・countPages・findSvgProblems）を通す
 */
import { buildXml, readSpec } from "./build.ts";
import { type Cell, labelText, type Page, parseDiagramFile } from "./model.ts";
import { drawioSvg, renderPage, shapeName, vertexBox } from "./render.ts";
import { countPages, DrawioFormatError, extractDiagramXml, findSvgProblems, MAX_SVG_BYTES, toSharingSvg } from "./svg.ts";

export interface Authored {
	svg: string;
	pages: number;
	warnings: string[];
}

/** 入力（図の SVG・.drawio・XML）から編集用 XML を取り出す */
export function xmlFromInput(text: string): string {
	const t = text.replace(/^﻿/, "").trimStart();
	if (/^(<\?xml[^>]*\?>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>[]*>\s*)?<svg[\s>]/.test(t)) {
		const r = extractDiagramXml(t);
		if (r.kind !== "diagram") throw new DrawioFormatError("編集用 XML がない（普通の SVG）");
		return r.xml;
	}
	const xml = t.replace(/^<\?xml[^>]*\?>\s*/, "").trim();
	if (!/^<(mxfile|mxGraphModel)[\s>/]/.test(xml)) throw new DrawioFormatError("図の SVG・.drawio・<mxfile> の XML のどれでもない");
	return xml;
}

/** XML から図のファイルを作る。xml はそのまま content に入れる */
export async function renderDiagram(xml: string, pageNumber = 1): Promise<Authored> {
	const pages = await parseDiagramFile(xml);
	const page = pages[pageNumber - 1];
	if (!page) throw new DrawioFormatError(`ページ ${pageNumber} がない（${pages.length} ページ）`);
	const rendered = renderPage(page);
	const svg = drawioSvg(xml, rendered);
	verify(svg, xml);
	return { svg, pages: pages.length, warnings: rendered.warnings };
}

/** spec（JSON の値）から図のファイルを作る */
export async function buildDiagram(spec: unknown): Promise<Authored & { xml: string }> {
	const xml = buildXml(readSpec(spec));
	const r = await renderDiagram(xml);
	return { ...r, xml };
}

function verify(svg: string, xml: string): void {
	if (svg.length > MAX_SVG_BYTES) throw new DrawioFormatError("SVG が大きすぎる（10 MiB まで）");
	const back = extractDiagramXml(svg);
	if (back.kind !== "diagram" || back.xml !== xml.trim()) throw new DrawioFormatError("書いた SVG から同じ編集用 XML を読めない");
	if (countPages(back.xml) !== countPages(xml)) throw new DrawioFormatError("ページの数が合わない");
	const problems = findSvgProblems(toSharingSvg(svg));
	if (problems.errors.length > 0) throw new DrawioFormatError(`描画に使えないものがある: ${problems.errors.join("、")}`);
}

function short(text: string, max = 60): string {
	const one = text.replace(/\s*\n\s*/g, " / ");
	return one.length > max ? `${one.slice(0, max - 1)}…` : one;
}

function describeCell(c: Cell, byId: Map<string, Cell>): string | null {
	const label = labelText(c);
	if (c.edge && !c.vertex) {
		const from = c.source ?? "(点)";
		const to = c.target ?? "(点)";
		const via = c.geometry?.points.length ? ` 経由 ${c.geometry.points.length} 点` : "";
		return `  ${c.id}  辺 ${from} -> ${to}${label ? `  "${short(label)}"` : ""}${via}`;
	}
	if (!c.vertex) return null;
	const parent = c.parent ? byId.get(c.parent) : undefined;
	if (parent?.edge) return `  ${c.id}  辺のラベル（${parent.id}）  "${short(label)}"`;
	const b = vertexBox(c, byId);
	const geo = b ? `  x=${Math.round(b.x)} y=${Math.round(b.y)} w=${Math.round(b.w)} h=${Math.round(b.h)}` : "";
	const inside = parent?.vertex ? `  中: ${parent.id}` : "";
	return `  ${c.id}  ${shapeName(c)}${label ? `  "${short(label)}"` : ""}${geo}${inside}`;
}

/** ページ・セル・描けない書式を短いテキストにする（位置は絶対座標） */
export async function inspectDiagram(xml: string): Promise<string> {
	const pages = await parseDiagramFile(xml);
	const lines: string[] = [`ページ ${pages.length}`];
	pages.forEach((p: Page, i) => {
		const byId = new Map(p.cells.map((c) => [c.id, c]));
		const shown = p.cells.map((c) => describeCell(c, byId)).filter((l): l is string => l !== null);
		lines.push(`[${i + 1}] ${p.name}（id ${p.id}、セル ${shown.length}）`);
		lines.push(...shown);
		const { warnings } = renderPage(p);
		for (const w of warnings) lines.push(`  ! ${w}`);
	});
	return lines.join("\n");
}
