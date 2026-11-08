/**
 * 短い JSON（spec）から、配置を計算して編集用 XML（<mxfile>）を作る（ADR-0085）。
 * 同じ spec からは同じ XML を作る。描画は render.ts
 */
import { DrawioFormatError } from "./svg.ts";
import { textWidth, wrapLines } from "./render.ts";
import { escapeXml } from "./xml.ts";

export type Direction = "down" | "right";
export type LayoutKind = "layered" | "grid" | "none";

export interface NodeSpec {
	id: string;
	label?: string;
	shape?: string;
	color?: string;
	fill?: string;
	stroke?: string;
	fontColor?: string;
	fontSize?: number;
	bold?: boolean;
	dashed?: boolean;
	group?: string;
	width?: number;
	height?: number;
	x?: number;
	y?: number;
	/** Draw.io の style をそのまま足す（後ろに付ける） */
	style?: string;
}

export interface EdgeSpec {
	id?: string;
	from: string;
	to: string;
	label?: string;
	dashed?: boolean;
	arrow?: "end" | "start" | "both" | "none";
	color?: string;
	width?: number;
	/** straight にすると直線（既定は直交） */
	line?: "orthogonal" | "straight" | "curved";
	style?: string;
}

export interface GroupSpec {
	id: string;
	label?: string;
	color?: string;
	group?: string;
	style?: string;
	/** グループの中の向き（既定はページと同じ） */
	direction?: Direction;
	layout?: LayoutKind;
	columns?: number;
	x?: number;
	y?: number;
}

export interface PageSpec {
	name?: string;
	direction?: Direction;
	layout?: LayoutKind;
	columns?: number;
	nodes?: NodeSpec[];
	edges?: EdgeSpec[];
	groups?: GroupSpec[];
}

export interface DiagramSpec extends PageSpec {
	pages?: PageSpec[];
}

/** 色の名前（Draw.io の既定のパレット） */
export const PALETTE: Readonly<Record<string, { fill: string; stroke: string; font?: string }>> = {
	white: { fill: "#ffffff", stroke: "#000000" },
	gray: { fill: "#f5f5f5", stroke: "#666666", font: "#333333" },
	blue: { fill: "#dae8fc", stroke: "#6c8ebf" },
	green: { fill: "#d5e8d4", stroke: "#82b366" },
	orange: { fill: "#ffe6cc", stroke: "#d79b00" },
	yellow: { fill: "#fff2cc", stroke: "#d6b656" },
	red: { fill: "#f8cecc", stroke: "#b85450" },
	purple: { fill: "#e1d5e7", stroke: "#9673a6" },
	dark: { fill: "#333333", stroke: "#000000", font: "#ffffff" },
	none: { fill: "none", stroke: "#000000" },
};

/** 形の名前 → Draw.io の style */
export const SHAPE_STYLES: Readonly<Record<string, string>> = {
	box: "rounded=0;whiteSpace=wrap;html=1;",
	rounded: "rounded=1;whiteSpace=wrap;html=1;",
	ellipse: "ellipse;whiteSpace=wrap;html=1;",
	circle: "ellipse;whiteSpace=wrap;html=1;aspect=fixed;",
	diamond: "rhombus;whiteSpace=wrap;html=1;",
	hexagon: "shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;",
	parallelogram: "shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;",
	step: "shape=step;perimeter=stepPerimeter;whiteSpace=wrap;html=1;fixedSize=1;",
	triangle: "triangle;whiteSpace=wrap;html=1;",
	cylinder: "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;",
	note: "shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;size=20;",
	document: "shape=document;whiteSpace=wrap;html=1;boundedLbl=1;",
	process: "shape=process;whiteSpace=wrap;html=1;backgroundOutline=1;",
	cloud: "ellipse;shape=cloud;whiteSpace=wrap;html=1;",
	actor: "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;",
	text: "text;html=1;align=center;verticalAlign=middle;whiteSpace=wrap;",
};

