/** ボードと Tasks Now から記録の開始・終了を直す（ADR-0193）。操作の決め方・時計のダイヤル。日時の書き方は入力言語（ADR-0228。shared/src/date-input.ts） */

export type WorklogTimesPlan =
	| { kind: "continue"; fromMs: number }
	| { kind: "stop"; fromMs: number; toMs: number }
	| { kind: "start"; fromMs: number }
	| { kind: "add"; fromMs: number; toMs: number }
	| { kind: "error"; error: string };

/**
 * ダイアログの入力から、何をするかを決める（ADR-0193 の 2）。
 * 記録中なら動いている記録を直し（To が空なら続け、あれば止める）、記録していないなら始めるか足す
 */
export function planWorklogTimes(input: { running: boolean; fromMs: number | null; toMs: number | null; now: number }): WorklogTimesPlan {
	const { running, fromMs, toMs, now } = input;
	if (fromMs === null) return { kind: "error", error: "From を入力してください" };
	if (fromMs > now || (toMs !== null && toMs > now)) return { kind: "error", error: "今より後の日時は入れられません" };
	if (toMs !== null && toMs <= fromMs) return { kind: "error", error: "To は From より後にしてください" };
	if (toMs === null) return running ? { kind: "continue", fromMs } : { kind: "start", fromMs };
	return running ? { kind: "stop", fromMs, toMs } : { kind: "add", fromMs, toMs };
}

export type ClockMode = "hour" | "minute";

/** 内の輪（12〜23）とみなす、中心からの距離（外の輪の半径を 1 とする） */
const INNER_LIMIT = 0.78;
/** 内の輪の数字を置く半径 */
export const INNER_RADIUS = 0.62;

/**
 * ダイヤルの点（中心を原点、外の輪の半径を 1、y は下向き）を値にする。
 * 時は外の輪が 0〜11、内の輪が 12〜23（真上が 0 / 12）。分は一周 60 で 1 分きざみ
 */
export function clockValueAt(mode: ClockMode, x: number, y: number): number {
	// 真上を 0 にして時計回りの角度（0 以上 1 未満）
	const turn = (Math.atan2(x, -y) / (2 * Math.PI) + 1) % 1;
	if (mode === "minute") return Math.round(turn * 60) % 60;
	const hour = Math.round(turn * 12) % 12;
	return Math.hypot(x, y) < INNER_LIMIT ? hour + 12 : hour;
}

/** ダイヤルに置く数字と位置（中心を原点、外の輪の半径を 1、y は下向き） */
export function dialPositions(mode: ClockMode): { value: number; x: number; y: number; inner: boolean }[] {
	const at = (value: number, step: number, radius: number, inner: boolean) => {
		const angle = (step / 12) * 2 * Math.PI;
		return { value, x: Math.sin(angle) * radius, y: -Math.cos(angle) * radius, inner };
	};
	if (mode === "minute") return Array.from({ length: 12 }, (_, i) => at(i * 5, i, 1, false));
	return [...Array.from({ length: 12 }, (_, i) => at(i, i, 1, false)), ...Array.from({ length: 12 }, (_, i) => at(i + 12, i, INNER_RADIUS, true))];
}

/** 針の位置（値から。dialPositions と同じ座標） */
export function handPosition(mode: ClockMode, value: number): { x: number; y: number } {
	const turn = mode === "minute" ? value / 60 : (value % 12) / 12;
	const radius = mode === "hour" && value >= 12 ? INNER_RADIUS : 1;
	const angle = turn * 2 * Math.PI;
	return { x: Math.sin(angle) * radius, y: -Math.cos(angle) * radius };
}
