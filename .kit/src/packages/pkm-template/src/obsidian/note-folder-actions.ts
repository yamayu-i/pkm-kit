/**
 * Notes の一覧の Folders の操作（ADR-0213）: note/ の下のフォルダを作る・名前を変える・動かす・消す、ノートを動かす。
 * 動かすのは fileManager.renameFile で、ノートを指すリンクは Obsidian が書き換える（alwaysUpdateLinks）
 */
import { FuzzySuggestModal, Modal, Notice, Platform, Setting, TFile, TFolder, type App, type TAbstractFile } from "obsidian";
import { openInNotePane } from "../../../shared/src/list-pane.ts";
import { registerCloseKey } from "../../../shared/src/modal-keys";
import { folderNameError, isDeletable, KEEP_FILE, moveTarget, NOTE_ROOT, noteFolders, renameTarget } from "../core/note-folders";

/** note/ の下のフォルダとファイルのパス（隠しフォルダは noteFolders が除く） */
export interface FolderSnapshot {
	folders: string[];
	files: string[];
}

export function collectNoteFolders(app: App): FolderSnapshot {
	const folders: string[] = [];
	const files: string[] = [];
	const walk = (node: TAbstractFile) => {
		if (node instanceof TFolder) {
			folders.push(node.path);
			for (const c of node.children) walk(c);
		} else files.push(node.path);
	};
	const root = app.vault.getAbstractFileByPath(NOTE_ROOT);
	if (root instanceof TFolder) walk(root);
	return { folders: noteFolders(folders), files };
}

export class NoteFolderActions {
	constructor(private readonly app: App) {}

	private exists = (path: string) => this.app.vault.getAbstractFileByPath(path) !== null;

	private async ensureRoot(): Promise<void> {
		if (!this.exists(NOTE_ROOT)) await this.app.vault.createFolder(NOTE_ROOT);
	}

	/** フォルダを作り、.gitkeep を置く */
	newFolder(parent: string): void {
		new NameModal(this.app, { title: "New folder", cta: "Create", initial: "", check: (name) => folderNameError(name) ?? (this.exists(`${parent}/${name}`) ? `${parent}/${name} がすでにあります` : null) }, async (name) => {
			await this.ensureRoot();
			const path = `${parent}/${name}`;
			await this.app.vault.createFolder(path);
			await this.app.vault.create(`${path}/${KEEP_FILE}`, "");
		}).open();
	}

	rename(folder: string): void {
		const current = folder.slice(folder.lastIndexOf("/") + 1);
		new NameModal(this.app, { title: "Rename folder", cta: "Rename", initial: current, check: (name) => (name === current ? null : errorOf(renameTarget(folder, name, this.exists))) }, async (name) => {
			if (name === current) return;
			const target = renameTarget(folder, name, this.exists);
			if ("error" in target) throw new Error(target.error);
			await this.relocate(folder, target.path);
		}).open();
	}

	/** 行き先のフォルダを選んで動かす */
	moveTo(path: string): void {
		const { folders } = collectNoteFolders(this.app);
		const choices = folders.filter((f) => !("error" in moveTarget(folders, path, f, this.exists)));
		if (choices.length === 0) {
			new Notice("動かせる先のフォルダがありません。先に New folder でフォルダを作ってください");
			return;
		}
		new FolderModal(this.app, choices, (dest) => void this.move(path, dest)).open();
	}

	/** ドラッグで落としたときにも使う */
	async move(path: string, dest: string): Promise<void> {
		const { folders } = collectNoteFolders(this.app);
		const target = moveTarget(folders, path, dest, this.exists);
		if ("error" in target) {
			new Notice(target.error);
			return;
		}
		await this.ensureRoot();
		await this.relocate(path, target.path);
	}

	/** 中に .gitkeep しかないフォルダを消す（ゴミ箱へ） */
	async deleteFolder(path: string): Promise<void> {
		const folder = this.app.vault.getAbstractFileByPath(path);
		if (!(folder instanceof TFolder)) return;
		if (!isDeletable(collectNoteFolders(this.app).files, path)) {
			new Notice("ファイルの入っているフォルダは消せません。先に中のノートを動かしてください");
			return;
		}
		await this.app.fileManager.trashFile(folder);
	}

	async open(path: string, newTab: boolean): Promise<void> {
		const file = this.app.vault.getFileByPath(path);
		if (file) await openInNotePane(this.app.workspace, file, { phone: Platform.isPhone, newTab });
	}

	private async relocate(from: string, to: string): Promise<void> {
		const node = this.app.vault.getAbstractFileByPath(from);
		if (node === null) return;
		try {
			await this.app.fileManager.renameFile(node, to);
			new Notice(`${node instanceof TFile ? node.basename : from} を ${parentOfPath(to)}/ に動かしました`);
		} catch (e) {
			new Notice(`動かせませんでした: ${e instanceof Error ? e.message : String(e)}`);
		}
	}
}

function parentOfPath(path: string): string {
	return path.slice(0, path.lastIndexOf("/"));
}

function errorOf(r: { error: string } | { path: string }): string | null {
	return "error" in r ? r.error : null;
}

/** 名前を入れるダイアログ。入れるたびに検査し、だめなら理由を出してボタンを止める */
class NameModal extends Modal {
	constructor(
		app: App,
		private readonly spec: { title: string; cta: string; initial: string; check: (name: string) => string | null },
		private readonly submit: (name: string) => Promise<void>,
	) {
		super(app);
		registerCloseKey(this);
	}

	override onOpen(): void {
		this.setTitle(this.spec.title);
		this.contentEl.addClass("vt-ui", "vt-tpl-modal");
		let value = this.spec.initial;
		const HINT = "Folder name under note/";
		const hint = createEl("p", { cls: "vt-tpl-hint", text: HINT });
		let button: HTMLButtonElement | null = null;
		const update = () => {
			const error = this.spec.check(value);
			hint.setText(error ?? HINT);
			hint.toggleClass("is-error", error !== null && value !== "");
			if (button) button.disabled = error !== null;
		};
		const run = async () => {
			if (this.spec.check(value) !== null) return;
			try {
				await this.submit(value);
				this.close();
			} catch (e) {
				new Notice(`できませんでした: ${e instanceof Error ? e.message : String(e)}`);
			}
		};
		new Setting(this.contentEl).setName("Name").addText((text) => {
			text.setValue(value).onChange((v) => {
				value = v.trim();
				update();
			});
			text.inputEl.addEventListener("keydown", (e) => {
				if (e.key === "Enter" && !e.isComposing) {
					e.preventDefault();
					void run();
				}
			});
			window.setTimeout(() => text.inputEl.select(), 0);
		});
		this.contentEl.appendChild(hint);
		new Setting(this.contentEl)
			.addButton((b) => b.setButtonText("Cancel").onClick(() => this.close()))
			.addButton((b) => {
				button = b.buttonEl;
				b.setButtonText(this.spec.cta)
					.setCta()
					.onClick(() => void run());
			});
		update();
	}

	override onClose(): void {
		this.contentEl.empty();
	}
}

class FolderModal extends FuzzySuggestModal<string> {
	constructor(
		app: App,
		private readonly folders: string[],
		private readonly choose: (folder: string) => void,
	) {
		super(app);
		registerCloseKey(this);
		this.setPlaceholder("Move to folder…");
	}

	getItems(): string[] {
		return this.folders;
	}

	getItemText(folder: string): string {
		return `${folder}/`;
	}

	onChooseItem(folder: string): void {
		this.choose(folder);
	}
}
