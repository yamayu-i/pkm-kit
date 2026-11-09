import { describe, expect, it } from "vitest";
import { readTokens } from "../node/build.ts";
import { contrastRatio, parseHex } from "../src/color.ts";
import { DIAGRAM_COLORS, diagramPalette, mermaidCss } from "../src/diagram.ts";
import { MODES } from "../src/tokens.ts";

const tokens = readTokens();

describe("図の配色（ADR-0102）", () => {
	for (const mode of MODES) {
		it(`${mode}: 色の面の上の文字は 4.5:1 以上、ノードの文字も 4.5:1 以上`, () => {
			const p = diagramPalette(tokens, mode);
			for (const name of DIAGRAM_COLORS) {
				const c = p.colors[name];
				expect(contrastRatio(parseHex(c.text), parseHex(c.fill)), name).toBeGreaterThanOrEqual(4.5);
			}
			expect(contrastRatio(parseHex(p.neutral.text), parseHex(p.neutral.nodeFill))).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(parseHex(p.neutral.text), parseHex(p.neutral.groupFill))).toBeGreaterThanOrEqual(4.5);
		});
	}

	it("Mermaid の CSS は、ライトとダークのすべての色の名前を持ち、Mermaid の色を上書きする", () => {
		const css = mermaidCss(tokens);
		for (const mode of MODES) for (const name of DIAGRAM_COLORS) expect(css).toContain(`body.theme-${mode} .mermaid .node.${name} rect`);
		expect(css).toContain("!important");
	});
});
