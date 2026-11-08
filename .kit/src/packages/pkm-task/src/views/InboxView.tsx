import { useState } from "preact/hooks";
import { isInbox } from "../core/index";
import { openCaptureModal } from "../obsidian/capture";
import type { TaskContext } from "../obsidian/context";
import { cancelIssues, closeIssues, scheduleIssues, scheduleToday, somedayIssues } from "../obsidian/issue-actions";
import { Icon } from "../ui/Icon";
import { ActionBar, IssueTable } from "../ui/IssueTable";
import { useStoreVersion } from "../ui/hooks";

/** Inbox（ADR-0009）: Inbox の一覧と、summary だけで作る入力欄 */
export function InboxView(props: { ctx: TaskContext }) {
	const { ctx } = props;
	useStoreVersion(ctx.store);
	const [draft, setDraft] = useState("");
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const issues = [...ctx.store.index.issues.values()].filter(isInbox).sort((a, b) => (b.created ?? "").localeCompare(a.created ?? ""));
	const sel = issues.filter((i) => selected.has(i.id));
	const done = () => setSelected(new Set());
	const create = (e: Event) => {
		e.preventDefault();
		const summary = draft.trim();
		if (!summary) return;
		setDraft("");
		void ctx.writer.createIssues([summary]).catch((err) => ctx.report("issue を作成できませんでした", err));
	};
	return (
		<div class="vt-page">
			<header class="vt-page-head">
				<h2 class="vt-page-title">Inbox</h2>
				<span class="vt-count">{issues.length}</span>
				<span class="vt-spacer" />
				<button class="vt-button is-primary" disabled={issues.length === 0} onClick={() => void ctx.openView("pkm-task-organize")}>
					<Icon name="layers" /> Organize で整理
				</button>
			</header>
			<form class="vt-quick-add" onSubmit={create}>
				<Icon name="plus" />
				<input type="text" placeholder="summary を入力して Enter（Inbox に入ります）" value={draft} onInput={(e) => setDraft(e.currentTarget.value)} />
				<button type="button" class="vt-button is-text" onClick={() => openCaptureModal(ctx)}>
					まとめて作成
				</button>
			</form>
			<IssueTable ctx={ctx} issues={issues} selected={selected} onSelect={setSelected} columns={["labels", "estimated", "created"]} empty="Inbox は空です" />
			<ActionBar
				count={sel.length}
				actions={[
					{ label: "Do Today", icon: "calendar-check", tone: "primary", run: () => void scheduleToday(ctx, sel).then(done) },
					{ label: "Add Do Date", icon: "calendar-plus", run: () => void scheduleIssues(ctx, sel).then(done) },
					{ label: "Someday", icon: "cloud", run: () => void somedayIssues(ctx, sel).then(done) },
					{ label: "Close", icon: "check", run: () => void closeIssues(ctx, sel).then(done) },
					{ label: "Cancel", icon: "x", run: () => void cancelIssues(ctx, sel).then(done) },
				]}
			/>
		</div>
	);
}
