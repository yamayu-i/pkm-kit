import { Modal, Notice, Setting, type App } from "obsidian";
import type { FileHistory, FileVersion } from "../git/engine";
import type { SyncLogEntry } from "../git/sync-log";
import type { ConflictChoice, ConflictSegment } from "../merge/text-merge";

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

/**
 * マーカー入りのノートを、塊ごとに選んで解く（ADR-0110 の 1）。
 * すべての塊を選ぶまで Apply は押せない
 */
export class ResolveConflictsModal extends Modal {
	private readonly choices: Array<ConflictChoice | undefined>;

	constructor(
		app: App,
		private readonly path: string,
		private readonly segments: ConflictSegment[],
		private readonly onApply: (choices: ConflictChoice[]) => void,
	) {
		super(app);
		this.choices = segments.filter((s) => s.type === "conflict").map(() => undefined);
	}

	override onOpen(): void {
		this.setTitle("Resolve conflicts");
		this.contentEl.addClass("pkm-git-resolve");
		this.contentEl.createEl("p", { text: `${this.path} の、両方の端末で変えた箇所です。箇所ごとに、どちらを残すかを選んでください。` });
		let apply: { setDisabled(v: boolean): unknown } | undefined;
		const refresh = () => apply?.setDisabled(this.choices.some((c) => c === undefined));
		let n = 0;
		for (const seg of this.segments) {
			if (seg.type !== "conflict") continue;
			const index = n++;
			const block = this.contentEl.createEl("div", { cls: "pkm-git-conflict" });
			block.createEl("h4", { text: `Conflict ${index + 1} / ${this.choices.length}` });
			for (const [label, text] of [[seg.localLabel, seg.local], [seg.remoteLabel, seg.remote]] as const) {
				block.createEl("div", { cls: "pkm-git-conflict-label", text: label });
				block.createEl("pre", { cls: "pkm-git-conflict-text", text: text === "" ? "(empty)" : text });
			}
			const buttons: Array<{ setCta(): unknown; removeCta(): unknown }> = [];
			const setting = new Setting(block);
			for (const [choice, label] of [["local", "Use local"], ["remote", "Use remote"], ["both", "Use both"]] as const) {
				setting.addButton((b) => {
					buttons.push(b);
					b.setButtonText(label).onClick(() => {
						this.choices[index] = choice;
						for (const other of buttons) other.removeCta();
						b.setCta();
						refresh();
					});
				});
			}
		}
		new Setting(this.contentEl)
			.addButton((b) => {
				apply = b;
				b.setButtonText("Apply").setCta().onClick(() => {
					if (this.choices.some((c) => c === undefined)) return;
					this.close();
					this.onApply(this.choices as ConflictChoice[]);
				});
			})
			.addButton((b) => b.setButtonText("Cancel").onClick(() => this.close()));
		refresh();
	}

	override onClose(): void {
		this.contentEl.empty();
	}
}

const KIND_TEXT: Record<FileVersion["kind"], string> = {
	synced: "Synced",
	kept: "Kept",
	merged: "Merged",
	other: "Other",
};

export interface FileHistoryActions {
	/** 次の 30 件（手元の始まりなら取り足してから）。取れなければ null */
	loadMore(skip: number, deepen: boolean): Promise<FileHistory | null>;
	preview(version: FileVersion): void;
	restore(version: FileVersion): void;
}

/** ファイルの履歴（ADR-0110 の 3・4）。そのファイルを変えたコミットを新しい順に出す */
export class FileHistoryModal extends Modal {
	private shown = 0;

	constructor(
		app: App,
		private readonly path: string,
		private readonly first: FileHistory,
		private readonly actions: FileHistoryActions,
	) {
		super(app);
	}

	override onOpen(): void {
		this.setTitle("File history");
		this.contentEl.createEl("p", { text: this.path });
		if (this.first.versions.length === 0 && !this.first.canDeepen) {
			this.contentEl.createEl("p", { text: "No versions" });
		}
		const list = this.contentEl.createEl("ul", { cls: "pkm-git-history" });
		const more = this.contentEl.createEl("div");
		this.contentEl.createEl("p", {
			cls: "setting-item-description",
			text: "同期の区切りと「Keep this version」の版です。保存のたびの細かな版は、Obsidian のファイル回復（設定 → ファイル回復）にあります。",
		});
		const render = (history: FileHistory) => {
			for (const v of history.versions) {
				const li = list.createEl("li");
				const name = v.kind === "kept" && v.name ? ` ${v.name}` : "";
				li.createEl("div", { text: `${new Date(v.time).toLocaleString()} · ${v.author} · ${KIND_TEXT[v.kind]}${name}` });
				new Setting(li)
					.addButton((b) => b.setButtonText("Preview").onClick(() => this.actions.preview(v)))
					.addButton((b) => b.setButtonText("Restore").onClick(() => {
						this.close();
						this.actions.restore(v);
					}));
			}
			this.shown += history.versions.length;
			more.empty();
			if (history.atStart && !history.canDeepen) return;
			new Setting(more).addButton((b) => b.setButtonText("Load older").onClick(async () => {
				b.setDisabled(true);
				const next = await this.actions.loadMore(this.shown, history.atStart);
				if (next) render(next);
				else b.setDisabled(false);
			}));
		};
		render(this.first);
	}

	override onClose(): void {
		this.contentEl.empty();
	}
}

/** 版の中身を読み取り専用で出す */
export class PreviewModal extends Modal {
	constructor(
		app: App,
		private readonly heading: string,
		private readonly text: string | null,
		private readonly size: number,
	) {
		super(app);
	}

	override onOpen(): void {
		this.setTitle("Preview");
		this.contentEl.createEl("p", { text: this.heading });
		if (this.text === null) this.contentEl.createEl("p", { text: `テキストではないファイルです（${this.size} バイト）` });
		else this.contentEl.createEl("pre", { cls: "pkm-git-preview", text: this.text });
	}

	override onClose(): void {
		this.contentEl.empty();
	}
}
