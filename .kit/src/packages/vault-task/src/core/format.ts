/** 1 日 = 8 時間で換算する（ADR-0012） */
export const MINUTES_PER_DAY = 8 * 60;

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

/** estimated の入力欄の値（日数。`0.5` / `0.5d`）を分にする。読めなければ null */
export function parseDaysInput(input: string): number | null {
	const m = /^\s*(\d+(?:\.\d+)?)\s*d?\s*$/i.exec(input);
	if (!m) return null;
	return Math.round(Number(m[1]) * MINUTES_PER_DAY);
}
