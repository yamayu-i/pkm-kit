import { Menu } from "obsidian";
import type { Issue, Status } from "../core/schema";
import type { SubIssue, SubIssuePatch } from "../core/sub-issue";
import { issueStatusPatch, primaryStep, subStatusPatch, transitionTargets } from "../core/transition";
import { Icon } from "../ui/Icon";
import { useStoreVersion } from "../ui/hooks";
import { StatusIcon } from "../ui/StatusIcon";
import type { TaskContext } from "./context";
import { pickMember } from "./issue-editors";

/**
 * status を変える画面の処理（ADR-0183）。どの画面もここを通し、メニューは遷移表の先だけ、ボタンはよく使う 1 つだけを出す。
 * 付随の変更は core/transition.ts の表で決まり、書き込み（TaskWriter）が表にない遷移を拒む
 */

/** サブの書き方。既定はファイル（TaskWriter）。本文のカードはエディタの文書に書く（ADR-0161） */
export type SubSave = (patch: SubIssuePatch) => unknown;

const isDone = (s: Status) => s === "closed" || s === "canceled";

/** issue の status を to にする。delegated は委任先を選ぶ（同じ delegated なら選び直す） */
export function changeIssueStatus(ctx: TaskContext, issue: Issue, to: Status): Promise<void> | void {
	const save = (delegatedTo?: string) =>
		ctx.writer.update(issue.path, issueStatusPatch(to, { delegatedTo })).catch((e) => ctx.report("status を変えられませんでした", e));
	if (to === "delegated") return pickMember(ctx, (id) => void save(id));
	if (to === issue.status) return;
	return save();
}

/** サブの status を to にする。save を渡さなければファイルに書く */
export function changeSubStatus(ctx: TaskContext, sub: SubIssue, to: Status, save?: SubSave): Promise<void> | void {
	const write = (patch: SubIssuePatch) =>
		Promise.resolve(save ? save(patch) : ctx.writer.updateSub(sub.key, patch)).then(
			() => undefined,
			(e: unknown) => ctx.report("サブを保存できませんでした", e),
		);
	if (to === "delegated") return pickMember(ctx, (id) => void write(subStatusPatch(to, { delegatedTo: id })));
	if (to === sub.status) return;
	return write(subStatusPatch(to));
}

/** issue かサブを、鍵で探して to にする */
function changeByKey(ctx: TaskContext, key: string, to: Status, save?: SubSave): Promise<void> | void {
	const issue = ctx.store.index.issues.get(key);
	if (issue) return changeIssueStatus(ctx, issue, to);
	const sub = ctx.store.index.sub(key);
	if (sub) return changeSubStatus(ctx, sub, to, save);
}

function statusOf(ctx: TaskContext, key: string): Status | null {
	return (ctx.store.index.issues.get(key) ?? ctx.store.index.sub(key))?.status ?? null;
}

/** ↩ の戻る先へ戻す（ADR-0183） */
export function reopenByKey(ctx: TaskContext, key: string, save?: SubSave): Promise<void> | void {
	return changeByKey(ctx, key, ctx.store.index.reopenStatus(key), save);
}

/**
 * status のメニュー: 今の status（チェック付き）と、遷移表の移れる先だけ。closed / canceled には ↩ の戻る先を書いた Reopen も出す。
 * delegated のときは、今の status を押すと委任先を選び直す
 */
export function showStatusMenu(ctx: TaskContext, e: MouseEvent, key: string, save?: SubSave): void {
	const current = statusOf(ctx, key);
	if (current === null) return;
	const m = new Menu();
	const title = (s: Status) => (s === "delegated" ? "delegated…" : s);
	m.addItem((mi) =>
		mi
			.setTitle(title(current))
			.setChecked(true)
			.onClick(() => {
				if (current === "delegated") void changeByKey(ctx, key, current, save);
			}),
	);
	for (const s of transitionTargets(current)) m.addItem((mi) => mi.setTitle(title(s)).onClick(() => void changeByKey(ctx, key, s, save)));
	if (isDone(current)) {
		const to = ctx.store.index.reopenStatus(key);
		m.addSeparator();
		m.addItem((mi) => mi.setTitle(`Reopen (→ ${to})`).setIcon("undo-2").onClick(() => void reopenByKey(ctx, key, save)));
	}
	m.showAtMouseEvent(e);
}

/**
 * status のボタン（ADR-0183）。いちばんよく使う遷移を 1 つだけ出す。アイコンは押した後の status の形、closed / canceled は ↩。
 * ボードでは CSS でホバー・フォーカスのときだけ見せる（場所は取っておく）
 */
export function StatusStepButton(props: { ctx: TaskContext; keyOf: string; save?: SubSave; onDone?: () => void }) {
	const { ctx, keyOf, save } = props;
	useStoreVersion(ctx.store);
	const status = statusOf(ctx, keyOf);
	if (status === null) return null;
	const step = primaryStep(status);
	const reopenTo = step.kind === "reopen" ? ctx.store.index.reopenStatus(keyOf) : null;
	const title = step.kind === "reopen" ? `Reopen (→ ${reopenTo})` : `${step.label} (→ ${step.to})`;
	const run = (e: MouseEvent) => {
		e.stopPropagation();
		const done = step.kind === "reopen" ? reopenByKey(ctx, keyOf, save) : changeByKey(ctx, keyOf, step.to, save);
		void Promise.resolve(done).then(() => props.onDone?.());
	};
	return (
		<button type="button" class="vt-icon-button vt-status-step" aria-label={title} title={title} onClick={run}>
			{step.kind === "reopen" ? <Icon name="undo-2" /> : <StatusIcon status={step.to} />}
		</button>
	);
}
