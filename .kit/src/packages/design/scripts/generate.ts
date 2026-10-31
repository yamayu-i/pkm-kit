/**
 * 生成物を作り直す: pnpm --filter design build
 * tokens.json の書式も整える（値は変えない）
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { buildOutputs, readTokens } from "../node/build.ts";
import { checkContrast } from "../src/contrast.ts";
import { formatRatio } from "../src/color.ts";
import { formatTokens } from "../src/format.ts";
import { OUTPUTS, TOKENS_JSON } from "../node/paths.ts";

const json = readFileSync(TOKENS_JSON, "utf8");
const formatted = formatTokens(JSON.parse(json));
if (formatted !== json) writeFileSync(TOKENS_JSON, formatted);

const tokens = readTokens();
const outputs = buildOutputs(tokens);
for (const [key, path] of Object.entries(OUTPUTS)) {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, outputs[key as keyof typeof OUTPUTS]);
}

const failed = checkContrast(tokens).filter((r) => !r.ok);
for (const r of failed) {
	console.error(`コントラスト不足: ${r.token}（${r.mode}）on ${r.on.join(" + ")} = ${formatRatio(r.ratio)} < ${r.min}`);
}
console.log(`design: ${tokens.length} 個のトークンから ${Object.keys(OUTPUTS).length} つのファイルを作りました`);
if (failed.length > 0) process.exit(1);
