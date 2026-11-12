/**
 * pkm-slide: slide/ のスライド（ADR-0117）を Obsidian の中で一覧し、整理のフォルダを作ってデッキを動かす（ADR-0120）。
 * デッキを書く・ビルドするのは Claude Code と CLI（.kit/bin/slide.mjs）。ほかのプラグインには実行時に依存しない
 */
import { Platform, Plugin } from "obsidian";
import { openListView } from "../../shared/src/list-pane.ts";
import { SlideActions } from "./obsidian/actions.ts";
import { SlideModel } from "./obsidian/model.ts";
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
		this.app.workspace.onLayoutReady(() => {
			void model.load((ref) => this.registerEvent(ref)).catch((e) => console.error("pkm-slide: スライドの一覧を作れませんでした", e));
		});
	}

	override onunload(): void {
		this.model?.unload();
	}
}
