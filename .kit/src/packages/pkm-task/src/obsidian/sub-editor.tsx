import { Menu } from "obsidian";
import { useState } from "preact/hooks";
import { formatShortDate, localToday, type LocalDate } from "../core/dates";
import { canEditSubPeriod, periodInInboxMessage, subPeriodError } from "../core/project-periods";
import { formatMinutes, parseDurationInput } from "../core/format";
import { STATUSES, type Status } from "../core/schema";
import { dependsChip, subItemPatch, toggleDepends, type SubIssue } from "../core/sub-issue";
import { revealSub } from "../header/sub-reveal";
import { DateForm } from "../ui/forms";
import { Icon } from "../ui/Icon";
import { SizeChips } from "../ui/SizeChips";
import type { TaskContext } from "./context";
import { pickMember } from "./issue-editors";
import { PreactModal } from "./modals";

/** サブの日付。期限は end が兼ねる（ADR-0190） */
export type DateKey = "start" | "end" | "scheduled";
const DATE_FIELDS: [DateKey, string][] = [
	["start", "Start"],
	["end", "End"],
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
export function pickSubDate(ctx: TaskContext, label: string, initial: LocalDate | null, onPick: (value: LocalDate | null) => void, validate?: (value: LocalDate) => string | null): void {
	new PreactModal(ctx.app, label, (close) => (
		<DateForm
			initial={initial}
			validate={validate}
			allowClear
			onSubmit={(v) => {
				close();
				onPick(v);
			}}
		/>
	)).open();
}

export const SUB_DATE_FIELDS = DATE_FIELDS;

/**
 * サブの日付の欄の規則（ADR-0210）。lock は Inbox の Project で期間（Start・End）を入れられない理由（入れられるなら null）。
 * validate は、その日にしてよいか（Tickler より前に始まる期間を止める）。Calendar の日（scheduled）は対象外
 */
export function subDateRules(ctx: TaskContext, sub: SubIssue): { lock: string | null; validate: (key: DateKey, draft: Pick<SubIssue, "start" | "end">) => ((d: LocalDate) => string | null) | undefined } {
	const index = ctx.store.index;
	const parent = index.issues.get(sub.parent);
	const today = localToday();
	const planned = index.planned(sub.parent);
	const lock = canEditSubPeriod(parent, planned, today) ? null : periodInInboxMessage(sub.parent);
	return {
		lock,
		validate: (key, draft) =>
			key === "scheduled" || !parent ? undefined : (d) => subPeriodError(parent, planned, { start: sub.start, end: sub.end }, { start: draft.start, end: draft.end, [key]: d }, today),
	};
}

/** 期間の欄か（Inbox の Project で押せなくする。ADR-0210） */
export const isPeriodKey = (key: DateKey) => key !== "scheduled";

/**
 * 「Depends on」の欄。押すと同じ親のほかのサブのメニューを開き、選んだものを付け外しする。
 * 1 行で済むように、選んだ題はボタンの文言（1 件は題、2 件以上は件数）とツールチップで見せる
 */
export function DependsField(props: { candidates: SubIssue[]; dependsOn: string[]; onChange: (next: string[]) => void }) {
	const { candidates, dependsOn } = props;
	const chip = dependsChip(candidates, dependsOn);
	const open = (e: MouseEvent) => {
		const m = new Menu();
		for (const s of candidates) m.addItem((item) => item.setTitle(s.summary).setChecked(dependsOn.includes(s.id)).onClick(() => props.onChange(toggleDepends(dependsOn, s.id))));
		m.showAtMouseEvent(e);
	};
	return (
		<div class="vt-text-field">
			<span>Depends on</span>
			<button type="button" class={`vt-field-chip vt-subissue-depends${chip.empty ? " is-placeholder" : ""}`} title={chip.title ?? undefined} aria-haspopup="menu" onClick={open}>
				<Icon name="link" />
				<span class="vt-subissue-depends-text">{chip.text}</span>
			</button>
		</div>
	);
}

/** 「Edit sub-issue」のダイアログ（ADR-0142）。項目だけを直す。本文は「Open note」で下部のカードを開いて直す（ADR-0179） */
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

	// someday に期間を入れたら open に戻す。someday にしたら Calendar の日と期間を外す（ADR-0190。保存のときと同じ規則）
	const rules = subDateRules(ctx, sub);
	const editDate = (key: DateKey, label: string) =>
		pickSubDate(
			ctx,
			label,
			draft[key],
			(v) => setDraft((d) => ({ ...d, [key]: v, ...(d.status === "someday" && key !== "scheduled" && v !== null ? { status: "open" as Status } : {}) })),
			rules.validate(key, draft),
		);
	const changeStatus = (status: Status) => {
		if (status === "delegated" && draft.delegatedTo === null) pickMember(ctx, (id) => set({ status, delegatedTo: id }));
		else set({ status, ...(status === "delegated" ? {} : { delegatedTo: null }), ...(status === "someday" ? { scheduled: null, start: null, end: null } : {}) });
	};

	const save = () => {
		const minutes = estimated.trim() === "" ? null : parseDurationInput(estimated);
		if (minutes === null && estimated.trim() !== "") return setError(`見積もりを時間として読めません: ${estimated}（例: 30m / 2h / 1h30m）`);
		const patch = subItemPatch(draft, minutes);
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
						{/* Inbox の Project では期間を入れない。押せなくし、理由を下に出す（ADR-0210） */}
						<button
							type="button"
							class={`vt-field-chip${draft[key] ? "" : " is-placeholder"}`}
							disabled={rules.lock !== null && isPeriodKey(key)}
							onClick={() => editDate(key, label)}
						>
							<Icon name="calendar" />
							{draft[key] ? formatShortDate(draft[key]!) : "Not set"}
						</button>
					</div>
				))}
			</div>
			{rules.lock !== null && <div class="vt-muted">{rules.lock}</div>}
			<div class="vt-subissue-form-row">
				<label class="vt-text-field">
					<span>Estimated</span>
					<input type="text" class="vt-small-input" placeholder="e.g. 2h" value={estimated} onInput={(e) => setEstimated(e.currentTarget.value)} />
				</label>
				{/* サイズのチップ（ADR-0231）。押すと欄に入れる（保存は Save で） */}
				<div class="vt-text-field">
					<span>Size</span>
					<SizeChips
						minutes={estimated.trim() === "" ? null : parseDurationInput(estimated)}
						onPick={(m) => {
							setError(null);
							setEstimated(m === null ? "" : formatMinutes(m));
						}}
						onXl={setError}
					/>
				</div>
				{siblings.length > 0 && <DependsField candidates={siblings} dependsOn={draft.dependsOn} onChange={(dependsOn) => set({ dependsOn })} />}
			</div>
			{error !== null && <div class="vt-error">{error}</div>}
			<div class="vt-form">
				<button type="button" class="vt-danger-text" onClick={() => deleteSubWithConfirm(ctx, sub, close)}>
					Delete
				</button>
				<span class="vt-spacer" />
				<button
					type="button"
					onClick={() => {
						close();
						revealSub(sub);
					}}
				>
					Open note
				</button>
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
