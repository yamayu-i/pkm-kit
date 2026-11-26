import { Menu } from "obsidian";
import { useState } from "preact/hooks";
import { routineResults, type RoutineDayResult } from "../core/board";
import { formatShortDate, localToday, WEEKDAY_NAMES, weekdayOf, type LocalDate } from "../core/dates";
import { formatMinutes } from "../core/format";
import { describeRepeat, type RepeatRule } from "../core/repeat";
import { DEFAULT_CATEGORY_NAME, DEFAULT_MISSED_NAME, ROUTINE_CATEGORIES, ROUTINE_MISSED, type Routine, type RoutineCategory, type RoutineMissed } from "../core/schema";
import type { TaskContext } from "../obsidian/context";
import { priorityMenu, type Save } from "../obsidian/issue-editors";
import { EstimateField } from "../ui/EstimateField";
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

/** routine 画面のヘッダー（ADR-0018）。issue と同じく、ページの一番上に差し込む（ADR-0077） */
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
	// category（ADR-0206）: default（なし）か closing。default は欄ごと消す
	const categoryMenu = (e: MouseEvent) => {
		const m = new Menu();
		for (const c of [null, ...ROUTINE_CATEGORIES] as (RoutineCategory | null)[]) {
			m.addItem((mi) =>
				mi
					.setTitle(c ?? DEFAULT_CATEGORY_NAME)
					.setChecked(routine.category === c)
					.onClick(() => save({ category: c })),
			);
		}
		m.showAtMouseEvent(e);
	};
	// missed（ADR-0234）: list（なし。Calendar の Missed に並べる）か carry（今日のボードに持ち越す）。list は欄ごと消す
	const missedMenu = (e: MouseEvent) => {
		const m = new Menu();
		for (const v of [null, ...ROUTINE_MISSED] as (RoutineMissed | null)[]) {
			m.addItem((mi) =>
				mi
					.setTitle(v ?? DEFAULT_MISSED_NAME)
					.setChecked(routine.missed === v)
					.onClick(() => save({ missed: v })),
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
					<button class="vt-field-chip" aria-label="Category" title="Where it appears: default is the board, closing is the Closing screen" onClick={categoryMenu}>
						<Icon name={routine.category === "closing" ? "moon" : "layout-dashboard"} />
						{routine.category ?? DEFAULT_CATEGORY_NAME}
						<Icon name="chevron-down" />
					</button>
					<button
						class="vt-field-chip"
						aria-label="When missed"
						title="When missed: list shows it under Missed in Today's Calendar, carry puts it on today's board until it is closed"
						onClick={missedMenu}
					>
						<Icon name={routine.missed === "carry" ? "rotate-cw" : "list"} />
						missed: {routine.missed ?? DEFAULT_MISSED_NAME}
						<Icon name="chevron-down" />
					</button>
					<PriorityBadge priority={routine.priority} onClick={(e) => priorityMenu(e, routine.priority, save)} />
					<LabelsField ctx={ctx} labels={routine.labels} index={index} save={save} />
				</div>
			</section>
			<section class="vt-card">
				<Results results={routineResults(index, routine, localToday(), RESULT_DAYS)} />
			</section>
			<div class="vt-effort">
				<EstimateField value={routine.estimated} onSave={(estimated) => save({ estimated })} />
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
