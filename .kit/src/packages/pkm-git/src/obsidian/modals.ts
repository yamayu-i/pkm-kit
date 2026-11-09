import { Modal, Notice, Setting, type App } from "obsidian";
import type { SyncLogEntry } from "../git/sync-log";

export interface ConflictAction {
	label: string;
	run(): void | Promise<void>;
}

export interface ConflictItem {
	path: string;
	note: string;
	/** 記録の行の解決のボタン（ADR-0103 の 3）。押すとモーダルを閉じてから実行する */
	actions?: ConflictAction[];
	/** false ならクリックで開かない（読めない記録など、Vault の一覧にないファイル） */
	openable?: boolean;
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
			if (item.openable === false) {
				li.createEl("code", { text: item.path });
			} else {
				const link = li.createEl("a", { text: item.path, href: "#" });
				link.addEventListener("click", (e) => {
					e.preventDefault();
					this.close();
					void this.app.workspace.openLinkText(item.path, "", false);
				});
			}
			li.appendText(` — ${item.note}`);
			for (const action of item.actions ?? []) {
				const button = li.createEl("button", { text: action.label });
				button.addEventListener("click", () => {
					this.close();
					void action.run();
				});
			}
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

/** 「この版を残す」の名前を入れる（空でよい） */
export class KeepVersionModal extends Modal {
	private name = "";

	constructor(
		app: App,
		private readonly onKeep: (name: string) => void,
	) {
		super(app);
	}

	override onOpen(): void {
		this.setTitle("Keep this version");
		this.contentEl.createEl("p", {
			text: "今の内容をコミットして残します。オフラインでも残り、次につながったときに送ります。名前は空でもかまいません。",
		});
		new Setting(this.contentEl).setName("Name").addText((t) =>
			t.setPlaceholder("Optional").onChange((v) => { this.name = v; }),
		);
		new Setting(this.contentEl)
			.addButton((b) =>
				b
					.setButtonText("Keep")
					.setCta()
					.onClick(() => {
						this.close();
						this.onKeep(this.name);
					}),
			)
			.addButton((b) => b.setButtonText("Cancel").onClick(() => this.close()));
	}

	override onClose(): void {
		this.contentEl.empty();
	}
}

/** 同期の記録（ADR-0089 の 8）。新しい順に出し、クリップボードにコピーできる */
export class SyncLogModal extends Modal {
	constructor(
		app: App,
		private readonly entries: SyncLogEntry[],
	) {
		super(app);
	}

	override onOpen(): void {
		this.setTitle("Sync log");
		if (this.entries.length === 0) {
			this.contentEl.createEl("p", { text: "No entries" });
			return;
		}
		this.contentEl.createEl("p", {
			text: "同期の失敗と、自動で回復したことの記録です（この端末だけ）。Issue などに貼る前に、ノートのパスが入っていないか確かめてください。",
		});
		new Setting(this.contentEl).addButton((b) =>
			b.setButtonText("Copy").onClick(() => {
				const text = this.entries.map((e) => JSON.stringify(e)).join("\n");
				void navigator.clipboard.writeText(text).then(
					() => new Notice("Git: 同期の記録をコピーしました"),
					() => new Notice("Git: コピーできませんでした"),
				);
			}),
		);
		const list = this.contentEl.createEl("ul");
		for (const e of this.entries.slice(0, 200)) {
			const li = list.createEl("li");
			const what = [e.event, e.phase, e.kind, e.message ?? e.detail].filter((x) => x).join(" · ");
			li.createEl("div", { text: `${e.time} ${e.level === "error" ? "Error" : "Warning"}（${e.trigger ?? "-"}）` });
			li.createEl("div", { text: what });
			if (e.paths && e.paths.length > 0) li.createEl("div", { text: e.paths.join(", ") });
		}
	}

	override onClose(): void {
		this.contentEl.empty();
	}
}
