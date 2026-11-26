import { useEffect, useState } from "preact/hooks";
import { presetSubError, presetSubItems, type IssuePreset } from "../core/presets";
import { splitQuickAdd } from "../core/sub-issue";
import type { TaskContext } from "../obsidian/context";
import type { Save } from "../obsidian/issue-editors";
import { RowTools, move } from "../ui/EditRow";
import { Icon } from "../ui/Icon";
import { SizeChips } from "../ui/SizeChips";
import { useStoreVersion } from "../ui/hooks";
import { SummaryField, formatDateTime } from "./IssueHeader";

/**
 * preset 画面のヘッダー（ADR-0186）。issue と同じく、ページの一番上に差し込む（ADR-0077）。
 * 名前とサブの題の一覧をここで直し、本文はヘッダーの下のふつうのエディタで書く
 */
export function PresetHeader(props: { ctx: TaskContext; path: string }) {
	const { ctx, path } = props;
	useStoreVersion(ctx.store);
	const preset = ctx.store.index.data.presets.find((p) => p.path === path);
	if (!preset) {
		return <div class="vt-header-missing">preset の frontmatter を読めません（type / id を確認してください）</div>;
	}
	const save: Save = (fields) => void ctx.writer.update(path, fields).catch((e) => ctx.report("保存できませんでした", e));
	return (
		<div class="vt-issue vt-preset">
			<div class="vt-meta">
				<span>created {formatDateTime(preset.created)}</span>
				<span>updated {formatDateTime(ctx.store.mtime(path))}</span>
			</div>
			<SummaryField badge={<span class="vt-badge vt-id">{preset.id}</span>} summary={preset.name} field="name" save={save} />
			<PresetSubs preset={preset} save={save} />
			<div class="vt-banner vt-preset-hint">
				<Icon name="copy-plus" /> Apply this preset from the Sub-issues card of an issue. The sub-issues are added at the end, and the body below is appended to the end of the issue's body.
			</div>
			<div class="vt-field-label vt-preset-body-label">Body</div>
		</div>
	);
}

/** サブの題の一覧（frontmatter の sub_issues）。行ごとに直す・並べ替える・消す・見積もりの既定値を選ぶ（ADR-0231）。最後に素早い追加 */
function PresetSubs(props: { preset: IssuePreset; save: Save }) {
	const { preset, save } = props;
	const subs = preset.subIssues.map((summary, i) => ({ summary, estimated: preset.subEstimates?.[i] ?? null }));
	const write = (next: { summary: string; estimated: number | null }[]) =>
		save({
			sub_issues: presetSubItems(
				next.map((s) => s.summary),
				next.map((s) => s.estimated),
			),
		});
	return (
		<section class="vt-card vt-preset-subs" aria-label="Sub-issues">
			<div class="vt-section-head">
				<span class="vt-field-label">Sub-issues</span>
				{subs.length > 0 && <span class="vt-count">{subs.length}</span>}
			</div>
			{subs.length === 0 && <div class="vt-empty">No sub-issues yet</div>}
			{subs.length > 0 && (
				<ol class="vt-preset-sub-list">
					{subs.map((sub, i) => (
						<PresetSubRow
							key={`${i}:${sub.summary}`}
							index={i}
							count={subs.length}
							summary={sub.summary}
							estimated={sub.estimated}
							onCommit={(v) => write(subs.map((s, j) => (j === i ? { ...s, summary: v } : s)))}
							onEstimate={(m) => write(subs.map((s, j) => (j === i ? { ...s, estimated: m } : s)))}
							onMove={(d) => write(move(subs, i, d))}
							onDelete={() => write(subs.filter((_, j) => j !== i))}
						/>
					))}
				</ol>
			)}
			<SubQuickAdd onAdd={(added) => write([...subs, ...added.map((summary) => ({ summary, estimated: null }))])} />
		</section>
	);
}

/** サブの題の 1 行。Enter か欄を離れたときに保存する。Escape で戻す。書けない題は保存せずに説明を出す */
function PresetSubRow(props: {
	index: number;
	count: number;
	summary: string;
	estimated: number | null;
	onCommit: (v: string) => void;
	onEstimate: (minutes: number | null) => void;
	onMove: (d: number) => void;
	onDelete: () => void;
}) {
	const { summary } = props;
	const [draft, setDraft] = useState(summary);
	useEffect(() => setDraft(summary), [summary]);
	const error = presetSubError(draft);
	const commit = () => {
		const next = draft.trim();
		if (error === null && next !== summary) props.onCommit(next);
	};
	return (
		<li class="vt-preset-sub">
			<label class={`vt-name-field${error ? " is-error" : ""}`}>
				<span class="vt-name-label">#{props.index + 1}</span>
				<input
					type="text"
					value={draft}
					placeholder="Sub-issue title"
					aria-invalid={error !== null}
					onInput={(e) => setDraft(e.currentTarget.value)}
					onBlur={commit}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.isComposing) commit();
						if (e.key === "Escape") setDraft(summary);
					}}
				/>
				{error && <span class="vt-name-error">{error}</span>}
			</label>
			{/* 見積もりの既定値（ADR-0231）。当てたサブの estimated に入る。もう一度押すと外す */}
			<SizeChips minutes={props.estimated} onPick={props.onEstimate} clearable />
			<RowTools what="sub-issue" index={props.index} count={props.count} onMove={props.onMove} onDelete={props.onDelete} />
		</li>
	);
}

/** サブの題を足す欄（issue 画面の素早い追加と同じ: Enter で 1 件、複数行の貼り付けは行ごと） */
function SubQuickAdd(props: { onAdd: (summaries: string[]) => void }) {
	const [draft, setDraft] = useState("");
	const [error, setError] = useState<string | null>(null);
	const add = (summaries: string[]) => {
		if (summaries.length === 0) return false;
		const bad = summaries.map(presetSubError).find((e) => e !== null) ?? null;
		setError(bad);
		if (bad !== null) return false;
		props.onAdd(summaries);
		return true;
	};
	return (
		<>
		<form
			class="vt-quick-add vt-subissue-add"
			onSubmit={(e) => {
				e.preventDefault();
				if (add(splitQuickAdd(draft))) setDraft("");
			}}
		>
			<Icon name="plus" />
			<input
				type="text"
				aria-label="Add a sub-issue"
				placeholder="Add a sub-issue"
				value={draft}
				aria-invalid={error !== null}
				onInput={(e) => {
					setDraft(e.currentTarget.value);
					setError(null);
				}}
				onPaste={(e) => {
					const text = e.clipboardData?.getData("text/plain") ?? "";
					if (!/\r?\n/.test(text.trim())) return;
					e.preventDefault();
					add(splitQuickAdd(text));
				}}
				onKeyDown={(e) => {
					if (e.key === "Escape") e.currentTarget.blur();
				}}
			/>
		</form>
		{error && <span class="vt-name-error">{error}</span>}
		</>
	);
}
