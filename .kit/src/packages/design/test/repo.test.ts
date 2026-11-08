/**
 * このリポジトリの実物の検査。pnpm check で毎回走る
 * （トークン ↔ 生成物 ↔ CSS ↔ Obsidian の設定 ↔ design.md の食い違いを見つける）
 */
import { existsSync, readFileSync } from "node:fs";
import { relative } from "node:path";
import { describe, expect, it } from "vitest";
import { buildOutputs, readTokens } from "../node/build.ts";
import { formatRatio } from "../src/color.ts";
import { checkContrast } from "../src/contrast.ts";
import { lintCss } from "../src/css-lint.ts";
import { lintDesignDoc } from "../src/doc-lint.ts";
import { formatTokens } from "../src/format.ts";
import { checkAppearance } from "../src/obsidian-config.ts";
import { DESIGN_DOC, OBSIDIAN_REQUIRED_JSON, OUTPUTS, PLUGIN_CSS, SNIPPET_NAME, TOKENS_JSON, VAULT_ROOT } from "../node/paths.ts";

const tokens = readTokens();

describe("このリポジトリのデザイン", () => {
	it("tokens.json の書式が整っている（pnpm --filter design build で整う）", () => {
		const text = readFileSync(TOKENS_JSON, "utf8");
		expect(text).toBe(formatTokens(JSON.parse(text)));
	});

	it("トークンに書いたコントラストの条件を、ライト / ダークとも満たす", () => {
		const failed = checkContrast(tokens)
			.filter((r) => !r.ok)
			.map((r) => `${r.token}（${r.mode}）on ${r.on.join(" + ")}: ${formatRatio(r.ratio)} < ${r.min}`);
		expect(failed).toEqual([]);
	});

	it("生成物が tokens.json と食い違っていない（pnpm --filter design build を忘れていない）", () => {
		const outputs = buildOutputs(tokens);
		for (const [key, path] of Object.entries(OUTPUTS)) {
			const where = relative(VAULT_ROOT, path);
			expect(existsSync(path), where).toBe(true);
			expect(readFileSync(path, "utf8"), where).toBe(outputs[key as keyof typeof OUTPUTS]);
		}
	});

	for (const path of PLUGIN_CSS) {
		it(`${relative(VAULT_ROOT, path)} がデザインルールに沿っている`, () => {
			const problems = lintCss(readFileSync(path, "utf8"), { tokens }).map((p) => `${p.line}: [${p.rule}] ${p.message}`);
			expect(problems).toEqual([]);
		});
	}

	it("Obsidian の外観の設定が固定されている", () => {
		const appearance = JSON.parse(readFileSync(OBSIDIAN_REQUIRED_JSON, "utf8"))["appearance.json"];
		expect(checkAppearance(appearance, tokens, SNIPPET_NAME).map((p) => p.message)).toEqual([]);
		expect(OUTPUTS.obsidianSnippet.endsWith(`/.obsidian/snippets/${SNIPPET_NAME}.css`)).toBe(true);
	});

	it("Obsidian のサイドバーの面をカードの面と同じ値に固定する（ADR-0019）", () => {
		const container = tokens.find((t) => t.path === "color.surface-container");
		expect(container?.obsidian).toContain("--background-secondary");
	});

	it("design.md がトークン・CSS・検査と食い違っていない", () => {
		const css = PLUGIN_CSS.map((p) => readFileSync(p, "utf8")).join("\n");
		expect(lintDesignDoc(readFileSync(DESIGN_DOC, "utf8"), tokens, css)).toEqual([]);
	});
});

describe("ビルドの順（#8・#52）", () => {
	it("ルートの build は、design の生成（tokens.css）を先に済ませてから、ほかのパッケージをビルドする", () => {
		const root = JSON.parse(readFileSync(new URL("../../../package.json", import.meta.url), "utf8"));
		const steps = String(root.scripts.build).split("&&").map((s) => s.trim());
		expect(steps[0]).toBe("pnpm --filter design build");
		expect(steps.slice(1)).toEqual(["pnpm -r --filter !design build"]);
	});
});
