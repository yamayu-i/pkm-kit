import { useState } from "preact/hooks";
import { localToday } from "../core/dates";
import { reopenPatch, reviewedPatch } from "../core/actions";
import type { Issue } from "../core/schema";
import type { TaskContext } from "../obsidian/context";
import { askDate, cancelIssues, ticklerIssues } from "../obsidian/issue-actions";
import { ActionBar, IssueTable } from "../ui/IssueTable";
import { useStoreVersion } from "../ui/hooks";
import { canApplyAll } from "../core/transition";

type Order = "reviewed" | "revisit" | "created";

const ORDERS: { key: Order; label: string }[] = [
	{ key: "reviewed", label: "Oldest review first" },
	{ key: "revisit", label: "Nearest revisit first" },
	{ key: "created", label: "Newest first" },
];

function sortSomeday(issues: Issue[], order: Order): Issue[] {
	const nullsFirst = (a: string | null, b: string | null) => (a === b ? 0 : a === null ? -1 : b === null ? 1 : a.localeCompare(b));
	const nullsLast = (a: string | null, b: string | null) => (a === b ? 0 : a === null ? 1 : b === null ? -1 : a.localeCompare(b));
	return [...issues].sort((a, b) =>
		order === "reviewed" ? nullsFirst(a.reviewed, b.reviewed) : order === "revisit" ? nullsLast(a.revisit, b.revisit) : (b.created ?? "").localeCompare(a.created ?? ""),
	);
}

/** Someday List（ADR-0006, 0009, 0212）。週次の見直しの場 */
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
	// 週次の見直しで、残すと決めたものに見た日を付ける（ADR-0212）
	const markReviewed = () =>
		void ctx.writer
			.updateMany(
				sel.map((i) => i.path),
				reviewedPatch(localToday()),
			)
			.then(done, (e) => ctx.report("見直した日を記録できませんでした", e));
	const setRevisit = async () => {
		const date = await askDate(ctx, "revisit (shows up in Organize from this date)");
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
			</header>
			<IssueTable ctx={ctx} issues={issues} selected={selected} onSelect={setSelected} columns={["labels", "revisit", "reviewed"]} empty="Someday is empty" />
			<ActionBar
				count={sel.length}
				actions={[
					{ label: "Reviewed", icon: "check", tone: "primary", run: markReviewed },
					{ label: "Back to Inbox", icon: "inbox", run: reopen },
					{ label: "Tickler", icon: "alarm-clock", disabled: !canApplyAll(sel.map((i) => i.status), "tickler"), run: () => void ticklerIssues(ctx, sel).then(done) },
					{ label: "revisit", icon: "calendar-clock", run: () => void setRevisit().catch((e) => ctx.report("revisit を設定できませんでした", e)) },
					{ label: "Cancel", icon: "x", disabled: !canApplyAll(sel.map((i) => i.status), "canceled"), run: () => void cancelIssues(ctx, sel).then(done) },
				]}
			/>
		</div>
	);
}
