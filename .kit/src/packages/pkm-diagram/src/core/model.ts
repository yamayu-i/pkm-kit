/**
 * 編集用 XML（<mxfile> / <mxGraphModel>）を、ページとセルにする（ADR-0085）。
 * 圧縮した <diagram>（base64 → deflate-raw → URI エンコード）も読む
 */
import { DrawioFormatError } from "./svg.ts";
import { parseXml, serializeXml, type XmlElement } from "./xml.ts";

export interface Point {
	x: number;
	y: number;
}

export interface Geometry {
	x: number;
	y: number;
	width: number;
	height: number;
	relative: boolean;
	points: Point[];
	sourcePoint: Point | null;
	targetPoint: Point | null;
	/** 辺のラベルのずれ（mxPoint as="offset"） */
	offset: Point | null;
}

export interface Cell {
	id: string;
	parent: string | null;
	value: string;
	style: Map<string, string>;
	/** style の先頭の、= のない名前（例: text、ellipse） */
	styleNames: string[];
	vertex: boolean;
	edge: boolean;
	source: string | null;
	target: string | null;
	geometry: Geometry | null;
}

export interface Page {
	id: string;
	name: string;
	cells: Cell[];
}

export function parseStyle(style: string): { map: Map<string, string>; names: string[] } {
	const map = new Map<string, string>();
	const names: string[] = [];
	for (const part of style.split(";")) {
		const p = part.trim();
		if (p === "") continue;
		const eq = p.indexOf("=");
		if (eq < 0) names.push(p);
		else map.set(p.slice(0, eq).trim(), p.slice(eq + 1).trim());
	}
	return { map, names };
}

function num(v: string | undefined, fallback = 0): number {
	if (v === undefined) return fallback;
	const n = Number(v);
	return Number.isFinite(n) ? n : fallback;
}

function readPoint(el: XmlElement): Point {
	return { x: num(el.attrs.x), y: num(el.attrs.y) };
}

function readGeometry(el: XmlElement): Geometry {
	const g: Geometry = {
		x: num(el.attrs.x),
		y: num(el.attrs.y),
		width: num(el.attrs.width),
		height: num(el.attrs.height),
		relative: el.attrs.relative === "1",
		points: [],
		sourcePoint: null,
		targetPoint: null,
		offset: null,
	};
	for (const c of el.children) {
		if (c.name === "mxPoint" && c.attrs.as === "sourcePoint") g.sourcePoint = readPoint(c);
		else if (c.name === "mxPoint" && c.attrs.as === "targetPoint") g.targetPoint = readPoint(c);
		else if (c.name === "mxPoint" && c.attrs.as === "offset") g.offset = readPoint(c);
		else if (c.name === "Array" && c.attrs.as === "points") g.points = c.children.filter((p) => p.name === "mxPoint").map(readPoint);
	}
	return g;
}

function readCell(el: XmlElement, wrapper: XmlElement | null): Cell {
	// <UserObject label="…"><mxCell …/></UserObject> と <object> は、ID とラベルを外側に持つ
	const id = wrapper?.attrs.id ?? el.attrs.id ?? "";
	const value = wrapper ? (wrapper.attrs.label ?? "") : (el.attrs.value ?? "");
	const { map, names } = parseStyle(el.attrs.style ?? "");
	const geo = el.children.find((c) => c.name === "mxGeometry");
	return {
		id,
		parent: el.attrs.parent ?? null,
		value,
		style: map,
		styleNames: names,
		vertex: el.attrs.vertex === "1",
		edge: el.attrs.edge === "1",
		source: el.attrs.source ?? null,
		target: el.attrs.target ?? null,
		geometry: geo ? readGeometry(geo) : null,
	};
}

