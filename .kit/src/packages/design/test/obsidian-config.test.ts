import { describe, expect, it } from "vitest";
import { readTokens } from "../node/build.ts";
import { checkAppearance } from "../src/obsidian-config.ts";

const tokens = readTokens();
const ok = { theme: "system", cssTheme: "", accentColor: "#6750a4", translucency: false, enabledCssSnippets: ["pkm-theme"] };

describe("checkAppearance", () => {
	it("固定した設定なら問題なし", () => {
		expect(checkAppearance(ok, tokens, "pkm-theme")).toEqual([]);
	});
	it("テーマ・スニペット・アクセント・半透明の違いを見つける", () => {
		const rules = checkAppearance({ ...ok, cssTheme: "Minimal", enabledCssSnippets: ["pkm-theme", "mine"], accentColor: "#ff0000", translucency: true }, tokens, "pkm-theme").map((p) => p.rule);
		expect(rules).toEqual(["obsidian/no-css-theme", "obsidian/snippets", "obsidian/accent", "obsidian/no-translucency"]);
	});
});
