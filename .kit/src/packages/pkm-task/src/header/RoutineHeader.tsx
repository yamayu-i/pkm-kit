import { Menu } from "obsidian";
import { useState } from "preact/hooks";
import { routineResults, type RoutineDayResult } from "../core/board";
import { formatShortDate, localToday, WEEKDAY_NAMES, weekdayOf, type LocalDate } from "../core/dates";
import { formatMinutes } from "../core/format";
import { groupKeys } from "../core/groups";
import { describeRepeat, type RepeatRule } from "../core/repeat";
import type { Routine } from "../core/schema";
import type { TaskContext } from "../obsidian/context";
import { estimateMenu, priorityMenu, type Save } from "../obsidian/issue-editors";
import { PreactModal } from "../obsidian/modals";
import { PriorityBadge } from "../ui/badges";
import { DateForm } from "../ui/forms";
import { Icon } from "../ui/Icon";
import { RepeatFields, readRepeatDraft, repeatDraftOf } from "../ui/RepeatFields";
import { useStoreVersion } from "../ui/hooks";
import { LabelsField, SummaryField, Worklog, formatDateTime } from "./IssueHeader";

const RESULT_DAYS = 14;
const RESULT_MARK: Record<RoutineDayResult["state"], string> = { closed: "✓", canceled: "×", none: "・", off: "" };
const RESULT_LABEL: Record<RoutineDayResult["state"], string> = { closed: "closed", canceled: "canceled", none: "not recorded", off: "not scheduled" };

function RepeatForm(props: { rule: RepeatRule | null; onSubmit: (repeat: Record<string, unknown>) => void }) {
	const [draft, setDraft] = useState(repeatDraftOf(props.rule));
	const read = readRepeatDraft(draft);
	return (
		<form
			class="vt-worklog-form"
			onSubmit={(e) => {
				e.preventDefault();
				if (read.error === null) props.onSubmit(read.repeat);
			}}
		>
			<RepeatFields draft={draft} onChange={setDraft} />
			{read.error !== null && <div class="vt-error">{read.error}</div>}
			<div class="vt-form">
				<button type="submit" class="mod-cta" disabled={read.error !== null}>
					Save
				</button>
			</div>
		</form>
	);
}

/** 直近の結果（読み取り専用。ADR-0018）。色だけに頼らないよう、記号と title でも伝える */
function Results(props: { results: RoutineDayResult[] }) {
	return (
		<div class="vt-routine-results">
			<div class="vt-field-label">Last {RESULT_DAYS} days</div>
			<div class="vt-results">
				{props.results.map((r) => {
					const label = `${r.date} ${RESULT_LABEL[r.state]}`;
					return (
						<div class={`vt-result is-${r.state}`} title={label} aria-label={label} role="img">
							<span class="vt-result-weekday">{WEEKDAY_NAMES[weekdayOf(r.date)]}</span>
							<span class="vt-num">{Number(r.date.slice(8, 10))}</span>
							<span class="vt-result-mark">{RESULT_MARK[r.state]}</span>
						</div>
					);
				})}
			</div>
			<div class="vt-muted">✓ closed　× canceled　・ not recorded　blank not scheduled</div>
		</div>
	);
}

