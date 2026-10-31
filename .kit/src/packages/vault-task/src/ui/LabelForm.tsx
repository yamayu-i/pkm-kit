import { useState } from "preact/hooks";
import type { LabelDef } from "../core/labels";

/** label を複数選ぶ。新しい label も作れる（ADR-0007） */
export function LabelForm(props: {
	labels: LabelDef[];
	initial: string[];
	onCreate: (name: string) => Promise<void>;
	onSubmit: (names: string[]) => void;
	onError: (e: unknown) => void;
}) {
	const [selected, setSelected] = useState(new Set(props.initial));
	const [extra, setExtra] = useState<string[]>([]);
	const [draft, setDraft] = useState("");
	const names = [...props.labels.map((l) => l.name), ...extra.filter((n) => !props.labels.some((l) => l.name === n))];
	// labels.json にないが issue に付いている label も外せるように出す
	for (const n of props.initial) if (!names.includes(n)) names.push(n);
	const toggle = (name: string) => {
		const next = new Set(selected);
		if (next.has(name)) next.delete(name);
		else next.add(name);
		setSelected(next);
	};
	const create = (e: Event) => {
		e.preventDefault();
		const name = draft.trim();
		if (!name) return;
		props
			.onCreate(name)
			.then(() => {
				setExtra([...extra, name]);
				setSelected(new Set([...selected, name]));
				setDraft("");
			})
			.catch(props.onError);
	};
	return (
		<div class="vt-label-form">
			<div class="vt-label-list">
				{names.map((name) => (
					<label class="vt-check">
						<input type="checkbox" checked={selected.has(name)} onChange={() => toggle(name)} />
						{name}
					</label>
				))}
			</div>
			<form class="vt-form" onSubmit={create}>
				<input type="text" placeholder="新しい label" value={draft} onInput={(e) => setDraft(e.currentTarget.value)} />
				<button type="submit">追加</button>
			</form>
			<div class="vt-form">
				<button class="mod-cta" onClick={() => props.onSubmit(names.filter((n) => selected.has(n)))}>
					保存
				</button>
			</div>
		</div>
	);
}
