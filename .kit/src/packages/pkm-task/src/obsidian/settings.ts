import { PluginSettingTab, Setting, type App, type Plugin } from "obsidian";
import { DEFAULT_CLOSING_GRACE_HOUR } from "../core/closing";
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
	/** 締めの猶予（時。0〜6）。0 時からこの時刻までは、締めていない前日のボードを Close board で締める（ADR-0226） */
	closingGraceHour: number;
}

export const DEFAULT_SETTINGS: TaskSettings = { deviceName: "", presets: [], lastOrganizedAt: null, pausedTasks: [], subOpen: {}, closingGraceHour: DEFAULT_CLOSING_GRACE_HOUR };

/** 締めの猶予として読める値（0〜6 の整数）。ほかは既定 */
export function sanitizeGraceHour(v: unknown): number {
	return typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 6 ? v : DEFAULT_CLOSING_GRACE_HOUR;
}

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
		new Setting(this.containerEl)
			.setName("締めの猶予（時）")
			.setDesc("0 時からこの時刻までに Close board を押すと、締めていない前日のボードを締めます。0 にすると、いつも今日を締めます")
			.addDropdown((d) => {
				for (let h = 0; h <= 6; h++) d.addOption(String(h), h === 0 ? "なし" : `${h}:00 まで`);
				d.setValue(String(this.settings.closingGraceHour)).onChange(async (v) => {
					this.settings.closingGraceHour = sanitizeGraceHour(Number(v));
					await this.save();
				});
			});
	}
}
