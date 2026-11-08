import { Menu } from "obsidian";
import { duePatch, scheduledPatch, statusPatch } from "../core/actions";
import { formatMinutes, parseDurationInput } from "../core/format";
import { PRIORITIES, STATUSES, STATUS_DETAIL_MAX, type Issue, type Priority } from "../core/schema";
import { CalendarForm, DateForm, TextForm } from "../ui/forms";
import { LabelForm } from "../ui/LabelForm";
import type { TaskContext } from "./context";
import { MemberSuggestModal, PreactModal } from "./modals";
import type { FieldValue } from "./writer";

const ESTIMATE_PRESETS = [15, 30, 60, 120, 300, 480];

export type Save = (fields: Record<string, FieldValue>) => void;

/** issue の frontmatter に書く */
export const saveIssue =
	(ctx: TaskContext, issue: Issue): Save =>
	(fields) =>
		void ctx.writer.update(issue.path, fields).catch((e) => ctx.report("保存できませんでした", e));

export function pickMember(ctx: TaskContext, onPick: (id: string) => void): void {
	new MemberSuggestModal(ctx.app, [...ctx.store.index.members.values()], (choice) => {
		if (choice.kind === "member") onPick(choice.member.id);
		else
			void ctx.writer
				.createMember(choice.name)
				.then(onPick)
				.catch((e) => ctx.report("委任先を作れませんでした", e));
	}).open();
}

export function priorityMenu(e: MouseEvent, current: Priority | null, save: Save): void {
	const m = new Menu();
	for (const p of PRIORITIES) m.addItem((item) => item.setTitle(p).setChecked(p === current).onClick(() => save({ priority: p })));
	m.addItem((item) => item.setTitle("None").onClick(() => save({ priority: null })));
	m.showAtMouseEvent(e);
}

export function editLabels(ctx: TaskContext, current: string[], save: Save): void {
	new PreactModal(ctx.app, "label", (close) => (
		<LabelForm
			labels={ctx.store.index.data.labels}
			initial={current}
			onCreate={(name) => ctx.writer.addLabel(name)}
			onSubmit={(names) => {
				close();
				save({ label: names });
			}}
			onError={(e) => ctx.report("label を追加できませんでした", e)}
		/>
	)).open();
}

export function editStatusDetail(ctx: TaskContext, current: string, save: Save): void {
	new PreactModal(ctx.app, "status-detail", (close) => (
		<TextForm
			initial={current}
			maxLength={STATUS_DETAIL_MAX}
			placeholder="e.g. Waiting for reply"
			onSubmit={(v) => {
				close();
				save({ "status-detail": v });
			}}
		/>
	)).open();
}

export function estimateMenu(ctx: TaskContext, e: MouseEvent, current: number | null, save: Save): void {
	const m = new Menu();
	for (const min of ESTIMATE_PRESETS) m.addItem((item) => item.setTitle(formatMinutes(min)).onClick(() => save({ estimated: min })));
	m.addItem((item) =>
		item.setTitle("Enter…").onClick(() =>
			new PreactModal(ctx.app, "estimated（m / h / d。1d = 24h）", (close) => (
				<TextForm
					initial={current === null ? "" : formatMinutes(current)}
					placeholder="e.g. 30m / 2h / 1d / 1h30m"
					onSubmit={(v) => {
						const min = parseDurationInput(v);
						if (min === null) return ctx.report(`時間として読めません: ${v}`);
						close();
						save({ estimated: min });
					}}
				/>
			)).open(),
		),
	);
	m.addItem((item) => item.setTitle("Clear").onClick(() => save({ estimated: null })));
	m.showAtMouseEvent(e);
}

/** リストの status（ADR-0018）。delegated は委任先も選ぶ */
export function statusMenu(ctx: TaskContext, e: MouseEvent, issue: Issue): void {
	const save = saveIssue(ctx, issue);
	const m = new Menu();
	for (const s of STATUSES) {
		m.addItem((item) =>
			item
				.setTitle(s)
				.setChecked(s === issue.status)
				.onClick(() => {
					if (s === issue.status) return;
					if (s === "delegated") pickMember(ctx, (id) => save(statusPatch(s, id)));
					else save(statusPatch(s));
				}),
		);
	}
	m.showAtMouseEvent(e);
}

export function editDue(ctx: TaskContext, issue: Issue, key: "soft_deadline" | "deadline"): void {
	new PreactModal(ctx.app, key, (close) => (
		<DateForm
			initial={key === "soft_deadline" ? issue.softDeadline : issue.deadline}
			onSubmit={(v) => {
				close();
				saveIssue(ctx, issue)(duePatch(issue, key, v));
			}}
		/>
	)).open();
}

export function editScheduled(ctx: TaskContext, issue: Issue): void {
	new PreactModal(ctx.app, "Do Date", (close) => (
		<CalendarForm
			initial={issue.scheduled}
			softDeadline={issue.softDeadline}
			deadline={issue.deadline}
			onSubmit={(dates) => {
				close();
				saveIssue(ctx, issue)(scheduledPatch(issue, dates));
			}}
		/>
	)).open();
}

function editSummary(ctx: TaskContext, issue: Issue): void {
	new PreactModal(ctx.app, "summary", (close) => (
		<TextForm
			initial={issue.summary}
			onSubmit={(v) => {
				close();
				if (v && v !== issue.summary) saveIssue(ctx, issue)({ summary: v });
			}}
		/>
	)).open();
}

/** 行末の「…」。列にない項目も含めてすべて編集できる（ADR-0018） */
export function issueRowMenu(ctx: TaskContext, e: MouseEvent, issue: Issue): void {
	const save = saveIssue(ctx, issue);
	const m = new Menu();
	m.addItem((item) => item.setTitle("summary").setIcon("pencil").onClick(() => editSummary(ctx, issue)));
	m.addItem((item) => item.setTitle("status").setIcon("circle-dot").onClick(() => statusMenu(ctx, e, issue)));
	m.addItem((item) => item.setTitle("status-detail").setIcon("pencil").onClick(() => editStatusDetail(ctx, issue.statusDetail, save)));
	m.addItem((item) => item.setTitle("priority").setIcon("flag").onClick(() => priorityMenu(e, issue.priority, save)));
	m.addItem((item) => item.setTitle("label").setIcon("tag").onClick(() => editLabels(ctx, issue.labels, save)));
	m.addSeparator();
	m.addItem((item) => item.setTitle("Do Date").setIcon("calendar").onClick(() => editScheduled(ctx, issue)));
	m.addItem((item) => item.setTitle("soft_deadline").setIcon("calendar").onClick(() => editDue(ctx, issue, "soft_deadline")));
	m.addItem((item) => item.setTitle("deadline").setIcon("calendar").onClick(() => editDue(ctx, issue, "deadline")));
	m.addItem((item) => item.setTitle("estimated").setIcon("clock").onClick(() => estimateMenu(ctx, e, issue.estimated, save)));
	m.showAtMouseEvent(e);
}
