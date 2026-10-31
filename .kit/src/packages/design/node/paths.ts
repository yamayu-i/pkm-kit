import { fileURLToPath } from "node:url";

const at = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));

/** 正本 */
export const TOKENS_JSON = at("../tokens.json");
/** リポジトリ（Vault）のルート */
export const VAULT_ROOT = at("../../../../");

/** 生成物（どれもコミットする。テストで正本と食い違っていないかを見る） */
export const OUTPUTS = {
	pluginCss: at("../../vault-task/tokens.css"),
	obsidianSnippet: at("../../../../.obsidian/snippets/vault-theme.css"),
	doc: at("../../../docs/design-tokens.md"),
	ts: at("../generated/tokens.ts"),
} as const;

/** 検査する CSS（プラグインごと） */
export const PLUGIN_CSS = [at("../../vault-task/styles.css")];

export const DESIGN_DOC = at("../../../docs/design.md");
export const APPEARANCE_JSON = at("../../../../.obsidian/appearance.json");
/** スニペットの名前（appearance.json の enabledCssSnippets に入れる） */
export const SNIPPET_NAME = "vault-theme";
