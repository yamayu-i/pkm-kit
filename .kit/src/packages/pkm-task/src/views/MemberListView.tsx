import { Keymap } from "obsidian";
import { useState } from "preact/hooks";
import { pathForId } from "../core/ids";
import { MEMBER_SORTS, defaultMemberQuery, memberLabel, queryMembers, type MemberQuery, type MemberSortKey } from "../core/member";
import { DEFAULT_LABEL_COLOR } from "../core/labels";
import { isDoneStatus } from "../core/status-log";
import type { TaskContext } from "../obsidian/context";
import { PreactModal } from "../obsidian/modals";
import { linkProps } from "../ui/a11y";
import { LabelBadge } from "../ui/badges";
import { FilterChip, toggle } from "../ui/FilterChip";
import { Icon } from "../ui/Icon";
import { useStoreVersion } from "../ui/hooks";

/** member を作るフォーム。入れた名前が name と nickname に、ID が alias に入る（ADR-0035） */
function MemberForm(props: { onSubmit: (name: string) => void }) {
	const [name, setName] = useState("");
	return (
		<form
			class="vt-worklog-form"
			onSubmit={(e) => {
				e.preventDefault();
				if (name.trim()) props.onSubmit(name.trim());
			}}
		>
			<label class="vt-text-field">
				<span>name</span>
				<input type="text" value={name} placeholder="例: 田中 太郎" ref={(el) => el?.focus()} onInput={(e) => setName(e.currentTarget.value)} />
			</label>
			<div class="vt-muted">nickname にも同じ名前が、alias には ID が入ります。作った後に member の画面で直せます</div>
			<div class="vt-form">
				<button type="submit" class="mod-cta" disabled={!name.trim()}>
					作成
				</button>
			</div>
		</form>
	);
}

/** Members（ADR-0035, 0036）: 一覧・検索・label での絞り込み・並べ替え・作成 */
export function MemberListView(props: { ctx: TaskContext }) {
	const { ctx } = props;
	useStoreVersion(ctx.store);
	const index = ctx.store.index;
	// 絞り込みと並べ替えは、View を開いているあいだだけ持つ（ADR-0036）
	const [q, setQ] = useState<MemberQuery>(defaultMemberQuery);
	const set = (patch: Partial<MemberQuery>) => setQ({ ...q, ...patch });
	const delegated = new Map<string, number>();
	for (const issue of index.issues.values()) {
		if (issue.delegatedTo !== null && !isDoneStatus(issue.status)) delegated.set(issue.delegatedTo, (delegated.get(issue.delegatedTo) ?? 0) + 1);
	}
	const total = index.members.size;
	const members = queryMembers(index.members.values(), q, delegated);
	const colors = new Map(index.data.labels.map((l) => [l.name, l.color]));
	const labels = index.data.labels.map((l) => l.name);
	const create = () =>
		new PreactModal(ctx.app, "member を作成", (close) => (
			<MemberForm
				onSubmit={(name) => {
					close();
					void ctx.writer
						.createMember(name)
						.then((id) => ctx.openPath(pathForId(id)))
						.catch((e) => ctx.report("member を作れませんでした", e));
				}}
			/>
		)).open();
	return (
		<div class="vt-page">
			<header class="vt-page-head">
				<h2 class="vt-page-title">Members</h2>
				<span class="vt-count">{total}</span>
				<span class="vt-spacer" />
				<button class="vt-button is-primary" onClick={create}>
					<Icon name="plus" /> member を作成
				</button>
			</header>
			<section class="vt-card vt-filters">
				<label class="vt-search">
					<Icon name="search" />
					<input type="search" placeholder="@alias・nickname・name・ID で検索" value={q.text} onInput={(e) => set({ text: e.currentTarget.value })} />
				</label>
				{labels.length > 0 && (
					<div class="vt-filter-row">
						<span class="vt-field-label">label</span>
						{labels.map((l) => (
							<FilterChip label={l} on={q.labels.includes(l)} onClick={() => set({ labels: toggle(q.labels, l) })} />
						))}
					</div>
				)}
				<div class="vt-filter-row">
					<span class="vt-spacer" />
					<span class="vt-field-label">並び替え</span>
					<select class="dropdown" value={q.sort} onChange={(e) => set({ sort: e.currentTarget.value as MemberSortKey })}>
						{MEMBER_SORTS.map((s) => (
							<option value={s.key}>{s.label}</option>
						))}
					</select>
					<button class="vt-icon-button" title={q.desc ? "降順" : "昇順"} aria-label={q.desc ? "降順" : "昇順"} onClick={() => set({ desc: !q.desc })}>
						<Icon name={q.desc ? "arrow-down-wide-narrow" : "arrow-up-narrow-wide"} />
					</button>
					<button class="vt-button is-text" onClick={() => setQ(defaultMemberQuery())}>
						リセット
					</button>
				</div>
			</section>
			{total === 0 && <div class="vt-empty">member はまだありません。issue を委任する相手を登録できます</div>}
			{total > 0 && members.length === 0 && <div class="vt-empty">条件に合う member はありません</div>}
			<div class="vt-routine-list">
				{members.map((m) => {
					const count = delegated.get(m.id) ?? 0;
					return (
						<div class="vt-routine-item" key={m.id}>
							<span class="vt-badge vt-id">{m.id}</span>
							<div class="vt-routine-main" {...linkProps((e) => void ctx.openPath(m.path, Keymap.isModEvent(e) !== false))}>
								<span class="vt-routine-summary">{memberLabel(m)}</span>
								{m.labels.length > 0 && (
									<span class="vt-member-row-labels">
										{m.labels.map((l) => (
											<LabelBadge name={l} color={colors.get(l) ?? DEFAULT_LABEL_COLOR} />
										))}
									</span>
								)}
							</div>
							<span class="vt-muted" title="委任中（closed / canceled でない）の issue の数">
								委任中 {count}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
