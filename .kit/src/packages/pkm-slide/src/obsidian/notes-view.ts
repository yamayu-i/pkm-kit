/**
 * 発表者ノートの編集の画面「Edit notes」（ADR-0132）。ノートペインに開く View で、状態にデッキのパスを持つ。
 * 中身は preact の NotesView。保存していない変更があるまま閉じる・別のデッキにするときは、保存するかを確かめる
 */
import { ItemView, Modal, Scope, Setting, type App, type ViewStateResult, type WorkspaceLeaf } from "obsidian";
import { h, render } from "preact";
import { baseName } from "../core/decks.ts";
import { NotesView, type NotesController } from "../views/NotesView.tsx";

export const NOTES_VIEW_TYPE = "pkm-slide-notes";

export interface NotesViewState extends Record<string, unknown> {
	deck: string;
}

export class SlideNotesView extends ItemView {
	private deck = "";
	private controller: NotesController | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		this.scope = new Scope(this.app.scope);
		this.scope.register(["Mod"], "s", () => {
			void this.controller?.save();
			return false;
		});
	}

	getViewType(): string {
		return NOTES_VIEW_TYPE;
	}

	getDisplayText(): string {
		return this.deck === "" ? "Notes" : `Notes: ${baseName(this.deck)}`;
	}

	override getIcon(): string {
		return "notebook-pen";
	}

	override getState(): Record<string, unknown> {
		return { deck: this.deck };
	}

	override async setState(state: unknown, result: ViewStateResult): Promise<void> {
		const deck = typeof (state as NotesViewState | null)?.deck === "string" ? (state as NotesViewState).deck : "";
		if (deck !== this.deck) {
			await this.confirmUnsaved();
			this.deck = deck;
			this.mount();
		}
		await super.setState(state, result);
	}

	override async onOpen(): Promise<void> {
		this.contentEl.addClass("vt-ui", "vt-sl-view");
		this.mount();
	}

	override async onClose(): Promise<void> {
		await this.confirmUnsaved();
		render(null, this.contentEl);
	}

	private mount(): void {
		this.controller = null;
		render(null, this.contentEl);
		if (this.deck === "") return;
		render(
			h(NotesView, {
				app: this.app,
				deckPath: this.deck,
				register: (c: NotesController | null) => {
					this.controller = c;
				},
			}),
			this.contentEl,
		);
		// タブの題をデッキの名前にする
		(this.leaf as WorkspaceLeaf & { updateHeader?: () => void }).updateHeader?.();
	}

	/** 閉じるのは止められないので、保存するか捨てるかだけを確かめる */
	private async confirmUnsaved(): Promise<void> {
		const c = this.controller;
		if (!c || !c.isDirty()) return;
		if (await confirmSave(this.app, this.deck)) await c.save();
	}
}

function confirmSave(app: App, deck: string): Promise<boolean> {
	return new Promise((resolve) => {
		let answered = false;
		const modal = new (class extends Modal {
			override onOpen(): void {
				this.setTitle("Unsaved notes");
				this.contentEl.addClass("vt-ui", "vt-sl-modal");
				this.contentEl.createEl("p", { text: `${baseName(deck)} の発表者ノートに、保存していない変更があります。` });
				const answer = (value: boolean) => {
					answered = true;
					resolve(value);
					this.close();
				};
				new Setting(this.contentEl)
					.addButton((b) => b.setButtonText("Discard").onClick(() => answer(false)))
					.addButton((b) => b.setButtonText("Save").setCta().onClick(() => answer(true)));
			}

			override onClose(): void {
				if (!answered) resolve(true);
			}
		})(app);
		modal.open();
	});
}
