import { StateField, type EditorState } from "@codemirror/state";
import { Decoration, EditorView, WidgetType, type DecorationSet } from "@codemirror/view";
import { MarkdownRenderChild, editorInfoField, editorLivePreviewField, type Plugin } from "obsidian";
import { h, render } from "preact";
import { cursorInsideSubArea, subAreaOffset, subAreaRole, subAreaStartLine } from "../core/sub-issue";
import type { TaskContext } from "../obsidian/context";
import { SubBody } from "../obsidian/sub-body";

const ISSUE_PATH_RE = /^issue\/[^/]+\.md$/;

/** Live Preview: 題と本文は、入力が止まって 600 ms で保存する（ADR-0158） */
const LIVE_PREVIEW_SAVE_MS = 600;

/** サブの領域の位置（文書の中。サブがなければ null） */
function areaOf(state: EditorState): { from: number; to: number } | null {
	const from = subAreaOffset(state.doc.toString());
	return from === null ? null : { from, to: state.doc.length };
}

class SubAreaWidget extends WidgetType {
	constructor(
		private readonly ctx: TaskContext,
		private readonly path: string,
	) {
		super();
	}

	// 中身はストアの変更で自分で描き直すので、同じノートの間は DOM を作り直さない（入力中のフォーカスを失わないため）
	override eq(other: SubAreaWidget): boolean {
		return other.path === this.path;
	}

	override toDOM(view: EditorView): HTMLElement {
		const dom = document.createElement("div");
		dom.className = "vt-sub-area";
		const showSource = () => {
			const area = areaOf(view.state);
			if (area) view.dispatch({ selection: { anchor: Math.min(area.from + 1, area.to) }, scrollIntoView: true });
			view.focus();
		};
		render(h(SubBody, { ctx: this.ctx, path: this.path, delayMs: LIVE_PREVIEW_SAVE_MS, onShowSource: showSource }), dom);
		return dom;
	}

	override destroy(dom: HTMLElement): void {
		render(null, dom);
	}

	// 入力欄やボタンの操作はエディタに渡さない
	override ignoreEvent(): boolean {
		return true;
	}
}

function build(ctx: TaskContext, state: EditorState): DecorationSet {
	const path = state.field(editorInfoField, false)?.file?.path;
	if (!path || !ISSUE_PATH_RE.test(path) || !state.field(editorLivePreviewField, false)) return Decoration.none;
	const area = areaOf(state);
	if (!area || cursorInsideSubArea(state.selection.main, area.from, area.to)) return Decoration.none;
	return Decoration.set([Decoration.replace({ widget: new SubAreaWidget(ctx, path), block: true }).range(area.from, area.to)]);
}

/**
 * issue の md のサブの領域（最初のマーカーから後ろ）を、アコーディオンに描く（ADR-0158。ADR-0142 の「隠す」「描き替えない」を置き換える）。
 * - Live Preview: 領域を block のウィジェットに置き換える。領域の中にカーソルがある間は、生の md を見せる。ソースモードでは描き替えない
 * - Reading: 領域の最初のセクションにアコーディオンを描き、後ろのセクションは隠す
 */
export function installSubArea(ctx: TaskContext, plugin: Plugin): void {
	plugin.registerEditorExtension(
		StateField.define<DecorationSet>({
			create: (state) => build(ctx, state),
			update: (_value, tr) => build(ctx, tr.state),
			provide: (field) => EditorView.decorations.from(field),
		}),
	);
	plugin.registerMarkdownPostProcessor((el, mctx) => {
		if (!ISSUE_PATH_RE.test(mctx.sourcePath)) return;
		const info = mctx.getSectionInfo(el);
		if (!info) return;
		const role = subAreaRole(subAreaStartLine(info.text), info.lineStart, info.lineEnd);
		if (role === "hide") el.addClass("vt-subissue-area-hidden");
		else if (role === "mount") {
			const host = el.createDiv({ cls: "vt-sub-area" });
			// リーディングは、保存でセクションが描き直されるので、欄を離れたときだけ保存する
			render(h(SubBody, { ctx, path: mctx.sourcePath, delayMs: null }), host);
			const child = new MarkdownRenderChild(host);
			child.onunload = () => render(null, host);
			mctx.addChild(child);
		}
	});
}