const ID = /^[A-Za-z0-9_.:-]{1,64}$/;
const COLOR = /^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$|^none$/;
const RAW_STYLE = /^[A-Za-z0-9_.:#%=;,\- ]*$/;

const FONT = 12;
const RANK_GAP = { down: 60, right: 80 } as const;
const NODE_GAP = 40;
const PAD = { top: 36, side: 20, bottom: 20 };

function fail(where: string, message: string): never {
	throw new DrawioFormatError(`spec の ${where}: ${message}`);
}

function checkObject(v: unknown, where: string): Record<string, unknown> {
	if (typeof v !== "object" || v === null || Array.isArray(v)) fail(where, "オブジェクトではない");
	return v as Record<string, unknown>;
}

function checkKeys(o: Record<string, unknown>, allowed: readonly string[], where: string): void {
	for (const k of Object.keys(o)) if (!allowed.includes(k)) fail(where, `知らない項目 ${k}（使えるのは ${allowed.join(", ")}）`);
}

function str(o: Record<string, unknown>, k: string, where: string): string | undefined {
	const v = o[k];
	if (v === undefined) return undefined;
	if (typeof v !== "string") fail(where, `${k} が文字列ではない`);
	return v;
}

function numv(o: Record<string, unknown>, k: string, where: string, min = -100000, max = 100000): number | undefined {
	const v = o[k];
	if (v === undefined) return undefined;
	if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max) fail(where, `${k} が ${min}〜${max} の数ではない`);
	return v;
}

function oneOf<T extends string>(o: Record<string, unknown>, k: string, values: readonly T[], where: string): T | undefined {
	const v = str(o, k, where);
	if (v === undefined) return undefined;
	if (!values.includes(v as T)) fail(where, `${k} は ${values.join(" / ")} のどれか`);
	return v as T;
}

function colorName(o: Record<string, unknown>, k: string, where: string): string | undefined {
	const v = str(o, k, where);
	if (v === undefined) return undefined;
	if (k === "color") {
		if (!(v in PALETTE)) fail(where, `color は ${Object.keys(PALETTE).join(" / ")} のどれか`);
		return v;
	}
	if (!COLOR.test(v)) fail(where, `${k} は #rrggbb か none`);
	return v;
}

function rawStyle(o: Record<string, unknown>, where: string): string | undefined {
	const v = str(o, "style", where);
	if (v === undefined) return undefined;
	if (!RAW_STYLE.test(v) || v.length > 1000) fail(where, "style に使えない文字がある");
	return v;
}

function bool(o: Record<string, unknown>, k: string, where: string): boolean | undefined {
	const v = o[k];
	if (v === undefined) return undefined;
	if (typeof v !== "boolean") fail(where, `${k} が true / false ではない`);
	return v;
}

function readPage(v: unknown, where: string): PageSpec {
	const o = checkObject(v, where);
	checkKeys(o, ["name", "direction", "layout", "columns", "nodes", "edges", "groups"], where);
	const list = (k: string) => {
		const x = o[k];
		if (x === undefined) return [];
		if (!Array.isArray(x)) fail(where, `${k} が配列ではない`);
		return x as unknown[];
	};
	const nodes = list("nodes").map((n, i): NodeSpec => {
		const w = `${where}nodes[${i}]`;
		const no = checkObject(n, w);
		checkKeys(no, ["id", "label", "shape", "color", "fill", "stroke", "fontColor", "fontSize", "bold", "dashed", "group", "width", "height", "x", "y", "style"], w);
		const id = str(no, "id", w);
		if (id === undefined || !ID.test(id) || id === "0" || id === "1") fail(w, "id は英数字と _ . : - の 64 文字まで（0 と 1 は使えない）");
		const shape = str(no, "shape", w);
		if (shape !== undefined && !(shape in SHAPE_STYLES)) fail(w, `shape は ${Object.keys(SHAPE_STYLES).join(" / ")} のどれか`);
		return {
			id,
			label: str(no, "label", w),
			shape,
			color: colorName(no, "color", w),
			fill: colorName(no, "fill", w),
			stroke: colorName(no, "stroke", w),
			fontColor: colorName(no, "fontColor", w),
			fontSize: numv(no, "fontSize", w, 6, 72),
			bold: bool(no, "bold", w),
			dashed: bool(no, "dashed", w),
			group: str(no, "group", w),
			width: numv(no, "width", w, 1, 5000),
			height: numv(no, "height", w, 1, 5000),
			x: numv(no, "x", w),
			y: numv(no, "y", w),
			style: rawStyle(no, w),
		};
	});
	const groups = list("groups").map((g, i): GroupSpec => {
		const w = `${where}groups[${i}]`;
		const go = checkObject(g, w);
		checkKeys(go, ["id", "label", "color", "group", "style", "direction", "layout", "columns", "x", "y"], w);
		const id = str(go, "id", w);
		if (id === undefined || !ID.test(id) || id === "0" || id === "1") fail(w, "id は英数字と _ . : - の 64 文字まで（0 と 1 は使えない）");
		return {
			id,
			label: str(go, "label", w),
			color: colorName(go, "color", w),
			group: str(go, "group", w),
			style: rawStyle(go, w),
			direction: oneOf(go, "direction", ["down", "right"], w),
			layout: oneOf(go, "layout", ["layered", "grid", "none"], w),
			columns: numv(go, "columns", w, 1, 100),
			x: numv(go, "x", w),
			y: numv(go, "y", w),
		};
	});
	const edges = list("edges").map((e, i): EdgeSpec => {
		const w = `${where}edges[${i}]`;
		const eo = checkObject(e, w);
		checkKeys(eo, ["id", "from", "to", "label", "dashed", "arrow", "color", "width", "line", "style"], w);
		const from = str(eo, "from", w);
		const to = str(eo, "to", w);
		if (from === undefined || to === undefined) fail(w, "from と to が要る");
		const id = str(eo, "id", w);
		if (id !== undefined && (!ID.test(id) || id === "0" || id === "1")) fail(w, "id は英数字と _ . : - の 64 文字まで（0 と 1 は使えない）");
		const c = str(eo, "color", w);
		if (c !== undefined && !(c in PALETTE) && !COLOR.test(c)) fail(w, "color は色の名前か #rrggbb");
		return {
			id,
			from,
			to,
			label: str(eo, "label", w),
			dashed: bool(eo, "dashed", w),
			arrow: oneOf(eo, "arrow", ["end", "start", "both", "none"], w),
			color: c,
			width: numv(eo, "width", w, 0.5, 20),
			line: oneOf(eo, "line", ["orthogonal", "straight", "curved"], w),
			style: rawStyle(eo, w),
		};
	});
	return {
		name: str(o, "name", where),
		direction: oneOf(o, "direction", ["down", "right"], where),
		layout: oneOf(o, "layout", ["layered", "grid", "none"], where),
		columns: numv(o, "columns", where, 1, 100),
		nodes,
		edges,
		groups,
	};
}

