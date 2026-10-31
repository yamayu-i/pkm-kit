/** Obsidian 側の設定（.obsidian/appearance.json）がデザインルールどおりに固定されているかを調べる */
import { toHex } from "./color.ts";
import { resolveColor, type Token } from "./tokens.ts";

export const OBSIDIAN_RULES = {
	"obsidian/no-css-theme": "コミュニティテーマを使わない（cssTheme は空）。色を決めるのはトークンとスニペットだけにする",
	"obsidian/snippets": "有効な CSS スニペットは生成した vault-theme だけ",
	"obsidian/accent": "accentColor はトークンの primary（ライト）と同じ",
	"obsidian/no-translucency": "translucency（半透明のウィンドウ）を使わない。背景が決まらずコントラストを保証できない",
} as const;

export type ObsidianRuleId = keyof typeof OBSIDIAN_RULES;

export interface ConfigProblem {
	rule: ObsidianRuleId;
	message: string;
}

export function checkAppearance(appearance: unknown, tokens: readonly Token[], snippetName: string): ConfigProblem[] {
	const problems: ConfigProblem[] = [];
	const add = (rule: ObsidianRuleId, message: string) => problems.push({ rule, message: `${OBSIDIAN_RULES[rule]}: ${message}` });
	const a = (typeof appearance === "object" && appearance !== null ? appearance : {}) as Record<string, unknown>;
	if (a.cssTheme !== undefined && a.cssTheme !== "") add("obsidian/no-css-theme", `cssTheme が「${String(a.cssTheme)}」です`);
	const snippets = a.enabledCssSnippets;
	if (!Array.isArray(snippets) || snippets.length !== 1 || snippets[0] !== snippetName) {
		add("obsidian/snippets", `enabledCssSnippets が ${JSON.stringify(snippets)} です（["${snippetName}"] にする）`);
	}
	const primary = toHex(resolveColor(tokens, "color.primary", "light"));
	if (typeof a.accentColor !== "string" || a.accentColor.toLowerCase() !== primary) {
		add("obsidian/accent", `accentColor が ${JSON.stringify(a.accentColor)} です（${primary} にする）`);
	}
	if (a.translucency !== false) add("obsidian/no-translucency", `translucency が ${JSON.stringify(a.translucency)} です（false にする）`);
	return problems;
}
