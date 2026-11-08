import { useState } from "preact/hooks";
import { reopenPatch } from "../core/actions";
import type { Issue } from "../core/schema";
import type { TaskContext } from "../obsidian/context";
import { askDate, cancelIssues, scheduleIssues } from "../obsidian/issue-actions";
import { Icon } from "../ui/Icon";
import { ActionBar, IssueTable } from "../ui/IssueTable";
import { useStoreVersion } from "../ui/hooks";

type Order = "reviewed" | "revisit" | "created";

const ORDERS: { key: Order; label: string }[] = [
	{ key: "reviewed", label: "見直した日が古い順" },
	{ key: "revisit", label: "revisit が近い順" },
	{ key: "created", label: "作成日が新しい順" },
];

function sortSomeday(issues: Issue[], order: Order): Issue[] {
	const nullsFirst = (a: string | null, b: string | null) => (a === b ? 0 : a === null ? -1 : b === null ? 1 : a.localeCompare(b));
	const nullsLast = (a: string | null, b: string | null) => (a === b ? 0 : a === null ? 1 : b === null ? -1 : a.localeCompare(b));
	return [...issues].sort((a, b) =>
		order === "reviewed" ? nullsFirst(a.reviewed, b.reviewed) : order === "revisit" ? nullsLast(a.revisit, b.revisit) : (b.created ?? "").localeCompare(a.created ?? ""),
	);
}

/** Someday List（ADR-0006, 0009） */
export function SomedayView(props: { ctx: TaskContext }) {
	const { ctx } = props;
	useStoreVersion(ctx.store);
	const [order, setOrder] = useState<Order>("reviewed");
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const issues = sortSomeday(
		[...ctx.store.index.issues.values()].filter((i) => i.status === "someday"),
		order,
	);
	const sel = issues.filter((i) => selected.has(i.id));
	const done = () => setSelected(new Set());
	const reopen = () =>
		void ctx.writer
			.updateMany(
				sel.map((i) => i.path),
				reopenPatch(),
			)
			.then(done, (e) => ctx.report("Inbox に戻せませんでした", e));
	const setRevisit = async () => {
		const date = await askDate(ctx, "revisit（この日を過ぎたら Organize に出す）");
		if (date === null) return;
		await ctx.writer.updateMany(
			sel.map((i) => i.path),
			{ revisit: date },
		);
		done();
	};
	return (
		<div class="vt-page">
			<header class="vt-page-head">
				<h2 class="vt-page-title">Someday</h2>
				<span class="vt-count">{issues.length}</span>
				<span class="vt-spacer" />
				<select class="dropdown" value={order} onChange={(e) => setOrder(e.currentTarget.value as Order)}>
					{ORDERS.map((o) => (
						<option value={o.key}>{o.label}</option>
					))}
				</select>
				<button class="vt-button is-primary" disabled={issues.length === 0} onClick={() => void ctx.openView("pkm-task-organize")}>
					<Icon name="layers" /> Organize で見直す
				</button>
			</header>
			<IssueTable ctx={ctx} issues={issues} selected={selected} onSelect={setSelected} columns={["labels", "revisit", "reviewed"]} empty="Someday は空です" />
			<ActionBar
				count={sel.length}
				actions={[
					{ label: "Inbox に戻す", icon: "inbox", tone: "primary", run: reopen },
					{ label: "Add Do Date", icon: "calendar-plus", run: () => void scheduleIssues(ctx, sel).then(done) },
					{ label: "revisit", icon: "calendar-clock", run: () => void setRevisit().catch((e) => ctx.report("revisit を設定できませんでした", e)) },
					{ label: "Cancel", icon: "x", run: () => void cancelIssues(ctx, sel).then(done) },
				]}
			/>
		</div>
	);
}
