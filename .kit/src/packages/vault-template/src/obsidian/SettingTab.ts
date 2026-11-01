import { PluginSettingTab, Setting, type App, type Plugin } from "obsidian";
import { moveTemplateEntry, TEMPLATE_CONFIG_PATH, TEMPLATE_DIR, type TemplateEntry } from "../core/config";
import type { TemplateManager } from "./creator";

export class TemplateSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		plugin: Plugin,
		private readonly manager: TemplateManager,
		private readonly onReport: (msg: string, err?: unknown) => void,
	) {
		super(app, plugin);
	}

	override display(): void {
		const { containerEl } = this;
		containerEl.empty();
		void this.renderAsync(containerEl);
	}

	private async renderAsync(containerEl: HTMLElement): Promise<void> {
		const { entries, problems } = await this.manager.loadConfig();
		containerEl.empty();

		new Setting(containerEl)
			.setName("テンプレート一覧と生成先")
			.setDesc(
				`${TEMPLATE_DIR}/ にあるテンプレートの表示順・モーダルへの表示有無・生成先フォルダ・初期ファイル名パターンを設定します（保存先: ${TEMPLATE_CONFIG_PATH}）。`,
			)
			.setHeading();

		if (problems.length > 0) {
			const warn = containerEl.createEl("div", { cls: "vt-tpl-setting-error" });
			warn.createEl("div", {
				text: `${TEMPLATE_CONFIG_PATH} に書式エラーがあります: ${problems.join(" / ")}`,
			});
		}

		const saveAndRefresh = async (next: TemplateEntry[], rerender = false) => {
			try {
				await this.manager.saveConfig(next);
				if (rerender) await this.renderAsync(containerEl);
			} catch (err) {
				this.onReport("設定を保存できませんでした", err);
			}
		};

		entries.forEach((entry, index) => {
			const row = new Setting(containerEl)
				.setName(entry.file)
				.setDesc("生成先フォルダ（例: wiki, daily/{{date:YYYY}}/{{date:MM}}）と初期ファイル名パターン（例: {{date:YYYY-MM-DD}}）");

			row.addText((text) =>
				text
					.setPlaceholder("生成先フォルダ（ルートなら空欄）")
					.setValue(entry.folder)
					.onChange((val) => {
						entry.folder = val.trim().replace(/^\/+|\/+$/g, "");
						void saveAndRefresh(entries, false);
					}),
			);

			row.addText((text) =>
				text
					.setPlaceholder("初期ファイル名パターン（任意）")
					.setValue(entry.fileNamePattern)
					.onChange((val) => {
						entry.fileNamePattern = val.trim();
						void saveAndRefresh(entries, false);
					}),
			);

			row.addExtraButton((btn) =>
				btn
					.setIcon("arrow-up")
					.setTooltip("上へ移動")
					.setDisabled(index === 0)
					.onClick(() => {
						void saveAndRefresh(moveTemplateEntry(entries, entry.file, -1), true);
					}),
			);

			row.addExtraButton((btn) =>
				btn
					.setIcon("arrow-down")
					.setTooltip("下へ移動")
					.setDisabled(index === entries.length - 1)
					.onClick(() => {
						void saveAndRefresh(moveTemplateEntry(entries, entry.file, 1), true);
					}),
			);

			row.addToggle((toggle) =>
				toggle
					.setTooltip("新規ファイル作成モーダルに表示する")
					.setValue(entry.enabled)
					.onChange((val) => {
						entry.enabled = val;
						void saveAndRefresh(entries, false);
					}),
			);
		});
	}
}
