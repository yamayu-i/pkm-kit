import { describe, expect, it } from "vitest";
import { pickSticky, toggleScrollDelta } from "../src/core/sub-sticky";

describe("pickSticky", () => {
	const regions = [
		{ top: 0, bottom: 500 },
		{ top: 600, bottom: 1200 },
	];

	it("題の行が上端に届くまでは浮かべない", () => {
		expect(pickSticky(regions, 0, 44)).toBeNull();
		expect(pickSticky(regions, -10, 44)).toBeNull();
	});

	it("題の行が上端を越え、本文が続く間は上端に固定する", () => {
		expect(pickSticky(regions, 100, 44)).toEqual({ index: 0, offset: 0 });
		expect(pickSticky(regions, 700, 44)).toEqual({ index: 1, offset: 0 });
	});

	it("本文の終わりが近づくと、行を上へ押し出す", () => {
		expect(pickSticky(regions, 476, 44)).toEqual({ index: 0, offset: -20 });
	});

	it("本文の終わりを越えたら浮かべない（サブの間でも）", () => {
		expect(pickSticky(regions, 500, 44)).toBeNull();
		expect(pickSticky(regions, 550, 44)).toBeNull();
		expect(pickSticky(regions, 1300, 44)).toBeNull();
	});

	it("上端の位置が不明（画面の外）でも、本文が上端をまたげば選ぶ", () => {
		expect(pickSticky([{ top: -Infinity, bottom: Infinity }], 100, 44)).toEqual({ index: 0, offset: 0 });
	});
});

describe("toggleScrollDelta（ADR-0179）", () => {
	it("題の行から開閉したら、題の行の位置を保つ", () => {
		expect(toggleScrollDelta(300, 300, 0, false)).toBe(0);
		expect(toggleScrollDelta(300, 120, 0, false)).toBe(-180);
		expect(toggleScrollDelta(300, 420, 0, false)).toBe(120);
	});

	it("1px 未満のずれは直さない", () => {
		expect(toggleScrollDelta(300, 300.4, 0, false)).toBe(0);
	});

	it("浮かんだ行から閉じたら、題を上端に出す", () => {
		expect(toggleScrollDelta(40, -800, 40, true)).toBe(-840);
		expect(toggleScrollDelta(40, 40, 40, true)).toBe(0);
	});
});