/** JSON を spec として読む（知らない項目・型の違いはエラー） */
export function readSpec(json: unknown): PageSpec[] {
	const o = checkObject(json, "ルート");
	if (o.pages !== undefined) {
		checkKeys(o, ["pages"], "ルート");
		if (!Array.isArray(o.pages) || o.pages.length === 0) fail("pages", "1 つ以上のページの配列にする");
		return o.pages.map((p, i) => readPage(p, `pages[${i}].`));
	}
	return [readPage(o, "")];
}

// ---- 配置 ----

interface Item {
	id: string;
	/** ノードかグループか */
	kind: "node" | "group";
	w: number;
	h: number;
	x: number;
	y: number;
	/** 形の下に出るラベルの分の余白（人の形など） */
	below: number;
	/** 指定された位置（layout: none） */
	fixed: { x?: number; y?: number };
	order: number;
}

function estimateNode(n: NodeSpec): { w: number; h: number } {
	const shape = n.shape ?? "rounded";
	const fontSize = n.fontSize ?? FONT;
	const label = n.label ?? n.id;
	if (shape === "actor") return { w: n.width ?? 30, h: n.height ?? 60 };
	const lineW = Math.max(0, ...label.split("\n").map((l) => textWidth(l, fontSize)));
	const factor = shape === "diamond" ? 1.6 : shape === "ellipse" || shape === "circle" || shape === "cloud" ? 1.35 : shape === "hexagon" || shape === "parallelogram" || shape === "step" ? 1.25 : 1;
	const maxW = 200 * Math.max(1, factor * 0.9);
	let w = Math.max(shape === "text" ? 40 : 120, Math.ceil(((lineW + 24) * factor) / 10) * 10);
	if (w > maxW) w = Math.ceil(maxW / 10) * 10;
	const inner = w / factor - 8;
	const lines = wrapLines(label, inner, fontSize).length;
	const minH = shape === "text" ? 30 : shape === "diamond" ? 80 : shape === "cylinder" ? 80 : 60;
	let h = Math.max(minH, Math.ceil(((lines * fontSize * 1.2 + 20) * (shape === "diamond" ? 1.6 : shape === "cylinder" || shape === "document" ? 1.3 : 1)) / 10) * 10);
	if (shape === "circle") {
		const s = Math.max(w, h);
		w = s;
		h = s;
	}
	return { w: n.width ?? w, h: n.height ?? h };
}

interface Box {
	x: number;
	y: number;
	w: number;
	h: number;
}

interface Level {
	items: Item[];
	/** 項目の間の辺（項目の ID で。向きあり） */
	links: Array<[string, string]>;
	direction: Direction;
	layout: LayoutKind;
	columns?: number;
}