function readModel(model: XmlElement): Cell[] {
	const root = model.children.find((c) => c.name === "root");
	if (!root) return [];
	const cells: Cell[] = [];
	for (const c of root.children) {
		if (c.name === "mxCell") cells.push(readCell(c, null));
		else if (c.name === "UserObject" || c.name === "object") {
			const inner = c.children.find((x) => x.name === "mxCell");
			if (inner) cells.push(readCell(inner, c));
		}
	}
	return cells;
}

function base64ToBytes(b64: string): Uint8Array {
	const binary = atob(b64.replace(/\s/g, ""));
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

/** 圧縮した <diagram> の中身を、<mxGraphModel> の XML に戻す */
export async function inflateDiagram(text: string): Promise<string> {
	let bytes: Uint8Array;
	try {
		bytes = base64ToBytes(text.trim());
	} catch {
		throw new DrawioFormatError("圧縮したページを base64 として読めない");
	}
	try {
		const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
		const inflated = await new Response(stream).text();
		return decodeURIComponent(inflated);
	} catch {
		throw new DrawioFormatError("圧縮したページを展開できない");
	}
}

/** 編集用 XML を読んでページにする */
export async function parseDiagramFile(xml: string): Promise<Page[]> {
	const root = parseXml(xml.trim());
	if (root.name === "mxGraphModel") return [{ id: "page-1", name: "Page-1", cells: readModel(root) }];
	if (root.name !== "mxfile") throw new DrawioFormatError("編集用 XML が <mxfile> / <mxGraphModel> ではない");
	const pages: Page[] = [];
	for (const [i, d] of root.children.filter((c) => c.name === "diagram").entries()) {
		let model = d.children.find((c) => c.name === "mxGraphModel");
		if (!model && d.text.trim() !== "") model = parseXml(await inflateDiagram(d.text));
		pages.push({ id: d.attrs.id ?? `page-${i + 1}`, name: d.attrs.name ?? `Page-${i + 1}`, cells: model ? readModel(model) : [] });
	}
	if (pages.length === 0) throw new DrawioFormatError("編集用 XML にページ（<diagram>）がない");
	return pages;
}

/** セルの絶対位置（親の頂点の位置を足す）。辺の親は頂点でなくてもよい */
export function absoluteOrigin(cell: Cell | undefined, byId: Map<string, Cell>): Point {
	let x = 0;
	let y = 0;
	const seen = new Set<string>();
	let c = cell;
	while (c && !seen.has(c.id)) {
		seen.add(c.id);
		if (c.vertex && c.geometry && !c.geometry.relative) {
			x += c.geometry.x;
			y += c.geometry.y;
		}
		c = c.parent ? byId.get(c.parent) : undefined;
	}
	return { x, y };
}

/** HTML のラベルを、改行だけを残した文字にする */
export function labelText(cell: Cell): string {
	const html = cell.style.get("html") === "1";
	let v = cell.value;
	if (html) {
		v = v
			.replace(/<br\s*\/?>/gi, "\n")
			.replace(/<\/(div|p|li|h[1-6])>/gi, "\n")
			.replace(/<[^>]*>/g, "")
			.replace(/&nbsp;/g, " ")
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">")
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/&#(\d{1,7});/g, (m, d: string) => (Number(d) <= 0x10ffff ? String.fromCodePoint(Number(d)) : m))
			.replace(/&amp;/g, "&");
	}
	return v.replace(/\n+$/, "");
}

/** 圧縮したページを展開した編集用 XML（Claude Code が書き換えるため）。圧縮したページがなければそのまま */
export async function decompressDiagramFile(xml: string): Promise<string> {
	const root = parseXml(xml.trim());
	if (root.name !== "mxfile") return xml.trim();
	const compressed = root.children.filter((d) => d.name === "diagram" && !d.children.some((c) => c.name === "mxGraphModel") && d.text.trim() !== "");
	if (compressed.length === 0) return xml.trim();
	for (const d of compressed) {
		d.children = [parseXml(await inflateDiagram(d.text))];
		d.text = "";
	}
	return serializeXml(root);
}
