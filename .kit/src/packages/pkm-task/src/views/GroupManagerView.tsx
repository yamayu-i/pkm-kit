import { useEffect, useState } from "preact/hooks";
import { groupNameError, type GroupDef } from "../core/groups";
import type { TaskContext } from "../obsidian/context";
import { NameField, RowTools, move } from "../ui/EditRow";
import { Icon } from "../ui/Icon";
import { useStoreVersion } from "../ui/hooks";

/** 編集中のグループ。名前を変えても入力欄が入れ替わらないように key を持つ */
interface Draft {
	key: number;
	name: string;
	children: Draft[];
}

let nextKey = 1;
const toDraft = (g: GroupDef): Draft => ({ key: nextKey++, name: g.name, children: g.children.map(toDraft) });
const toDef = (d: Draft): GroupDef => ({ name: d.name.trim(), children: d.children.map(toDef) });

/** 入力欄の名前の検査。同じ階層のほかの名前と比べる */
function errorOf(d: Draft, siblings: Draft[]): string | null {
	return groupNameError(
		d.name,
		siblings.filter((s) => s.key !== d.key).map(toDef),
	);
}

/**
 * task group manager（ADR-0015）。グループとサブグループを、その場の入力欄で作る・名前を変える・並べ替える
 */
export function GroupManagerView(props: { ctx: TaskContext }) {
	const { ctx } = props;
	const version = useStoreVersion(ctx.store);
	const [drafts, setDrafts] = useState<Draft[]>(() => ctx.store.index.data.groups.map(toDraft));
	const [dirty, setDirty] = useState(false);
	const [focusKey, setFocusKey] = useState<number | null>(null);
	useEffect(() => {
		if (!dirty) setDrafts(ctx.store.index.data.groups.map(toDraft));
	}, [version]);

	const update = (next: Draft[]) => {
		setDrafts(next);
		setDirty(true);
	};
	const setGroup = (key: number, fn: (d: Draft) => Draft) => update(drafts.map((d) => (d.key === key ? fn(d) : d)));
	const addGroup = () => {
		const d: Draft = { key: nextKey++, name: "", children: [] };
		setFocusKey(d.key);
		update([...drafts, d]);
	};
	const addSub = (parent: number) => {
		const c: Draft = { key: nextKey++, name: "", children: [] };
		setFocusKey(c.key);
		setGroup(parent, (g) => ({ ...g, children: [...g.children, c] }));
	};

	const hasError = drafts.some((g) => errorOf(g, drafts) !== null || g.children.some((c) => errorOf(c, g.children) !== null));
	const save = () =>
		void ctx.writer.saveGroups(drafts.map(toDef)).then(
			() => setDirty(false),
			(e) => ctx.report("保存できませんでした", e),
		);

	return (
		<div class="vt-page vt-group-manager">
			<header class="vt-page-head">
				<h2 class="vt-page-title">Board groups</h2>
				<span class="vt-spacer" />
				{dirty ? (
					<button class="vt-button is-text" onClick={() => {
						setDrafts(ctx.store.index.data.groups.map(toDraft));
						setDirty(false);
					}}>
						Revert
					</button>
				) : (
					<span class="vt-muted">Saved</span>
				)}
				<button class="vt-button is-primary" disabled={!dirty || hasError} onClick={save}>
					<Icon name="save" /> Save
				</button>
			</header>

			<section class="vt-card vt-layout-preview" aria-label="Layout on the board">
				<span class="vt-field-label">Layout on the board</span>
				<div class="vt-preview-columns">
					<div class="vt-preview-col is-ungrouped">
						<span>Unsorted</span>
					</div>
					{drafts.map((g) => (
						<div class="vt-preview-col">
							<span>{g.name || "(no name)"}</span>
							{g.children.map((c) => (
								<span class="vt-preview-sub">{c.name || "(no name)"}</span>
							))}
						</div>
					))}
				</div>
				<span class="vt-muted">Groups are laid out side by side on the board (stacked on narrow screens). Subgroups stack inside their group.</span>
			</section>

			<div class="vt-group-editor">
				{drafts.map((g, i) => (
					<section class="vt-card vt-group-edit" key={g.key}>
						<div class="vt-group-edit-head">
							<NameField
								label="Group name"
								value={g.name}
								error={errorOf(g, drafts)}
								autoFocus={focusKey === g.key}
								onInput={(v) => setGroup(g.key, (x) => ({ ...x, name: v }))}
							/>
							<RowTools what="group" index={i} count={drafts.length} onMove={(d) => update(move(drafts, i, d))} onDelete={() => update(drafts.filter((x) => x.key !== g.key))} />
						</div>
						<div class="vt-sub-list">
							{g.children.map((c, j) => (
								<div class="vt-sub-edit" key={c.key}>
									<Icon name="corner-down-right" class="vt-sub-mark" />
									<NameField
										label="Subgroup name"
										value={c.name}
										error={errorOf(c, g.children)}
										autoFocus={focusKey === c.key}
										onInput={(v) => setGroup(g.key, (x) => ({ ...x, children: x.children.map((y) => (y.key === c.key ? { ...y, name: v } : y)) }))}
									/>
									<RowTools
										what="subgroup"
										index={j}
										count={g.children.length}
										onMove={(d) => setGroup(g.key, (x) => ({ ...x, children: move(x.children, j, d) }))}
										onDelete={() => setGroup(g.key, (x) => ({ ...x, children: x.children.filter((y) => y.key !== c.key) }))}
									/>
								</div>
							))}
							<button class="vt-button is-text vt-add-sub" onClick={() => addSub(g.key)}>
								<Icon name="plus" /> Add subgroup
							</button>
						</div>
					</section>
				))}
				<button class="vt-add-group" onClick={addGroup}>
					<Icon name="plus" /> Add group
				</button>
			</div>
			{dirty && <div class="vt-banner">Unsaved changes{hasError ? " (fix the name errors to save)" : ""}</div>}
			<p class="vt-muted">Renaming a group does not move cards placed in it on past boards (they show up in Unsorted).</p>
		</div>
	);
}
