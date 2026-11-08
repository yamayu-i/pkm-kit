/**
 * vault-html: Vault の中の HTML を、読み取り専用で表示する（ADR-0037）。
 * .html / .htm を View に登録するだけ。ほかのプラグインには依存しない
 */
import { Notice, Plugin } from "obsidian";
import { HTML_EXTENSIONS } from "./core/policy.ts";
import { HtmlView, VIEW_TYPE } from "./obsidian/html-view.ts";

export default class VaultHtmlPlugin extends Plugin {
	override async onload(): Promise<void> {
		this.registerView(VIEW_TYPE, (leaf) => new HtmlView(leaf));
		try {
			this.registerExtensions([...HTML_EXTENSIONS], VIEW_TYPE);
		} catch (e) {
			// ほかのプラグインが同じ拡張子を登録していると失敗する
			new Notice(`vault-html: .html を登録できませんでした（${e instanceof Error ? e.message : String(e)}）`);
		}
	}
}
