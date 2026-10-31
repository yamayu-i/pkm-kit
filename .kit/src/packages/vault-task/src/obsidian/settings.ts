import { PluginSettingTab, Setting, type App, type Plugin } from "obsidian";
import type { IssueQuery } from "../core/list";
import { sanitizeDeviceName } from "../core/worklog";

/** 端末ごとの設定（data.json。git には入れない） */
export interface TaskSettings {
	/** worklog を書くフォルダ名（ADR-0004）。端末ごとに違う名前にする */
	deviceName: string;
	/** Issue List の保存した条件 */
	presets: { name: string; query: IssueQuery }[];
}

export const DEFAULT_SETTINGS: TaskSettings = { deviceName: "", presets: [] };

export { sanitizeDeviceName } from "../core/worklog";

export class TaskSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		plugin: Plugin,
		private readonly settings: TaskSettings,
		private readonly save: () => Promise<void>,
	) {
		super(app, plugin);
	}

	override display(): void {
		this.containerEl.empty();
		new Setting(this.containerEl)
			.setName("端末名")
			.setDesc("worklog を worklog/<端末名>/ に書きます。端末ごとに違う名前にしてください（vault-git の端末名と同じがおすすめ）")
			.addText((t) =>
				t
					.setPlaceholder("例: iphone")
					.setValue(this.settings.deviceName)
					.onChange(async (v) => {
						this.settings.deviceName = sanitizeDeviceName(v);
						await this.save();
					}),
			);
	}
}
