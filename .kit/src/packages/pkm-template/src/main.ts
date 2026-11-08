import { Notice, Platform, Plugin } from "obsidian";
import { openListView } from "../../shared/src/list-pane.ts";
import { CreateNoteModal } from "./obsidian/CreateNoteModal";
import { TemplateManager } from "./obsidian/creator";
import { installNoteHeaders } from "./obsidian/header-mount";
import { atSessionField, slashSessionField } from "./obsidian/snippet-session";
import { INLINE_KIND, SnippetSuggest } from "./obsidian/SnippetSuggest";
import { preactViewCreator, type ViewSpec } from "./obsidian/view";
import { DailyListView, NoteListView, SourceListView } from "./views/NoteListView";

/** 一覧 View(ADR-0026)。pkm-task の View と区別するため接頭辞は pkm-template- */
const LIST_VIEWS: ViewSpec[] = [
	{ type: "pkm-template-daily-list", title: "Daily notes", icon: "calendar-days", component: DailyListView },
	{ type: "pkm-template-note-list", title: "Notes", icon: "notebook", component: NoteListView },
	{ type: "pkm-template-source-list", title: "Sources", icon: "library", component: SourceListView },
];

export default class PkmTemplatePlugin extends Plugin {
	manager!: TemplateManager;

	override async onload(): Promise<void> {
		this.manager = new TemplateManager(this.app);

		const openCreateModal = async () => {
			try {
				const templates = await this.manager.loadEnabledTemplates();
				new CreateNoteModal(this.app, this.manager, templates, (msg, err) => this.report(msg, err)).open();
			} catch (err) {
				this.report("テンプレートを読み込めませんでした", err);
			}
		};

		this.addCommand({
			id: "create-from-template",
			name: "テンプレートから新規ファイルを作成",
			callback: () => void openCreateModal(),
		});

		const openToday = async () => {
			try {
				await this.manager.openTodaysDaily();
			} catch (err) {
				this.report("今日のデイリーノートを開けませんでした", err);
			}
		};

		this.addCommand({
			id: "open-todays-daily",
			name: "今日のデイリーノートを開く",
			callback: () => void openToday(),
		});

		for (const spec of LIST_VIEWS) {
			this.registerView(spec.type, preactViewCreator(spec, this.app));
			this.addCommand({ id: `open-${spec.type.replace("pkm-template-", "")}`, name: `${spec.title} を開く`, callback: () => void this.openView(spec.type) });
		}

		// 「今日のデイリーノートを開く」のリボンは pkm-ribbon が、Daily と続けて並べる（ADR-0029）。コマンド open-todays-daily は残す
		this.addRibbonIcon("file-plus-2", "テンプレートから新規ファイルを作成", () => void openCreateModal());
		installNoteHeaders(this);
		// 行頭の / でスニペットを挿入する（ADR-0060）
		this.registerEditorExtension(slashSessionField);
		this.registerEditorSuggest(new SnippetSuggest(this.app, this.manager));
		// 行頭か半角空白の後の @ でインラインテンプレートを挿入する（ADR-0067）
		this.registerEditorExtension(atSessionField);
		this.registerEditorSuggest(new SnippetSuggest(this.app, this.manager, INLINE_KIND));
	}

	/** 一覧 View は左の固定ペインに開く（ADR-0033） */
	private async openView(type: string): Promise<void> {
		await openListView(this.app.workspace, type, { phone: Platform.isPhone });
	}

	private report(message: string, error?: unknown): void {
		if (error !== undefined) console.error(`pkm-template: ${message}`, error);
		const detail = error instanceof Error ? `: ${error.message}` : "";
		new Notice(`${message}${detail}`);
	}
}
