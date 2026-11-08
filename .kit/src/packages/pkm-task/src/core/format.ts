/** 1 日 = 24 時間で換算する（ADR-0034） */
export const MINUTES_PER_DAY = 24 * 60;

const UNIT_MINUTES: Record<string, number> = { d: MINUTES_PER_DAY, h: 60, m: 1 };

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

/**
 * estimated の入力欄の値を分にする（ADR-0034）。`1m` / `2h` / `1d` / `0.5d` / `2d3h33m` / `1h 30m` を読む。
 * 単位のない数字だけなら分。読めないもの、同じ単位が 2 回あるもの、0 以下は null
 */
export function parseDurationInput(input: string): number | null {
	const text = input.trim().toLowerCase();
	if (/^\d+(?:\.\d+)?$/.test(text)) {
		const min = Math.round(Number(text));
		return min > 0 ? min : null;
	}
	if (!/^(?:\d+(?:\.\d+)?\s*[dhm]\s*)+$/.test(text)) return null;
	const seen = new Set<string>();
	let total = 0;
	for (const m of text.matchAll(/(\d+(?:\.\d+)?)\s*([dhm])/g)) {
		const unit = m[2]!;
		if (seen.has(unit)) return null;
		seen.add(unit);
		total += Number(m[1]) * UNIT_MINUTES[unit]!;
	}
	const min = Math.round(total);
	return min > 0 ? min : null;
}
