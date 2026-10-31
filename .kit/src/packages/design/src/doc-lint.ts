/** docs/design.md とトークン・CSS・検査の食い違いを調べる */
import { CSS_RULES } from "./css-lint.ts";
import { OBSIDIAN_RULES } from "./obsidian-config.ts";
import { RUNTIME_RULES } from "./audit.ts";
import type { Token } from "./tokens.ts";

export const ALL_RULES = { ...CSS_RULES, ...OBSIDIAN_RULES, ...RUNTIME_RULES };

export function lintDesignDoc(doc: string, tokens: readonly Token[], pluginCss: string): string[] {
	const problems: string[] = [];
	const own = tokens.filter((t) => t.plugin).map((t) => t.cssVar);
	const localVars = new Set([...pluginCss.matchAll(/(?:^|[{;\s])(--vt-[\w-]+)\s*:/gm)].map((m) => m[1] as string));
	const classes = new Set([...pluginCss.matchAll(/\.(vt-[\w-]+)/g)].map((m) => m[1] as string));

	for (const id of Object.keys(ALL_RULES)) {
		if (!doc.includes(`\`${id}\``)) problems.push(`検査 ${id} が design.md の「検査の一覧」にありません`);
	}
	// `--vt-<色>-container` のような書き方の説明は対象外
	for (const m of doc.matchAll(/--vt-[\w-]*[\w*](?![\w<-])/g)) {
		const name = m[0];
		if (name.endsWith("*")) {
			const prefix = name.slice(0, -1);
			if (!own.some((v) => v.startsWith(prefix))) problems.push(`design.md の ${name} に当てはまるトークンがありません`);
		} else if (!own.includes(name) && !localVars.has(name)) {
			problems.push(`design.md の ${name} はトークンにも CSS にもありません`);
		}
	}
	for (const m of doc.matchAll(/`\.(vt-[\w-]+)/g)) {
		if (!classes.has(m[1] as string)) problems.push(`design.md のクラス .${m[1]} が CSS にありません`);
	}
	for (const m of doc.matchAll(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi)) {
		problems.push(`design.md に色の値（${m[0]}）を書かない。値は design-tokens.md（生成物）にある`);
	}
	return [...new Set(problems)];
}
