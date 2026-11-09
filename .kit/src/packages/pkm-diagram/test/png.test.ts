import { describe, expect, it } from "vitest";
import { diagram } from "../../design/generated/tokens.ts";
import { cssColorToHex, darkToLightColors, forceLightSvg, pngFileName, saveMethods, stripDarkMedia } from "../src/core/png.ts";
import { darkenSvg, styleSvg } from "../src/core/plain-svg.ts";

describe("PNG をライトの色で作る（ADR-0102）", () => {
	it("ダークの @media の塊だけを除き、入れ子の括弧も扱う", () => {
		const css = "a{fill:red}\n@media (prefers-color-scheme: dark) {\n  a { fill: blue; }\n  b { stroke: green; }\n}\nc{fill:x}\n@media screen and (prefers-color-scheme:dark){.f{fill:#000}}\n@media print{d{e:f}}";
		expect(stripDarkMedia(css)).toBe("a{fill:red}\n\nc{fill:x}\n\n@media print{d{e:f}}");
	});

	it("styleSvg と darkenSvg の SVG から、ダークの色の指定がなくなる", () => {
		const svg = darkenSvg(styleSvg('<svg viewBox="0 0 10 10"><g class="node blue"><rect/></g></svg>'));
		const light = forceLightSvg(svg);
		expect(light).not.toMatch(/prefers-color-scheme/);
		expect(light).toContain(diagram.light.colors.blue.fill);
		expect(light).not.toContain(`fill: ${diagram.dark.colors.blue.fill}`);
	});

	it("ダークの配色の値をライトの配色の値に引ける", () => {
		const map = darkToLightColors();
		expect(map.get(diagram.dark.colors.green.fill.toLowerCase())).toBe(diagram.light.colors.green.fill.toLowerCase());
		expect(map.get(diagram.dark.neutral.text.toLowerCase())).toBe(diagram.light.neutral.text.toLowerCase());
	});

	it("CSS の色を #rrggbb にする。透明は null", () => {
		expect(cssColorToHex("rgb(11, 87, 208)")).toBe("#0b57d0");
		expect(cssColorToHex("rgba(11, 87, 208, 0.5)")).toBe("#0b57d0");
		expect(cssColorToHex("rgba(0, 0, 0, 0)")).toBeNull();
		expect(cssColorToHex("#ABC")).toBe("#aabbcc");
		expect(cssColorToHex("none")).toBeNull();
	});
});

describe("PNG の保存", () => {
	it("保存のダイアログ → 共有シート → tmp/ の順。tmp/ はいつも最後にある", () => {
		expect(saveMethods({ picker: true, share: true })).toEqual(["picker", "share", "tmp"]);
		expect(saveMethods({ picker: false, share: true })).toEqual(["share", "tmp"]);
		expect(saveMethods({ picker: false, share: false })).toEqual(["tmp"]);
	});

	it("ファイル名: 図の拡張子を除き、使えない文字を置き換える", () => {
		expect(pngFileName("system-overview.drawio.svg")).toBe("system-overview.png");
		expect(pngFileName("flow.svg")).toBe("flow.png");
		expect(pngFileName("会議: メモ.md")).toBe("会議- メモ.png");
		expect(pngFileName("")).toBe("diagram.png");
	});
});
