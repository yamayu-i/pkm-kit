import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { decodeDataUri, svgDataUri, utf8 } from "../src/core/encoding.ts";
import { findSvgProblems, isDiagramSvgPath, parseRootSvg, SvgFormatError, toSharingSvg } from "../src/core/svg.ts";

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
/** 以前の Draw.io の図（ルートの content に編集用 XML を持つ。ADR-0111 で普通の SVG の図として扱う） */
const DIAGRAM = fixture("two-pages.drawio.svg");

describe("isDiagramSvgPath", () => {
	it(".svg（以前の .drawio.svg を含む）を図とする。名前のない .svg と、ほかの拡張子は図としない", () => {
		expect(isDiagramSvgPath("asset/a.svg")).toBe(true);
		expect(isDiagramSvgPath("asset/A.SVG")).toBe(true);
		expect(isDiagramSvgPath("asset/a.drawio.svg")).toBe(true);
		expect(isDiagramSvgPath("asset/a.png")).toBe(false);
		expect(isDiagramSvgPath("asset/.svg")).toBe(false);
	});
});

describe("parseRootSvg", () => {
	it("XML 宣言・コメント・DOCTYPE を飛ばしてルートの属性を読む", () => {
		const root = parseRootSvg(DIAGRAM);
		expect(root.attributes.map((a) => a.name)).toEqual(["xmlns", "xmlns:xlink", "version", "width", "height", "viewBox", "content"]);
		expect(DIAGRAM.slice(root.end - 1, root.end)).toBe(">");
	});

	it("BOM と単一引用符と自己終了のタグを読む", () => {
		const root = parseRootSvg("﻿<svg a='1' b=\"2\"/>");
		expect(root.attributes.map((a) => [a.name, a.raw])).toEqual([
			["a", "1"],
			["b", "2"],
		]);
	});

	it.each([
		["ルートが svg ではない", "<html></html>"],
		["DOCTYPE の実体の宣言", '<!DOCTYPE svg [<!ENTITY x "y">]><svg></svg>'],
		["閉じていない属性", '<svg a="1'],
		["引用符のない値", "<svg a=1>"],
		["重複した属性", '<svg a="1" a="2">'],
		["空白のない属性", '<svg a="1"b="2">'],
	])("%s はエラー", (_, text) => {
		expect(() => parseRootSvg(text)).toThrow(SvgFormatError);
	});
});

describe("toSharingSvg", () => {
	it("content 属性だけを除き、ほかのバイトは変えない", () => {
		const sharing = toSharingSvg(DIAGRAM);
		expect(sharing).not.toContain("content=");
		expect(sharing).not.toContain("mxfile");
		const root = parseRootSvg(DIAGRAM);
		const content = root.attributes.find((a) => a.name === "content");
		expect(content).toBeDefined();
		expect(sharing).toBe(DIAGRAM.slice(0, content?.start) + DIAGRAM.slice(content?.end));
		expect(parseRootSvg(sharing).attributes.some((a) => a.name === "content")).toBe(false);
	});

	it("同じ図からは同じバイト列（決定的）、2 回かけても同じ", () => {
		expect(toSharingSvg(DIAGRAM)).toBe(toSharingSvg(DIAGRAM));
		expect(toSharingSvg(toSharingSvg(DIAGRAM))).toBe(toSharingSvg(DIAGRAM));
	});

	it("普通の SVG はそのまま", () => {
		expect(toSharingSvg(fixture("plain.svg"))).toBe(fixture("plain.svg"));
	});
});

describe("findSvgProblems", () => {
	it("以前の Draw.io の SVG（foreignObject、図の中のリンク、名前空間の URL）は問題なし", () => {
		expect(findSvgProblems(toSharingSvg(DIAGRAM))).toEqual({ errors: [], warnings: [] });
	});

	it.each([
		["<script>", '<svg><script>alert(1)</script></svg>'],
		["名前空間付きの script", '<svg><svg:script>x</svg:script></svg>'],
		["イベント属性", '<svg onload="alert(1)"></svg>'],
		["javascript: の URL", '<svg><a href=" &#106;ava&#x09;script&colon;alert(1)"></a></svg>'],
		["foreignObject の中の iframe", "<svg><foreignObject><iframe/></foreignObject></svg>"],
		["実体の宣言", '<!DOCTYPE svg [<!ENTITY a "b">]><svg></svg>'],
	])("%s はエラー", (_, svg) => {
		expect(findSvgProblems(svg).errors.length).toBeGreaterThan(0);
	});

	it.each([
		["外部の画像", '<svg><image href="https://example.com/a.png"/></svg>'],
		["外部の use", '<svg><use xlink:href="//example.com/a.svg#x"/></svg>'],
		["属性の url()", '<svg><rect style="fill:url(https://example.com/a)"/></svg>'],
		["style の @import", "<svg><style>@import url(x.css);</style></svg>"],
		["style の url()", "<svg><style>.a{background:url('https://example.com/a.png')}</style></svg>"],
	])("%s は警告", (_, svg) => {
		const p = findSvgProblems(svg);
		expect(p.errors).toEqual([]);
		expect(p.warnings.length).toBeGreaterThan(0);
	});
});

describe("data URI", () => {
	it("日本語を含む SVG を UTF-8 の base64 にし、戻せる", () => {
		const svg = toSharingSvg(DIAGRAM);
		const uri = svgDataUri(svg);
		expect(uri.startsWith("data:image/svg+xml;base64,")).toBe(true);
		const decoded = decodeDataUri(uri);
		expect(decoded?.mime).toBe("image/svg+xml");
		expect(decoded && utf8(decoded.bytes)).toBe(svg);
	});

	it("base64 でない data URI も読む。壊れたものは null", () => {
		const d = decodeDataUri("data:image/svg+xml;charset=utf-8,%3Csvg%3E");
		expect(d && utf8(d.bytes)).toBe("<svg>");
		expect(decodeDataUri("https://example.com")).toBeNull();
		expect(decodeDataUri("data:image/svg+xml;base64,@@@")).toBeNull();
	});
});
