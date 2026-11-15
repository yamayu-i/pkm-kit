import { PluginSettingTab, Setting, type App, type Plugin } from "obsidian";
import type { IssueQuery } from "../core/list";
import type { SubOpenMap } from "../core/sub-issue";
import { sanitizeDeviceName } from "../core/worklog";

/** 端末ごとの設定（data.json。git には入れない） */
export interface TaskSettings {
	/** worklog を書くフォルダ名（ADR-0004）。端末ごとに違う名前にする */
	deviceName: string;
	/** Issue List の保存した条件 */
	presets: { name: string; query: IssueQuery }[];
	/** この端末で最後に Organize した時刻（ISO。Tasks Now の Organized に使う。ADR-0154） */
	lastOrganizedAt: string | null;
	/** Tasks Now で一時停止した記録の群（鍵の一覧。再開で一括して始める。ADR-0154） */
	pausedTasks: string[];
	/** 本文のサブの一覧で開いているサブ（ノートのパスごとのサブの id。この端末だけ。ADR-0158） */
	subOpen: SubOpenMap;
}

export const DEFAULT_SETTINGS: TaskSettings = { deviceName: "", presets: [], lastOrganizedAt: null, pausedTasks: [], subOpen: {} };

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
			.setDesc("worklog を worklog/<端末名>/ に書きます。端末ごとに違う名前にしてください（pkm-git の端末名と同じがおすすめ）")
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
