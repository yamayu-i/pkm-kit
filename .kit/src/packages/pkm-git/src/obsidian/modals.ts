import { Modal, Setting, type App } from "obsidian";

/** push しようとしたがリモートが先に進んでいたとき */
export class BehindModal extends Modal {
	constructor(
		app: App,
		private readonly onPull: () => void,
	) {
		super(app);
	}

	override onOpen(): void {
		this.setTitle("リモートに新しい変更があります");
		this.contentEl.createEl("p", {
			text: "push は実行していません（コミットもしていません）。先に pull で取り込んでから、もう一度 push してください。",
		});
		new Setting(this.contentEl)
			.addButton((b) =>
				b
					.setButtonText("Pull now")
					.setCta()
					.onClick(() => {
						this.close();
						this.onPull();
					}),
			)
			.addButton((b) => b.setButtonText("Close").onClick(() => this.close()));
	}

	override onClose(): void {
		this.contentEl.empty();
	}
}

export interface ConflictItem {
	path: string;
	note: string;
}

/** 未解決のコンフリクト一覧。クリックでファイルを開く */
export class ConflictsModal extends Modal {
	constructor(
		app: App,
		private readonly title: string,
		private readonly items: ConflictItem[],
	) {
		super(app);
	}

	override onOpen(): void {
		this.setTitle(this.title);
		if (this.items.length === 0) {
			this.contentEl.createEl("p", { text: "未解決のコンフリクトはありません。" });
			return;
		}
		this.contentEl.createEl("p", {
			text: "内容は全部残っています。急ぎでなければ PC でまとめて解決して大丈夫です。",
		});
		const list = this.contentEl.createEl("ul");
		for (const item of this.items) {
			const li = list.createEl("li");
			const link = li.createEl("a", { text: item.path, href: "#" });
			link.addEventListener("click", (e) => {
				e.preventDefault();
				this.close();
				void this.app.workspace.openLinkText(item.path, "", false);
			});
			li.appendText(` — ${item.note}`);
		}
	}

	override onClose(): void {
		this.contentEl.empty();
	}
}

export class ConfirmModal extends Modal {
	constructor(
		app: App,
		private readonly title: string,
		private readonly message: string,
		private readonly onConfirm: () => void,
	) {
		super(app);
	}

	override onOpen(): void {
		this.setTitle(this.title);
		this.contentEl.createEl("p", { text: this.message });
		new Setting(this.contentEl)
			.addButton((b) =>
				b
					.setButtonText("Run")
					.setCta()
					.onClick(() => {
						this.close();
						this.onConfirm();
					}),
			)
			.addButton((b) => b.setButtonText("Cancel").onClick(() => this.close()));
	}

	override onClose(): void {
		this.contentEl.empty();
	}
}
