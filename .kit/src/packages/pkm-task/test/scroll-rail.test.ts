import { describe, expect, it } from "vitest";
import { railScrollFor, railThumb } from "../src/ui/ScrollRail";

describe("ScrollRail", () => {
	it("はみ出していなければつまみを出さない", () => {
		expect(railThumb(0, 500, 500, 500)).toBeNull();
		expect(railThumb(0, 1000, 500, 0)).toBeNull();
	});

	it("つまみの幅は見えている割合で、左端はスクロールの位置に比例する", () => {
		expect(railThumb(0, 1000, 500, 500)).toEqual({ left: 0, width: 250 });
		expect(railThumb(500, 1000, 500, 500)).toEqual({ left: 250, width: 250 });
		expect(railThumb(250, 1000, 500, 500)).toEqual({ left: 125, width: 250 });
	});

	it("つまみは最小 24px で、端を越えない", () => {
		expect(railThumb(0, 100000, 500, 500)?.width).toBe(24);
		expect(railThumb(99500, 100000, 500, 500)).toEqual({ left: 476, width: 24 });
		expect(railThumb(-10, 1000, 500, 500)?.left).toBe(0);
	});

	it("つまみを動かした量を、スクロールの量に直す", () => {
		// 溝 500・つまみ 250 なら、つまみの 1px はスクロールの 2px
		expect(railScrollFor(100, 50, 1000, 500, 500, 250)).toBe(200);
		expect(railScrollFor(100, 50, 1000, 500, 250, 250)).toBe(100);
	});
});
