import { Keymap } from "obsidian";
import { useState } from "preact/hooks";
import { pathForId } from "../core/ids";
import { memberLabel, memberMatches, sortMembers } from "../core/member";
import { isDoneStatus } from "../core/status-log";
import type { TaskContext } from "../obsidian/context";
import { PreactModal } from "../obsidian/modals";
import { linkProps } from "../ui/a11y";
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

/** Members（ADR-0035）: 一覧・検索・作成 */
export function MemberListView(props: { ctx: TaskContext }) {
	const { ctx } = props;
	useStoreVersion(ctx.store);
	const index = ctx.store.index;
	const [query, setQuery] = useState("");
	const all = sortMembers(index.members.values());
	const members = all.filter((m) => memberMatches(m, query));
	const delegated = new Map<string, number>();
	for (const issue of index.issues.values()) {
		if (issue.delegatedTo !== null && !isDoneStatus(issue.status)) delegated.set(issue.delegatedTo, (delegated.get(issue.delegatedTo) ?? 0) + 1);
	}
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
				<span class="vt-count">{all.length}</span>
				<span class="vt-spacer" />
				<button class="vt-button is-primary" onClick={create}>
					<Icon name="plus" /> member を作成
				</button>
			</header>
			<label class="vt-search">
				<Icon name="search" />
				<input type="search" placeholder="@alias・nickname・name・ID で検索" value={query} onInput={(e) => setQuery(e.currentTarget.value)} />
			</label>
			{all.length === 0 && <div class="vt-empty">member はまだありません。issue を委任する相手を登録できます</div>}
			{all.length > 0 && members.length === 0 && <div class="vt-empty">一致する member はありません</div>}
			<div class="vt-routine-list">
				{members.map((m) => {
					const count = delegated.get(m.id) ?? 0;
					return (
						<div class="vt-routine-item" key={m.id}>
							<span class="vt-badge vt-id">{m.id}</span>
							<div class="vt-routine-main" {...linkProps((e) => void ctx.openPath(m.path, Keymap.isModEvent(e) !== false))}>
								<span class="vt-routine-summary">{memberLabel(m)}</span>
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
