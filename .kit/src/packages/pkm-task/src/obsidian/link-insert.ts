import { type Editor, type Plugin } from "obsidian";
import { installLinkChips, resolveVaultPath, type ChipTarget, type LinkChip } from "../../../shared/src/link-chips.ts";
import { LinkPicker, insertAtCursor, renderRow, type PickerSource } from "../../../shared/src/link-picker.ts";
import {
	isDoneStatus,
	issueLink,
	memberInitial,
	memberLink,
	routineLink,
	searchIssues,
	searchMembers,
	searchRoutines,
	searchSubs,
	subLink,
	subShortcut,
} from "../core/link-search";
import { describeRepeat } from "../core/repeat";
import type { Issue, Member, Routine, Status } from "../core/schema";
import type { SubIssue } from "../core/sub-issue";
import type { TaskContext } from "./context";

/**
 * @issue・@sub-issue・@member・@routine（ADR-0194）。検索ダイアログで選んだものへのリンクをカーソルの位置に入れ、
 * 本文の issue / routine / member へのリンクをチップに描き替える
 */

// ---------- 描き方（ダイアログの行とチップで共有） ----------

function idBadge(el: HTMLElement, text: string, status: Status | "paused" | "routine"): void {
	const cls = status === "routine" ? "vt-status-in-progress" : status === "paused" ? "vt-status-canceled" : `vt-status-${status}`;
	el.createSpan({ cls: `vt-badge vt-id ${cls}`, text });
}

function avatar(el: HTMLElement, member: Member): void {
	el.createSpan({ cls: "vt-link-avatar", text: memberInitial(member), attr: { "aria-hidden": "true" } });
}

function chipTitle(el: HTMLElement, text: string, done = false): void {
	el.createSpan({ cls: `vt-link-chip-title${done ? " is-done" : ""}`, text });
}

// ---------- 検索ダイアログ ----------

const STATUS_HINT = "Number: ID · s:closed / s:open,waiting / s:all";

function issueSource(ctx: TaskContext, editor: Editor, recency: (path: string) => number): PickerSource<Issue> {
	return {
		placeholder: "Search issues",
		hint: STATUS_HINT,
		search: (q) => searchIssues([...ctx.store.index.issues.values()], q, recency),
		render: (i, el) => renderRow(el, { lead: (l) => idBadge(l, i.id, i.status), title: i.summary, note: i.status, done: isDoneStatus(i.status) }),
		choose: (i) => insertAtCursor(editor, issueLink(i)),
	};
}

/** @sub-issue: ① 親（サブを持つ issue）→ ② その親のサブ。`12#` で ① を飛ばす。② の空の欄で Backspace を押すと ① に戻る */
type SubRow = { parent: Issue } | { sub: SubIssue };

function subSource(ctx: TaskContext, editor: Editor, recency: (path: string) => number): PickerSource<SubRow> {
	const index = () => ctx.store.index;
	const subsStep = (parent: Issue): PickerSource<SubRow> => ({
		placeholder: `Sub-issues of ${parent.id} ${parent.summary}`,
		hint: "s:closed / s:all · Backspace: back to issues",
		search: (q) => searchSubs(index().subs(parent.id), q).map((sub) => ({ sub })),
		render: (row, el) => {
			if (!("sub" in row)) return;
			const s = row.sub;
			renderRow(el, { lead: (l) => idBadge(l, s.key, s.status), title: s.summary, note: s.status, done: isDoneStatus(s.status) });
		},
		choose: (row) => {
			if ("sub" in row) insertAtCursor(editor, subLink(row.sub));
		},
		back: (picker) => {
			picker.setSource(first);
			return true;
		},
		empty: "No sub-issues",
	});
	const first: PickerSource<SubRow> = {
		placeholder: "Search issues with sub-issues (12# to jump)",
		hint: STATUS_HINT,
		search: (q) => {
			const jump = subShortcut(q);
			if (jump) {
				const parent = index().issues.get(jump.parent);
				return parent ? searchSubs(index().subs(parent.id), jump.rest).map((sub) => ({ sub })) : [];
			}
			const parents = [...index().issues.values()].filter((i) => index().subs(i.id).length > 0);
			return searchIssues(parents, q, recency).map((parent) => ({ parent }));
		},
		render: (row, el) => {
			if ("sub" in row) {
				const s = row.sub;
				renderRow(el, { lead: (l) => idBadge(l, s.key, s.status), title: s.summary, note: s.status, done: isDoneStatus(s.status) });
				return;
			}
			const p = row.parent;
			renderRow(el, { lead: (l) => idBadge(l, p.id, p.status), title: p.summary, note: `${index().subs(p.id).length} sub-issues`, done: isDoneStatus(p.status) });
		},
		choose: (row, picker) => {
			if ("sub" in row) return insertAtCursor(editor, subLink(row.sub));
			picker.setSource(subsStep(row.parent));
			return "stay";
		},
		empty: "No issues with sub-issues",
	};
	return first;
}

