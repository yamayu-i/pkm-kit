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
import type { StateField } from "@codemirror/state";
import { filterSnippets, inlineBody, type SlashSession, type Snippet } from "../core/snippet";
import { extractDatePrompts, renderTemplate } from "../core/template";
import type { TemplateManager } from "./creator";
import { askDates } from "./DatePromptModal";
import { atSessionField, slashSessionField } from "./snippet-session";

/** 候補の出し方。スニペット（`/`）とインラインテンプレート（`@`）で違うところ */
export interface SnippetSuggestKind {
	/** コンソールに出す呼び名 */
	label: string;
	/** きっかけの文字（`/` か `@`）からのセッション */
	field: StateField<SlashSession | null>;
	load(manager: TemplateManager): Promise<{ snippets: Snippet[]; problems: string[] }>;
	/** 挿入する本文（展開の前） */
	bodyOf(snippet: Snippet): string;
}

/** 行頭の `/` でスニペット（ADR-0060） */
export const SNIPPET_KIND: SnippetSuggestKind = {
	label: "スニペット",
	field: slashSessionField,
	load: (m) => m.loadSnippets(),
	bodyOf: (s) => s.body,
};

/** 行頭か半角空白の後の `@` でインラインテンプレート（ADR-0067）。ファイルの終わりの改行は入れない */
export const INLINE_KIND: SnippetSuggestKind = {
	label: "インラインテンプレート",
	field: atSessionField,
	load: (m) => m.loadInlineTemplates(),
	bodyOf: (s) => inlineBody(s.body),
};

/** きっかけの文字で候補を出し、選んだものを挿入する（ADR-0060、ADR-0067） */
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
		private readonly kind: SnippetSuggestKind = SNIPPET_KIND,
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
		const session = view?.state.field(this.kind.field, false) ?? null;
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
				snippets: this.kind.load(this.manager).then(({ snippets, problems }) => {
					for (const p of problems) console.warn(`pkm-template: ${this.kind.label}を読めませんでした: ${p}`);
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
		const { editor, file, start, end } = ctx;
		this.close();
		const body = this.kind.bodyOf(snippet);
		// {{prompt-date}} があれば、挿入の前に日付を尋ねる。キャンセルなら挿入せず、打った /… や @… を残す（ADR-0065）
		void askDates(this.app, extractDatePrompts(body)).then((dates) => {
			if (dates === null) {
				editor.focus();
				return;
			}
			const rendered = renderTemplate(body, {
				now: new Date(),
				title: file?.basename ?? "",
				path: file?.path ?? "",
				folder: file?.parent && file.parent.path !== "/" ? file.parent.path : "",
				prompts: {},
				takenNames: this.manager.takenNames(),
				dates,
			});
			const startOffset = editor.posToOffset(start);
			editor.replaceRange(rendered.content, start, end);
			// {{cursor}} がなければ挿入した末尾（改行は足さない）
			editor.setCursor(editor.offsetToPos(startOffset + (rendered.cursorOffset ?? rendered.content.length)));
			editor.focus();
		});
	}
}
