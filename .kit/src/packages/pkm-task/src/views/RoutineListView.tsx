import { Keymap, Menu } from "obsidian";
import { useState } from "preact/hooks";
import { localToday } from "../core/dates";
import { formatMinutes, parseDurationInput } from "../core/format";
import { routineOccursOn } from "../core/index";
import { describeRepeat } from "../core/repeat";
import { moveRoutine, routineGroups } from "../core/routine-order";
import { DEFAULT_CATEGORY_NAME, type Routine, type RoutineCategory } from "../core/schema";
import type { TaskContext } from "../obsidian/context";
import { PreactModal } from "../obsidian/modals";
import { Icon } from "../ui/Icon";
import { RepeatFields, defaultRepeatDraft, readRepeatDraft } from "../ui/RepeatFields";
import { useStoreVersion } from "../ui/hooks";
import { linkProps } from "../ui/a11y";

/** routine を作るフォーム。月は `15, last, 2th-tue, last-fri` のように書く（ADR-0010） */
function RoutineForm(props: { onSubmit: (summary: string, repeat: Record<string, unknown>, extra: { estimated: number | null }) => void }) {
	const [summary, setSummary] = useState("");
	const [draft, setDraft] = useState(defaultRepeatDraft());
	const [estimated, setEstimated] = useState("");
	const read = readRepeatDraft(draft);
	const minutes = estimated.trim() ? parseDurationInput(estimated) : null;
	const error = !summary.trim() ? "summary を入れてください" : minutes === null && estimated.trim() ? `estimated を時間として読めません: ${estimated.trim()}` : read.error;
	return (
		<form
			class="vt-worklog-form"
			onSubmit={(e) => {
				e.preventDefault();
				if (error === null) props.onSubmit(summary.trim(), read.repeat, { estimated: minutes });
			}}
		>
			<label class="vt-text-field">
				<span>summary</span>
				<input type="text" value={summary} placeholder="e.g. Weekly review" onInput={(e) => setSummary(e.currentTarget.value)} />
			</label>
			<RepeatFields draft={draft} onChange={setDraft} />
			<div class="vt-chip-row">
				<label class="vt-text-field">
					<span>estimated (optional)</span>
					<input class="vt-small-input" type="text" value={estimated} placeholder="30m / 2h / 1d" onInput={(e) => setEstimated(e.currentTarget.value)} />
				</label>
			</div>
			{error !== null && summary && <div class="vt-error">{error}</div>}
			<div class="vt-form">
				<button type="submit" class="mod-cta" disabled={error !== null}>
					Create
				</button>
			</div>
		</form>
	);
}

const DRAG_TYPE = "text/plain";
const readDrag = (e: DragEvent): string | null => e.dataTransfer?.getData(DRAG_TYPE) || null;

/** 群の見出しの説明（ADR-0206） */
const GROUP_HINT: Record<string, string> = {
	[DEFAULT_CATEGORY_NAME]: "On the task board",
	closing: "On the Closing screen",
};

/** routine の行。ドラッグで並べ、別の群に落とすと category を変える（ADR-0206）。`⋯` のメニューでも動かせる */
function RoutineItem(props: { ctx: TaskContext; routine: Routine; today: string; move: (id: string, category: RoutineCategory | null, before: string | null) => void; menu: (e: MouseEvent, r: Routine) => void }) {
	const { ctx, routine: r } = props;
	const [dropBefore, setDropBefore] = useState(false);
	const toggle = () => void ctx.writer.update(r.path, { active: !r.active }).catch((e) => ctx.report("切り替えられませんでした", e));
	return (
		<div
			class={`vt-routine-item${r.active ? "" : " is-paused"}${dropBefore ? " is-drop-before" : ""}`}
			data-key={r.id}
			draggable
			onDragStart={(e: DragEvent) => e.dataTransfer?.setData(DRAG_TYPE, r.id)}
			onDragOver={(e: DragEvent) => {
				e.preventDefault();
				e.stopPropagation();
				setDropBefore(true);
			}}
			onDragLeave={() => setDropBefore(false)}
			onDrop={(e: DragEvent) => {
				e.preventDefault();
				e.stopPropagation();
				setDropBefore(false);
				const dragged = readDrag(e);
				if (dragged && dragged !== r.id) props.move(dragged, r.category, r.id);
			}}
		>
			<span class="vt-drag-handle" aria-hidden="true">
				<Icon name="grip-vertical" />
			</span>
			<span class="vt-badge vt-id vt-routine-id">{r.id}</span>
			<div class="vt-routine-main" {...linkProps((e) => void ctx.openPath(r.path, Keymap.isModEvent(e) !== false))}>
				<span class="vt-routine-summary">{r.summary || "(no summary)"}</span>
				<span class="vt-muted">
					{r.repeat ? describeRepeat(r.repeat) : "Invalid repeat"}
					{r.estimated ? ` · ${formatMinutes(r.estimated)}` : ""}
				</span>
			</div>
			{routineOccursOn(r, props.today) && <span class="vt-chip-mini is-today">Today</span>}
			<button class={`vt-switch${r.active ? " is-on" : ""}`} role="switch" aria-checked={r.active} title={r.active ? "Pause" : "Resume"} onClick={toggle}>
				<span class="vt-switch-thumb" />
			</button>
			<button class="vt-icon-button" aria-label="Routine menu" title="Move and more" onClick={(e) => props.menu(e, r)}>
				<Icon name="more-horizontal" />
			</button>
		</div>
	);
}

