import { describe, expect, it } from "vitest";
import { actualSize, clampScale, fit, FIT_MAX_SCALE, MAX_SCALE, MIN_SCALE, pan, pinch, wheelFactor, zoomAt } from "../src/core/viewport.ts";

const stage = { width: 800, height: 600 };

describe("拡大表示の計算（ADR-0102）", () => {
	it("全体を表示: 大きい図は余白を残して収め、真ん中に置く", () => {
		const v = fit({ width: 2000, height: 500 }, stage);
		expect(v.scale).toBeCloseTo((800 - 32) / 2000);
		expect(v.x).toBeCloseTo((800 - 2000 * v.scale) / 2);
		expect(v.y).toBeCloseTo((600 - 500 * v.scale) / 2);
	});

	it("全体を表示: 小さい図は FIT_MAX_SCALE まで拡大する。大きさ 0 の図は 1 倍", () => {
		expect(fit({ width: 100, height: 50 }, stage).scale).toBe(FIT_MAX_SCALE);
		expect(fit({ width: 0, height: 0 }, stage)).toEqual({ scale: 1, x: 0, y: 0 });
	});

	it("100%: 収まる図は真ん中、はみ出す図は左上の余白の内側から", () => {
		expect(actualSize({ width: 400, height: 200 }, stage)).toEqual({ scale: 1, x: 200, y: 200 });
		expect(actualSize({ width: 2000, height: 2000 }, stage)).toEqual({ scale: 1, x: 16, y: 16 });
	});

	it("拡大: 指定した点の下にある図の点は動かない。上限と下限で止まる", () => {
		const v = { scale: 1, x: 10, y: 20 };
		const at = { x: 300, y: 200 };
		const z = zoomAt(v, 2, at);
		const before = { x: (at.x - v.x) / v.scale, y: (at.y - v.y) / v.scale };
		expect((at.x - z.x) / z.scale).toBeCloseTo(before.x);
		expect((at.y - z.y) / z.scale).toBeCloseTo(before.y);
		expect(zoomAt({ scale: MAX_SCALE, x: 0, y: 0 }, 10, at).scale).toBe(MAX_SCALE);
		expect(zoomAt({ scale: MIN_SCALE, x: 0, y: 0 }, 0.01, at).scale).toBe(MIN_SCALE);
		expect(clampScale(Number.NaN)).toBe(MIN_SCALE);
	});

	it("移動とピンチ: 指の間が 2 倍になれば 2 倍に拡大し、指の真ん中に同じ図の点が来る", () => {
		expect(pan({ scale: 2, x: 1, y: 2 }, 10, -5)).toEqual({ scale: 2, x: 11, y: -3 });
		const start = { scale: 1, x: 0, y: 0 };
		const a0 = { x: 100, y: 100 };
		const b0 = { x: 200, y: 100 };
		const v = pinch(start, a0, b0, { x: 50, y: 150 }, { x: 250, y: 150 });
		expect(v.scale).toBeCloseTo(2);
		// 置いたときの真ん中（150, 100）の図の点（150, 100）が、今の真ん中（150, 150）に来る
		expect(v.x + 150 * v.scale).toBeCloseTo(150);
		expect(v.y + 100 * v.scale).toBeCloseTo(150);
		expect(pinch(start, a0, a0, a0, b0)).toBe(start);
	});

	it("ホイール: 上に回すと拡大、下に回すと縮小。行・ページの単位も扱い、極端な量は抑える", () => {
		expect(wheelFactor(-100)).toBeGreaterThan(1);
		expect(wheelFactor(100)).toBeLessThan(1);
		expect(wheelFactor(3, 1)).toBeCloseTo(wheelFactor(48));
		expect(wheelFactor(100000)).toBeCloseTo(wheelFactor(200));
	});
});
