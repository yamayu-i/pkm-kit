import { Menu } from "obsidian";
import { useState } from "preact/hooks";
import { localToday } from "../core/dates";
import { defaultQuery, queryIssues, type IssueQuery, type SortKey } from "../core/list";
import { PRIORITIES, STATUSES } from "../core/schema";
import type { TaskContext } from "../obsidian/context";
import { cancelIssues, closeIssues, inboxIssues, scheduleIssues, somedayIssues } from "../obsidian/issue-actions";
import { PreactModal } from "../obsidian/modals";
import { TextForm } from "../ui/forms";
import { Icon } from "../ui/Icon";
import { ActionBar, IssueTable } from "../ui/IssueTable";
import { Pager } from "../ui/Pager";
import { useStoreVersion } from "../ui/hooks";

const PAGE = 50;
const SORTS: { key: SortKey; label: string }[] = [
	{ key: "id", label: "ID" },
	{ key: "summary", label: "summary" },
	{ key: "status", label: "status" },
	{ key: "priority", label: "priority" },
	{ key: "next_scheduled", label: "次の実行日" },
	{ key: "soft_deadline", label: "soft_deadline" },
	{ key: "deadline", label: "deadline" },
	{ key: "created", label: "作成日" },
];

function toggle<T>(list: T[], v: T): T[] {
	return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

/** 絞り込み用のチップ（M3 の filter chip） */
function FilterChip(props: { label: string; on: boolean; onClick: () => void }) {
	return (
		<button class={`vt-filter-chip${props.on ? " is-on" : ""}`} aria-pressed={props.on} onClick={props.onClick}>
			{props.on && <Icon name="check" />}
			{props.label}
		</button>
	);
}

/** Issue List（ADR-0009）: 全 issue を検索・絞り込み・並び替え */
export function IssueListView(props: { ctx: TaskContext }) {
	const { ctx } = props;
	useStoreVersion(ctx.store);
	const index = ctx.store.index;
	const [q, setQ] = useState<IssueQuery>(defaultQuery());
	const [page, setPage] = useState(0);
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const set = (patch: Partial<IssueQuery>) => {
		setQ({ ...q, ...patch });
		setPage(0);
	};
	const results = queryIssues(index.issues.values(), q, localToday());
	const pages = Math.max(1, Math.ceil(results.length / PAGE));
	const current = Math.min(page, pages - 1);
	const shown = results.slice(current * PAGE, (current + 1) * PAGE);
	const sel = results.filter((i) => selected.has(i.id));
	const done = () => setSelected(new Set());
	const labels = index.data.labels.map((l) => l.name);

	const presetMenu = (e: MouseEvent) => {
		const m = new Menu();
		for (const p of ctx.settings.presets) {
			m.addItem((mi) => mi.setTitle(p.name).onClick(() => set({ ...defaultQuery(), ...p.query })));
		}
		if (ctx.settings.presets.length > 0) m.addSeparator();
		m.addItem((mi) =>
			mi
				.setTitle("今の条件を保存…")
				.setIcon("save")
				.onClick(() =>
					new PreactModal(ctx.app, "条件の名前", (close) => (
						<TextForm
							initial=""
							onSubmit={(name) => {
								close();
								if (!name) return;
								ctx.settings.presets = [...ctx.settings.presets.filter((p) => p.name !== name), { name, query: q }];
								void ctx.saveSettings();
							}}
						/>
					)).open(),
				),
		);
		for (const p of ctx.settings.presets) {
			m.addItem((mi) =>
				mi
					.setTitle(`「${p.name}」を削除`)
					.setIcon("trash")
					.onClick(() => {
						ctx.settings.presets = ctx.settings.presets.filter((x) => x !== p);
						void ctx.saveSettings();
					}),
			);
		}
		m.showAtMouseEvent(e);
	};

	return (
		<div class="vt-page">
			<header class="vt-page-head">
				<h2 class="vt-page-title">Issues</h2>
				<span class="vt-count">{results.length}</span>
				<span class="vt-spacer" />
				<button class="vt-button is-text" onClick={presetMenu}>
					<Icon name="bookmark" /> 保存した条件
				</button>
			</header>
			<section class="vt-card vt-filters">
				<label class="vt-search">
					<Icon name="search" />
					<input type="search" placeholder="ID・summary で検索" value={q.text} onInput={(e) => set({ text: e.currentTarget.value })} />
				</label>
				<div class="vt-filter-row">
					<span class="vt-field-label">status</span>
					{STATUSES.map((s) => (
						<FilterChip label={s} on={q.statuses.includes(s)} onClick={() => set({ statuses: toggle(q.statuses, s) })} />
					))}
				</div>
				<div class="vt-filter-row">
					<span class="vt-field-label">priority</span>
					{[...PRIORITIES, "none" as const].map((p) => (
						<FilterChip label={p} on={q.priorities.includes(p)} onClick={() => set({ priorities: toggle(q.priorities, p) })} />
					))}
				</div>
				{labels.length > 0 && (
					<div class="vt-filter-row">
						<span class="vt-field-label">label</span>
						{labels.map((l) => (
							<FilterChip label={l} on={q.labels.includes(l)} onClick={() => set({ labels: toggle(q.labels, l) })} />
						))}
					</div>
				)}
				<div class="vt-filter-row">
					<span class="vt-field-label">実行日</span>
					{(
						[
							["any", "すべて"],
							["yes", "あり"],
							["no", "なし"],
						] as const
					).map(([v, label]) => (
						<FilterChip label={label} on={q.scheduled === v} onClick={() => set({ scheduled: v })} />
					))}
					<span class="vt-spacer" />
					<span class="vt-field-label">並び替え</span>
					<select class="dropdown" value={q.sort} onChange={(e) => set({ sort: e.currentTarget.value as SortKey })}>
						{SORTS.map((s) => (
							<option value={s.key}>{s.label}</option>
						))}
					</select>
					<button class="vt-icon-button" title={q.desc ? "降順" : "昇順"} onClick={() => set({ desc: !q.desc })}>
						<Icon name={q.desc ? "arrow-down-wide-narrow" : "arrow-up-narrow-wide"} />
					</button>
					<button class="vt-button is-text" onClick={() => set(defaultQuery())}>
						リセット
					</button>
				</div>
			</section>
			<IssueTable ctx={ctx} issues={shown} selected={selected} onSelect={setSelected} columns={["status-detail", "labels", "next", "soft_deadline", "deadline", "estimated"]} empty="条件に合う issue はありません" />
			<ActionBar
				count={sel.length}
				actions={[
					{ label: "Add Do Date", icon: "calendar-plus", run: () => void scheduleIssues(ctx, sel).then(done) },
					{ label: "Close", icon: "check", run: () => void closeIssues(ctx, sel).then(done) },
					{ label: "Someday", icon: "cloud", run: () => void somedayIssues(ctx, sel).then(done) },
					{ label: "Inbox", icon: "inbox", run: () => void inboxIssues(ctx, sel).then(done) },
					{ label: "Cancel", icon: "x", run: () => void cancelIssues(ctx, sel).then(done) },
				]}
			/>
			{pages > 1 && <Pager current={current} pages={pages} onChange={setPage} />}
		</div>
	);
}
