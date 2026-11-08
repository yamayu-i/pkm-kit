/**
 * pkm-html: Vault の中の HTML を、読み取り専用で表示する（ADR-0037）。
 * .html / .htm を View に登録し、tmp/ への書き出し（ADR-0044）を持つ。ほかのプラグインには依存しない
 */
import { Notice, Plugin, TFile, type TAbstractFile } from "obsidian";
import { HTML_EXTENSIONS } from "./core/policy.ts";
import { exportHtmlToTmp } from "./obsidian/export.ts";
import { HtmlView, VIEW_TYPE } from "./obsidian/html-view.ts";

export default class PkmHtmlPlugin extends Plugin {
	override async onload(): Promise<void> {
		this.registerView(VIEW_TYPE, (leaf) => new HtmlView(leaf));
		try {
			this.registerExtensions([...HTML_EXTENSIONS], VIEW_TYPE);
		} catch (e) {
			// ほかのプラグインが同じ拡張子を登録していると失敗する
			new Notice(`pkm-html: .html を登録できませんでした（${e instanceof Error ? e.message : String(e)}）`);
		}

		this.addCommand({
			id: "export-to-tmp",
			name: "Export HTML to tmp/",
			icon: "file-output",
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				if (!isHtml(file)) return false;
				if (!checking) void exportHtmlToTmp(this.app, file);
				return true;
			},
		});
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (!isHtml(file)) return;
				menu.addItem((item) => item.setTitle("Export HTML to tmp/").setIcon("file-output").onClick(() => void exportHtmlToTmp(this.app, file)));
			}),
		);
	}
}

function isHtml(file: TAbstractFile | null): file is TFile {
	return file instanceof TFile && (HTML_EXTENSIONS as readonly string[]).includes(file.extension.toLowerCase());
}
