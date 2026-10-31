/** tokens.json から生成物の中身を作る（書き込みは scripts/generate.ts）。Node の API を使うので src/ の外に置く */
import { readFileSync } from "node:fs";
import { obsidianSnippet, pluginCss, tokensDoc, tsModule } from "../src/emit.ts";
import { OUTPUTS, TOKENS_JSON } from "./paths.ts";
import { loadTokens, type Token } from "../src/tokens.ts";

export function readTokens(): Token[] {
	return loadTokens(JSON.parse(readFileSync(TOKENS_JSON, "utf8")));
}

export function buildOutputs(tokens: readonly Token[]): Record<keyof typeof OUTPUTS, string> {
	return {
		pluginCss: pluginCss(tokens),
		obsidianSnippet: obsidianSnippet(tokens),
		doc: tokensDoc(tokens),
		ts: tsModule(tokens),
	};
}
