import type { BoardState } from "./board";
import { isLocalDate, type LocalDate } from "./dates";
import type { TaskIndex } from "./index";
import { boardSummary, upsertSummary } from "./summary";

/**
 * 本文の要約を書いた内容を返す。失敗時は一切保存しない。
 * 未完了が残っていても書く（未完了は「持ち越し」と書く。締めは記録だけ。ADR-0189）
 */
export function closeBoardNote(text: string, date: LocalDate, index: TaskIndex, board: BoardState): string {
	if (!isLocalDate(date)) throw new Error("日付が不正です");
	if (/^(?:<{7}|={7}|>{7})(?: |\r?$)/m.test(text)) throw new Error("同期の競合を解消してからボードを締めてください");
	return upsertSummary(text, boardSummary(index, date, board));
}