/** 層に分ける配置。items の x, y を書く（左上が 0, 0） */
function layered(level: Level): void {
	const { items, direction } = level;
	const index = new Map(items.map((it, i) => [it.id, i]));
	const n = items.length;
	const out: number[][] = items.map(() => []);
	const seenPair = new Set<string>();
	for (const [a, b] of level.links) {
		const ia = index.get(a);
		const ib = index.get(b);
		if (ia === undefined || ib === undefined || ia === ib) continue;
		const key = `${ia}>${ib}`;
		if (seenPair.has(key)) continue;
		seenPair.add(key);
		out[ia]?.push(ib);
	}
	// 閉路を切る: 入力順の DFS で、戻る辺を逆向きにする
	const state = new Array<number>(n).fill(0);
	const forward: Array<[number, number]> = [];
	const visit = (u: number) => {
		state[u] = 1;
		for (const v of out[u] ?? []) {
			if (state[v] === 1) forward.push([v, u]);
			else {
				forward.push([u, v]);
				if (state[v] === 0) visit(v);
			}
		}
		state[u] = 2;
	};
	// 入ってくる辺のない項目から始める
	const indeg = new Array<number>(n).fill(0);
	for (const list of out) for (const v of list) indeg[v] = (indeg[v] ?? 0) + 1;
	for (let i = 0; i < n; i++) if (state[i] === 0 && indeg[i] === 0) visit(i);
	for (let i = 0; i < n; i++) if (state[i] === 0) visit(i);
	const preds: number[][] = items.map(() => []);
	const succs: number[][] = items.map(() => []);
	for (const [a, b] of forward) {
		if (!succs[a]?.includes(b)) succs[a]?.push(b);
		if (!preds[b]?.includes(a)) preds[b]?.push(a);
	}
	// 最長路で層を決める
	const rank = new Array<number>(n).fill(0);
	const remaining = preds.map((p) => p.length);
	const queue: number[] = [];
	for (let i = 0; i < n; i++) if (remaining[i] === 0) queue.push(i);
	while (queue.length > 0) {
		queue.sort((a, b) => a - b);
		const u = queue.shift() as number;
		for (const v of succs[u] ?? []) {
			rank[v] = Math.max(rank[v] ?? 0, (rank[u] ?? 0) + 1);
			remaining[v] = (remaining[v] ?? 0) - 1;
			if (remaining[v] === 0) queue.push(v);
		}
	}
	// 出ていく辺しかない項目は、つながる先のすぐ上の層に寄せる
	for (let i = 0; i < n; i++) {
		if ((preds[i]?.length ?? 0) === 0 && (succs[i]?.length ?? 0) > 0) {
			rank[i] = Math.max(0, Math.min(...(succs[i] ?? []).map((s) => rank[s] ?? 0)) - 1);
		}
	}
	const ranks: number[][] = [];
	for (let i = 0; i < n; i++) (ranks[rank[i] ?? 0] ??= []).push(i);
	for (let r = 0; r < ranks.length; r++) ranks[r] ??= [];
	// 重心法で並べ替える（下へ・上へを 4 往復）
	const pos = new Array<number>(n).fill(0);
	const setPos = () => {
		for (const row of ranks) row.forEach((v, i) => (pos[v] = i));
	};
	setPos();
	const bary = (v: number, nbrs: number[]) => (nbrs.length === 0 ? (pos[v] ?? 0) : nbrs.reduce((s, x) => s + (pos[x] ?? 0), 0) / nbrs.length);
	for (let sweep = 0; sweep < 8; sweep++) {
		const down = sweep % 2 === 0;
		const order = down ? ranks.map((_, i) => i) : ranks.map((_, i) => ranks.length - 1 - i);
		for (const r of order.slice(1)) {
			const row = ranks[r] as number[];
			const key = new Map(row.map((v) => [v, bary(v, down ? (preds[v] ?? []) : (succs[v] ?? []))]));
			row.sort((a, b) => (key.get(a) as number) - (key.get(b) as number) || (pos[a] ?? 0) - (pos[b] ?? 0) || a - b);
			setPos();
		}
	}
	// 座標: 層の軸（main）と、層の中の軸（cross）
	const mainSize = (it: Item) => (direction === "down" ? it.h + it.below : it.w);
	const crossSize = (it: Item) => (direction === "down" ? it.w : it.h + it.below);
	const center = new Array<number>(n).fill(0);
	const pack = (row: number[], desired: number[]) => {
		// 順を保って、間をあけながら desired に近づける
		const left: number[] = [];
		row.forEach((v, i) => {
			const half = crossSize(items[v] as Item) / 2;
			const want = desired[i] as number;
			if (i === 0) left.push(want);
			else {
				const pv = row[i - 1] as number;
				left.push(Math.max(want, (left[i - 1] as number) + crossSize(items[pv] as Item) / 2 + NODE_GAP + half));
			}
		});
		const right: number[] = new Array(row.length);
		for (let i = row.length - 1; i >= 0; i--) {
			const v = row[i] as number;
			const want = desired[i] as number;
			if (i === row.length - 1) right[i] = want;
			else {
				const nv = row[i + 1] as number;
				right[i] = Math.min(want, (right[i + 1] as number) - crossSize(items[nv] as Item) / 2 - NODE_GAP - crossSize(items[v] as Item) / 2);
			}
		}
		const avg = row.map((_, i) => ((left[i] as number) + (right[i] as number)) / 2);
		// もう一度、間を保つ
		for (let i = 1; i < row.length; i++) {
			const min = (avg[i - 1] as number) + crossSize(items[row[i - 1] as number] as Item) / 2 + NODE_GAP + crossSize(items[row[i] as number] as Item) / 2;
			if ((avg[i] as number) < min) avg[i] = min;
		}
		row.forEach((v, i) => (center[v] = avg[i] as number));
	};
	const evenly = (row: number[]) => {
		let total = -NODE_GAP;
		for (const v of row) total += crossSize(items[v] as Item) + NODE_GAP;
		let c = -total / 2;
		return row.map((v) => {
			const s = crossSize(items[v] as Item);
			const mid = c + s / 2;
			c += s + NODE_GAP;
			return mid;
		});
	};
	ranks.forEach((row, r) => {
		if (r === 0) {
			pack(row, evenly(row));
			return;
		}
		const base = evenly(row);
		const desired = row.map((v, i) => {
			const p = preds[v] ?? [];
			return p.length === 0 ? (base[i] as number) : p.reduce((s, x) => s + (center[x] ?? 0), 0) / p.length;
		});
		pack(row, desired);
	});
	// 上へ: 子だけを持つ項目を、子の重心に寄せる（もう一度並べ直す）
	for (let r = ranks.length - 2; r >= 0; r--) {
		const row = ranks[r] as number[];
		const desired = row.map((v) => {
			const s = succs[v] ?? [];
			const p = preds[v] ?? [];
			if (s.length === 0) return center[v] as number;
			const sc = s.reduce((acc, x) => acc + (center[x] ?? 0), 0) / s.length;
			return p.length === 0 ? sc : ((center[v] as number) + sc) / 2;
		});
		pack(row, desired);
	}
	let main = 0;
	const minCross = Math.min(...items.map((it, i) => (center[i] as number) - crossSize(it) / 2));
	for (const row of ranks) {
		const thick = Math.max(0, ...row.map((v) => mainSize(items[v] as Item)));
		for (const v of row) {
			const it = items[v] as Item;
			const m = main + (thick - mainSize(it)) / 2;
			const c = (center[v] as number) - crossSize(it) / 2 - minCross;
			if (direction === "down") {
				it.x = Math.round(c);
				it.y = Math.round(m);
			} else {
				it.x = Math.round(m);
				it.y = Math.round(c);
			}
		}
		main += thick + RANK_GAP[direction];
	}
}

