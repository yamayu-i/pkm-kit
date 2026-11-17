import type { SubIssue } from "../core/sub-issue";

/**
 * 上部の一覧・Timeline の題と「Open note」: サブを開き、下部のカードの題を画面の上端に出す（ADR-0179 とその追記）。
 * 実際の動きは、本文のカードを描く sub-cards.ts が登録する（上部の一覧とダイアログが、エディタの部品を直接読み込まないため）
 */
let reveal: ((sub: SubIssue) => void) | null = null;

export function setSubRevealer(fn: ((sub: SubIssue) => void) | null): void {
	reveal = fn;
}

export function revealSub(sub: SubIssue): void {
	reveal?.(sub);
}
