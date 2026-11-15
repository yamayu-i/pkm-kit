import { EditorState, StateField } from "@codemirror/state";
import { describe, expect, it, vi } from "vitest";
import type { Plugin } from "obsidian";
import { installSubCards } from "../src/header/sub-cards";
import type { TaskContext } from "../src/obsidian/context";

vi.mock("obsidian", async () => {
	const { StateField } = await import("@codemirror/state");
	const { parse } = await import("yaml");
	return {
		parseYaml: parse, Modal: class {}, SuggestModal: class {}, FuzzySuggestModal: class {},
		editorInfoField: StateField.define({ create: () => ({ file: { path: "issue/i-1.md" } }), update: v => v }),
		editorLivePreviewField: StateField.define({ create: () => true, update: v => v }),
	};
});
import { editorInfoField, editorLivePreviewField } from "obsidian";

const card = (id: string) => `<!-- sub-issue\nid: ${id}\nsummary: Task\nstatus: open\n-->`;
const text = `${card("aaaaaa")}\n\nBody\n\n${card("bbbbbb")}\n\n`;

function create(anchor: number) {
	let field: StateField<any>;
	const ctx = { settings: { subOpen: {} }, store: { subscribe: () => () => {} } } as unknown as TaskContext;
	installSubCards(ctx, {
		registerEditorExtension: (f: unknown[]) => { field = f.find((x) => x instanceof StateField) as StateField<any>; },
		registerMarkdownPostProcessor: () => {},
		registerDomEvent: () => {},
		register: () => {},
	} as unknown as Plugin);
	const state = EditorState.create({ doc: text, selection: { anchor }, extensions: [editorInfoField, editorLivePreviewField, field!] });
	const ranges: [number, number][] = [];
	state.field(field!).all.between(0, text.length, (from: number, to: number) => { ranges.push([from, to]); });
	return ranges;
}

describe("閉じたサブのカード", () => {
	it("空行まで置き換え、レコード間に空行だけを残さない", () => {
		// カーソルは最後のサブ内。最初のサブの置き換えは次のカードの直前まで。
		const ranges = create(text.length);
		expect(ranges).toContainEqual([0, text.indexOf("<!-- sub-issue", 1) - 1]);
	});
	it("本文にカーソルを入れたら本文を隠さない", () => {
		const cursor = text.indexOf("Body") + 1;
		expect(create(cursor).some(([from, to]) => from <= cursor && to >= cursor)).toBe(false);
	});
});
