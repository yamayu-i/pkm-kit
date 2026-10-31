import { describe, expect, it } from "vitest";
import { contrastRatio, formatRatio, over, parseHex, stack, toHex } from "../src/color.ts";

describe("color", () => {
	it("WCAG の定義どおりのコントラスト比", () => {
		expect(contrastRatio(parseHex("#000"), parseHex("#fff"))).toBeCloseTo(21, 5);
		expect(contrastRatio(parseHex("#fff"), parseHex("#fff"))).toBe(1);
		// よく知られた境界: #767676 は白の上で 4.54、#777777 は 4.48
		expect(formatRatio(contrastRatio(parseHex("#767676"), parseHex("#ffffff")))).toBe("4.54");
		expect(contrastRatio(parseHex("#777777"), parseHex("#ffffff"))).toBeLessThan(4.5);
	});

	it("半透明の色は下に重ねてから測る", () => {
		const half = parseHex("#00000080");
		expect(half.a).toBeCloseTo(128 / 255);
		const mixed = over(half, parseHex("#ffffff"));
		expect(toHex(mixed)).toBe("#7f7f7f");
		expect(contrastRatio(half, parseHex("#ffffff"))).toBeCloseTo(contrastRatio(mixed, parseHex("#ffffff")));
		expect(toHex(stack([parseHex("#ffffff"), parseHex("#00000080")]))).toBe("#7f7f7f");
	});

	it("一番下が半透明なら重ねられない", () => {
		expect(() => stack([parseHex("#00000080")])).toThrow();
		expect(() => contrastRatio(parseHex("#000"), parseHex("#ffffff80"))).toThrow();
	});

	it("書式", () => {
		expect(toHex(parseHex("#abc"))).toBe("#aabbcc");
		expect(() => parseHex("red")).toThrow();
		expect(formatRatio(4.499)).toBe("4.49");
	});
});
