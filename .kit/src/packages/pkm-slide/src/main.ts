/**
 * pkm-slide: slide/ のスライド（ADR-0117）を Obsidian の中で一覧し、整理のフォルダを作ってデッキを動かす（ADR-0120）。
 * 発表者ノートを編集し、プラグインの中でビルドし直す（ADR-0132）。
 * デッキを書くのは Claude Code と CLI（.kit/bin/slide.mjs）。ほかのプラグインには実行時に依存しない
 */
import { Platform, Plugin } from "obsidian";
import { openListView, openViewInNotePane } from "../../shared/src/list-pane.ts";
import { deckOfFile } from "./core/decks.ts";
import { SlideActions } from "./obsidian/actions.ts";
import { SlideModel } from "./obsidian/model.ts";
import { NOTES_VIEW_TYPE, SlideNotesView } from "./obsidian/notes-view.ts";
import { preactViewCreator } from "./obsidian/view.ts";
import { SlidesView } from "./views/SlidesView.tsx";

/** View の型。一覧ペインの接頭辞 pkm-slide- を持つ（ADR-0033）。開くコマンドは pkm-slide:open-list（pkm-view-selector が集める） */
export const VIEW_TYPE = "pkm-slide-list";

export default class PkmSlidePlugin extends Plugin {
	private model: SlideModel | null = null;

	override async onload(): Promise<void> {
		const model = new SlideModel(this.app);
		this.model = model;
		const actions = new SlideActions(this.app, () => model.snapshot.tree);
		this.registerView(VIEW_TYPE, preactViewCreator({ type: VIEW_TYPE, title: "Slides", icon: "presentation" }, SlidesView, { app: this.app, model, actions }));
		this.addCommand({ id: "open-list", name: "Open Slides", icon: "presentation", callback: () => void openListView(this.app.workspace, VIEW_TYPE, { phone: Platform.isPhone }) });
		this.registerView(NOTES_VIEW_TYPE, (leaf) => new SlideNotesView(leaf));
		// 開いているデッキ（pkm-html で開いた index.html か、deck.html）の発表者ノートを編集する
		this.addCommand({
			id: "edit-notes",
			name: "Edit slide notes",
			icon: "notebook-pen",
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				const deck = file ? deckOfFile(file.path) : null;
				if (deck === null) return false;
				if (!checking) void openViewInNotePane(this.app.workspace, { type: NOTES_VIEW_TYPE, state: { deck } }, { phone: Platform.isPhone, newTab: true });
				return true;
			},
		});
		this.app.workspace.onLayoutReady(() => {
			void model.load((ref) => this.registerEvent(ref)).catch((e) => console.error("pkm-slide: スライドの一覧を作れませんでした", e));
		});
	}

	override onunload(): void {
		this.model?.unload();
	}
}