/** routine 画面のヘッダー（ADR-0018）。issue と同じく md の先頭に CodeMirror の widget として差し込む */
export function RoutineHeader(props: { ctx: TaskContext; path: string }) {
	const { ctx, path } = props;
	useStoreVersion(ctx.store);
	const index = ctx.store.index;
	const routine: Routine | undefined = [...index.routines.values()].find((r) => r.path === path);
	if (!routine) {
		return <div class="vt-header-missing">routine の frontmatter を読めません（type / id を確認してください）</div>;
	}
	const save: Save = (fields) => void ctx.writer.update(path, fields).catch((e) => ctx.report("保存できませんでした", e));
	const editRepeat = () =>
		new PreactModal(ctx.app, "Repeat", (close) => (
			<RepeatForm
				rule={routine.repeat}
				onSubmit={(repeat) => {
					close();
					save({ repeat });
				}}
			/>
		)).open();
	const editDate = (key: "start" | "end", current: LocalDate | null) => () =>
		new PreactModal(ctx.app, key, (close) => (
			<DateForm
				initial={current}
				onSubmit={(v) => {
					close();
					save({ [key]: v });
				}}
			/>
		)).open();
	const groupMenu = (e: MouseEvent) => {
		const m = new Menu();
		for (const key of ["", ...groupKeys(index.data.groups)]) {
			m.addItem((item) =>
				item
					.setTitle(key || "Unsorted")
					.setChecked((routine.group ?? "") === key)
					.onClick(() => save({ group: key || null })),
			);
		}
		m.showAtMouseEvent(e);
	};
	const effort = index.routineEffort(routine.id, Date.now());
	return (
		<div class="vt-issue">
			<div class="vt-meta">
				<span>created {formatDateTime(routine.created)}</span>
				<span>updated {formatDateTime(ctx.store.mtime(path))}</span>
			</div>
			<div class="vt-routine-title">
				<SummaryField badge={<span class="vt-badge vt-id vt-routine-id">{routine.id}</span>} summary={routine.summary} save={save} />
				<button
					class={`vt-switch${routine.active ? " is-on" : ""}`}
					role="switch"
					aria-checked={routine.active}
					aria-label={routine.active ? "Pause" : "Resume"}
					title={routine.active ? "Pause" : "Resume"}
					onClick={() => save({ active: !routine.active })}
				>
					<span class="vt-switch-thumb" />
				</button>
			</div>
			<section class="vt-card">
				<div class="vt-row vt-chips">
					<button class="vt-field-chip" onClick={editRepeat}>
						<Icon name="repeat" />
						{routine.repeat ? describeRepeat(routine.repeat) : "Invalid repeat"}
					</button>
					<button class="vt-field-chip" onClick={editDate("start", routine.start)}>
						<Icon name="calendar" />
						start {routine.start ? formatShortDate(routine.start) : "—"}
					</button>
					<button class="vt-field-chip" onClick={editDate("end", routine.end)}>
						<Icon name="calendar" />
						end {routine.end ? formatShortDate(routine.end) : "—"}
					</button>
				</div>
				<div class="vt-row vt-chips">
					<button class="vt-field-chip" onClick={groupMenu}>
						<Icon name="layout-grid" />
						{routine.group ?? "Unsorted"}
					</button>
					<PriorityBadge priority={routine.priority} onClick={(e) => priorityMenu(e, routine.priority, save)} />
					<LabelsField ctx={ctx} labels={routine.labels} index={index} save={save} />
				</div>
			</section>
			<section class="vt-card">
				<Results results={routineResults(index, routine, localToday(), RESULT_DAYS)} />
			</section>
			<div class="vt-effort">
				<button class="vt-effort-cell is-editable" onClick={(e) => estimateMenu(ctx, e, routine.estimated, save)}>
					<span class="vt-field-label">
						estimated
						<Icon name="chevron-down" class="vt-trailing" />
					</span>
					<span class="vt-effort-value">{routine.estimated === null ? "—" : formatMinutes(routine.estimated)}</span>
				</button>
				<div class="vt-effort-cell is-readonly" title="Calculated from the worklog">
					<span class="vt-field-label">total</span>
					<span class="vt-effort-value">{formatMinutes(effort.total)}</span>
				</div>
				<div class="vt-effort-cell is-readonly" title={effort.days > 0 ? `Daily average over ${effort.days} recorded days` : "Calculated from the worklog"}>
					<span class="vt-field-label">average</span>
					<span class="vt-effort-value">{effort.average === null ? "—" : formatMinutes(effort.average)}</span>
				</div>
			</div>
			<hr class="vt-sep" />
			<Worklog ctx={ctx} taskId={routine.id} index={index} />
			<hr class="vt-sep" />
		</div>
	);
}
