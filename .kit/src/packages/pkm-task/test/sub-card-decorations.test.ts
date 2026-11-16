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

function build(anchor: number, subOpen: Record<string, unknown> = {}) {
	let field: StateField<any>;
	const ctx = { settings: { subOpen }, store: { subscribe: () => () => {} } } as unknown as TaskContext;
	installSubCards(ctx, {
		registerEditorExtension: (f: unknown[]) => { field = f.find((x) => x instanceof StateField) as StateField<any>; },
		registerMarkdownPostProcessor: () => {},
		registerDomEvent: () => {},
		register: () => {},
	} as unknown as Plugin);
	const state = EditorState.create({ doc: text, selection: { anchor }, extensions: [editorInfoField, editorLivePreviewField, field!] });
	return state.field(field!).all as import("@codemirror/view").DecorationSet;
}

function create(anchor: number) {
	const ranges: [number, number][] = [];
	build(anchor).between(0, text.length, (from: number, to: number) => { ranges.push([from, to]); });
	return ranges;
}

/** 本文の最後の行の下に余白を置く行（class が vt-sub-body-end の行の先頭） */
function bodyEnds(subOpen: Record<string, unknown>) {
	const lines: number[] = [];
	build(text.length, subOpen).between(0, text.length, (from: number, _to: number, d: any) => {
		if (d.spec.class === "vt-sub-body-end") lines.push(from);
	});
	return lines;
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

describe("開いたサブの本文と次の題の間の余白", () => {
	it("開いたサブの本文の最後の行に付ける", () => {
		const open = { "issue/i-1.md": ["aaaaaa"] };
		expect(bodyEnds(open)).toEqual([text.indexOf("Body")]);
	});
	it("閉じたサブには付けない", () => {
		expect(bodyEnds({})).toEqual([]);
	});
});
