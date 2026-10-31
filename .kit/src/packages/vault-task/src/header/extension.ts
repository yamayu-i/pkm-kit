import { StateField, type EditorState, type Extension } from "@codemirror/state";
import { Decoration, EditorView, WidgetType, type DecorationSet } from "@codemirror/view";
import { editorInfoField } from "obsidian";
import { h, render } from "preact";
import type { TaskContext } from "../obsidian/context";
import { IssueHeader } from "./IssueHeader";

const ISSUE_PATH_RE = /^issue\/[^/]+\.md$/;

class HeaderWidget extends WidgetType {
	constructor(
		private readonly ctx: TaskContext,
		readonly path: string,
	) {
		super();
	}

	override eq(other: HeaderWidget): boolean {
		return other.path === this.path;
	}

	toDOM(): HTMLElement {
		const el = document.createElement("div");
		el.className = "vt-header";
		render(h(IssueHeader, { ctx: this.ctx, path: this.path }), el);
		return el;
	}

	override destroy(dom: HTMLElement): void {
		render(null, dom);
	}

	/** ヘッダーの中のクリックや入力をエディタに渡さない */
	override ignoreEvent(): boolean {
		return true;
	}
}

interface HeaderState {
	path: string | null;
	decorations: DecorationSet;
}

/**
 * issue の md を開いたとき、文書の先頭に issue 画面のヘッダーを差し込む（ADR-0008, 0012）。
 * 本文はふつうのエディタのまま。Properties 欄は CSS で隠す
 */
export function issueHeaderExtension(ctx: TaskContext): Extension {
	const pathOf = (state: EditorState): string | null => {
		const path = state.field(editorInfoField, false)?.file?.path ?? null;
		return path !== null && ISSUE_PATH_RE.test(path) ? path : null;
	};
	const build = (path: string | null): HeaderState => ({
		path,
		decorations:
			path === null ? Decoration.none : Decoration.set([Decoration.widget({ widget: new HeaderWidget(ctx, path), block: true, side: -1 }).range(0)]),
	});
	return StateField.define<HeaderState>({
		create: (state) => build(pathOf(state)),
		update(value, tr) {
			const path = pathOf(tr.state);
			if (path !== value.path) return build(path);
			return tr.docChanged ? { path, decorations: value.decorations.map(tr.changes) } : value;
		},
		provide: (field) => EditorView.decorations.from(field, (v) => v.decorations),
	});
}
