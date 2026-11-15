import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { EditorState, StateField } from "@codemirror/state";
import { Decoration, EditorView, WidgetType, keymap, type DecorationSet } from "@codemirror/view";
import { Component, MarkdownRenderer, type App } from "obsidian";
import { useEffect, useRef } from "preact/hooks";
import { notePreviewBlocks } from "../core/note-preview";

/** 編集中の段落はソース、ほかの段落は Obsidian の Markdown 描画で表示する。 */
export function NoteEditor({ app, sourcePath, initial, onChange }: { app: App; sourcePath: string; initial: string; onChange: (text: string) => void }) {
	const host = useRef<HTMLDivElement>(null);
	const changed = useRef(onChange);
	changed.current = onChange;
	useEffect(() => {
		if (!host.current) return;
		class Preview extends WidgetType {
			private component = new Component();
			constructor(readonly text: string, readonly from: number) { super(); }
			override eq(other: Preview): boolean { return other.text === this.text && other.from === this.from; }
			override toDOM(view: EditorView): HTMLElement {
				const el = document.createElement("div");
				el.className = "vt-note-preview markdown-rendered";
				this.component.load();
				void MarkdownRenderer.render(app, this.text, el, sourcePath, this.component).then(
					() => view.requestMeasure(),
					() => { el.textContent = this.text; view.requestMeasure(); },
				);
				el.addEventListener("mousedown", (event) => {
					event.preventDefault();
					view.dispatch({ selection: { anchor: this.from } });
					view.focus();
				});
				return el;
			}
			override destroy(): void { this.component.unload(); }
		}
		const decorate = (state: EditorState): DecorationSet => Decoration.set(notePreviewBlocks(state.doc.toString(), state.selection.ranges).map(({ from, to }) =>
			Decoration.replace({ widget: new Preview(state.doc.sliceString(from, to), from), block: true }).range(from, to)));
		const previews = StateField.define<DecorationSet>({
			create: decorate,
			update: (value, tr) => tr.docChanged || tr.selection ? decorate(tr.state) : value,
			provide: (field) => EditorView.decorations.from(field),
		});
		const view = new EditorView({
			parent: host.current,
			state: EditorState.create({ doc: initial, extensions: [
				history(), keymap.of([...defaultKeymap, ...historyKeymap]), EditorView.lineWrapping, previews,
				EditorView.contentAttributes.of({ "aria-label": "Note", role: "textbox", "aria-multiline": "true" }),
				EditorView.updateListener.of((update) => { if (update.docChanged) changed.current(update.state.doc.toString()); }),
			] }),
		});
		return () => view.destroy();
	}, [app, sourcePath]);
	return <div ref={host} class="vt-note-editor" />;
}