/** Routine List（ADR-0010, 0206）: category ごとの群・並べ替え・作成・一時停止 */
export function RoutineListView(props: { ctx: TaskContext }) {
	const { ctx } = props;
	useStoreVersion(ctx.store);
	const index = ctx.store.index;
	const today = localToday();
	const all = [...index.routines.values()];
	const groups = routineGroups(all);
	const [over, setOver] = useState<string | null>(null);
	const create = () =>
		new PreactModal(ctx.app, "Create routine", (close) => (
			<RoutineForm
				onSubmit={(summary, repeat, extra) => {
					close();
					void ctx.writer.createRoutine(summary, repeat, { ...extra, start: today }).catch((e) => ctx.report("routine を作れませんでした", e));
				}}
			/>
		)).open();
	const move = (id: string, category: RoutineCategory | null, before: string | null) => {
		const patches = moveRoutine(all, id, category, before);
		if (patches.length > 0) void ctx.writer.updateRoutines(patches).catch((e) => ctx.report("並べ替えられませんでした", e));
	};
	const menu = (e: MouseEvent, r: Routine) => {
		const group = groups.find((g) => g.category === r.category)?.routines ?? [];
		const at = group.findIndex((x) => x.id === r.id);
		const m = new Menu();
		if (at > 0) m.addItem((mi) => mi.setTitle("Move up").setIcon("arrow-up").onClick(() => move(r.id, r.category, group[at - 1]!.id)));
		if (at >= 0 && at < group.length - 1) m.addItem((mi) => mi.setTitle("Move down").setIcon("arrow-down").onClick(() => move(r.id, r.category, group[at + 2]?.id ?? null)));
		for (const g of groups) {
			if (g.category === r.category) continue;
			m.addItem((mi) =>
				mi
					.setTitle(`Move to ${g.category ?? DEFAULT_CATEGORY_NAME}`)
					.setIcon("folder-input")
					.onClick(() => move(r.id, g.category, null)),
			);
		}
		m.addSeparator();
		m.addItem((mi) => mi.setTitle("Open").setIcon("file-text").onClick(() => void ctx.openPath(r.path)));
		m.showAtMouseEvent(e);
	};
	return (
		<div class="vt-page">
			<header class="vt-page-head">
				<h2 class="vt-page-title">Routines</h2>
				<span class="vt-count">{all.length}</span>
				<span class="vt-spacer" />
				<button class="vt-button is-primary" onClick={create}>
					<Icon name="plus" /> Create routine
				</button>
			</header>
			{all.length === 0 && <div class="vt-empty">No routines yet. Add tasks that repeat daily or weekly (they appear only on the task board).</div>}
			{all.length > 0 &&
				groups.map((g) => {
					const name = g.category ?? DEFAULT_CATEGORY_NAME;
					return (
						<section
							class={`vt-routine-group${over === name ? " is-over" : ""}`}
							aria-label={name}
							key={name}
							// 群の空いた所に落とすと、その群の末尾に入る
							onDragOver={(e: DragEvent) => {
								e.preventDefault();
								setOver(name);
							}}
							onDragLeave={() => setOver(null)}
							onDrop={(e: DragEvent) => {
								e.preventDefault();
								setOver(null);
								const dragged = readDrag(e);
								if (dragged) move(dragged, g.category, null);
							}}
						>
							<div class="vt-section-head">
								<span class="vt-field-label">{name}</span>
								<span class="vt-count">{g.routines.length}</span>
								<span class="vt-muted">{GROUP_HINT[name]}</span>
							</div>
							<div class="vt-routine-list">
								{g.routines.length === 0 && <div class="vt-empty">Drag a routine here</div>}
								{g.routines.map((r) => (
									<RoutineItem ctx={ctx} routine={r} today={today} move={move} menu={menu} key={r.id} />
								))}
							</div>
						</section>
					);
				})}
		</div>
	);
}