function grid(level: Level): void {
	const { items } = level;
	const cols = Math.max(1, Math.min(items.length, level.columns ?? Math.ceil(Math.sqrt(items.length))));
	const colW: number[] = [];
	const rowH: number[] = [];
	items.forEach((it, i) => {
		const c = i % cols;
		const r = Math.floor(i / cols);
		colW[c] = Math.max(colW[c] ?? 0, it.w);
		rowH[r] = Math.max(rowH[r] ?? 0, it.h + it.below);
	});
	items.forEach((it, i) => {
		const c = i % cols;
		const r = Math.floor(i / cols);
		const x0 = colW.slice(0, c).reduce((s, w) => s + w + NODE_GAP, 0);
		const y0 = rowH.slice(0, r).reduce((s, h) => s + h + NODE_GAP, 0);
		it.x = Math.round(x0 + ((colW[c] as number) - it.w) / 2);
		it.y = Math.round(y0 + ((rowH[r] as number) - it.h) / 2);
	});
}

function fixed(level: Level, where: string): void {
	for (const it of level.items) {
		if (it.fixed.x === undefined || it.fixed.y === undefined) fail(where, `layout: none では ${it.id} に x と y が要る`);
		it.x = it.fixed.x;
		it.y = it.fixed.y;
	}
}

function arrange(level: Level, where: string): void {
	if (level.items.length === 0) return;
	if (level.layout === "none") fixed(level, where);
	else if (level.layout === "grid") grid(level);
	else layered(level);
}

function htmlLabel(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.split("\n")
		.join("<br>");
}

