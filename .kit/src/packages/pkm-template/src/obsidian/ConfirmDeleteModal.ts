import { Modal, Setting, type App } from "obsidian";

/** 一覧からファイルを消す前の確認（ADR-0045）。Delete を押したときだけ onConfirm を呼ぶ */
export class ConfirmDeleteModal extends Modal {
	constructor(
		app: App,
		private readonly path: string,
		private readonly onConfirm: () => void,
	) {
		super(app);
	}

	override onOpen(): void {
		this.setTitle("Delete file");
		this.contentEl.createEl("p", { text: `${this.path} を削除します（Obsidian の「削除したファイル」の設定に従います）。` });
		new Setting(this.contentEl)
			.addButton((b) =>
				b
					.setButtonText("Delete")
					.setWarning()
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
