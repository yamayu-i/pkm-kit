import { describe, expect, it } from "vitest";
import { liveVarsCss, slideLiveVars, tokenVarNames } from "../src/core/live-vars.ts";

describe("tokenVarNames", () => {
	it("トークンの CSS から --vt-* の名前を重ねずに取り出す", () => {
		const css = "body {\n\t--vt-surface: #f6f5f2;\n\t--vt-primary: #6750a4;\n\t--vt-focus-ring: var(--vt-primary);\n}\nbody.theme-dark {\n\t--vt-primary: #d0bcff;\n}";
		expect(tokenVarNames(css)).toEqual(["--vt-surface", "--vt-primary", "--vt-focus-ring"]);
	});
});

describe("liveVarsCss（ADR-0129）", () => {
	it("Obsidian で今効いている値を、トークンと同じ強さで両方のテーマに書く", () => {
		const css = liveVarsCss({ "--vt-primary": "#13612f", "--vt-elevation-1": "0 1px 2px 0 #0000004d, 0 1px 3px 1px #00000026" });
		expect(css).toBe("body.theme-light,\nbody.theme-dark {\n\t--vt-primary: #13612f;\n\t--vt-elevation-1: 0 1px 2px 0 #0000004d, 0 1px 3px 1px #00000026;\n}");
	});

	it("空の値と、名前が --vt-* でないものは書かない", () => {
		expect(liveVarsCss({ "--vt-primary": "  ", "--font-text": "serif", color: "red" })).toBe("");
	});

	it("CSS を抜け出せる値や、外を読み込む値は書かない", () => {
		const bad = {
			"--vt-a": "red; } body { background: url(https://example.com/x.png)",
			"--vt-b": "url(https://example.com/x.png)",
			"--vt-c": "#fff</style><script>alert(1)</script>",
			"--vt-d": "\\66 oo",
			"--vt-e": "image-set(\"x.png\" 1x)",
			"--vt-f": "a".repeat(300),
		};
		expect(liveVarsCss({ ...bad, "--vt-ok": "cubic-bezier(0.2, 0, 0, 1)" })).toBe("body.theme-light,\nbody.theme-dark {\n\t--vt-ok: cubic-bezier(0.2, 0, 0, 1);\n}");
	});
});

describe("slideLiveVars", () => {
	it("スライドでは primary の系統だけを今の値にする（面と文字は埋め込んだ上流の値のまま）", () => {
		const vars = { "--vt-primary": "#13612f", "--vt-on-primary": "#ffffff", "--vt-secondary-container": "#d6e2d8", "--vt-surface": "#f4f6f8", "--vt-on-surface": "#1a2233" };
		expect(slideLiveVars(vars)).toEqual({ "--vt-primary": "#13612f", "--vt-on-primary": "#ffffff", "--vt-secondary-container": "#d6e2d8" });
	});
});
