import { describe, expect, it } from "vitest";
import { diagram } from "../../design/generated/tokens.ts";
import { d2Preamble } from "../src/core/d2.ts";
import { checkPlainSvg, COLOR_NAMES, DARK_ID, darkenSvg, DEFS_ID, minTextSize, shownTextPx, STYLE_ID, styleSvg, tooSmallToRead } from "../src/core/plain-svg.ts";

const SIMPLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" width="400" height="120">
  <g class="node blue"><rect x="10" y="10" width="120" height="40" rx="8"/><text x="70" y="30" class="center">あ</text></g>
  <path class="edge dashed" d="M130,30 H200"/>
  <text x="165" y="20" class="label center">ラベル</text>
</svg>
`;

describe("styleSvg（ADR-0102）", () => {
	it("ルートの直後にスタイルと矢印を差し込み、ライトとダークの配色を持つ", () => {
		const out = styleSvg(SIMPLE);
		expect(out.indexOf(`<style id="${STYLE_ID}">`)).toBeGreaterThan(out.indexOf("<svg"));
		expect(out).toContain(`<defs id="${DEFS_ID}">`);
		expect(out).toContain(diagram.light.colors.blue.fill);
		expect(out).toContain(diagram.dark.colors.blue.fill);
		expect(out).toContain("@media (prefers-color-scheme: dark)");
		for (const name of COLOR_NAMES) expect(out).toContain(`id="pkm-arrow-${name}"`);
	});

	it("何度実行しても同じ結果（前に差し込んだものを除いてから差し込む）", () => {
		const once = styleSvg(SIMPLE);
		expect(styleSvg(once)).toBe(once);
	});

	it("差し込んだ結果は検査を通る（色の値は差し込んだスタイルの中だけ）", () => {
		const r = checkPlainSvg(styleSvg(SIMPLE));
		expect(r.errors).toEqual([]);
		expect(r.warnings).toEqual([]);
		expect(r.width).toBe(400);
		expect(r.minTextPx).toBe(12);
	});
});

describe("checkPlainSvg", () => {
	it("スクリプト・イベント属性・foreignObject・外部の読み込みを誤りにする", () => {
		const bad = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><script>x</script><rect onclick="x"/><foreignObject/><image href="https://example.com/a.png"/></svg>`;
		const r = checkPlainSvg(bad, { allowColors: true });
		expect(r.errors.join("\n")).toMatch(/<script>/);
		expect(r.errors.join("\n")).toMatch(/on\*/);
		expect(r.errors.join("\n")).toMatch(/foreignObject/);
		expect(r.errors.join("\n")).toMatch(/外部の画像/);
	});

	it("色の値と独自の style を誤りにする。none・currentColor・url(#…) はよい。allowColors なら色の値を許す", () => {
		const svg = `<svg viewBox="0 0 10 10"><rect fill="#ff0000"/><rect style="stroke: red"/><rect fill="none" stroke="currentColor"/><path fill="url(#g)"/></svg>`;
		const r = checkPlainSvg(svg);
		expect(r.errors.join("\n")).toMatch(/fill="#ff0000"/);
		expect(r.errors.join("\n")).toMatch(/style の stroke: red/);
		expect(r.errors.join("\n")).not.toMatch(/none|currentColor|url/);
		expect(checkPlainSvg(svg, { allowColors: true }).errors).toEqual([]);
		expect(checkPlainSvg(`<svg viewBox="0 0 10 10"><style>rect{fill:red}</style></svg>`).errors.join()).toMatch(/独自の <style>/);
	});

	it("ノートの幅に縮めると文字が小さすぎる図を警告し、幅の目安を出す", () => {
		const wide = `<svg viewBox="0 0 2000 100"><text x="0" y="50">あ</text></svg>`;
		const r = checkPlainSvg(wide);
		expect(r.errors).toEqual([]);
		expect(r.minTextPx).toBeCloseTo(13 * (700 / 2000));
		expect(r.warnings.join()).toMatch(/1011px 以下/);
	});

	it("幅のない図を誤りにする", () => {
		expect(checkPlainSvg(`<svg><text>あ</text></svg>`).errors.join()).toMatch(/viewBox か width/);
	});
});

describe("darkenSvg と D2 のテーマ", () => {
	it("配色のライトの値の属性を、ダークのときにダークの値にする CSS を足す。何度実行しても同じ結果", () => {
		const svg = `<svg viewBox="0 0 10 10"><rect fill="${diagram.light.colors.blue.fill}" stroke="${diagram.light.colors.blue.stroke}"/></svg>`;
		const out = darkenSvg(svg);
		expect(out).toContain(`<style id="${DARK_ID}">`);
		expect(out).toContain(`[fill="${diagram.light.colors.blue.fill}" i] { fill: ${diagram.dark.colors.blue.fill}; }`);
		expect(out).toContain(`[stroke="${diagram.light.colors.blue.stroke}" i] { stroke: ${diagram.dark.colors.blue.stroke}; }`);
		expect(darkenSvg(out)).toBe(out);
		expect(checkPlainSvg(out, { allowColors: true }).errors).toEqual([]);
	});

	it("D2 の前置きは、色の名前ごとのクラスと、ライト・ダークのテーマの上書きを持つ", () => {
		const pre = d2Preamble();
		for (const name of COLOR_NAMES) expect(pre).toContain(`  ${name}: { style: { fill: "${diagram.light.colors[name].fill}"`);
		expect(pre).toContain("layout-engine: elk");
		expect(pre).toContain(`N1: "${diagram.light.neutral.text}"`);
		expect(pre).toContain(`N1: "${diagram.dark.neutral.text}"`);
		expect(d2Preamble("dagre")).toContain("layout-engine: dagre");
	});
});

describe("縮めすぎて読めない図（ADR-0102 の段階 3）", () => {
	it("いちばん小さい文字の大きさを、font-size・クラス・既定から出す。文字がなければ null", () => {
		expect(minTextSize(styleSvg(SIMPLE))).toBe(12);
		expect(minTextSize('<svg viewBox="0 0 10 10"><text font-size="20">a</text><text class="small">b</text></svg>')).toBe(11);
		expect(minTextSize('<svg viewBox="0 0 10 10"><rect/></svg>')).toBeNull();
	});

	it("縮めた幅に比例して文字が小さくなり、9px 未満なら読めない。拡大して出す図と文字のない図は読める", () => {
		expect(shownTextPx(13, 2000, 700)).toBeCloseTo(4.55);
		expect(tooSmallToRead(13, 2000, 700)).toBe(true);
		expect(tooSmallToRead(13, 1000, 700)).toBe(false);
		expect(tooSmallToRead(13, 500, 700)).toBe(false);
		expect(tooSmallToRead(null, 2000, 100)).toBe(false);
		expect(tooSmallToRead(13, 0, 100)).toBe(false);
	});
});
