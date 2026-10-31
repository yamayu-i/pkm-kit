import { useEffect, useState } from "preact/hooks";
import { BOARD_COLUMNS, type GroupDef } from "../core/groups";
import type { TaskContext } from "../obsidian/context";
import { PreactModal } from "../obsidian/modals";
import { TextForm } from "../ui/forms";
import { Icon } from "../ui/Icon";
import { useStoreVersion } from "../ui/hooks";

function move<T>(list: T[], i: number, d: number): T[] {
	const j = i + d;
	if (j < 0 || j >= list.length) return list;
	const next = [...list];
	[next[i], next[j]] = [next[j]!, next[i]!];
	return next;
}

/** task group manager（ADR-0009, 0014）: グループ（2 階層まで）の名前・順番・横幅を編集する */
export function GroupManagerView(props: { ctx: TaskContext }) {
	const { ctx } = props;
	const version = useStoreVersion(ctx.store);
	const [groups, setGroups] = useState<GroupDef[]>(ctx.store.index.data.groups);
	const [dirty, setDirty] = useState(false);
	useEffect(() => {
		if (!dirty) setGroups(ctx.store.index.data.groups);
	}, [version]);
	const update = (next: GroupDef[]) => {
		setGroups(next);
		setDirty(true);
	};
	const ask = (title: string, initial: string, fn: (name: string) => void) =>
		new PreactModal(ctx.app, title, (close) => (
			<TextForm
				initial={initial}
				onSubmit={(v) => {
					close();
					if (v && !v.includes("/")) fn(v);
					else if (v) ctx.report("グループ名に / は使えません");
				}}
			/>
		)).open();
	const save = () =>
		void ctx.writer.saveGroups(groups).then(
			() => setDirty(false),
			(e) => ctx.report("保存できませんでした", e),
		);
	const unique = (list: GroupDef[], name: string) => !list.some((g) => g.name === name);

	return (
		<div class="vt-page">
			<header class="vt-page-head">
				<h2 class="vt-page-title">Board groups</h2>
				<span class="vt-spacer" />
				<button class="vt-button" onClick={() => ask("グループを追加", "", (name) => unique(groups, name) && update([...groups, { name, span: 1, children: [] }]))}>
					<Icon name="plus" /> グループを追加
				</button>
				<button class="vt-button is-primary" disabled={!dirty} onClick={save}>
					<Icon name="save" /> 保存
				</button>
			</header>
			<p class="vt-muted">ボードは横 {BOARD_COLUMNS} 段です。グループごとに横幅（段数）を選べます。子グループはグループの中に横に並びます（2 階層まで）。</p>
			{groups.length === 0 && <div class="vt-empty">グループはまだありません。なくてもボードは「未分類」だけで使えます</div>}
			<div class="vt-group-editor">
				{groups.map((g, i) => (
					<section class="vt-card" key={g.name}>
						<div class="vt-section-head">
							<span class="vt-group-name">{g.name}</span>
							<button class="vt-icon-button" title="名前を変える" onClick={() => ask("グループ名", g.name, (name) => (name === g.name || unique(groups, name)) && update(groups.map((x, k) => (k === i ? { ...x, name } : x))))}>
								<Icon name="pencil" />
							</button>
							<span class="vt-spacer" />
							<span class="vt-field-label">横幅</span>
							<div class="vt-segmented">
								{Array.from({ length: BOARD_COLUMNS }, (_, k) => k + 1).map((n) => (
									<button class={g.span === n ? "is-on" : ""} onClick={() => update(groups.map((x, k) => (k === i ? { ...x, span: n } : x)))}>
										{n}
									</button>
								))}
							</div>
							<button class="vt-icon-button" title="上へ" disabled={i === 0} onClick={() => update(move(groups, i, -1))}>
								<Icon name="arrow-up" />
							</button>
							<button class="vt-icon-button" title="下へ" disabled={i === groups.length - 1} onClick={() => update(move(groups, i, 1))}>
								<Icon name="arrow-down" />
							</button>
							<button class="vt-icon-button" title="削除" onClick={() => update(groups.filter((_, k) => k !== i))}>
								<Icon name="trash-2" />
							</button>
						</div>
						<div class="vt-chip-row">
							{g.children.map((c, j) => (
								<span class="vt-relation">
									<span class="vt-link" onClick={() => ask("子グループ名", c.name, (name) => (name === c.name || unique(g.children, name)) && update(groups.map((x, k) => (k === i ? { ...x, children: x.children.map((y, m) => (m === j ? { ...y, name } : y)) } : x))))}>
										{c.name}
									</span>
									<button class="vt-icon-button" title="左へ" disabled={j === 0} onClick={() => update(groups.map((x, k) => (k === i ? { ...x, children: move(x.children, j, -1) } : x)))}>
										<Icon name="chevron-left" />
									</button>
									<button class="vt-icon-button" title="削除" onClick={() => update(groups.map((x, k) => (k === i ? { ...x, children: x.children.filter((_, m) => m !== j) } : x)))}>
										<Icon name="x" />
									</button>
								</span>
							))}
							<button class="vt-field-chip is-placeholder" onClick={() => ask("子グループを追加", "", (name) => unique(g.children, name) && update(groups.map((x, k) => (k === i ? { ...x, children: [...x.children, { name, span: 1, children: [] }] } : x))))}>
								<Icon name="plus" /> 子グループ
							</button>
						</div>
					</section>
				))}
			</div>
			{dirty && <div class="vt-banner">変更はまだ保存していません</div>}
		</div>
	);
}
