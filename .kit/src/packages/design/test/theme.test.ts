import { describe, expect, it } from "vitest";
import { readTokens } from "../node/build.ts";
import { toHex } from "../src/color.ts";
import { resolveColor } from "../src/tokens.ts";
import { applyTheme, checkTheme, parseTheme, themeAccent, themeSnippet, vaultColorNames } from "../src/theme.ts";

const base = readTokens();
const hex = (tokens: typeof base, name: string, mode: "light" | "dark") => toHex(resolveColor(tokens, `color.${name}`, mode));

/** 規約を満たす上書き（アクセントを緑寄りの青にし、ライトの面を少し青くする） */
const good = {
	light: { primary: "#00639b", surface: "#f4f6f8", "surface-container": "#eceff2", "surface-container-high": "#e4e8ec" },
	dark: { primary: "#8fcdff", "on-primary": "#00344f" },
};

describe("vaultColorNames", () => {
	it("基本の色だけを上書きできる", () => {
		const names = vaultColorNames(base);
		expect(names).toEqual(
			expect.arrayContaining(["surface", "surface-container", "surface-container-high", "on-surface", "on-surface-variant", "outline", "primary", "on-primary", "secondary-container", "on-secondary-container", "text-faint"]),
		);
		for (const fixed of ["green", "green-container", "error", "due-0", "scheduled", "on-label", "state-hover", "focus-ring"]) expect(names).not.toContain(fixed);
	});
});