function nodeStyle(n: NodeSpec): string {
	let s = SHAPE_STYLES[n.shape ?? "rounded"] as string;
	const pal = n.color ? PALETTE[n.color] : undefined;
	const fill = n.fill ?? pal?.fill;
	const stroke = n.stroke ?? pal?.stroke;
	const font = n.fontColor ?? pal?.font;
	if (n.shape === "text") {
		if (n.fill) s += `fillColor=${n.fill};`;
		if (n.stroke) s += `strokeColor=${n.stroke};`;
	} else {
		if (fill) s += `fillColor=${fill};`;
		if (stroke) s += `strokeColor=${stroke};`;
	}
	if (font) s += `fontColor=${font};`;
	if (n.fontSize) s += `fontSize=${n.fontSize};`;
	if (n.bold) s += "fontStyle=1;";
	if (n.dashed) s += "dashed=1;";
	if (n.style) s += n.style.endsWith(";") ? n.style : `${n.style};`;
	return s;
}

function groupStyle(g: GroupSpec): string {
	const pal = PALETTE[g.color ?? "gray"] ?? PALETTE.gray;
	let s = `rounded=1;arcSize=4;whiteSpace=wrap;html=1;container=1;collapsible=0;verticalAlign=top;align=left;spacingLeft=8;spacingTop=2;fontStyle=1;fillColor=${pal?.fill};strokeColor=${pal?.stroke};`;
	if (pal?.font) s += `fontColor=${pal.font};`;
	if (g.style) s += g.style.endsWith(";") ? g.style : `${g.style};`;
	return s;
}

function edgeStyle(e: EdgeSpec, ports: string): string {
	const line = e.line ?? "orthogonal";
	let s = line === "straight" ? "html=1;rounded=0;" : line === "curved" ? "html=1;curved=1;" : `edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;${ports}`;
	const arrow = e.arrow ?? "end";
	if (arrow === "none") s += "endArrow=none;";
	if (arrow === "start") s += "endArrow=none;startArrow=classic;";
	if (arrow === "both") s += "startArrow=classic;";
	if (e.dashed) s += "dashed=1;";
	if (e.color) s += `strokeColor=${PALETTE[e.color]?.stroke ?? e.color};`;
	if (e.width) s += `strokeWidth=${e.width};`;
	if (e.style) s += e.style.endsWith(";") ? e.style : `${e.style};`;
	return s;
}

