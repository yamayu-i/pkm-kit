import { EditorSelection, EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { atSessionField, slashSessionField } from "../src/obsidian/snippet-session";

const start = (doc: string, cursor: number) =>
	EditorState.create({ doc, selection: EditorSelection.cursor(cursor), extensions: [slashSessionField, atSessionField] });

/** カーソルの位置に文字を打つ（Obsidian の入力と同じ userEvent） */
const type = (state: EditorState, text: string) => {
	const at = state.selection.main.head;
	return state.update({ changes: { from: at, insert: text }, selection: EditorSelection.cursor(at + text.length), userEvent: "input.type" }).state;
};
const moveTo = (state: EditorState, pos: number) => state.update({ selection: EditorSelection.cursor(pos), userEvent: "select" }).state;
const session = (state: EditorState) => state.field(slashSessionField);

describe("slashSessionField", () => {
	it("行頭で / を打つと始まり、続けて打つあいだ続く", () => {
		let s = type(start("abc\n", 4), "/");
		expect(session(s)).toMatchObject({ from: 4 });
		s = type(type(s, "t"), "1");
		expect(session(s)).toMatchObject({ from: 4 });
	});

	it("貼り付けや、行頭でない / では始まらない", () => {
		const pasted = start("", 0).update({ changes: { from: 0, insert: "/" }, selection: EditorSelection.cursor(1), userEvent: "input.paste" }).state;
		expect(session(pasted)).toBeNull();
		expect(session(type(start(" ", 1), "/"))).toBeNull();
		expect(session(type(start("a", 1), "/"))).toBeNull();
	});

	it("別の行へ移ってから戻っても、もう始まらない", () => {
		let s = type(start("x\n", 2), "/");
		s = moveTo(s, 0);
		expect(session(s)).toBeNull();
		s = moveTo(s, 3);
		expect(session(s)).toBeNull();
	});

	it("空白を打つと終わる", () => {
		expect(session(type(type(start("", 0), "/"), " "))).toBeNull();
	});
});

describe("atSessionField（ADR-0067）", () => {
	const atSession = (state: EditorState) => state.field(atSessionField);

	it("行頭か半角空白の後で @ を打つと始まり、/ のセッションとは別に動く", () => {
		let s = type(start("会議は ", 4), "@");
		expect(atSession(s)).toMatchObject({ from: 4 });
		expect(session(s)).toBeNull();
		s = type(type(s, "d"), "a");
		expect(atSession(s)).toMatchObject({ from: 4 });
		expect(atSession(type(start("", 0), "@"))).toMatchObject({ from: 0 });
	});

	it("文字の直後の @ や、貼り付けでは始まらない", () => {
		expect(atSession(type(start("foo", 3), "@"))).toBeNull();
		const pasted = start(" ", 1).update({ changes: { from: 1, insert: "@" }, selection: EditorSelection.cursor(2), userEvent: "input.paste" }).state;
		expect(atSession(pasted)).toBeNull();
	});
});
