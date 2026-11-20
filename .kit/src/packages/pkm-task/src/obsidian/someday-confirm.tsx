import { describeClear, somedayClears } from "../core/project-periods";
import type { Issue } from "../core/schema";
import type { TaskContext } from "./context";
import { PreactModal } from "./modals";

/**
 * Project を someday にする前の確認（ADR-0210）。閉じていないサブの期間と Calendar の日が消えるので、消えるものを並べて確かめる。
 * 消えるものがなければ確認せずに true。Cancel・閉じたら false（何も変えない）。一括の操作は 1 つのダイアログでまとめて確かめる
 */
export function confirmSomeday(ctx: TaskContext, issues: readonly Issue[]): Promise<boolean> {
	const groups = issues
		.filter((i) => i.status !== "someday")
		.map((issue) => ({ issue, subs: somedayClears(ctx.store.index.subs(issue.id)) }))
		.filter((g) => g.subs.length > 0);
	if (groups.length === 0) return Promise.resolve(true);
	return new Promise((resolve) => {
		let done = false;
		const finish = (ok: boolean, close: () => void) => {
			done = true;
			close();
			resolve(ok);
		};
		const modal = new PreactModal(ctx.app, "Move to Someday", (close) => (
			<div>
				<p>Someday にすると、次のサブの期間と Calendar の日を消します。サブの status は変えません。</p>
				{groups.map((g) => (
					<div>
						{groups.length > 1 && <div class="vt-field-label">{`${g.issue.id} ${g.issue.summary}`}</div>}
						<ul>
							{g.subs.map((s) => (
								<li>{describeClear(s)}</li>
							))}
						</ul>
					</div>
				))}
				<div class="vt-form">
					<button type="button" onClick={() => finish(false, close)}>
						Cancel
					</button>
					<button type="button" class="mod-warning" onClick={() => finish(true, close)}>
						Move to Someday
					</button>
				</div>
			</div>
		));
		const onClose = modal.onClose.bind(modal);
		modal.onClose = () => {
			onClose();
			if (!done) resolve(false);
		};
		modal.open();
	});
}
