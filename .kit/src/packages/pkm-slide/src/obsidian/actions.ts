/**
 * 一覧の View の操作（ADR-0120）: フォルダを作る・名前を変える・動かす・消す、デッキを開く。
 * 動かしたら、動いた範囲のデッキの index.html の data-deck を新しいパスに書き換える（ビルドし直さずに済む）
 */
import { FuzzySuggestModal, Modal, Notice, Platform, Setting, TFile, TFolder, type App } from "obsidian";
import { openSlideInBrowser } from "../../../pkm-html/src/obsidian/open-external.ts";
import { openInNotePane } from "../../../shared/src/list-pane.ts";
import { folderLabel, markdownLink, movedDecks, moveTarget, nameError, renameTarget, retargetDeck, type SlideTree } from "../core/decks.ts";
import type { Deck } from "./model.ts";

const KEEP = ".gitkeep";

export class SlideActions {
	constructor(
		private readonly app: App,
		private readonly tree: () => SlideTree,
	) {}

	private exists = (path: string) => this.app.vault.getAbstractFileByPath(path) !== null;

	/** 整理のフォルダを作る。git は空のフォルダを残さないので .gitkeep を置く */
	newFolder(parent: string): void {
		new NameModal(this.app, { title: "New folder", cta: "Create", initial: "", check: (name) => nameError(name) ?? (this.exists(`${parent}/${name}`) ? `${parent}/${name} がすでにあります` : null) }, async (name) => {
			const path = `${parent}/${name}`;
			await this.app.vault.createFolder(path);
			await this.app.vault.create(`${path}/${KEEP}`, "");
		}).open();
	}

	rename(path: string): void {
		const current = path.slice(path.lastIndexOf("/") + 1);
		new NameModal(this.app, { title: "Rename", cta: "Rename", initial: current, check: (name) => (name === current ? null : errorOf(renameTarget(path, name, this.exists))) }, async (name) => {
			if (name === current) return;
			const target = renameTarget(path, name, this.exists);
			if ("error" in target) throw new Error(target.error);
			await this.relocate(path, target.path);
		}).open();
	}

	/** 行き先の整理のフォルダを選んで動かす */
	moveTo(path: string): void {
		const tree = this.tree();
		const choices = tree.folders.filter((f) => !("error" in moveTarget(tree, path, f, this.exists)));
		if (choices.length === 0) {
			new Notice("動かせる先のフォルダがありません。先に New folder でフォルダを作ってください");
			return;
		}
		new FolderModal(this.app, choices, (dest) => void this.move(path, dest)).open();
	}

	/** ドラッグで落としたときにも使う */
	async move(path: string, dest: string): Promise<void> {
		const target = moveTarget(this.tree(), path, dest, this.exists);
		if ("error" in target) {
			new Notice(target.error);
			return;
		}
		await this.relocate(path, target.path);
	}

	/** デッキのない整理のフォルダを消す（ゴミ箱へ） */
	async deleteFolder(path: string): Promise<void> {
		const folder = this.app.vault.getAbstractFileByPath(path);
		if (!(folder instanceof TFolder)) return;
		if (this.tree().decks.some((d) => d.path.startsWith(`${path}/`))) {
			new Notice("デッキの入っているフォルダは消せません。先にデッキを動かしてください");
			return;
		}
		await this.app.fileManager.trashFile(folder);
	}

	async open(deck: Deck, newTab: boolean): Promise<void> {
		if (deck.index === null) {
			new Notice("まだビルドしていません。PC で node .kit/bin/slide.mjs build を実行してください");
			return;
		}
		await openInNotePane(this.app.workspace, deck.index, { phone: Platform.isPhone, newTab });
	}

	openInBrowser(deck: Deck): void {
		if (deck.index === null) new Notice("まだビルドしていません。PC で node .kit/bin/slide.mjs build を実行してください");
		else openSlideInBrowser(this.app, deck.index);
	}

	async copyLink(deck: Deck): Promise<void> {
		await navigator.clipboard.writeText(markdownLink(deck.title, deck.path));
		new Notice("リンクをコピーしました");
	}

	/** フォルダ（デッキか整理のフォルダ）を動かし、その下のデッキの index.html のパスを直す */
	private async relocate(from: string, to: string): Promise<void> {
		const node = this.app.vault.getAbstractFileByPath(from);
		if (node === null) return;
		const decks = movedDecks(
			this.tree().decks.map((d) => d.path),
			from,
			to,
		);
		// ノートからのリンクは Obsidian が書き換える（alwaysUpdateLinks）
		await this.app.fileManager.renameFile(node, to);
		const failed: string[] = [];
		for (const d of decks) {
			const index = this.app.vault.getAbstractFileByPath(`${d.to}/index.html`);
			if (!(index instanceof TFile)) continue;
			let ok = true;
			await this.app.vault.process(index, (html) => {
				const next = retargetDeck(html, d.to);
				if (next === null) {
					ok = false;
					return html;
				}
				return next;
			});
			if (!ok) failed.push(d.to);
		}
		if (failed.length > 0) new Notice(`index.html のパスを直せませんでした。PC で node .kit/bin/slide.mjs build --all を実行してください: ${failed.join(", ")}`);
		else if (decks.length > 0) new Notice(`${to} に動かしました（ブラウザに残したレビューのコメントは、前の場所のものとして残ります）`);
		else new Notice(`${to} に動かしました`);
	}
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
	}

	override onOpen(): void {
		this.setTitle(this.spec.title);
		this.contentEl.addClass("vt-ui", "vt-sl-modal");
		let value = this.spec.initial;
		const HINT = "Lowercase letters, digits and hyphens (e.g. 2026-roadmap)";
		const hint = createEl("p", { cls: "vt-sl-hint", text: HINT });
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
		this.setPlaceholder("Move to folder…");
	}

	getItems(): string[] {
		return this.folders;
	}

	getItemText(folder: string): string {
		return folder === "slide" ? `slide/（${folderLabel(folder)}）` : `${folder}/`;
	}

	onChooseItem(folder: string): void {
		this.choose(folder);
	}
}
