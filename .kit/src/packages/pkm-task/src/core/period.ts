import { parseDateInput } from "../../../shared/src/date-input.ts";
import type { LocalDate } from "./dates";

/** サブの期間（ADR-0245）。両方あるか、両方ないかのどちらか */
export interface Period {
	start: LocalDate | null;
	end: LocalDate | null;
}

/**
 * カレンダーで日を押したときの次の期間。1 回目に押した日が Start、2 回目が End。
 * Start より前を押したら、その日を Start にして選び直す。両方そろっていれば、押した日から選び直す
 */
export function pickPeriodDay(current: Period, day: LocalDate): Period {
	if (current.start === null || current.end !== null || day < current.start) return { start: day, end: null };
	return { start: current.start, end: day };
}

/** 保存できない理由（日本語）。片方だけと、End が Start より前のもの。保存できれば null */
export function periodError(p: Period): string | null {
	if (p.start === null && p.end === null) return null;
	if (p.start === null) return "Start も入れてください（期間は Start と End の両方が要ります）";
	if (p.end === null) return "End も入れてください（期間は Start と End の両方が要ります。1 日なら同じ日）";
	if (p.end < p.start) return "End が Start より前です";
	return null;
}

/** 入力欄の文字を入力言語（ADR-0228）で読む。End は Start を基準に読む（`+3d` は Start の 3 日後）。Start が読めなければ今日を基準にする */
export function readPeriodTexts(startText: string, endText: string, today: LocalDate): Period {
	const start = parseDateInput(startText, today);
	return { start, end: parseDateInput(endText, start ?? today) };
}

const shortDate = (d: LocalDate) => `${d.slice(5, 7)}/${d.slice(8, 10)}`;

/** チップの文字。`11/03–11/07`、同じ日は `11/03`、なければ null（行の補足と同じ形） */
export function formatPeriod(p: Period): string | null {
	if (p.start === null || p.end === null) return p.start ?? p.end ? `${p.start ? shortDate(p.start) : ""}–${p.end ? shortDate(p.end) : ""}` : null;
	return p.start === p.end ? shortDate(p.start) : `${shortDate(p.start)}–${shortDate(p.end)}`;
}
