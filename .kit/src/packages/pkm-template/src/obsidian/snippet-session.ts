import { StateField } from "@codemirror/state";
import { nextSlashSession, type SlashSession } from "../core/snippet";

let lastId = 0;
const newId = () => ++lastId;

/** 入力で `/` を 1 文字だけ挿入した位置（変更のあと）。IME の確定（input.type.compose）も入力に数える */
function typedSlashAt(tr: import("@codemirror/state").Transaction): number | null {
	if (!tr.docChanged || !tr.isUserEvent("input.type")) return null;
	let at: number | null = null;
	let count = 0;
	tr.changes.iterChanges((fromA, toA, fromB, _toB, inserted) => {
		count++;
		if (fromA === toA && inserted.toString() === "/") at = fromB;
	});
	return count === 1 ? at : null;
}

/** 行頭で打った `/` のセッション（ADR-0060）。選択だけの変更でも更新し、範囲の外に出たら終わる */
export const slashSessionField = StateField.define<SlashSession | null>({
	create: () => null,
	update(prev, tr) {
		if (!tr.docChanged && !tr.selection) return prev;
		const doc = tr.state.doc;
		const sel = tr.state.selection.main;
		return nextSlashSession(
			prev,
			{ typedSlashAt: typedSlashAt(tr), mapPos: (p) => tr.changes.mapPos(p, 1), head: sel.head, empty: sel.empty },
			{ lineStartAt: (pos) => doc.lineAt(pos).from, slice: (from, to) => doc.sliceString(from, to) },
			newId,
		);
	},
});