function memberSource(ctx: TaskContext, editor: Editor, recency: (path: string) => number): PickerSource<Member> {
	return {
		placeholder: "Search members",
		hint: "Name, nickname, alias · Number: ID",
		search: (q) => searchMembers([...ctx.store.index.members.values()], q, recency),
		render: (m, el) => renderRow(el, { lead: (l) => avatar(l, m), title: m.nickname, note: m.name === m.nickname ? m.id : `${m.name} · ${m.id}` }),
		choose: (m) => insertAtCursor(editor, memberLink(m)),
	};
}

function routineSource(ctx: TaskContext, editor: Editor, recency: (path: string) => number): PickerSource<Routine> {
	return {
		placeholder: "Search routines",
		hint: "Number: ID · s:paused / s:all",
		search: (q) => searchRoutines([...ctx.store.index.routines.values()], q, recency),
		render: (r, el) =>
			renderRow(el, { lead: (l) => idBadge(l, r.id, r.active ? "routine" : "paused"), title: r.summary, note: r.repeat ? describeRepeat(r.repeat) : "", done: !r.active }),
		choose: (r) => insertAtCursor(editor, routineLink(r)),
	};
}

// ---------- チップ ----------

export function chipFor(ctx: TaskContext, t: ChipTarget): LinkChip | null {
	const index = ctx.store.index;
	const path = index.issuesByPath.has(t.path) ? t.path : resolveVaultPath(ctx.app, t.path, t.source);
	if (!path) return null;
	if (path.startsWith("issue/")) {
		const issue = index.issuesByPath.get(path);
		if (!issue) return null;
		const sub = t.anchor ? index.sub(`${issue.id}#${t.anchor}`) : undefined;
		if (sub) {
			return {
				mode: "replace",
				key: `${sub.key}|${sub.status}|${sub.summary}|${issue.summary}`,
				open: path,
				render: (el) => {
					idBadge(el, sub.key, sub.status);
					el.createSpan({ cls: "vt-link-chip-context", text: `${issue.summary} ›` });
					chipTitle(el, sub.summary, isDoneStatus(sub.status));
				},
			};
		}
		return {
			mode: "replace",
			key: `${issue.id}|${issue.status}|${issue.summary}`,
			open: path,
			render: (el) => {
				idBadge(el, issue.id, issue.status);
				chipTitle(el, issue.summary, isDoneStatus(issue.status));
			},
		};
	}
	if (path.startsWith("routine/")) {
		const r = index.data.routines.find((x) => x.path === path);
		if (!r) return null;
		return {
			mode: "replace",
			key: `${r.id}|${r.active}|${r.summary}`,
			open: path,
			render: (el) => {
				idBadge(el, r.id, r.active ? "routine" : "paused");
				chipTitle(el, r.summary, !r.active);
			},
		};
	}
	if (path.startsWith("member/")) {
		const m = index.data.members.find((x) => x.path === path);
		if (!m) return null;
		return {
			mode: "replace",
			key: `${m.id}|${m.nickname}`,
			open: path,
			render: (el) => {
				avatar(el, m);
				chipTitle(el, m.nickname);
			},
		};
	}
	return null;
}

/** ファイルの更新日時（新しいほど大きい） */
function recencyOf(ctx: TaskContext): (path: string) => number {
	return (path) => ctx.app.vault.getFileByPath(path)?.stat.mtime ?? 0;
}

export function installLinkInsert(ctx: TaskContext, plugin: Plugin): void {
	const open = <T>(editor: Editor, make: (ctx: TaskContext, editor: Editor, recency: (path: string) => number) => PickerSource<T>) =>
		new LinkPicker(ctx.app, make(ctx, editor, recencyOf(ctx))).open();
	plugin.addCommand({ id: "insert-issue-link", name: "Insert link to issue", icon: "link", editorCallback: (editor) => open(editor, issueSource) });
	plugin.addCommand({ id: "insert-sub-issue-link", name: "Insert link to sub-issue", icon: "link", editorCallback: (editor) => open(editor, subSource) });
	plugin.addCommand({ id: "insert-member-link", name: "Insert link to member", icon: "link", editorCallback: (editor) => open(editor, memberSource) });
	plugin.addCommand({ id: "insert-routine-link", name: "Insert link to routine", icon: "link", editorCallback: (editor) => open(editor, routineSource) });
	installLinkChips(plugin, { resolve: (t) => chipFor(ctx, t), subscribe: (fn) => ctx.store.subscribe(fn) });
}
