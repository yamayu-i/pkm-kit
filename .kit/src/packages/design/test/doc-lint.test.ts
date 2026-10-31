import { describe, expect, it } from "vitest";
import { readTokens } from "../node/build.ts";
import { ALL_RULES, lintDesignDoc } from "../src/doc-lint.ts";

const tokens = readTokens();
const allRules = Object.keys(ALL_RULES)
	.map((id) => `\`${id}\``)
	.join(" ");
const css = ".vt-card { --vt-dot: var(--vt-green); color: var(--vt-on-surface); }";

describe("lintDesignDoc", () => {
	it("実在するトークン・クラス・ワイルドカードは問題なし", () => {
		expect(lintDesignDoc(`${allRules} \`--vt-on-surface\` \`--vt-type-label-small-*\` \`--vt-dot\` \`.vt-card\` \`--vt-<色>-container\``, tokens, css)).toEqual([]);
	});

	it("ない検査・トークン・クラス・色の値を見つける", () => {
		const problems = lintDesignDoc("`--vt-nothing` `--vt-zzz-*` `.vt-none` #ff0000", tokens, css);
		expect(problems.some((p) => p.includes("検査 color/no-literal"))).toBe(true);
		expect(problems).toContain("design.md の --vt-nothing はトークンにも CSS にもありません");
		expect(problems).toContain("design.md の --vt-zzz-* に当てはまるトークンがありません");
		expect(problems).toContain("design.md のクラス .vt-none が CSS にありません");
		expect(problems.some((p) => p.includes("#ff0000"))).toBe(true);
	});

	it("プラグインに出さないトークン（Obsidian 専用）は使えない", () => {
		expect(lintDesignDoc(`${allRules} \`--vt-text-faint\``, tokens, css)).toContain("design.md の --vt-text-faint はトークンにも CSS にもありません");
	});
});
