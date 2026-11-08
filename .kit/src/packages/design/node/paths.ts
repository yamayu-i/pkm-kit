import { fileURLToPath } from "node:url";

const at = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));

/** 正本 */
export const TOKENS_JSON = at("../tokens.json");
/** リポジトリ（Vault）のルート */
export const VAULT_ROOT = at("../../../../../");

/** 生成物（どれもコミットする。テストで正本と食い違っていないかを見る） */
export const OUTPUTS = {
	pluginCss: at("../../pkm-task/tokens.css"),
	templatePluginCss: at("../../pkm-template/tokens.css"),
	htmlPluginCss: at("../../pkm-html/tokens.css"),
	drawioPluginCss: at("../../pkm-drawio/tokens.css"),
	obsidianSnippet: at("../../../../../.obsidian/snippets/pkm-theme.css"),
	doc: at("../../../docs/design-tokens.md"),
	ts: at("../generated/tokens.ts"),
} as const;

/** 検査する CSS（プラグインごと） */
export const PLUGIN_CSS = [at("../../pkm-task/styles.css"), at("../../pkm-template/styles.css"), at("../../pkm-html/styles.css"), at("../../pkm-drawio/styles.css")];

export const DESIGN_DOC = at("../../../docs/design.md");
/** 子の Obsidian の設定に必要なキーと値（ADR-0009）。ここの "appearance.json" をデザインルールと照らす */
export const OBSIDIAN_REQUIRED_JSON = at("../../../../obsidian-required.json");
/** スニペットの名前（appearance.json の enabledCssSnippets に入れる） */
export const SNIPPET_NAME = "pkm-theme";
