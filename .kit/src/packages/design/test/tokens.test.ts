import { describe, expect, it } from "vitest";
import { loadTokens, resolveColor } from "../src/tokens.ts";

const X = "com.yamayu-pkm";
const c = (hex: string, alpha?: number) => {
	const n = (i: number) => +(Number.parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(4);
	return { colorSpace: "srgb", components: [n(1), n(3), n(5)], ...(alpha === undefined ? {} : { alpha }), hex };
};
const base = () => ({
	color: {
		$type: "color",
		bg: { $value: c("#ffffff"), $extensions: { [X]: { role: "surface", dark: c("#000000") } } },
		fg: { $value: c("#222222"), $extensions: { [X]: { role: "text", dark: c("#dddddd"), contrast: { min: 4.5, on: ["{color.bg}"] } } } },
	},
});

describe("loadTokens", () => {
	it("正しいものを読み、別名とダークをたどる", () => {
		const json = base() as any;
		json.color.alias = { $value: "{color.fg}", $extensions: { [X]: { role: "decorative" } } };
		const tokens = loadTokens(json);
		expect(tokens.map((t) => t.cssVar)).toEqual(["--vt-bg", "--vt-fg", "--vt-alias"]);
		expect(resolveColor(tokens, "color.alias", "dark").r).toBe(0xdd);
	});

	it("vault と derive を読む", () => {
		const json = base() as any;
		json.color.bg.$extensions[X].vault = true;
		json.color.hover = { $value: c("#222222", 0.08), $extensions: { [X]: { role: "state", dark: c("#dddddd", 0.08), derive: "{color.fg}" } } };
		const tokens = loadTokens(json);
		expect(tokens.find((t) => t.path === "color.bg")?.vault).toBe(true);
		expect(tokens.find((t) => t.path === "color.fg")?.vault).toBe(false);
		expect(tokens.find((t) => t.path === "color.hover")?.derive).toBe("color.fg");
	});

	const broken: [string, (j: any) => void, RegExp][] = [
		["role がない", (j) => delete j.color.bg.$extensions, /role/],
		["text の下限より低い min", (j) => (j.color.fg.$extensions[X].contrast.min = 3), /4\.5 以上/],
		["text なのに contrast がない", (j) => delete j.color.fg.$extensions[X].contrast, /contrast を書いて/],
		["components と hex が合わない", (j) => (j.color.bg.$value.components = [1, 1, 0.5]), /合いません/],
		["別名の参照先がない", (j) => (j.color.fg.$value = "{color.nothing}"), /ありません/],
		["別名の循環", (j) => {
			j.color.a = { $value: "{color.b}", $extensions: { [X]: { role: "decorative" } } };
			j.color.b = { $value: "{color.a}", $extensions: { [X]: { role: "decorative" } } };
		}, /循環/],
		["contrast.on の一番下が半透明", (j) => (j.color.bg.$value = c("#ffffff", 0.5)), /不透明/],
		["知らない拡張", (j) => (j.color.bg.$extensions[X].foo = 1), /知らない拡張/],
		["$type がない", (j) => (j.size = { a: { $value: 1 } }), /\$type/],
		["derive の参照先がない", (j) => (j.color.hover = { $value: c("#222222", 0.08), $extensions: { [X]: { role: "state", derive: "{color.none}" } } }), /derive の参照先/],
		["derive の色が元と合わない", (j) => (j.color.hover = { $value: c("#333333", 0.08), $extensions: { [X]: { role: "state", dark: c("#dddddd", 0.08), derive: "{color.fg}" } } }), /derive の元.*合いません/],
		["vault を別名に付ける", (j) => (j.color.alias = { $value: "{color.fg}", $extensions: { [X]: { role: "decorative", vault: true } } }), /vault/],
		["vault が真偽でない", (j) => (j.color.bg.$extensions[X].vault = "yes"), /vault/],
		["dimension の単位", (j) => (j.size = { $type: "dimension", a: { $value: { value: 1, unit: "em" } } }), /dimension/],
	];
	for (const [name, mutate, re] of broken) {
		it(`誤り: ${name}`, () => {
			const json = base();
			mutate(json);
			expect(() => loadTokens(json)).toThrow(re);
		});
	}
});
