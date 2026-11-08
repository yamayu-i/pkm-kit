import { useEffect, useState } from "preact/hooks";
import { labelColorError, labelNameError, labelUsage, planLabelSave, type LabelDraft } from "../core/label-edit";
import { DEFAULT_LABEL_COLOR, type LabelDef } from "../core/labels";
import type { TaskContext } from "../obsidian/context";
import { LabelBadge } from "../ui/badges";
import { NameField, RowTools, move } from "../ui/EditRow";
import { Icon } from "../ui/Icon";
import { useStoreVersion } from "../ui/hooks";

let nextKey = 1;
const toDraft = (l: LabelDef): LabelDraft => ({ key: nextKey++, from: l.name, name: l.name, color: l.color });

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** カラーピッカーに渡せる #rrggbb にする（3 桁は広げ、8 桁は透明度を落とす） */
function pickerValue(color: string): string {
	const m = HEX.exec(color);
	if (!m) return DEFAULT_LABEL_COLOR;
	const hex = m[1]!;
	if (hex.length === 3) return `#${[...hex].map((c) => c + c).join("")}`.toLowerCase();
	return `#${hex.slice(0, 6)}`.toLowerCase();
}

/**
 * Labels（ADR-0024）。label の追加・改名・色の変更・並べ替え・削除を、下書きにしてまとめて保存する。
 * 改名は、その label が付いた issue・routine・member にも反映する（ADR-0036）。使われている label は削除できない
 */
export function LabelManagerView(props: { ctx: TaskContext }) {
	const { ctx } = props;
	const version = useStoreVersion(ctx.store);
	const [drafts, setDrafts] = useState<LabelDraft[]>(() => ctx.store.index.data.labels.map(toDraft));
	const [dirty, setDirty] = useState(false);
	const [saving, setSaving] = useState(false);
	const [focusKey, setFocusKey] = useState<number | null>(null);
	useEffect(() => {
		if (!dirty) setDrafts(ctx.store.index.data.labels.map(toDraft));
	}, [version]);

	const usage = labelUsage(ctx.store.index);
	const update = (next: LabelDraft[]) => {
		setDrafts(next);
		setDirty(true);
	};
	const setLabel = (key: number, patch: Partial<LabelDraft>) => update(drafts.map((d) => (d.key === key ? { ...d, ...patch } : d)));
	const add = () => {
		const d: LabelDraft = { key: nextKey++, from: null, name: "", color: DEFAULT_LABEL_COLOR };
		setFocusKey(d.key);
		update([...drafts, d]);
	};

	const nameError = (d: LabelDraft) => labelNameError(d.name, drafts.filter((x) => x.key !== d.key).map((x) => x.name));
	const hasError = drafts.some((d) => nameError(d) !== null || labelColorError(d.color) !== null);
	const renamed = drafts.filter((d) => d.from !== null && d.from !== d.name.trim()).reduce((n, d) => n + (usage.get(d.from!) ?? 0), 0);
	const save = () => {
		setSaving(true);
		void Promise.resolve()
			.then(() => ctx.writer.saveLabels(planLabelSave(ctx.store.index.data.labels, drafts, usage)))
			.then(
				() => setDirty(false),
				(e) => ctx.report("保存できませんでした", e),
			)
			.finally(() => setSaving(false));
	};

	return (
		<div class="vt-page vt-label-manager">
			<header class="vt-page-head">
				<h2 class="vt-page-title">Labels</h2>
				<span class="vt-spacer" />
				{dirty ? (
					<button
						class="vt-button is-text"
						onClick={() => {
							setDrafts(ctx.store.index.data.labels.map(toDraft));
							setDirty(false);
						}}
					>
						Revert
					</button>
				) : (
					<span class="vt-muted">Saved</span>
				)}
				<button class="vt-button is-primary" disabled={!dirty || hasError || saving} onClick={save}>
					<Icon name="save" /> Save
				</button>
			</header>

			<div class="vt-label-editor">
				{drafts.map((d, i) => {
					const used = d.from === null ? 0 : (usage.get(d.from) ?? 0);
					const colorError = labelColorError(d.color);
					return (
						<section class="vt-card vt-label-edit" key={d.key} aria-label={`label ${d.name || "(no name)"}`}>
							<div class="vt-label-edit-fields">
								<input
									type="color"
									class="vt-color-swatch"
									value={pickerValue(d.color)}
									title="Choose color"
									aria-label="Choose color"
									onInput={(e) => setLabel(d.key, { color: e.currentTarget.value })}
								/>
								<NameField label="Name" value={d.name} error={nameError(d)} autoFocus={focusKey === d.key} onInput={(v) => setLabel(d.key, { name: v })} />
								<NameField
									label="Color"
									class="vt-color-field"
									placeholder="#rrggbb"
									value={d.color}
									error={colorError}
									autoFocus={false}
									onInput={(v) => setLabel(d.key, { color: v.trim() })}
								/>
								<RowTools
									what="label"
									index={i}
									count={drafts.length}
									onMove={(n) => update(move(drafts, i, n))}
									onDelete={() => update(drafts.filter((x) => x.key !== d.key))}
									deleteDisabled={used > 0 ? `Used by ${used} issues / routines / members, so it cannot be deleted` : undefined}
								/>
							</div>
							<div class="vt-label-edit-meta">
								<LabelBadge name={d.name.trim() || "(no name)"} color={HEX.test(d.color) ? d.color : DEFAULT_LABEL_COLOR} />
								<span class="vt-muted">{used > 0 ? `Used by ${used}` : "Unused"}</span>
								{d.from !== null && d.from !== d.name.trim() && <span class="vt-muted">(was: {d.from})</span>}
							</div>
						</section>
					);
				})}
				<button class="vt-add-group" onClick={add}>
					<Icon name="plus" /> Add label
				</button>
			</div>
			{dirty && (
				<div class="vt-banner">
					Unsaved changes
					{hasError ? " (fix the errors to save)" : renamed > 0 ? ` (saving rewrites the label on ${renamed} issues / routines / members)` : ""}
				</div>
			)}
			<p class="vt-muted">Renaming a label also rewrites it on the issues, routines and members that use it. To delete a label in use, remove it from those issues, routines and members first.</p>
		</div>
	);
}
