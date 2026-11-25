import { Menu } from "obsidian";
import { duePatch, scheduledPatch, ticklerFieldPatch } from "../core/actions";
import { formatMinutes } from "../core/format";
import { ESTIMATE_ERROR, parseEstimate } from "../ui/EstimateField";
import { PRIORITIES, STATUS_DETAIL_MAX, type Issue, type Priority } from "../core/schema";
import { DateForm, TextForm } from "../ui/forms";
import { LabelForm } from "../ui/LabelForm";
import type { TaskContext } from "./context";
import { MemberSuggestModal, PreactModal } from "./modals";
import type { FieldValue } from "./writer";
import { showStatusMenu } from "./status-change";
import { canSetTickler } from "../core/transition";

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

/** estimated を入力欄で直す（メニューを出さない。ADR-0231 の追記）。空にすると消す */
export function editEstimate(ctx: TaskContext, current: number | null, save: Save): void {
	new PreactModal(ctx.app, "estimated（m / h / d。1d = 24h）", (close) => (
		<TextForm
			initial={current === null ? "" : formatMinutes(current)}
			placeholder="e.g. 30m / 2h / 1d / 1h30m（空にすると消す）"
			onSubmit={(v) => {
				const min = parseEstimate(v);
				if (min === undefined) return ctx.report(ESTIMATE_ERROR(v));
				close();
				save({ estimated: min });
			}}
		/>
	)).open();
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

/** Calendar の日（scheduled。その日にやらなければならない日。ADR-0152）を選ぶ・消す */
export function editScheduled(ctx: TaskContext, issue: Issue): void {
	new PreactModal(ctx.app, "Calendar (must be done on this day)", (close) => (
		<DateForm
			initial={issue.scheduled}
			onSubmit={(v) => {
				close();
				saveIssue(ctx, issue)(scheduledPatch(issue, v));
			}}
		/>
	)).open();
}

/** Tickler の日（この日まで出さず、この日に Inbox に戻す。ADR-0152）を選ぶ・消す */
export function editTickler(ctx: TaskContext, issue: Issue): void {
	new PreactModal(ctx.app, "Tickler (back to Inbox on this date)", (close) => (
		<DateForm
			initial={issue.tickler}
			onSubmit={(v) => {
				close();
				saveIssue(ctx, issue)(ticklerFieldPatch(issue, v));
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
	m.addItem((item) => item.setTitle("status").setIcon("circle-dot").onClick(() => showStatusMenu(ctx, e, issue.id)));
	m.addItem((item) => item.setTitle("status-detail").setIcon("pencil").onClick(() => editStatusDetail(ctx, issue.statusDetail, save)));
	m.addItem((item) => item.setTitle("priority").setIcon("flag").onClick(() => priorityMenu(e, issue.priority, save)));
	m.addItem((item) => item.setTitle("label").setIcon("tag").onClick(() => editLabels(ctx, issue.labels, save)));
	m.addSeparator();
	m.addItem((item) => item.setTitle("Calendar").setIcon("calendar").onClick(() => editScheduled(ctx, issue)));
	if (canSetTickler(issue.status)) m.addItem((item) => item.setTitle("Tickler").setIcon("alarm-clock").onClick(() => editTickler(ctx, issue)));
	else if (issue.tickler !== null) m.addItem((item) => item.setTitle("Clear Tickler").setIcon("alarm-clock-off").onClick(() => saveIssue(ctx, issue)({ tickler: null })));
	m.addItem((item) => item.setTitle("soft_deadline").setIcon("calendar").onClick(() => editDue(ctx, issue, "soft_deadline")));
	m.addItem((item) => item.setTitle("deadline").setIcon("calendar").onClick(() => editDue(ctx, issue, "deadline")));
	m.addItem((item) => item.setTitle("estimated").setIcon("clock").onClick(() => editEstimate(ctx, issue.estimated, save)));
	m.showAtMouseEvent(e);
}
