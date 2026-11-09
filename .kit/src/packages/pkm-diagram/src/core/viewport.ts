/**
 * 図の拡大表示（ADR-0102）の拡大率と位置の計算。DOM に依存しない。
 * 表示は `translate(x, y) scale(scale)`（原点は左上）で、図の座標 p は画面の x + p * scale に出る
 */

export interface View {
	scale: number;
	x: number;
	y: number;
}

export interface Size {
	width: number;
	height: number;
}

export interface Point {
	x: number;
	y: number;
}

export const MIN_SCALE = 0.05;
export const MAX_SCALE = 8;
/** 全体を表示するときに、小さい図を拡大する上限 */
export const FIT_MAX_SCALE = 2;
/** 全体を表示するときの周りの余白（px） */
export const FIT_PADDING = 16;
/** ボタンとキーで拡大・縮小する倍率 */
export const ZOOM_STEP = 1.25;

export function clampScale(scale: number): number {
	if (!Number.isFinite(scale) || scale <= 0) return MIN_SCALE;
	return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/** 図を真ん中に置く */
function centered(content: Size, stage: Size, scale: number): View {
	return { scale, x: (stage.width - content.width * scale) / 2, y: (stage.height - content.height * scale) / 2 };
}

/** 全体を表示する（余白を残して収める。小さい図は FIT_MAX_SCALE まで拡大する） */
export function fit(content: Size, stage: Size, padding = FIT_PADDING): View {
	if (content.width <= 0 || content.height <= 0) return { scale: 1, x: 0, y: 0 };
	const w = Math.max(1, stage.width - 2 * padding);
	const h = Math.max(1, stage.height - 2 * padding);
	return centered(content, stage, clampScale(Math.min(w / content.width, h / content.height, FIT_MAX_SCALE)));
}

/** 100%（図の 1px が画面の 1px）。図が画面より大きければ、左上（の余白の内側）から見せる */
export function actualSize(content: Size, stage: Size, padding = FIT_PADDING): View {
	const v = centered(content, stage, 1);
	return { scale: 1, x: content.width > stage.width ? padding : v.x, y: content.height > stage.height ? padding : v.y };
}

/** 画面の点 at を動かさずに、拡大率を factor 倍にする */
export function zoomAt(view: View, factor: number, at: Point): View {
	const scale = clampScale(view.scale * factor);
	const k = scale / view.scale;
	return { scale, x: at.x - (at.x - view.x) * k, y: at.y - (at.y - view.y) * k };
}

export function pan(view: View, dx: number, dy: number): View {
	return { scale: view.scale, x: view.x + dx, y: view.y + dy };
}

function distance(a: Point, b: Point): number {
	return Math.hypot(a.x - b.x, a.y - b.y);
}

function middle(a: Point, b: Point): Point {
	return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * ピンチ。2 本の指を置いたときの表示 start と指の位置 a0・b0 から、今の指の位置 a・b での表示を出す。
 * 指の間の距離の比で拡大し、指の真ん中に図の同じ点が来るようにする
 */
export function pinch(start: View, a0: Point, b0: Point, a: Point, b: Point): View {
	const d0 = distance(a0, b0);
	if (d0 === 0) return start;
	const m0 = middle(a0, b0);
	const m = middle(a, b);
	const zoomed = zoomAt(start, distance(a, b) / d0, m0);
	return pan(zoomed, m.x - m0.x, m.y - m0.y);
}

/** ホイールの量（deltaY）を倍率にする。上に回すと拡大 */
export function wheelFactor(deltaY: number, deltaMode = 0): number {
	const px = deltaMode === 1 ? deltaY * 16 : deltaMode === 2 ? deltaY * 400 : deltaY;
	return Math.exp(-Math.max(-200, Math.min(200, px)) * 0.002);
}
