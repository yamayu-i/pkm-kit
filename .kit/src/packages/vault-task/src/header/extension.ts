import { StateField, type EditorState, type Extension } from "@codemirror/state";
import { Decoration, EditorView, WidgetType, type DecorationSet } from "@codemirror/view";
import { editorInfoField, editorLivePreviewField } from "obsidian";
import { h, render } from "preact";
import { frontmatterRange } from "../core/issue-file";
import type { TaskContext } from "../obsidian/context";
import { IssueHeader } from "./IssueHeader";
import { RoutineHeader } from "./RoutineHeader";

const ISSUE_PATH_RE = /^issue\/[^/]+\.md$/;
const ROUTINE_PATH_RE = /^routine\/[^/]+\.md$/;

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
		render(h(ROUTINE_PATH_RE.test(this.path) ? RoutineHeader : IssueHeader, { ctx: this.ctx, path: this.path }), el);
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
	livePreview: boolean;
	decorations: DecorationSet;
}

/**
 * issue と routine の md を開いたとき、文書の先頭に画面のヘッダーを差し込む（ADR-0008, 0012, 0018）。
 * 本文はふつうのエディタのまま。Properties 欄は CSS で隠し、raw の frontmatter はヘッダーに置き換えて隠す。
 * ソースモードでは frontmatter を見せる（壊れたときに直せるように）
 */
export function issueHeaderExtension(ctx: TaskContext): Extension {
	const pathOf = (state: EditorState): string | null => {
		const path = state.field(editorInfoField, false)?.file?.path ?? null;
		return path !== null && (ISSUE_PATH_RE.test(path) || ROUTINE_PATH_RE.test(path)) ? path : null;
	};
	const livePreviewOf = (state: EditorState): boolean => state.field(editorLivePreviewField, false) === true;
	const build = (state: EditorState): HeaderState => {
		const path = pathOf(state);
		const livePreview = livePreviewOf(state);
		if (path === null) return { path, livePreview, decorations: Decoration.none };
		const widget = new HeaderWidget(ctx, path);
		const range = livePreview ? frontmatterRange(state.doc.toString()) : null;
		const decoration = range ? Decoration.replace({ widget, block: true }).range(range.from, range.to) : Decoration.widget({ widget, block: true, side: -1 }).range(0);
		return { path, livePreview, decorations: Decoration.set([decoration]) };
	};
	return StateField.define<HeaderState>({
		create: build,
		update(value, tr) {
			if (tr.docChanged || pathOf(tr.state) !== value.path || livePreviewOf(tr.state) !== value.livePreview) return build(tr.state);
			return value;
		},
		provide: (field) => [
			EditorView.decorations.from(field, (v) => v.decorations),
			// カーソルが隠した frontmatter の中に入らないようにする
			EditorView.atomicRanges.of((view) => view.state.field(field).decorations),
		],
	});
}
