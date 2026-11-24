/** 1 日 = 24 時間で換算する（ADR-0034） */
export const MINUTES_PER_DAY = 24 * 60;

/** 分を `2d3h33m` の形にする。0 は `0m` */
export function formatMinutes(minutes: number): string {
	const sign = minutes < 0 ? "-" : "";
	let rest = Math.round(Math.abs(minutes));
	const d = Math.floor(rest / MINUTES_PER_DAY);
	rest -= d * MINUTES_PER_DAY;
	const h = Math.floor(rest / 60);
	const m = rest - h * 60;
	const parts = [d ? `${d}d` : "", h ? `${h}h` : "", m ? `${m}m` : ""].join("");
	return sign + (parts || "0m");
}

/** estimated の入力欄の値を分にする（ADR-0034）。入力言語の期間（ADR-0228） */
export { parseDurationInput } from "../../../shared/src/date-input.ts";
