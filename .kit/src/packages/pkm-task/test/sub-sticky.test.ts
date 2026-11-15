import { describe, expect, it } from "vitest";
import { pickSticky } from "../src/core/sub-sticky";

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
