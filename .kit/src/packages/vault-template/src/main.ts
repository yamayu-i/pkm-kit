import { Notice, Plugin } from "obsidian";
import { CreateNoteModal } from "./obsidian/CreateNoteModal";
import { TemplateManager } from "./obsidian/creator";
import { TemplateSettingTab } from "./obsidian/SettingTab";

export default class VaultTemplatePlugin extends Plugin {
	manager!: TemplateManager;

	override async onload(): Promise<void> {
		this.manager = new TemplateManager(this.app);

		const openCreateModal = async () => {
			try {
				const templates = await this.manager.loadEnabledTemplates();
				new CreateNoteModal(this.app, this.manager, templates, (msg, err) => this.report(msg, err)).open();
			} catch (err) {
				this.report("テンプレートを読み込めませんでした", err);
			}
		};

		this.addCommand({
			id: "create-from-template",
			name: "テンプレートから新規ファイルを作成",
			callback: () => void openCreateModal(),
		});

		const openToday = async () => {
			try {
				await this.manager.openTodaysDaily();
			} catch (err) {
				this.report("今日のデイリーノートを開けませんでした", err);
			}
		};

		this.addCommand({
			id: "open-todays-daily",
			name: "今日のデイリーノートを開く",
			callback: () => void openToday(),
		});

		this.addRibbonIcon("calendar-check", "今日のデイリーノートを開く", () => void openToday());
		this.addRibbonIcon("file-plus-2", "テンプレートから新規ファイルを作成", () => void openCreateModal());
		this.addSettingTab(new TemplateSettingTab(this.app, this, this.manager, (msg, err) => this.report(msg, err)));
	}

	private report(message: string, error?: unknown): void {
		if (error !== undefined) console.error(`vault-template: ${message}`, error);
		const detail = error instanceof Error ? `: ${error.message}` : "";
		new Notice(`${message}${detail}`);
	}
}
