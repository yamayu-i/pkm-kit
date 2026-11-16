import { EditorState, StateField } from "@codemirror/state";
import { describe, expect, it, vi } from "vitest";

vi.mock("obsidian", async () => {
	const { StateField } = await import("@codemirror/state");
	return {
		Keymap: { isModEvent: () => false },
		MarkdownRenderChild: class {},
		editorInfoField: StateField.define({ create: () => ({ file: { path: "note.md" } }), update: (v) => v }),
		editorLivePreviewField: StateField.define({ create: () => true, update: (v) => v }),
	};
});
import { editorInfoField, editorLivePreviewField, type App } from "obsidian";
import { chipDecorations, type ChipTarget, type LinkChip } from "../src/link-chips";

const doc = "See [i-1 a](issue/i-1.md) and [w](wiki/w.md) and [x](https://example.com)";

function run(anchor: number, live = true) {
	const seen: ChipTarget[] = [];
	const resolve = (t: ChipTarget): LinkChip | null => {
		seen.push(t);
		if (t.path.startsWith("issue/")) return { mode: "replace", key: t.path, render: () => {}, open: t.path };
		if (t.path.startsWith("wiki/")) return { mode: "before", key: t.path, render: () => {} };
		return null;
	};
	const liveField = live ? editorLivePreviewField : StateField.define({ create: () => false, update: (v) => v });
	const state = EditorState.create({ doc, selection: { anchor }, extensions: [editorInfoField as unknown as StateField<unknown>, liveField as unknown as StateField<unknown>] });
	const set = chipDecorations(state, [{ from: 0, to: doc.length }], {} as App, { resolve, subscribe: () => () => {} });
	const ranges: [number, number][] = [];
	set.between(0, doc.length, (from, to) => {
		ranges.push([from, to]);
	});
	return { ranges, seen };
}

describe("chipDecorations（ADR-0194）", () => {
	const issueFrom = doc.indexOf("[i-1");
	const issueTo = doc.indexOf(")", issueFrom) + 1;
	const wikiFrom = doc.indexOf("[w]");

	it("issue のリンクは置き換え、ノートのリンクは前に印を足す。外部は見ない", () => {
		const { ranges, seen } = run(0);
		expect(ranges).toEqual([
			[issueFrom, issueTo],
			[wikiFrom, wikiFrom],
		]);
		expect(seen.map((t) => t.path)).toEqual(["issue/i-1.md", "wiki/w.md"]);
		expect(seen[0]!.source).toBe("note.md");
	});

	it("カーソルがリンクの中にあれば、置き換えない（生の md を見せる）", () => {
		expect(run(issueFrom + 2).ranges).toEqual([[wikiFrom, wikiFrom]]);
	});

	it("ソースモードでは描き替えない", () => {
		expect(run(0, false).ranges).toEqual([]);
	});
});
