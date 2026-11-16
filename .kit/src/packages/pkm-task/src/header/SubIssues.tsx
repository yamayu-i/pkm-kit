import { Menu, Notice } from "obsidian";
import { useState } from "preact/hooks";
import { localToday } from "../core/dates";
import { formatMinutes } from "../core/format";
import type { TaskIndex } from "../core/index";
import type { Issue } from "../core/schema";
import { isDoneStatus } from "../core/status-log";
import { splitQuickAdd, subCounts, subHint, visibleSubs, type SubIssue, type SubIssuePatch } from "../core/sub-issue";
import type { TaskContext } from "../obsidian/context";
import { PickTimer } from "../obsidian/pick-toggle";
import { deleteSubWithConfirm, openSubEditor } from "../obsidian/sub-editor";
import { revealSub } from "./sub-reveal";
import type { TimelineScale } from "../core/timeline";
import { FilterChip } from "../ui/FilterChip";
import { Icon } from "../ui/Icon";
import { SubTimeline } from "./SubTimeline";
import { StatusIcon } from "../ui/StatusIcon";
import { showStatusMenu, StatusStepButton } from "../obsidian/status-change";

/** ドラッグで運ぶ値の種類（同じ親のサブの合成キー） */
const DRAG_TYPE = "application/x-pkm-sub-issue";

/** 親の issue 画面のサブイシュー（ADR-0142）: 1 行の一覧、closed の表示の切り替え、素早い追加、並べ替え */
export function SubIssues(props: { ctx: TaskContext; issue: Issue; index: TaskIndex; now: number }) {
	const { ctx, issue, index, now } = props;
	const [showClosed, setShowClosed] = useState(false);
	// 表示（List / Timeline）と目盛り（Day / Week）は保存しない（ADR-0143）
	const [mode, setMode] = useState<"list" | "timeline">("list");
	const [scale, setScale] = useState<TimelineScale>("day");
	const subs = index.subs(issue.id);
	const shown = visibleSubs(subs, showClosed);
	const counts = subCounts(subs);
	const effort = index.effortByKey(now);
	const visibleKeys = shown.map((s) => s.key);
	const move = (key: string, before: string | null) => void ctx.writer.moveSubBefore(key, before).catch((e) => ctx.report("サブを並べ替えられませんでした", e));
	return (
		<section class="vt-card vt-subissues">
			<div class="vt-section-head">
				<span class="vt-field-label">Sub-issues</span>
				{counts.total > 0 && (
					<span class="vt-count" title={`${counts.open} open of ${counts.total}`}>
						{counts.open} / {counts.total}
					</span>
				)}
				<span class="vt-spacer" />
				{counts.total > 0 && (
					<div class="vt-subissues-modes">
						{mode === "timeline" && (
							<>
								<FilterChip label="Day" on={scale === "day"} onClick={() => setScale("day")} />
								<FilterChip label="Week" on={scale === "week"} onClick={() => setScale("week")} />
								<span class="vt-subissues-modes-sep" aria-hidden="true" />
							</>
						)}
						<FilterChip label="List" on={mode === "list"} onClick={() => setMode("list")} />
						<FilterChip label="Timeline" on={mode === "timeline"} onClick={() => setMode("timeline")} />
					</div>
				)}
				<PresetButton ctx={ctx} issue={issue} index={index} />
			</div>
			{mode === "timeline" && shown.length > 0 && <SubTimeline ctx={ctx} subs={shown} scale={scale} />}
			{mode === "list" && shown.length > 0 && (
				<ul class="vt-subissue-list">
					{shown.map((sub) => (
						<SubRow
							key={sub.key}
							ctx={ctx}
							sub={sub}
							index={index}
							actual={effort.get(sub.key) ?? 0}
							visible={visibleKeys}
							onDrop={(dragged) => move(dragged, sub.key)}
						/>
					))}
				</ul>
			)}
			{counts.closed > 0 && (
				<button type="button" class="vt-text-button vt-subissues-closed" onClick={() => setShowClosed((v) => !v)}>
					{showClosed ? "Hide closed" : `Show ${counts.closed} closed`}
				</button>
			)}
			<QuickAdd ctx={ctx} issue={issue} onDropEnd={(dragged) => move(dragged, null)} />
		</section>
	);
}

/** 見出しの「Apply preset」（ADR-0186）: プリセットを選ぶと、サブを末尾へ足し、本文を親の本文の末尾に追記する */
function PresetButton(props: { ctx: TaskContext; issue: Issue; index: TaskIndex }) {
	const { ctx, issue, index } = props;
	const open = (e: MouseEvent) => {
		const m = new Menu();
		for (const preset of index.data.presets) {
			m.addItem((mi) =>
				mi
					.setTitle(preset.name)
					.setIcon("copy-plus")
					.onClick(() =>
						void ctx.writer.applyPreset(issue.id, preset).then(
							(keys) => new Notice(`プリセット「${preset.name}」を追加しました（サブ ${keys.length} 件）`),
							(err) => ctx.report("プリセットを追加できませんでした", err),
						),
					),
			);
		}
		if (index.data.presets.length > 0) m.addSeparator();
		m.addItem((mi) => mi.setTitle("Manage presets…").setIcon("settings").onClick(() => void ctx.openView("pkm-task-presets")));
		m.showAtMouseEvent(e);
	};
	return (
		<button type="button" class="vt-icon-button" aria-label="Apply preset" title="Apply preset" onClick={open}>
			<Icon name="copy-plus" />
		</button>
	);
}

function readDrag(e: DragEvent): string | null {
	return e.dataTransfer?.getData(DRAG_TYPE) || null;
}

