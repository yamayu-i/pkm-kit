import { useEffect, useRef } from "preact/hooks";
import { Icon } from "./Icon";

/** i 番目を d だけ動かした新しい配列（端を越えるなら元のまま） */
export function move<T>(list: T[], i: number, d: number): T[] {
	const j = i + d;
	if (j < 0 || j >= list.length) return list;
	const next = [...list];
	[next[i], next[j]] = [next[j]!, next[i]!];
	return next;
}

/** 名前の入力欄（M3 の outlined text field 風） */
export function NameField(props: { value: string; label: string; error: string | null; autoFocus: boolean; onInput: (v: string) => void; placeholder?: string; class?: string }) {
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (props.autoFocus) ref.current?.focus();
	}, []);
	return (
		<label class={`vt-name-field${props.error ? " is-error" : ""}${props.class ? ` ${props.class}` : ""}`}>
			<span class="vt-name-label">{props.label}</span>
			<input ref={ref} type="text" value={props.value} placeholder={props.placeholder ?? "Name"} onInput={(e) => props.onInput(e.currentTarget.value)} />
			{props.error && <span class="vt-name-error">{props.error}</span>}
		</label>
	);
}

/** 行の上へ / 下へ / 削除。deleteDisabled を渡すと削除を押せなくし、その理由をツールチップに出す */
export function RowTools(props: { index: number; count: number; onMove: (d: number) => void; onDelete: () => void; what: string; deleteDisabled?: string }) {
	const deleteTitle = props.deleteDisabled ?? `Delete ${props.what}`;
	return (
		<span class="vt-row-tools">
			<button class="vt-icon-button" title="Move up" aria-label="Move up" disabled={props.index === 0} onClick={() => props.onMove(-1)}>
				<Icon name="arrow-up" />
			</button>
			<button class="vt-icon-button" title="Move down" aria-label="Move down" disabled={props.index === props.count - 1} onClick={() => props.onMove(1)}>
				<Icon name="arrow-down" />
			</button>
			<button class="vt-icon-button" title={deleteTitle} aria-label={deleteTitle} disabled={props.deleteDisabled !== undefined} onClick={props.onDelete}>
				<Icon name="trash-2" />
			</button>
		</span>
	);
}
