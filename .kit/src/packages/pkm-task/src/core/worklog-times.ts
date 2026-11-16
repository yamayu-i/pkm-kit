/** ボードと Tasks Now から記録の開始・終了を直す（ADR-0193）。短い書き方の解釈・操作の決め方・時計のダイヤル */

const pad2 = (n: number) => String(n).padStart(2, "0");

/** 端末のタイムゾーンで、その日時の ms。存在しない日時（2/30、24:00 など）は null */
function localMs(year: number, month: number, day: number, hour: number, minute: number): number | null {
	if (month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59) return null;
	const d = new Date(year, month - 1, day, hour, minute, 0, 0);
	if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day || d.getHours() !== hour) return null;
	return d.getTime();
}

/**
 * 短い書き方（ADR-0193 の表）を、今（now）を基準に ms にする。
 * 表にない形・存在しない日時・今より後は null。相対の書き方は、秒を切り捨てた今から数える
 */
export function parseTimeInputAt(input: string, now: number): number | null {
	const s = input.trim().toLowerCase();
	const ms = parseShape(s, now);
	return ms !== null && ms <= now ? ms : null;
}

function parseShape(s: string, now: number): number | null {
	const base = new Date(now);
	const relative = /^-(?:(\d+)h)?(?:(\d+)m)?$/.exec(s);
	if (relative && (relative[1] !== undefined || relative[2] !== undefined)) {
		const minutes = Number(relative[1] ?? 0) * 60 + Number(relative[2] ?? 0);
		const floored = new Date(now);
		floored.setSeconds(0, 0);
		return floored.getTime() - minutes * 60_000;
	}
	const stored = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(s);
	if (stored) return localMs(Number(stored[1]), Number(stored[2]), Number(stored[3]), Number(stored[4]), Number(stored[5]));
	const daysAgo = /^(\d{4})-(\d+)d$/.exec(s);
	if (daysAgo) {
		const day = new Date(base.getFullYear(), base.getMonth(), base.getDate() - Number(daysAgo[2]));
		return localMs(day.getFullYear(), day.getMonth() + 1, day.getDate(), Number(daysAgo[1]!.slice(0, 2)), Number(daysAgo[1]!.slice(2)));
	}
	if (!/^\d+$/.test(s)) return null;
	const hm = (t: string) => [Number(t.slice(-4, -2)), Number(t.slice(-2))] as const;
	const [hour, minute] = hm(s);
	const year = base.getFullYear();
	const month = base.getMonth() + 1;
	if (s.length === 4) return localMs(year, month, base.getDate(), hour, minute);
	if (s.length === 6) return localMs(year, month, Number(s.slice(0, 2)), hour, minute);
	if (s.length === 8) return localMs(year, Number(s.slice(0, 2)), Number(s.slice(2, 4)), hour, minute);
	if (s.length === 10) return localMs(2000 + Number(s.slice(0, 2)), Number(s.slice(2, 4)), Number(s.slice(4, 6)), hour, minute);
	return null;
}

/** 欄を離れたときに書き換える文字（`2026-08-26 22:05`）。parseTimeInputAt で同じ日時に戻る */
export function formatTimeInput(ms: number): string {
	const d = new Date(ms);
	return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

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