function SubRow(props: {
	ctx: TaskContext;
	sub: SubIssue;
	index: TaskIndex;
	actual: number;
	visible: string[];
	onDrop: (dragged: string) => void;
}) {
	const { ctx, sub, index, actual } = props;
	const [dropBefore, setDropBefore] = useState(false);
	const running = index.running(sub.key);
	const hint = subHint(sub, localToday());
	const save = (patch: SubIssuePatch) => void ctx.writer.updateSub(sub.key, patch).catch((e) => ctx.report("サブを保存できませんでした", e));
	// メニューは遷移表の先だけ。付随の変更も表で決まる（ADR-0183）
	const statusMenu = (e: MouseEvent) => showStatusMenu(ctx, e, sub.key);
	const moreMenu = (e: MouseEvent) => {
		const m = new Menu();
		const at = props.visible.indexOf(sub.key);
		m.addItem((mi) => mi.setTitle("Edit").setIcon("pencil").onClick(() => openSubEditor(ctx, sub)));
		m.addSeparator();
		if (at > 0) m.addItem((mi) => mi.setTitle("Move up").setIcon("arrow-up").onClick(() => void ctx.writer.stepSub(sub.key, props.visible, -1).catch((err) => ctx.report("サブを並べ替えられませんでした", err))));
		if (at >= 0 && at < props.visible.length - 1) m.addItem((mi) => mi.setTitle("Move down").setIcon("arrow-down").onClick(() => void ctx.writer.stepSub(sub.key, props.visible, 1).catch((err) => ctx.report("サブを並べ替えられませんでした", err))));
		m.addSeparator();
		m.addItem((mi) => mi.setTitle("Delete").setIcon("trash-2").onClick(() => deleteSubWithConfirm(ctx, sub)));
		m.showAtMouseEvent(e);
	};
	return (
		<li
			class={`vt-subissue${isDoneStatus(sub.status) ? " is-done" : ""}${running.length > 0 ? " is-running" : ""}${dropBefore ? " is-drop-before" : ""}`}
			draggable
			onDragStart={(e) => e.dataTransfer?.setData(DRAG_TYPE, sub.key)}
			onDragOver={(e) => {
				if (!e.dataTransfer?.types.includes(DRAG_TYPE)) return;
				e.preventDefault();
				setDropBefore(true);
			}}
			onDragLeave={() => setDropBefore(false)}
			onDrop={(e) => {
				e.preventDefault();
				setDropBefore(false);
				const dragged = readDrag(e);
				if (dragged && dragged !== sub.key) props.onDrop(dragged);
			}}
		>
			<div class="vt-subissue-row">
				<button type="button" class="vt-subissue-status" aria-label={`Status: ${sub.status}`} title={`Status: ${sub.status}`} onClick={statusMenu}>
					<StatusIcon status={sub.status} />
				</button>
				<StatusStepButton ctx={ctx} keyOf={sub.key} />
				<button type="button" class="vt-subissue-summary" title={sub.summary} onClick={() => openSubEditor(ctx, sub)}>
					<span class="vt-subissue-summary-text">{sub.summary}</span>
					{hint !== null && <span class="vt-subissue-hint">{hint}</span>}
				</button>
				{actual >= 1 && <span class="vt-subissue-actual vt-num">{formatMinutes(actual)}</span>}
				<button type="button" class="vt-icon-button" aria-label="Open note" title="Open note" onClick={() => revealSub(sub)}>
					<Icon name="file-text" />
				</button>
				<PickTimer ctx={ctx} keyOf={sub.key} />
				<button type="button" class="vt-icon-button" aria-label="More actions" title="More actions" onClick={moreMenu}>
					<Icon name="more-horizontal" />
				</button>
			</div>
		</li>
	);
}

/** 素早い追加（ADR-0142）: Enter で 1 件作り、フォーカスを残す。複数行の貼り付けは行ごとに作る。末尾へのドラッグもここで受ける */
function QuickAdd(props: { ctx: TaskContext; issue: Issue; onDropEnd: (dragged: string) => void }) {
	const { ctx, issue } = props;
	const [draft, setDraft] = useState("");
	const [over, setOver] = useState(false);
	const create = (summaries: string[]) => {
		if (summaries.length === 0) return;
		void ctx.writer.createSubs(issue.id, summaries).catch((e) => ctx.report("サブを作れませんでした", e));
	};
	return (
		<form
			class={`vt-quick-add vt-subissue-add${over ? " is-drop-before" : ""}`}
			onSubmit={(e) => {
				e.preventDefault();
				create(splitQuickAdd(draft));
				setDraft("");
			}}
			onDragOver={(e) => {
				if (!e.dataTransfer?.types.includes(DRAG_TYPE)) return;
				e.preventDefault();
				setOver(true);
			}}
			onDragLeave={() => setOver(false)}
			onDrop={(e) => {
				e.preventDefault();
				setOver(false);
				const dragged = readDrag(e);
				if (dragged) props.onDropEnd(dragged);
			}}
		>
			<Icon name="plus" />
			<input
				type="text"
				aria-label="Add a sub-issue"
				placeholder="Add a sub-issue"
				value={draft}
				onInput={(e) => setDraft(e.currentTarget.value)}
				onPaste={(e) => {
					const text = e.clipboardData?.getData("text/plain") ?? "";
					if (!/\r?\n/.test(text.trim())) return;
					e.preventDefault();
					create(splitQuickAdd(text));
				}}
				onKeyDown={(e) => {
					if (e.key === "Escape") e.currentTarget.blur();
				}}
			/>
		</form>
	);
}
