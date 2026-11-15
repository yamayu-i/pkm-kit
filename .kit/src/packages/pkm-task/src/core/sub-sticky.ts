/**
 * 開いたサブの題の行を、スクロールの上端に固定する（ADR-0161 の追記）。
 * カードと本文は兄弟の要素で、画面外の要素は DOM から外れるので、CSS の sticky では本文の終わりで止められない。
 * 位置（同じ座標系の数値）から、浮かべるサブと、上へ押し出す量を決める
 */
export interface StickyRegion {
	/** 題の行の上端（カードの上端） */
	top: number;
	/** そのサブの本文の下端 */
	bottom: number;
}

export interface StickyPick {
	index: number;
	/** 上端からのずれ（0 以下）。本文の終わりが近づくと、行を上へ押し出す */
	offset: number;
}

/** edge はスクロール領域の上端。題の行が上端より上へ抜け、本文の下端がまだ上端より下にあるサブを選ぶ */
export function pickSticky(regions: readonly StickyRegion[], edge: number, rowHeight: number): StickyPick | null {
	let pick: StickyPick | null = null;
	regions.forEach((r, index) => {
		if (r.top < edge && r.bottom > edge) pick = { index, offset: Math.min(0, r.bottom - edge - rowHeight) };
	});
	return pick;
}

/**
 * 開閉のあとに足すスクロールの量（ADR-0179）。before / after は、開閉の前と後の題の行の上端（画面の座標）、edge はスクロール領域の上端。
 * - 題の行から開閉したとき: 題の行の位置を保つ（ずれた分だけ戻す）
 * - 上端に浮かんだ行から閉じたとき（floating）: 題を上端に出す
 */
export function toggleScrollDelta(before: number, after: number, edge: number, floating: boolean): number {
	const delta = floating ? after - edge : after - before;
	return Math.abs(delta) < 1 ? 0 : delta;
}
