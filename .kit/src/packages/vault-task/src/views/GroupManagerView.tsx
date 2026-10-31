import { useEffect, useRef, useState } from "preact/hooks";
import { groupNameError, type GroupDef } from "../core/groups";
import type { TaskContext } from "../obsidian/context";
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

function move<T>(list: T[], i: number, d: number): T[] {
	const j = i + d;
	if (j < 0 || j >= list.length) return list;
	const next = [...list];
	[next[i], next[j]] = [next[j]!, next[i]!];
	return next;
}

/** 入力欄の名前の検査。同じ階層のほかの名前と比べる */
function errorOf(d: Draft, siblings: Draft[]): string | null {
	return groupNameError(
		d.name,
		siblings.filter((s) => s.key !== d.key).map(toDef),
	);
}

/** 名前の入力欄（M3 の outlined text field 風） */
function NameField(props: { value: string; label: string; error: string | null; autoFocus: boolean; onInput: (v: string) => void }) {
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (props.autoFocus) ref.current?.focus();
	}, []);
	return (
		<label class={`vt-name-field${props.error ? " is-error" : ""}`}>
			<span class="vt-name-label">{props.label}</span>
			<input ref={ref} type="text" value={props.value} placeholder="名前" onInput={(e) => props.onInput(e.currentTarget.value)} />
			{props.error && <span class="vt-name-error">{props.error}</span>}
		</label>
	);
}

function RowTools(props: { index: number; count: number; onMove: (d: number) => void; onDelete: () => void; what: string }) {
	return (
		<span class="vt-row-tools">
			<button class="vt-icon-button" title="上へ" aria-label="上へ" disabled={props.index === 0} onClick={() => props.onMove(-1)}>
				<Icon name="arrow-up" />
			</button>
			<button class="vt-icon-button" title="下へ" aria-label="下へ" disabled={props.index === props.count - 1} onClick={() => props.onMove(1)}>
				<Icon name="arrow-down" />
			</button>
			<button class="vt-icon-button" title={`${props.what}を削除`} aria-label={`${props.what}を削除`} onClick={props.onDelete}>
				<Icon name="trash-2" />
			</button>
		</span>
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
						元に戻す
					</button>
				) : (
					<span class="vt-muted">保存済み</span>
				)}
				<button class="vt-button is-primary" disabled={!dirty || hasError} onClick={save}>
					<Icon name="save" /> 保存
				</button>
			</header>

			<section class="vt-card vt-layout-preview" aria-label="ボードでの並び方">
				<span class="vt-field-label">ボードでの並び方</span>
				<div class="vt-preview-columns">
					<div class="vt-preview-col is-ungrouped">
						<span>未分類</span>
					</div>
					{drafts.map((g) => (
						<div class="vt-preview-col">
							<span>{g.name || "（名前なし）"}</span>
							{g.children.map((c) => (
								<span class="vt-preview-sub">{c.name || "（名前なし）"}</span>
							))}
						</div>
					))}
				</div>
				<span class="vt-muted">グループはボードに横に並びます（狭い画面では縦）。サブグループはグループの中に縦に並びます。</span>
			</section>

			<div class="vt-group-editor">
				{drafts.map((g, i) => (
					<section class="vt-card vt-group-edit" key={g.key}>
						<div class="vt-group-edit-head">
							<NameField
								label="グループ名"
								value={g.name}
								error={errorOf(g, drafts)}
								autoFocus={focusKey === g.key}
								onInput={(v) => setGroup(g.key, (x) => ({ ...x, name: v }))}
							/>
							<RowTools what="グループ" index={i} count={drafts.length} onMove={(d) => update(move(drafts, i, d))} onDelete={() => update(drafts.filter((x) => x.key !== g.key))} />
						</div>
						<div class="vt-sub-list">
							{g.children.map((c, j) => (
								<div class="vt-sub-edit" key={c.key}>
									<Icon name="corner-down-right" class="vt-sub-mark" />
									<NameField
										label="サブグループ名"
										value={c.name}
										error={errorOf(c, g.children)}
										autoFocus={focusKey === c.key}
										onInput={(v) => setGroup(g.key, (x) => ({ ...x, children: x.children.map((y) => (y.key === c.key ? { ...y, name: v } : y)) }))}
									/>
									<RowTools
										what="サブグループ"
										index={j}
										count={g.children.length}
										onMove={(d) => setGroup(g.key, (x) => ({ ...x, children: move(x.children, j, d) }))}
										onDelete={() => setGroup(g.key, (x) => ({ ...x, children: x.children.filter((y) => y.key !== c.key) }))}
									/>
								</div>
							))}
							<button class="vt-button is-text vt-add-sub" onClick={() => addSub(g.key)}>
								<Icon name="plus" /> サブグループを追加
							</button>
						</div>
					</section>
				))}
				<button class="vt-add-group" onClick={addGroup}>
					<Icon name="plus" /> グループを追加
				</button>
			</div>
			{dirty && <div class="vt-banner">変更はまだ保存していません{hasError ? "（名前のエラーを直すと保存できます）" : ""}</div>}
			<p class="vt-muted">グループの名前を変えても、過去のボードでそのグループに置いたカードは移りません（未分類に出ます）。</p>
		</div>
	);
}
