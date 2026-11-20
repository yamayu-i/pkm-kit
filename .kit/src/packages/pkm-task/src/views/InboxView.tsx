import { useState } from "preact/hooks";
import { localToday } from "../core/dates";
import { openCaptureModal } from "../obsidian/capture";
import type { TaskContext } from "../obsidian/context";
import { cancelIssues, closeIssues, nextIssues, somedayIssues, ticklerIssues } from "../obsidian/issue-actions";
import { Icon } from "../ui/Icon";
import { ActionBar, IssueTable } from "../ui/IssueTable";
import { useStoreVersion } from "../ui/hooks";
import { canApplyAll } from "../core/transition";

/** Inbox（ADR-0009, 0148, 0152）: Inbox の一覧と、summary だけで作る入力欄 */
export function InboxView(props: { ctx: TaskContext }) {
	const { ctx } = props;
	useStoreVersion(ctx.store);
	const [draft, setDraft] = useState("");
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const today = localToday();
	const issues = [...ctx.store.index.issues.values()].filter((i) => ctx.store.index.inbox(i, today)).sort((a, b) => (b.created ?? "").localeCompare(a.created ?? ""));
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
					<Icon name="layers" /> Organize
				</button>
			</header>
			<form class="vt-quick-add" onSubmit={create}>
				<Icon name="plus" />
				<input type="text" placeholder="Type a summary and press Enter (goes to Inbox)" value={draft} onInput={(e) => setDraft(e.currentTarget.value)} />
				<button type="button" class="vt-button is-text" onClick={() => openCaptureModal(ctx)}>
					Capture
				</button>
			</form>
			<IssueTable ctx={ctx} issues={issues} selected={selected} onSelect={setSelected} columns={["labels", "estimated", "created"]} empty="Inbox is empty" />
			<ActionBar
				count={sel.length}
				actions={[
					{ label: "Next", icon: "list-todo", tone: "primary", run: () => void nextIssues(ctx, sel).then(done) },
					{ label: "Tickler", icon: "alarm-clock", disabled: !canApplyAll(sel.map((i) => i.status), "tickler"), run: () => void ticklerIssues(ctx, sel).then(done) },
					{ label: "Someday", icon: "cloud", disabled: !canApplyAll(sel.map((i) => i.status), "someday"), run: () => void somedayIssues(ctx, sel).then(done) },
					{ label: "Close", icon: "check", disabled: !canApplyAll(sel.map((i) => i.status), "closed"), run: () => void closeIssues(ctx, sel).then(done) },
					{ label: "Cancel", icon: "x", disabled: !canApplyAll(sel.map((i) => i.status), "canceled"), run: () => void cancelIssues(ctx, sel).then(done) },
				]}
			/>
		</div>
	);
}
