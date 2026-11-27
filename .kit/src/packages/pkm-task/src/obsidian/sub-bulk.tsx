import { useState } from "preact/hooks";
import { bulkCancelSelectable, bulkSelectAll, type SubIssue } from "../core/sub-issue";
import { StatusIcon } from "../ui/StatusIcon";
import type { TaskContext } from "./context";
import { PreactModal } from "./modals";

/** 親のサブを一括で canceled にするダイアログ（ADR-0244） */
export function openSubBulkCancel(ctx: TaskContext, parentId: string): void {
	new PreactModal(ctx.app, "Cancel sub-issues", (close) => (
		<SubBulkForm
			subs={ctx.store.index.subs(parentId)}
			onCancel={async (keys) => {
				await ctx.writer.cancelSubs(keys);
				close();
			}}
		/>
	)).open();
}

/**
 * 選ぶ一覧と操作のボタン。md の順にすべてのサブを出す。canceled は選べない。
 * Select all は閉じていないものだけを選ぶ。closed を選んだら、完了の記録を書き換えることを知らせる
 */
export function SubBulkForm(props: { subs: readonly SubIssue[]; onCancel: (keys: string[]) => Promise<void> }) {
	const { subs } = props;
	const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const all = bulkSelectAll(subs);
	const allSelected = all.length > 0 && all.every((k) => selected.has(k));
	const toggle = (key: string) => {
		const next = new Set(selected);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		setSelected(next);
	};
	const chosen = subs.filter((s) => selected.has(s.key));
	const closed = chosen.filter((s) => s.status === "closed").length;
	const run = () => {
		setSaving(true);
		setError(null);
		props
			.onCancel(chosen.map((s) => s.key))
			.catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
			.finally(() => setSaving(false));
	};
	return (
		<div class="vt-sub-bulk">
			<div class="vt-sub-bulk-head">
				<button type="button" class="vt-text-button" disabled={all.length === 0} onClick={() => setSelected(allSelected ? new Set() : new Set(all))}>
					{allSelected ? "Clear selection" : "Select all"}
				</button>
				<span class="vt-muted">{chosen.length} selected</span>
			</div>
			<div class="vt-label-list">
				{subs.map((sub) => {
					const selectable = bulkCancelSelectable(sub);
					return (
						<label class={`vt-check${selectable ? "" : " is-disabled"}`} title={selectable ? undefined : "Already canceled"}>
							<input type="checkbox" checked={selected.has(sub.key)} disabled={!selectable} onChange={() => toggle(sub.key)} aria-label={`Select ${sub.summary}`} />
							<StatusIcon status={sub.status} />
							<span class="vt-sub-bulk-title">{sub.summary}</span>
						</label>
					);
				})}
			</div>
			{closed > 0 && <div class="vt-muted">closed のサブ {closed} 件を canceled にします（完了の記録が変わります）</div>}
			{error !== null && <div class="vt-error">{error}</div>}
			<div class="vt-form">
				<button type="button" class="mod-warning" disabled={chosen.length === 0 || saving} onClick={run}>
					{`Cancel ${chosen.length} sub-issue${chosen.length === 1 ? "" : "s"}`}
				</button>
			</div>
		</div>
	);
}
