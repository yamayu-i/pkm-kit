import { Platform, PluginSettingTab, SecretComponent, Setting, type App } from "obsidian";
import { normalizeAuthHost } from "../git/auth-target";
import type PkmGitPlugin from "../main";

/**
 * data.json に保存される端末ごとの設定（.gitignore 済み）。
 * トークンそのものは保存しない。Obsidian の SecretStorage に置き、その ID だけを持つ。
 */
export interface PkmGitSettings {
	deviceName: string;
	authorName: string;
	authorEmail: string;
	/** HTTPS 認証のユーザー名。GitHub の PAT なら何でもよい */
	username: string;
	tokenSecretId: string;
	/** トークンを送ってよいホスト名。これ以外と https 以外には送らない */
	authHost: string;
	/** モバイルでの初回 clone にだけ使う */
	cloneUrl: string;
	cloneBranch: string;
}

function defaultDeviceName(): string {
	if (Platform.isIosApp) return "ios";
	if (Platform.isAndroidApp) return "android";
	if (Platform.isMacOS) return "mac";
	if (Platform.isWin) return "windows";
	return "desktop";
}

export const DEFAULT_SETTINGS: PkmGitSettings = {
	deviceName: defaultDeviceName(),
	authorName: "",
	authorEmail: "",
	username: "x-access-token",
	tokenSecretId: "",
	authHost: "github.com",
	cloneUrl: "",
	cloneBranch: "main",
};

export class PkmGitSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: PkmGitPlugin,
	) {
		super(app, plugin);
	}

	override display(): void {
		const { containerEl } = this;
		const s = this.plugin.settings;
		const save = () => this.plugin.saveSettings();
		containerEl.empty();

		new Setting(containerEl)
			.setName("端末名")
			.setDesc("コミットメッセージとコンフリクト版のファイル名に入ります")
			.addText((t) =>
				t.setValue(s.deviceName).onChange(async (v) => {
					s.deviceName = v.trim();
					await save();
				}),
			);
		new Setting(containerEl).setName("コミットの名前").addText((t) =>
			t.setValue(s.authorName).onChange(async (v) => {
				s.authorName = v.trim();
				await save();
			}),
		);
		new Setting(containerEl).setName("コミットのメールアドレス").addText((t) =>
			t.setValue(s.authorEmail).onChange(async (v) => {
				s.authorEmail = v.trim();
				await save();
			}),
		);

		new Setting(containerEl).setName("認証").setHeading();
		new Setting(containerEl)
			.setName("アクセストークン")
			.setDesc("GitHub の fine-grained PAT（対象リポジトリの Contents: Read and write のみ）を推奨")
			.addComponent((el) =>
				new SecretComponent(this.app, el).setValue(s.tokenSecretId).onChange(async (v) => {
					s.tokenSecretId = v ?? "";
					await save();
				}),
			);
		new Setting(containerEl)
			.setName("トークンを送るホスト")
			.setDesc("このホストの https:// にだけトークンを送ります（例: github.com）")
			.addText((t) =>
				t.setValue(s.authHost).onChange(async (v) => {
					s.authHost = normalizeAuthHost(v);
					await save();
				}),
			);
		new Setting(containerEl).setName("ユーザー名").addText((t) =>
			t.setValue(s.username).onChange(async (v) => {
				s.username = v.trim();
				await save();
			}),
		);

		new Setting(containerEl).setName("初回 clone（モバイル用）").setHeading();
		new Setting(containerEl)
			.setName("リモート URL")
			.setDesc("https:// の URL。認証情報を URL に含めないでください")
			.addText((t) =>
				t
					.setPlaceholder("https://github.com/owner/repo.git")
					.setValue(s.cloneUrl)
					.onChange(async (v) => {
						s.cloneUrl = v.trim();
						await save();
					}),
			);
		new Setting(containerEl).setName("ブランチ").addText((t) =>
			t.setValue(s.cloneBranch).onChange(async (v) => {
				s.cloneBranch = v.trim() || "main";
				await save();
			}),
		);
	}
}
