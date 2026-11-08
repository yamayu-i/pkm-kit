import { Plugin, SuggestModal, setIcon, type App, type Command } from "obsidian";
import { collectViews, matchViews, type ViewEntry } from "./views";

/**
 * pkm-task と pkm-template の一覧の View を、1 つのダイアログから探して開く（ADR-0072）。
 * どちらのプラグインも import しない。実行時にコマンドの登録から候補を集め、選んだらコマンドを ID で呼ぶ
 */

/** Obsidian の公開の型にはないが、コマンドと View の登録を読むのに使う */
interface Internals {
	commands: { commands: Record<string, Command>; executeCommandById(id: string): boolean };
	viewRegistry: { viewByType: Record<string, unknown> };
}

class ViewSelectorModal extends SuggestModal<ViewEntry> {
	constructor(
		app: App,
		private readonly entries: ViewEntry[],
		private readonly run: (entry: ViewEntry) => void,
	) {
		super(app);
		this.setPlaceholder("View を探す（Issues, Inbox, Notes …）");
		this.emptyStateText = entries.length ? "当てはまる View がありません" : "View がありません（pkm-task か pkm-template が有効になっていません）";
		this.setInstructions([
			{ command: "↑↓", purpose: "選ぶ" },
			{ command: "↵", purpose: "開く" },
			{ command: "esc", purpose: "閉じる" },
		]);
	}

	override getSuggestions(query: string): ViewEntry[] {
		return matchViews(query, this.entries);
	}

	override renderSuggestion(entry: ViewEntry, el: HTMLElement): void {
		el.addClass("mod-complex");
		const icon = el.createDiv({ cls: "suggestion-icon" }).createSpan({ cls: "suggestion-flair" });
		setIcon(icon, entry.icon ?? "layout-list");
		const content = el.createDiv({ cls: "suggestion-content" });
		content.createDiv({ cls: "suggestion-title", text: entry.name });
		content.createDiv({ cls: "suggestion-note", text: entry.plugin });
		if (entry.open) el.createDiv({ cls: "suggestion-aux" }).createSpan({ cls: "suggestion-hotkey", text: "開いている" });
	}

	override onChooseSuggestion(entry: ViewEntry): void {
		this.run(entry);
	}
}

export default class PkmViewSelectorPlugin extends Plugin {
	override onload(): void {
		this.addCommand({
			id: "open",
			name: "View を探して開く",
			icon: "layout-list",
			hotkeys: [{ modifiers: ["Mod"], key: "k" }],
			callback: () => this.openSelector(),
		});
	}

	private openSelector(): void {
		const app = this.app as unknown as App & Internals;
		const entries = collectViews(
			Object.values(app.commands.commands),
			(type) => type in app.viewRegistry.viewByType,
			(type) => app.workspace.getLeavesOfType(type).length > 0,
		);
		new ViewSelectorModal(this.app, entries, (entry) => {
			app.commands.executeCommandById(entry.commandId);
		}).open();
	}
}