function pageXml(page: PageSpec, pageIndex: number, where: string): string {
	const nodes = page.nodes ?? [];
	const groups = page.groups ?? [];
	const edges = page.edges ?? [];
	const ids = new Set<string>();
	for (const x of [...groups, ...nodes]) {
		if (ids.has(x.id)) fail(where, `id ${x.id} が重複している`);
		ids.add(x.id);
	}
	const groupById = new Map(groups.map((g) => [g.id, g]));
	for (const x of [...groups, ...nodes]) {
		if (x.group !== undefined && !groupById.has(x.group)) fail(where, `${x.id} の group ${x.group} がない`);
	}
	// グループの入れ子の循環
	for (const g of groups) {
		const seen = new Set<string>();
		let c: GroupSpec | undefined = g;
		while (c?.group !== undefined) {
			if (seen.has(c.id)) fail(where, `グループ ${g.id} の入れ子が循環している`);
			seen.add(c.id);
			c = groupById.get(c.group);
		}
	}
	for (const e of edges) {
		for (const end of [e.from, e.to]) if (!ids.has(end)) fail(where, `辺 ${e.from} → ${e.to} の ${end} がない`);
	}
	const direction = page.direction ?? "down";
	// 各ノード・グループの、すぐ上のグループ（なければ ""）
	const parentOf = new Map<string, string>();
	for (const x of [...groups, ...nodes]) parentOf.set(x.id, x.group ?? "");
	const ancestors = (id: string): string[] => {
		const list = [id];
		let p = parentOf.get(id) ?? "";
		while (p !== "") {
			list.push(p);
			p = parentOf.get(p) ?? "";
		}
		return list;
	};
	// level（グループの ID。"" はページ）ごとに配置し、グループの大きさを決める（内側から）
	const items = new Map<string, Item>();
	nodes.forEach((n, i) => {
		const s = estimateNode(n);
		const below = n.shape === "actor" ? Math.ceil(((n.label ?? n.id).split("\n").length * (n.fontSize ?? FONT) * 1.2 + 6) / 2) * 2 : 0;
		items.set(n.id, { id: n.id, kind: "node", w: s.w, h: s.h, below, x: 0, y: 0, fixed: { x: n.x, y: n.y }, order: i });
	});
	groups.forEach((g, i) => items.set(g.id, { id: g.id, kind: "group", w: 0, h: 0, below: 0, x: 0, y: 0, fixed: { x: g.x, y: g.y }, order: i - groups.length }));
	const depth = (gid: string): number => ancestors(gid).length;
	const levels = ["", ...[...groups].sort((a, b) => depth(b.id) - depth(a.id)).map((g) => g.id)];
	// 内側のグループから
	const ordered = [...levels.slice(1), ""];
	for (const lv of ordered) {
		const members = [...items.values()].filter((it) => (parentOf.get(it.id) ?? "") === lv).sort((a, b) => a.order - b.order);
		const memberSet = new Set(members.map((m) => m.id));
		const toMember = (id: string): string | null => {
			for (const a of ancestors(id)) if (memberSet.has(a)) return a;
			return null;
		};
		const links: Array<[string, string]> = [];
		for (const e of edges) {
			const a = toMember(e.from);
			const b = toMember(e.to);
			if (a && b && a !== b) links.push([a, b]);
		}
		const g = lv === "" ? undefined : groupById.get(lv);
		const level: Level = {
			items: members,
			links,
			direction: g?.direction ?? direction,
			layout: g?.layout ?? page.layout ?? "layered",
			columns: g?.columns ?? (lv === "" ? page.columns : undefined),
		};
		arrange(level, where);
		if (g) {
			const it = items.get(g.id) as Item;
			const label = g.label ?? "";
			const labelW = textWidth(label, FONT) + 24;
			if (members.length === 0) {
				it.w = Math.max(120, labelW);
				it.h = 60;
			} else {
				// グループの中の座標を、余白の分だけずらす
				const minX = Math.min(...members.map((m) => m.x));
				const minY = Math.min(...members.map((m) => m.y));
				for (const m of members) {
					m.x = m.x - minX + PAD.side;
					m.y = m.y - minY + PAD.top;
				}
				const maxX = Math.max(...members.map((m) => m.x + m.w));
				const maxY = Math.max(...members.map((m) => m.y + m.h + m.below));
				it.w = Math.max(maxX + PAD.side, labelW);
				it.h = maxY + PAD.bottom;
			}
		}
	}
	// XML を書く（親を子より先に）
	const cells: string[] = [];
	const nodeById = new Map(nodes.map((n) => [n.id, n]));
	const write = (id: string) => {
		const it = items.get(id) as Item;
		const parent = parentOf.get(id) || "1";
		const geo = `<mxGeometry x="${it.x}" y="${it.y}" width="${it.w}" height="${it.h}" as="geometry"/>`;
		if (it.kind === "group") {
			const g = groupById.get(id) as GroupSpec;
			cells.push(`<mxCell id="${escapeXml(id)}" value="${escapeXml(htmlLabel(g.label ?? ""))}" style="${escapeXml(groupStyle(g))}" vertex="1" parent="${escapeXml(parent)}">${geo}</mxCell>`);
			const children = [...items.values()].filter((c) => parentOf.get(c.id) === id).sort((a, b) => a.order - b.order);
			for (const c of children) write(c.id);
		} else {
			const n = nodeById.get(id) as NodeSpec;
			cells.push(`<mxCell id="${escapeXml(id)}" value="${escapeXml(htmlLabel(n.label ?? n.id))}" style="${escapeXml(nodeStyle(n))}" vertex="1" parent="${escapeXml(parent)}">${geo}</mxCell>`);
		}
	};
	for (const it of [...items.values()].filter((x) => (parentOf.get(x.id) ?? "") === "").sort((a, b) => a.order - b.order)) write(it.id);
	// 辺。層の向きに進む辺は、出入りの位置を固定する
	const absolute = (id: string): Box => {
		let x = 0;
		let y = 0;
		for (const a of ancestors(id)) {
			const it = items.get(a) as Item;
			x += it.x;
			y += it.y;
		}
		const it = items.get(id) as Item;
		return { x, y, w: it.w, h: it.h };
	};
	const edgeIds = new Set<string>();
	const tops = [...items.values()].filter((x) => (parentOf.get(x.id) ?? "") === "");
	const farX = Math.max(0, ...tops.map((t) => t.x + t.w));
	const farY = Math.max(0, ...tops.map((t) => t.y + t.h + t.below));
	let lanes = 0;
	// 前へ進む辺が、ほかの箱を横切るなら、横に寄せて回る（right は x と y を入れ替えて考える）
	const boxes = [...items.keys()].map((id) => ({ id, box: absolute(id) }));
	const detour = (from: string, to: string, a: Box, b: Box, swap: boolean): string => {
		const T = (r: Box): Box => (swap ? { x: r.y, y: r.x, w: r.h, h: r.w } : r);
		const pt = (x: number, y: number) => (swap ? `<mxPoint x="${Math.round(y)}" y="${Math.round(x)}"/>` : `<mxPoint x="${Math.round(x)}" y="${Math.round(y)}"/>`);
		const skip = new Set([...ancestors(from), ...ancestors(to)]);
		const obstacles = boxes.filter((o) => !skip.has(o.id)).map((o) => T(o.box));
		const A = T(a);
		const B = T(b);
		const ax = A.x + A.w / 2;
		const bx = B.x + B.w / 2;
		const top = A.y + A.h;
		const bottom = B.y;
		const my = (top + bottom) / 2;
		const hits = (segs: Array<[number, number, number, number]>) =>
			obstacles.filter((o) =>
				segs.some(([x1, y1, x2, y2]) => Math.max(x1, x2) > o.x && Math.min(x1, x2) < o.x + o.w && Math.max(y1, y2) > o.y && Math.min(y1, y2) < o.y + o.h),
			);
		const straight: Array<[number, number, number, number]> = [
			[ax, top, ax, my],
			[ax, my, bx, my],
			[bx, my, bx, bottom],
		];
		const blocking = hits(straight);
		if (blocking.length === 0) return "";
		const y1 = top + Math.min(20, (bottom - top) / 3);
		const y2 = bottom - Math.min(20, (bottom - top) / 3);
		const between = obstacles.filter((o) => o.y < y2 && o.y + o.h > y1);
		const right = Math.max(...between.map((o) => o.x + o.w)) + 20;
		const left = Math.min(...between.map((o) => o.x)) - 20;
		const lane = Math.abs(right - (ax + bx) / 2) <= Math.abs((ax + bx) / 2 - left) ? right : left;
		return `<Array as="points">${pt(ax, y1)}${pt(lane, y1)}${pt(lane, y2)}${pt(bx, y2)}</Array>`;
	};
	edges.forEach((e, i) => {
		let id = e.id ?? `e${i + 1}`;
		while (ids.has(id) || edgeIds.has(id)) id = `${id}_`;
		edgeIds.add(id);
		let ports = "";
		let points = "";
		const orthogonal = (e.line ?? "orthogonal") === "orthogonal";
		if (e.from !== e.to && orthogonal) {
			const a = absolute(e.from);
			const b = absolute(e.to);
			if (direction === "down" && b.y >= a.y + a.h) {
				ports = "exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;";
				points = detour(e.from, e.to, a, b, false);
			} else if (direction === "right" && b.x >= a.x + a.w) {
				ports = "exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;";
				points = detour(e.from, e.to, a, b, true);
			} else if (direction === "down" && b.y + b.h <= a.y) {
				// 戻る辺: 図の右の外側を回る
				lanes++;
				const lane = farX + 30 * lanes;
				ports = "exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=1;entryY=0.5;entryDx=0;entryDy=0;";
				points = `<Array as="points"><mxPoint x="${lane}" y="${a.y + a.h / 2}"/><mxPoint x="${lane}" y="${b.y + b.h / 2}"/></Array>`;
			} else if (direction === "right" && b.x + b.w <= a.x) {
				lanes++;
				const lane = farY + 30 * lanes;
				ports = "exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;";
				points = `<Array as="points"><mxPoint x="${a.x + a.w / 2}" y="${lane}"/><mxPoint x="${b.x + b.w / 2}" y="${lane}"/></Array>`;
			}
		}
		cells.push(
			`<mxCell id="${escapeXml(id)}" value="${escapeXml(htmlLabel(e.label ?? ""))}" style="${escapeXml(edgeStyle(e, ports))}" edge="1" parent="1" source="${escapeXml(e.from)}" target="${escapeXml(e.to)}">${points ? `<mxGeometry relative="1" as="geometry">${points}</mxGeometry>` : `<mxGeometry relative="1" as="geometry"/>`}</mxCell>`,
		);
	});
	const name = page.name ?? `Page-${pageIndex + 1}`;
	return `<diagram id="page-${pageIndex + 1}" name="${escapeXml(name)}"><mxGraphModel dx="800" dy="600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells.join("")}</root></mxGraphModel></diagram>`;
}

/** spec から編集用 XML を作る */
export function buildXml(pages: PageSpec[]): string {
	const body = pages.map((p, i) => pageXml(p, i, pages.length > 1 ? `pages[${i}]` : "ページ")).join("");
	return `<mxfile host="pkm-kit" agent="pkm-drawio-cli" version="1">${body}</mxfile>`;
}
