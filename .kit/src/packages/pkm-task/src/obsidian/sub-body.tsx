import { Menu, parseYaml } from "obsidian";
import { useEffect, useRef, useState } from "preact/hooks";
import { formatShortDate, localToday } from "../core/dates";
import { formatMinutes, parseDurationInput } from "../core/format";
import { STATUSES, type Status } from "../core/schema";
import { isDoneStatus } from "../core/status-log";
import { isSubOpen, parseSubIssues, subCounts, subHint, toggleSubOpen, type SubIssue, type SubIssuePatch } from "../core/sub-issue";
import { Icon } from "../ui/Icon";
import { StatusIcon } from "../ui/StatusIcon";
import type { TaskContext } from "./context";
import { pickMember } from "./issue-editors";
import { SUB_DATE_FIELDS, pickSubDate } from "./sub-editor";

/** issue の md のパスから、親の issue の ID（`issue/i-12.md` → `i-12`） */
export function issueIdOf(path: string): string {
	return path.replace(/^issue\//, "").replace(/\.md$/, "");
}

/**
 * 入力欄の下書き。入力が止まって delayMs 後（null なら欄を離れたときだけ）と、欄を離れたときに commit する。
 * 保存で値が戻ってきても、入力中の欄は上書きしない（フォーカスとカーソルを失わない。ADR-0158）
 */
function useDraft(value: string, commit: (v: string) => Promise<boolean>, delayMs: number | null) {
	const [draft, setDraft] = useState(value);
	const s = useRef({ draft: value, dirty: false, value, commit, timer: 0 });
	s.current.value = value;
	s.current.commit = commit;
	useEffect(() => {
		const c = s.current;
		if (value === c.draft) c.dirty = false;
		else if (!c.dirty) {
			c.draft = value;
			setDraft(value);
		}
	}, [value]);
	const flush = () => {
		const c = s.current;
		window.clearTimeout(c.timer);
		if (!c.dirty || c.draft === c.value) return;
		const sent = c.draft;
		void c.commit(sent).then((ok) => {
			if (ok && s.current.draft === sent) s.current.dirty = false;
		});
	};
	useEffect(() => () => flush(), []);
	const input = (v: string) => {
		const c = s.current;
		c.draft = v;
		c.dirty = true;
		setDraft(v);
		window.clearTimeout(c.timer);
		if (delayMs !== null) c.timer = window.setTimeout(flush, delayMs);
	};
	return { draft, input, flush };
}

/** サブの項目や本文を保存する。通らなければ行の中に日本語の説明を出す */
type Save = (patch: SubIssuePatch) => Promise<boolean>;

/**
 * issue の本文のサブの領域を描くアコーディオン（ADR-0158）。Live Preview と Reading の両方がこれを描く。
 * 行は status のアイコンと題。開くと項目と本文をその場で直せる。開閉はこの端末に保存する。
 * delayMs: 題と本文を、入力が止まってから保存するまでの時間。null なら欄を離れたときだけ（Reading は、保存で描き直されるため）
 */
export function SubBody(props: { ctx: TaskContext; path: string; delayMs: number | null; onShowSource?: () => void }) {
	const { ctx, path, delayMs } = props;
	const [, setTick] = useState(0);
	const redraw = () => setTick((n) => n + 1);
	useEffect(() => ctx.store.subscribe(redraw), [ctx]);
	const parent = issueIdOf(path);
	const blocks = parseSubIssues(path, parent, ctx.store.text(path) ?? "", parseYaml).blocks;
	const subs = blocks.flatMap((b) => (b.sub ? [b.sub] : []));
	const counts = subCounts(subs);
	if (blocks.length === 0) return null;
	const toggle = (id: string) => {
		ctx.settings.subOpen = toggleSubOpen(ctx.settings.subOpen, path, id, subs.map((s) => s.id));
		void ctx.saveSettings().catch((e) => ctx.report("展開の状態を保存できませんでした", e));
		redraw();
	};
	return (
		<section class="vt-sub-body vt-ui">
			<div class="vt-section-head">
				<span class="vt-field-label">Sub-issues</span>
				<span class="vt-count" title={`${counts.open} open of ${counts.total}`}>
					{counts.open} / {counts.total}
				</span>
				<span class="vt-spacer" />
				{props.onShowSource && (
					<button type="button" class="vt-text-button" onClick={props.onShowSource}>
						Show source
					</button>
				)}
			</div>
			<ul class="vt-subissue-list">
				{blocks.map((b, i) =>
					b.sub ? (
						<SubItem key={b.sub.id} ctx={ctx} sub={b.sub} siblings={subs} open={isSubOpen(ctx.settings.subOpen, path, b.sub.id)} onToggle={() => toggle(b.sub!.id)} delayMs={delayMs} />
					) : (
						<UnreadableItem key={`raw-${i}`} raw={b.raw} />
					),
				)}
			</ul>
		</section>
	);
}

/** 読めなかったブロック。原文を読み取り専用で見せ、書き換えない */
function UnreadableItem(props: { raw: string }) {
	const [open, setOpen] = useState(false);
	return (
		<li class="vt-subissue is-unreadable">
			<div class="vt-subissue-row">
				<span class="vt-subissue-status" aria-hidden="true">
					<Icon name="alert-triangle" />
				</span>
				<button type="button" class="vt-subissue-summary" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
					<Icon name={open ? "chevron-down" : "chevron-right"} />
					<span class="vt-subissue-summary-text">Could not read this block</span>
				</button>
			</div>
			{open && (
				<div class="vt-subissue-detail">
					<pre class="vt-subissue-raw">{props.raw}</pre>
				</div>
			)}
		</li>
	);
}

function SubItem(props: { ctx: TaskContext; sub: SubIssue; siblings: SubIssue[]; open: boolean; onToggle: () => void; delayMs: number | null }) {
	const { ctx, sub, open } = props;
	const [error, setError] = useState<string | null>(null);
	const save: Save = (patch) =>
		ctx.writer
			.updateSub(sub.key, patch)
			.then(() => {
				setError(null);
				return true;
			})
			.catch((e: unknown) => {
				setError(e instanceof Error ? e.message : String(e));
				return false;
			});
	const changeStatus = (next: Status) => {
		if (next === "delegated") return pickMember(ctx, (id) => void save({ status: next, delegatedTo: id }));
		if (next === sub.status) return;
		// someday にするときは予定と期限を外す（issue と同じ。ADR-0006）
		void save(next === "someday" ? { status: next, scheduled: null, softDeadline: null, deadline: null } : { status: next });
	};
	const statusMenu = (e: MouseEvent) => {
		const m = new Menu();
		for (const s of STATUSES) m.addItem((mi) => mi.setTitle(s === "delegated" ? "delegated…" : s).setChecked(s === sub.status).onClick(() => changeStatus(s)));
		m.showAtMouseEvent(e);
	};
	const hint = subHint(sub, localToday());
	return (
		<li class={`vt-subissue${isDoneStatus(sub.status) ? " is-done" : ""}${open ? " is-open" : ""}`}>
			<div class="vt-subissue-row">
				<button type="button" class="vt-subissue-status" aria-label={`Status: ${sub.status}`} title={`Status: ${sub.status}`} onClick={statusMenu}>
					<StatusIcon status={sub.status} />
				</button>
				<button type="button" class="vt-subissue-summary" aria-expanded={open} title={sub.summary} onClick={props.onToggle}>
					<Icon name={open ? "chevron-down" : "chevron-right"} />
					<span class="vt-subissue-summary-text">{sub.summary}</span>
					{hint !== null && <span class="vt-subissue-hint">{hint}</span>}
				</button>
			</div>
			{open && <SubFields ctx={ctx} sub={sub} siblings={props.siblings} save={save} error={error} delayMs={props.delayMs} />}
		</li>
	);
}

/** 開いた行の中身: 項目と本文を、その場で直す */
function SubFields(props: { ctx: TaskContext; sub: SubIssue; siblings: SubIssue[]; save: Save; error: string | null; delayMs: number | null }) {
	const { ctx, sub, save, delayMs } = props;
	const member = sub.delegatedTo === null ? null : ctx.store.index.members.get(sub.delegatedTo);
	const others = props.siblings.filter((s) => s.id !== sub.id);
	const summary = useDraft(sub.summary, (v) => (v.trim() === "" ? Promise.resolve(false) : save({ summary: v.trim() })), delayMs);
	const estimatedText = sub.estimated === null ? "" : formatMinutes(sub.estimated);
	const [estimatedError, setEstimatedError] = useState<string | null>(null);
	const estimated = useDraft(
		estimatedText,
		(v) => {
			const minutes = v.trim() === "" ? null : parseDurationInput(v);
			if (minutes === null && v.trim() !== "") {
				setEstimatedError(`見積もりを時間として読めません: ${v}（例: 30m / 2h / 1h30m）`);
				return Promise.resolve(false);
			}
			setEstimatedError(null);
			return save({ estimated: minutes });
		},
		null,
	);
	const body = useDraft(sub.body, (v) => save({ body: v }), delayMs);
	return (
		<div class="vt-subissue-detail vt-subissue-form">
			<label class="vt-text-field">
				<span>Summary</span>
				<input
					type="text"
					value={summary.draft}
					onInput={(e) => summary.input(e.currentTarget.value)}
					onBlur={summary.flush}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.isComposing) summary.flush();
					}}
				/>
			</label>
			<div class="vt-subissue-form-row">
				{sub.status === "delegated" && (
					<div class="vt-text-field">
						<span>Delegated to</span>
						<button type="button" class={`vt-field-chip${member ? "" : " is-placeholder"}`} onClick={() => pickMember(ctx, (id) => void save({ delegatedTo: id }))}>
							<Icon name="user" />
							{member ? member.nickname : "Choose a member"}
						</button>
					</div>
				)}
				{SUB_DATE_FIELDS.map(([key, label]) => (
					<div class="vt-text-field">
						<span>{label}</span>
						<button type="button" class={`vt-field-chip${sub[key] ? "" : " is-placeholder"}`} onClick={() => pickSubDate(ctx, label, sub[key], (v) => void save({ [key]: v }))}>
							<Icon name="calendar" />
							{sub[key] ? formatShortDate(sub[key]!) : "Not set"}
						</button>
					</div>
				))}
				<label class="vt-text-field">
					<span>Estimated</span>
					<input
						type="text"
						class="vt-small-input"
						placeholder="e.g. 2h"
						value={estimated.draft}
						onInput={(e) => estimated.input(e.currentTarget.value)}
						onBlur={estimated.flush}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.isComposing) estimated.flush();
						}}
					/>
				</label>
			</div>
			{others.length > 0 && (
				<fieldset class="vt-subissue-depends">
					<legend>Depends on</legend>
					{others.map((s) => (
						<label class="vt-check">
							<input
								type="checkbox"
								checked={sub.dependsOn.includes(s.id)}
								onChange={(e) => void save({ dependsOn: e.currentTarget.checked ? [...sub.dependsOn, s.id] : sub.dependsOn.filter((d) => d !== s.id) })}
							/>
							{s.summary}
						</label>
					))}
				</fieldset>
			)}
			<label class="vt-text-field">
				<span>Notes</span>
				<textarea class="vt-subissue-body-input" value={body.draft} onInput={(e) => body.input(e.currentTarget.value)} onBlur={body.flush} />
			</label>
			{(props.error ?? estimatedError) !== null && <div class="vt-error">{props.error ?? estimatedError}</div>}
		</div>
	);
}
