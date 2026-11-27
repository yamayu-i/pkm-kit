import { useState } from "preact/hooks";
import { bulkCancelTargets, bulkClearTargets, bulkSelectAll, type SubIssue } from "../core/sub-issue";
import { StatusIcon } from "../ui/StatusIcon";
import type { TaskContext } from "./context";
import { PreactModal } from "./modals";

/** 親のサブを一括で canceled にする・日付を消すダイアログ（ADR-0244） */
export function openSubBulkEdit(ctx: TaskContext, parentId: string): void {
	new PreactModal(ctx.app, "Edit sub-issues in bulk", (close) => (
		<SubBulkForm
			subs={ctx.store.index.subs(parentId)}
			onCancel={async (keys) => {
				await ctx.writer.cancelSubs(keys);
				close();
			}}
			onClearDates={async (keys) => {
				await ctx.writer.clearSubDates(keys);
				close();
			}}
		/>
	)).open();
}

/**
 * 選ぶ一覧と操作のボタン。md の順にすべてのサブを出し、すべて選べる。Select all but closed は閉じていないものだけを選ぶ。
 * ボタンは選んだ中の当てはまるものだけに当て、その件数を出す。closed を canceled にするときは、完了の記録を書き換えることを知らせる
 */
export function SubBulkForm(props: { subs: readonly SubIssue[]; onCancel: (keys: string[]) => Promise<void>; onClearDates: (keys: string[]) => Promise<void> }) {
	const { subs } = props;
	const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const all = bulkSelectAll(subs);
	const allSelected = all.length > 0 && all.length === selected.size && all.every((k) => selected.has(k));
	const toggle = (key: string) => {
		const next = new Set(selected);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		setSelected(next);
	};
	const chosen = subs.filter((s) => selected.has(s.key));
	const cancels = bulkCancelTargets(chosen);
	const clears = bulkClearTargets(chosen);
	const closed = cancels.filter((s) => s.status === "closed").length;
	const run = (action: (keys: string[]) => Promise<void>, targets: readonly SubIssue[]) => {
		setSaving(true);
		setError(null);
		action(targets.map((s) => s.key))
			.catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
			.finally(() => setSaving(false));
	};
	return (
		<div class="vt-sub-bulk">
			<div class="vt-sub-bulk-head">
				<button type="button" class="vt-text-button" disabled={all.length === 0 && selected.size === 0} onClick={() => setSelected(allSelected ? new Set() : new Set(all))}>
					{allSelected ? "Clear selection" : "Select all but closed"}
				</button>
				<span class="vt-muted">{chosen.length} selected</span>
			</div>
			<div class="vt-label-list">
				{subs.map((sub) => (
					<label class="vt-check">
						<input type="checkbox" checked={selected.has(sub.key)} onChange={() => toggle(sub.key)} aria-label={`Select ${sub.summary}`} />
						<StatusIcon status={sub.status} />
						<span class="vt-sub-bulk-title">{sub.summary}</span>
					</label>
				))}
			</div>
			{closed > 0 && <div class="vt-muted">closed のサブ {closed} 件を canceled にします（完了の記録が変わります）</div>}
			{error !== null && <div class="vt-error">{error}</div>}
			<div class="vt-form">
				<button type="button" disabled={clears.length === 0 || saving} onClick={() => run(props.onClearDates, clears)}>
					{`Clear dates ${clears.length}`}
				</button>
				<button type="button" class="mod-warning" disabled={cancels.length === 0 || saving} onClick={() => run(props.onCancel, cancels)}>
					{`Cancel ${cancels.length}`}
				</button>
			</div>
		</div>
	);
}