describe("parseTheme", () => {
	it("正しいものを読む", () => {
		const { theme, errors } = parseTheme(good, base);
		expect(errors).toEqual([]);
		expect(theme.light.primary).toBe("#00639b");
		expect(theme.dark["on-primary"]).toBe("#00344f");
	});

	const broken: [string, unknown, RegExp][] = [
		["オブジェクトでない", [], /オブジェクト/],
		["知らないモード", { sepia: {} }, /sepia/],
		["上書きできない色（状態の色）", { light: { green: "#00ff00" } }, /green.*上書きできません/],
		["上書きできない色（追従する色）", { light: { "state-hover": "#00000014" } }, /state-hover.*上書きできません/],
		["16 進でない", { light: { primary: "blue" } }, /#rrggbb/],
		["半透明", { light: { primary: "#6750a480" } }, /#rrggbb/],
	];
	for (const [name, json, re] of broken) {
		it(`誤り: ${name}`, () => {
			const { errors } = parseTheme(json, base);
			expect(errors.join("\n")).toMatch(re);
		});
	}
});

describe("applyTheme", () => {
	it("上書きした色を変え、書いていない色は上流のまま", () => {
		const themed = applyTheme(base, parseTheme(good, base).theme);
		expect(hex(themed, "primary", "light")).toBe("#00639b");
		expect(hex(themed, "primary", "dark")).toBe("#8fcdff");
		expect(hex(themed, "on-surface", "light")).toBe(hex(base, "on-surface", "light"));
		expect(hex(themed, "surface", "dark")).toBe(hex(base, "surface", "dark"));
		expect(hex(themed, "green", "light")).toBe(hex(base, "green", "light"));
	});

	it("derive の色と別名は、元の色に追従する（透明度はそのまま）", () => {
		const themed = applyTheme(base, parseTheme({ light: { "on-surface": "#1a2233", primary: "#00639b" } }, base).theme);
		const hover = resolveColor(themed, "color.state-hover", "light");
		expect(toHex({ ...hover, a: 1 })).toBe("#1a2233");
		expect(hover.a).toBeCloseTo(resolveColor(base, "color.state-hover", "light").a, 4);
		expect(toHex({ ...resolveColor(themed, "color.outline-variant", "light"), a: 1 })).toBe("#1a2233");
		expect(toHex({ ...resolveColor(themed, "color.primary-state-hover", "light"), a: 1 })).toBe("#00639b");
		expect(hex(themed, "focus-ring", "light")).toBe("#00639b");
		// ダークは変えていない
		expect(hex(themed, "state-hover", "dark")).toBe(hex(base, "state-hover", "dark"));
	});

	it("元の tokens を変えない", () => {
		applyTheme(base, parseTheme(good, base).theme);
		expect(hex(base, "primary", "light")).toBe("#6750a4");
	});
});

describe("checkTheme", () => {
	const problems = (json: unknown) => checkTheme(applyTheme(base, parseTheme(json, base).theme));

	it("上流の値と、規約を満たす上書きは通る", () => {
		expect(checkTheme(base)).toEqual([]);
		expect(problems(good)).toEqual([]);
	});

	it("文字のコントラスト不足を拒む", () => {
		expect(problems({ light: { primary: "#b39ddb" } }).join("\n")).toMatch(/primary（ライト）.*< 4\.5/);
	});

	it("面を変えて、変えられない状態の色の印が 3:1 を割るなら拒む", () => {
		// 濃い面にすると、ライトの green（#1e8e3e）が 3:1 を割る
		const p = problems({ light: { surface: "#9e9e9e", "surface-container": "#9a9a9a", "surface-container-high": "#969696" } }).join("\n");
		expect(p).toMatch(/green（ライト）/);
	});

	it("on-surface を変えて、状態の面に重ねたホバーでも確かめる", () => {
		// on-surface を明るくすると state-hover も明るくなり、本文の 7:1 も割る
		expect(problems({ light: { "on-surface": "#9a9a9a" } }).join("\n")).toMatch(/on-surface（ライト）/);
	});

	it("面の明るさの段差が逆なら拒む", () => {
		const p = problems({ light: { surface: "#e8e7e2", "surface-container-high": "#f6f5f2" } }).join("\n");
		expect(p).toMatch(/面の段差（ライト）/);
		const d = problems({ dark: { surface: "#2b2b2b", "surface-container-high": "#1e1e1e" } }).join("\n");
		expect(d).toMatch(/面の段差（ダーク）/);
	});
});

describe("themeSnippet", () => {
	it("変わった色だけを、プラグインの変数と Obsidian 本体の変数の両方に書く", () => {
		const themed = applyTheme(base, parseTheme({ light: { primary: "#00639b" } }, base).theme);
		const css = themeSnippet(base, themed);
		expect(css).toContain("html body.theme-light {");
		expect(css).not.toContain("html body.theme-dark {");
		expect(css).toMatch(/\t--vt-primary: #00639b;/);
		expect(css).toMatch(/\t--vt-primary-state-hover: #00639b14;/);
		expect(css).toMatch(/\t--interactive-accent: #00639b;/);
		expect(css).toMatch(/\t--color-accent: #00639b;/);
		// 別名（focus-ring）は var() で追従するので書かない。変わっていない色も書かない
		expect(css).not.toContain("--vt-focus-ring");
		expect(css).not.toContain("--vt-surface:");
		expect(css).toMatch(/^\/\* 生成物。手で編集しない。正本は \.kit-local\/theme\.json/);
	});

	it("プラグインで使わない色（text-faint）は Obsidian 本体の変数だけに書く", () => {
		const themed = applyTheme(base, parseTheme({ dark: { "text-faint": "#9e9e9e" } }, base).theme);
		const css = themeSnippet(base, themed);
		expect(css).toContain("html body.theme-dark {");
		expect(css).toMatch(/\t--text-faint: #9e9e9e;/);
		expect(css).not.toContain("--vt-text-faint");
	});

	it("何も変えていなければ、規則を書かない", () => {
		expect(themeSnippet(base, base)).not.toContain("{");
	});
});

describe("themeAccent", () => {
	it("Obsidian の accentColor は、上書き後のライトの primary", () => {
		expect(themeAccent(base)).toBe("#6750a4");
		expect(themeAccent(applyTheme(base, parseTheme(good, base).theme))).toBe("#00639b");
	});
});
