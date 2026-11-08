import type { EditorView } from "@codemirror/view";
import {
	EditorSuggest,
	type App,
	type Editor,
	type EditorPosition,
	type EditorSuggestContext,
	type EditorSuggestTriggerInfo,
	type TFile,
} from "obsidian";
import { filterSnippets, type Snippet } from "../core/snippet";
import { renderTemplate } from "../core/template";
import type { TemplateManager } from "./creator";
import { slashSessionField } from "./snippet-session";

/** 行頭の `/` でスニペットの候補を出し、選んだものを挿入する（ADR-0060） */
export class SnippetSuggest extends EditorSuggest<Snippet> {
	/** いま候補を出しているセッション */
	private sessionId: number | null = null;
	/** Escape で閉じたか、候補を選んで終えたセッション。同じセッションでは開き直さない */
	private dismissedId: number | null = null;
	/** 最後に出した候補の数。0 件で閉じたとき（打ち直せばまた出る）と区別する */
	private shownCount = 0;
	private cache: { sessionId: number; snippets: Promise<Snippet[]> } | null = null;

	constructor(
		app: App,
		private readonly manager: TemplateManager,
	) {
		super(app);
	}

	/**
	 * Escape・候補の選択・クリックで閉じたら、そのセッションでは開き直さない。
	 * onTrigger が null を返して閉じるとき（セッションが終わった）と、候補が 0 件で閉じるときは除く
	 */
	override close(): void {
		if (this.sessionId !== null && this.shownCount > 0) this.dismissedId = this.sessionId;
		super.close();
	}

	override onTrigger(cursor: EditorPosition, editor: Editor, _file: TFile | null): EditorSuggestTriggerInfo | null {
		// Obsidian の Editor は CodeMirror 6 の EditorView を cm に持つ
		const view = (editor as unknown as { cm?: EditorView }).cm;
		const session = view?.state.field(slashSessionField, false) ?? null;
		if (!session || session.id === this.dismissedId) {
			this.sessionId = null;
			return null;
		}
		this.sessionId = session.id;
		const start = editor.offsetToPos(session.from);
		return { start, end: cursor, query: editor.getRange(start, cursor).slice(1) };
	}

	override async getSuggestions(context: EditorSuggestContext): Promise<Snippet[]> {
		const id = this.sessionId ?? -1;
		// 読み込みはセッションごとに 1 回（打つたびにファイルを読まない）
		if (!this.cache || this.cache.sessionId !== id) {
			this.cache = {
				sessionId: id,
				snippets: this.manager.loadSnippets().then(({ snippets, problems }) => {
					for (const p of problems) console.warn(`pkm-template: スニペットを読めませんでした: ${p}`);
					return snippets;
				}),
			};
		}
		const found = filterSnippets(await this.cache.snippets, context.query);
		this.shownCount = found.length;
		return found;
	}

	override renderSuggestion(snippet: Snippet, el: HTMLElement): void {
		el.setText(`${snippet.alias}: ${snippet.name}`);
	}

	override selectSuggestion(snippet: Snippet, _evt: MouseEvent | KeyboardEvent): void {
		const ctx = this.context;
		if (!ctx) return;
		const file = ctx.file;
		const rendered = renderTemplate(snippet.body, {
			now: new Date(),
			title: file?.basename ?? "",
			path: file?.path ?? "",
			folder: file?.parent && file.parent.path !== "/" ? file.parent.path : "",
			prompts: {},
			takenNames: this.manager.takenNames(),
		});
		const startOffset = ctx.editor.posToOffset(ctx.start);
		ctx.editor.replaceRange(rendered.content, ctx.start, ctx.end);
		// {{cursor}} がなければ挿入した末尾（改行は足さない）
		ctx.editor.setCursor(ctx.editor.offsetToPos(startOffset + (rendered.cursorOffset ?? rendered.content.length)));
		this.close();
	}
}
