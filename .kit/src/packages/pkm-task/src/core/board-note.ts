import { unfinished, unfinishedCount, type BoardState } from "./board";
import { isLocalDate, type LocalDate } from "./dates";
import type { TaskIndex } from "./index";
import { boardSummary, upsertSummary } from "./summary";

/** 未完了を再検査し、本文の要約を書いた内容を返す。失敗時は一切保存しない。 */
export function closeBoardNote(text: string, date: LocalDate, index: TaskIndex, board: BoardState): string {
	if (!isLocalDate(date)) throw new Error("日付が不正です");
	if (/^(?:<{7}|={7}|>{7})(?: |\r?$)/m.test(text)) throw new Error("同期の競合を解消してからボードを締めてください");
	// 鍵が指すものがなくなったカード（消したサブなど）は数えず、締めを止めない（ADR-0137）
	const remaining = unfinished(index, date, board);
	if (unfinishedCount(remaining) > 0) throw new Error("未完了のタスクがあるためボードを締められません");
	return upsertSummary(text, boardSummary(index, date, board));
}
