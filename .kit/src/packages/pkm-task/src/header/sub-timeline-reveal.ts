import type { SubIssue } from "../core/sub-issue";

/**
 * 「Timeline で期間を決める」（ADR-0203）: 期間を決めれば Next になるサブの、Pick の位置のボタン。
 * 親の issue 画面の Sub-issues のカードを Timeline に切り替え、そのサブの行を目立たせて画面に入れる。何も書き換えない。
 * 実際の動きは、親の Sub-issues のカード（SubIssues.tsx）が開いている間だけ登録する（本文のサブカードからも呼べるように、部品を直接読み込まない）
 */
const revealers = new Map<string, (sub: SubIssue) => void>();
/** 親の画面が開いていなかったときに、開いた後で見せるサブ */
let pending: SubIssue | null = null;

export function setTimelineRevealer(parentId: string, fn: ((sub: SubIssue) => void) | null): void {
	if (!fn) {
		revealers.delete(parentId);
		return;
	}
	revealers.set(parentId, fn);
	if (pending?.parent === parentId) {
		const sub = pending;
		pending = null;
		fn(sub);
	}
}

/** 登録がなければ false（親の画面が開いていない）。そのときは、親の画面が開いたら見せる */
export function revealInTimeline(sub: SubIssue): boolean {
	const fn = revealers.get(sub.parent);
	if (!fn) {
		pending = sub;
		return false;
	}
	pending = null;
	fn(sub);
	return true;
}
