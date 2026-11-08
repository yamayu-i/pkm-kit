import { Keymap } from "obsidian";
import { useEffect, useState } from "preact/hooks";
import { isDoneStatus } from "../core/status-log";
import type { Issue, Member } from "../core/schema";
import type { TaskContext } from "../obsidian/context";
import type { Save } from "../obsidian/issue-editors";
import { linkProps } from "../ui/a11y";
import { StatusBadge } from "../ui/badges";
import { Icon } from "../ui/Icon";
import { useStoreVersion } from "../ui/hooks";
import { LabelsField, formatDateTime } from "./IssueHeader";

/**
 * その場で編集する 1 行の欄（M3 の outlined text field 風の `.vt-name-field`。枠の上にラベル、下に説明かエラー）。Enter か、欄を離れたときに保存する。Escape で元に戻す。
 * required なら空では保存しない。空で保存すると frontmatter から項目を外す（読むときに既定に戻る。ADR-0035）
 */
function MemberField(props: { label: string; field: string; value: string; hint: string; required?: boolean; save: Save }) {
	const { label, field, value, required, save } = props;
	const [draft, setDraft] = useState(value);
	useEffect(() => setDraft(value), [value]);
	const error = required && !draft.trim() ? `${label} は空にできません` : null;
	const commit = () => {
		const next = draft.trim();
		if (error !== null) return;
		if (next !== value) save({ [field]: next || null });
	};
	return (
		<label class={`vt-name-field vt-member-field${error ? " is-error" : ""}`}>
			<span class="vt-name-label">{label}</span>
			<input
				type="text"
				value={draft}
				aria-invalid={error !== null}
				onInput={(e) => setDraft(e.currentTarget.value)}
				onBlur={commit}
				onKeyDown={(e) => {
					if (e.key === "Enter" && !e.isComposing) commit();
					if (e.key === "Escape") setDraft(value);
				}}
			/>
			<span class={error ? "vt-name-error" : "vt-name-hint"}>{error ?? props.hint}</span>
		</label>
	);
}

function DelegatedIssues(props: { ctx: TaskContext; issues: Issue[] }) {
	const { ctx } = props;
	const active = props.issues.filter((i) => !isDoneStatus(i.status));
	const done = props.issues.length - active.length;
	return (
		<div class="vt-member-issues">
			<div class="vt-field-label">Delegated issues {active.length}</div>
			{active.length === 0 && <div class="vt-muted">No delegated issues</div>}
			{active.map((issue) => (
				<div class="vt-member-issue" key={issue.id}>
					<StatusBadge status={issue.status} />
					<span class="vt-badge vt-id">{issue.id}</span>
					<span class="vt-member-issue-summary" {...linkProps((e) => void ctx.openPath(issue.path, Keymap.isModEvent(e) !== false))}>
						{issue.summary || "(no summary)"}
					</span>
				</div>
			))}
			{done > 0 && <div class="vt-muted">Finished (closed / canceled) {done}</div>}
		</div>
	);
}

/** member 画面のヘッダー（ADR-0035）。issue / routine と同じく、ページの一番上に差し込む（ADR-0077） */
export function MemberHeader(props: { ctx: TaskContext; path: string }) {
	const { ctx, path } = props;
	useStoreVersion(ctx.store);
	const index = ctx.store.index;
	const member: Member | undefined = [...index.members.values()].find((m) => m.path === path);
	if (!member) {
		return <div class="vt-header-missing">member の frontmatter を読めません（type / id を確認してください）</div>;
	}
	const save: Save = (fields) => void ctx.writer.update(path, fields).catch((e) => ctx.report("保存できませんでした", e));
	const issues = [...index.issues.values()]
		.filter((i) => i.delegatedTo === member.id)
		.sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
	return (
		<div class="vt-issue vt-member">
			<div class="vt-meta">
				<span>created {formatDateTime(member.created)}</span>
				<span>updated {formatDateTime(ctx.store.mtime(path))}</span>
			</div>
			<div class="vt-title vt-member-title">
				<Icon name="user" class="vt-member-icon" />
				<span class="vt-member-nickname">{member.nickname}</span>
				<span class="vt-member-name">({member.name})</span>
				<span class="vt-badge vt-id">{member.id}</span>
			</div>
			<section class="vt-card vt-member-fields">
				<MemberField label="nickname" field="nickname" value={member.nickname} hint="What you call them. Empty uses name" save={save} />
				<MemberField label="name" field="name" value={member.name} hint="Full name" required save={save} />
				<MemberField label="alias" field="alias" value={member.alias} hint={`Find them with @${member.alias} when choosing a delegate. Empty uses the ID`} save={save} />
				<div class="vt-member-labels">
					<span class="vt-field-label">label</span>
					<LabelsField ctx={ctx} labels={member.labels} index={index} save={save} />
				</div>
			</section>
			<section class="vt-card">
				<DelegatedIssues ctx={ctx} issues={issues} />
			</section>
			<hr class="vt-sep" />
		</div>
	);
}
