import { Menu, parseYaml } from "obsidian";
import { useEffect, useRef, useState } from "preact/hooks";
import { formatShortDate, localToday } from "../core/dates";
import { adoptValue } from "../core/draft";
import { formatMinutes, parseDurationInput } from "../core/format";
import { STATUSES, type Status } from "../core/schema";
import { isDoneStatus } from "../core/status-log";
import { parseSubIssues, subHint, type SubIssue, type SubIssuePatch } from "../core/sub-issue";
import { Icon } from "../ui/Icon";
import { StatusIcon } from "../ui/StatusIcon";
import type { TaskContext } from "./context";
import { pickMember } from "./issue-editors";
import { PickTimer } from "./pick-toggle";
import { SUB_DATE_FIELDS, pickSubDate } from "./sub-editor";

/** issue の md のパスから、親の issue の ID（`issue/i-12.md` → `i-12`） */
export function issueIdOf(path: string): string {
	return path.replace(/^issue\//, "").replace(/\.md$/, "");
}

/**
 * 入力欄の下書き。入力が止まって delayMs 後（null なら欄を離れたときだけ）と、欄を離れたときに commit する。
 * 保存で値が戻ってきても、入力中の欄は上書きしない（フォーカスとカーソルを失わない）。
 * normalize は保存のときの整形（trim など）。整形した値が戻ったときも上書きしない（ADR-0161）
 */
function useDraft(value: string, commit: (v: string) => Promise<boolean>, delayMs: number | null, normalize: (v: string) => string = (v) => v) {
	const [draft, setDraft] = useState(value);
	const s = useRef({ draft: value, dirty: false, value, commit, normalize, timer: 0 });
	s.current.value = value;
	s.current.commit = commit;
	s.current.normalize = normalize;
	useEffect(() => {
		const c = s.current;
		const next = adoptValue({ draft: c.draft, dirty: c.dirty }, value, c.normalize);
		c.dirty = next.dirty;
		if (next.draft !== c.draft) {
			c.draft = next.draft;
			setDraft(next.draft);
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

/** サブの項目を書く。通らなければ例外（日本語の説明）。書き方は描く場所で違う（Live Preview はエディタの文書、Reading はファイル。ADR-0161） */
export type SaveSub = (patch: SubIssuePatch) => Promise<void>;

/** 項目を保存する。通らなければカードの中に日本語の説明を出す */
type Save = (patch: SubIssuePatch) => Promise<boolean>;

export interface SubCardProps {
	ctx: TaskContext;
	sub: SubIssue;
	/** 同じ親のサブ（依存先の候補） */
	siblings: SubIssue[];
	open: boolean;
	onToggle: () => void;
	save: SaveSub;
	/** 題を、入力が止まってから保存するまでの時間。null なら欄を離れたときだけ（Reading は、保存で描き直されるため） */
	delayMs: number | null;
	/** 生の md を見せる（Live Preview だけ） */
	onShowSource?: () => void;
}

/**
 * サブ 1 件の項目のカード（ADR-0161）。行は status のアイコンと題。開くと項目をその場で直せる。
 * 本文は描かない（issue 本体の編集が描く）。開閉は、カードと本文の両方を開け閉めする
 */
export function SubCard(props: SubCardProps) {
	const { ctx, sub, open } = props;
	const [error, setError] = useState<string | null>(null);
	const save: Save = (patch) =>
		props
			.save(patch)
			.then(() => {
				setError(null);
				return true;
			})
			.catch((e: unknown) => {
				setError(e instanceof Error ? e.message : String(e));
				return false;
			});
	return (
		<div class="vt-sub-card vt-ui">
			<div class={`vt-subissue${isDoneStatus(sub.status) ? " is-done" : ""}${open ? " is-open" : ""}`}>
				<SubRow ctx={ctx} sub={sub} open={open} onToggle={props.onToggle} save={save} />
				{open && <SubFields {...props} save={save} error={error} />}
			</div>
		</div>
	);
}

/** カードの題の行（status・題と開閉・Pick）。カードと、上端に浮かべる行（StickySubRow）で使う */
function SubRow(props: { ctx: TaskContext; sub: SubIssue; open: boolean; onToggle: () => void; save: Save }) {
	const { ctx, sub, open, save } = props;
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
		<div class="vt-subissue-row">
			<button type="button" class="vt-subissue-status" aria-label={`Status: ${sub.status}`} title={`Status: ${sub.status}`} onClick={statusMenu}>
				<StatusIcon status={sub.status} />
			</button>
			<button type="button" class="vt-subissue-summary" aria-expanded={open} title={sub.summary} onClick={props.onToggle}>
				<Icon name={open ? "chevron-down" : "chevron-right"} />
				<span class="vt-subissue-summary-text">{sub.summary}</span>
				{hint !== null && <span class="vt-subissue-hint">{hint}</span>}
			</button>
			<PickTimer ctx={ctx} keyOf={sub.key} />
		</div>
	);
}

/**
 * 開いたサブの題の行を、スクロールの上端に浮かべる（ADR-0161 の追記）。カードと同じ行で、操作も同じ。
 * 保存できなかったときはカードの欄がないので、通知で知らせる
 */
export function StickySubRow(props: { ctx: TaskContext; sub: SubIssue; onToggle: () => void; save: SaveSub }) {
	const { ctx, sub } = props;
	const save: Save = (patch) =>
		props
			.save(patch)
			.then(() => true)
			.catch((e: unknown) => {
				ctx.report("サブを保存できませんでした", e);
				return false;
			});
	return (
		<div class="vt-sub-card vt-ui">
			<div class={`vt-subissue is-open${isDoneStatus(sub.status) ? " is-done" : ""}`}>
				<SubRow ctx={ctx} sub={sub} open onToggle={props.onToggle} save={save} />
			</div>
		</div>
	);
}

/** 開いたカードの中身: 項目を、その場で直す */
function SubFields(props: Omit<SubCardProps, "save"> & { save: Save; error: string | null }) {
	const { ctx, sub, save, delayMs } = props;
	const member = sub.delegatedTo === null ? null : ctx.store.index.members.get(sub.delegatedTo);
	const others = props.siblings.filter((s) => s.id !== sub.id);
	const summary = useDraft(sub.summary, (v) => (v.trim() === "" ? Promise.resolve(false) : save({ summary: v.trim() })), delayMs, (v) => v.trim());
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
			{(props.error ?? estimatedError) !== null && <div class="vt-error">{props.error ?? estimatedError}</div>}
			{props.onShowSource && (
				<div class="vt-form">
					<span class="vt-spacer" />
					<button type="button" class="vt-text-button" onClick={props.onShowSource}>
						Show source
					</button>
				</div>
			)}
		</div>
	);
}

/** 読めなかったブロックのカード。警告の行で、原文は Reading では読み取り専用で見せる。書き換えない */
export function UnreadableCard(props: { raw: string; onShowSource?: () => void }) {
	return (
		<div class="vt-sub-card vt-ui">
			<div class="vt-subissue is-unreadable">
				<div class="vt-subissue-row">
					<span class="vt-subissue-status" aria-hidden="true">
						<Icon name="alert-triangle" />
					</span>
					<span class="vt-subissue-summary-text">Could not read this block</span>
					<span class="vt-spacer" />
					{props.onShowSource && (
						<button type="button" class="vt-text-button" onClick={props.onShowSource}>
							Show source
						</button>
					)}
				</div>
				{!props.onShowSource && (
					<div class="vt-subissue-detail">
						<pre class="vt-subissue-raw">{props.raw}</pre>
					</div>
				)}
			</div>
		</div>
	);
}

/**
 * Reading のカード。保存済みの md（索引のストア）からサブを読み、ストアの変更で描き直す。
 * 項目を直すとファイルを書き換える（Reading にはエディタがないので、食い違わない）
 */
export function ReadingCard(props: {
	ctx: TaskContext;
	path: string;
	id: string | null;
	raw: string;
	open: () => boolean;
	onToggle: (ids: string[]) => void;
	/** 開閉がほかの場所（上端に浮かべた行）で変わったら知らせる */
	subscribeOpen?: (fn: () => void) => () => void;
}) {
	const { ctx, path } = props;
	const [, setTick] = useState(0);
	const redraw = () => setTick((n) => n + 1);
	useEffect(() => ctx.store.subscribe(redraw), [ctx]);
	useEffect(() => props.subscribeOpen?.(redraw), [props.subscribeOpen]);
	if (props.id === null) return <UnreadableCard raw={props.raw} />;
	const subs = parseSubIssues(path, issueIdOf(path), ctx.store.text(path) ?? "", parseYaml).subs;
	const sub = subs.find((s) => s.id === props.id);
	if (!sub) return null;
	return (
		<SubCard
			ctx={ctx}
			sub={sub}
			siblings={subs}
			open={props.open()}
			onToggle={() => {
				props.onToggle(subs.map((s) => s.id));
				redraw();
			}}
			save={(patch) => ctx.writer.updateSub(sub.key, patch)}
			delayMs={null}
		/>
	);
}
