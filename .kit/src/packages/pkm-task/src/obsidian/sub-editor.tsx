import { useState } from "preact/hooks";
import { formatShortDate, type LocalDate } from "../core/dates";
import { formatMinutes, parseDurationInput } from "../core/format";
import { STATUSES, type Status } from "../core/schema";
import type { SubIssue, SubIssuePatch } from "../core/sub-issue";
import { DateForm } from "../ui/forms";
import { Icon } from "../ui/Icon";
import type { TaskContext } from "./context";
import { pickMember } from "./issue-editors";
import { PreactModal } from "./modals";

type DateKey = "start" | "end" | "softDeadline" | "deadline" | "scheduled";
const DATE_FIELDS: [DateKey, string][] = [
	["start", "Start"],
	["end", "End"],
	["softDeadline", "Soft deadline"],
	["deadline", "Deadline"],
	["scheduled", "Calendar"],
];

/** 確認のモーダル（文は日本語、ボタンは英語。docs/design.md「文言」） */
export function confirmModal(ctx: TaskContext, title: string, message: string, action: string, run: () => void): void {
	new PreactModal(ctx.app, title, (close) => (
		<div>
			<p>{message}</p>
			<div class="vt-form">
				<button type="button" onClick={close}>
					Cancel
				</button>
				<button
					type="button"
					class="mod-warning"
					onClick={() => {
						close();
						run();
					}}
				>
					{action}
				</button>
			</div>
		</div>
	)).open();
}

/** サブを消す（確認の後。ADR-0142） */
export function deleteSubWithConfirm(ctx: TaskContext, sub: SubIssue, done?: () => void): void {
	confirmModal(ctx, "Delete sub-issue", `サブ「${sub.summary}」を本文ごと消します。作業時間の記録は残り、親の実績に含まれます。`, "Delete", () => {
		void ctx.writer
			.deleteSub(sub.key)
			.then(() => done?.())
			.catch((e) => ctx.report("サブを消せませんでした", e));
	});
}

/** 日付を選ぶダイアログ（サブの項目。ダイアログと本文の一覧で使う） */
export function pickSubDate(ctx: TaskContext, label: string, initial: LocalDate | null, onPick: (value: LocalDate | null) => void): void {
	new PreactModal(ctx.app, label, (close) => (
		<DateForm
			initial={initial}
			allowClear
			onSubmit={(v) => {
				close();
				onPick(v);
			}}
		/>
	)).open();
}

export const SUB_DATE_FIELDS = DATE_FIELDS;

/** 「Edit sub-issue」のダイアログ（ADR-0142） */
export function openSubEditor(ctx: TaskContext, sub: SubIssue): void {
	new PreactModal(ctx.app, "Edit sub-issue", (close) => <SubIssueForm ctx={ctx} sub={sub} close={close} />).open();
}

function SubIssueForm(props: { ctx: TaskContext; sub: SubIssue; close: () => void }) {
	const { ctx, sub, close } = props;
	const [draft, setDraft] = useState<SubIssue>(sub);
	const [estimated, setEstimated] = useState(sub.estimated === null ? "" : formatMinutes(sub.estimated));
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const set = (patch: Partial<SubIssue>) => setDraft((d) => ({ ...d, ...patch }));
	const siblings = ctx.store.index.subs(sub.parent).filter((s) => s.id !== sub.id);
	const member = draft.delegatedTo === null ? null : ctx.store.index.members.get(draft.delegatedTo);

	const editDate = (key: DateKey, label: string) => pickSubDate(ctx, label, draft[key], (v) => set({ [key]: v }));
	const changeStatus = (status: Status) => {
		if (status === "delegated" && draft.delegatedTo === null) pickMember(ctx, (id) => set({ status, delegatedTo: id }));
		else set({ status, ...(status === "delegated" ? {} : { delegatedTo: null }) });
	};

	const save = () => {
		const minutes = estimated.trim() === "" ? null : parseDurationInput(estimated);
		if (minutes === null && estimated.trim() !== "") return setError(`見積もりを時間として読めません: ${estimated}（例: 30m / 2h / 1h30m）`);
		const patch: SubIssuePatch = {
			summary: draft.summary.trim(),
			status: draft.status,
			delegatedTo: draft.delegatedTo,
			start: draft.start,
			end: draft.end,
			scheduled: draft.scheduled,
			softDeadline: draft.softDeadline,
			deadline: draft.deadline,
			estimated: minutes,
			dependsOn: draft.dependsOn,
			body: draft.body,
		};
		setSaving(true);
		ctx.writer
			.updateSub(sub.key, patch)
			.then(close)
			.catch((e: unknown) => {
				setSaving(false);
				setError(e instanceof Error ? e.message : String(e));
			});
	};

	return (
		<form
			class="vt-subissue-form"
			onSubmit={(e) => {
				e.preventDefault();
				save();
			}}
		>
			<label class="vt-text-field">
				<span>Summary</span>
				<input type="text" value={draft.summary} onInput={(e) => set({ summary: e.currentTarget.value })} />
			</label>
			<div class="vt-subissue-form-row">
				<label class="vt-text-field">
					<span>Status</span>
					<select value={draft.status} onChange={(e) => changeStatus(e.currentTarget.value as Status)}>
						{STATUSES.map((s) => (
							<option value={s}>{s}</option>
						))}
					</select>
				</label>
				{draft.status === "delegated" && (
					<div class="vt-text-field">
						<span>Delegated to</span>
						<button type="button" class={`vt-field-chip${member ? "" : " is-placeholder"}`} onClick={() => pickMember(ctx, (id) => set({ delegatedTo: id }))}>
							<Icon name="user" />
							{member ? member.nickname : "Choose a member"}
						</button>
					</div>
				)}
			</div>
			<div class="vt-subissue-form-row">
				{DATE_FIELDS.map(([key, label]) => (
					<div class="vt-text-field">
						<span>{label}</span>
						<button type="button" class={`vt-field-chip${draft[key] ? "" : " is-placeholder"}`} onClick={() => editDate(key, label)}>
							<Icon name="calendar" />
							{draft[key] ? formatShortDate(draft[key]!) : "Not set"}
						</button>
					</div>
				))}
			</div>
			<div class="vt-subissue-form-row">
				<label class="vt-text-field">
					<span>Estimated</span>
					<input type="text" class="vt-small-input" placeholder="e.g. 2h" value={estimated} onInput={(e) => setEstimated(e.currentTarget.value)} />
				</label>
			</div>
			{siblings.length > 0 && (
				<fieldset class="vt-subissue-depends">
					<legend>Depends on</legend>
					{siblings.map((s) => (
						<label class="vt-check">
							<input
								type="checkbox"
								checked={draft.dependsOn.includes(s.id)}
								onChange={(e) => set({ dependsOn: e.currentTarget.checked ? [...draft.dependsOn, s.id] : draft.dependsOn.filter((d) => d !== s.id) })}
							/>
							{s.summary}
						</label>
					))}
				</fieldset>
			)}
			<label class="vt-text-field">
				<span>Notes</span>
				<textarea class="vt-subissue-body-input" value={draft.body} onInput={(e) => set({ body: e.currentTarget.value })} />
			</label>
			{error !== null && <div class="vt-error">{error}</div>}
			<div class="vt-form">
				<button type="button" class="vt-danger-text" onClick={() => deleteSubWithConfirm(ctx, sub, close)}>
					Delete
				</button>
				<span class="vt-spacer" />
				<button type="button" onClick={close}>
					Cancel
				</button>
				<button type="submit" class="mod-cta" disabled={saving}>
					Save
				</button>
			</div>
		</form>
	);
}
