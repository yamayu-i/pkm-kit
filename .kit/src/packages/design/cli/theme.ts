/**
 * node .kit/bin/theme.mjs <list | check | build>（ADR-0121）。
 * 上流のトークンを束ね、置き場所（.kit/bin/）から Vault のルートを決める
 */
import { fileURLToPath } from "node:url";
import tokensJson from "../tokens.json" with { type: "json" };
import { runTheme } from "../node/theme-cli.ts";
import { loadTokens } from "../src/tokens.ts";

const root = process.env.KIT_VAULT_ROOT ?? fileURLToPath(new URL("../../", import.meta.url));
const result = runTheme(process.argv.slice(2), root, loadTokens(tokensJson));
for (const line of result.out) console.log(line);
for (const line of result.err) console.error(line);
process.exit(result.code);
