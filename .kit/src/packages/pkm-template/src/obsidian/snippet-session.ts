import { StateField, type Transaction } from "@codemirror/state";
import { AT_TRIGGER, nextTriggerSession, SLASH_TRIGGER, type SessionTrigger, type SlashSession } from "../core/snippet";

let lastId = 0;
const newId = () => ++lastId;

/** 入力で char を 1 文字だけ挿入した位置（変更のあと）。IME の確定（input.type.compose）も入力に数える */
function typedCharAt(tr: Transaction, char: string): number | null {
	if (!tr.docChanged || !tr.isUserEvent("input.type")) return null;
	let at: number | null = null;
	let count = 0;
	tr.changes.iterChanges((fromA, toA, fromB, _toB, inserted) => {
		count++;
		if (fromA === toA && inserted.toString() === char) at = fromB;
	});
	return count === 1 ? at : null;
}

/** きっかけの文字から続く入力のセッション。選択だけの変更でも更新し、範囲の外に出たら終わる */
function sessionField(trigger: SessionTrigger) {
	return StateField.define<SlashSession | null>({
		create: () => null,
		update(prev, tr) {
			if (!tr.docChanged && !tr.selection) return prev;
			const doc = tr.state.doc;
			const sel = tr.state.selection.main;
			return nextTriggerSession(
				trigger,
				prev,
				{ typedAt: typedCharAt(tr, trigger.char), mapPos: (p) => tr.changes.mapPos(p, 1), head: sel.head, empty: sel.empty },
				{ lineStartAt: (pos) => doc.lineAt(pos).from, slice: (from, to) => doc.sliceString(Math.max(0, from), to) },
				newId,
			);
		},
	});
}

/** 行頭で打った `/` のセッション（ADR-0060） */
export const slashSessionField = sessionField(SLASH_TRIGGER);
/** 行頭か半角空白の直後で打った `@` のセッション（ADR-0067） */
export const atSessionField = sessionField(AT_TRIGGER);
