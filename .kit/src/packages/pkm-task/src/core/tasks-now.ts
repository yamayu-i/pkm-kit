import { emptyBoard } from "./board";
import { boardLanes, cardPath, cardSummary } from "./board-lanes";
import type { LocalDate } from "./dates";
import { formatMinutes } from "./format";
import type { TaskIndex } from "./index";
import { workKey, type WorklogEntry } from "./worklog";

/**
 * Tasks Now（ADR-0144）: リボンの「Tasks Now」で開くダイアログの、状態の判定と一覧の組み立て。
 * 画面に依存しない純粋な関数だけを置く
 */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** PKM State のカードの状態。ok = 緑、caution = 黄、alert = 赤、idle = 色なし（比べる相手がない） */
export type StateLevel = "ok" | "caution" | "alert" | "idle";

export interface StateCard {
	/** 経過時間（ミリ秒）。比べる相手がなければ null */
	elapsedMs: number | null;
	level: StateLevel;
	/** 状態の名前（Rest のカードの Healthy / Caution / Over-focused など）。ないときは null */
	label: string | null;
}

/** Organized: 前に Organize してから 1 日以上たったら赤 */
export const ORGANIZED_ALERT_MS = DAY;
/** Worklog Paused: 前に記録を止めてから半日（12 時間）以上たったら赤 */
export const PAUSED_ALERT_MS = 12 * HOUR;
/** Rest（Focus Streak）: タイマーが 1 時間以内なら緑、2 時間までは黄、2 時間以上は赤 */
export const FOCUS_OK_MS = HOUR;
export const FOCUS_CAUTION_MS = 2 * HOUR;

/** 日付 YYYY-MM-DD の、その端末の 0 時のミリ秒 */
function localMidnightMs(date: LocalDate): number {
	const [y, m, d] = date.split("-").map(Number);
	return new Date(y!, m! - 1, d!).getTime();
}

/**
 * 前に Organize した時刻。Organize は issue の `reviewed`（日付）を書くので、いちばん新しい `reviewed` の 0 時と、
 * この端末が最後に Organize で記録した時刻（lastOrganizedAt。ISO）の新しい方。どちらもなければ null
 */
export function lastOrganizedMs(index: TaskIndex, lastOrganizedAt: string | null): number | null {
	let latest: number | null = null;
	for (const issue of index.issues.values()) {
		if (issue.reviewed === null) continue;
		const ms = localMidnightMs(issue.reviewed);
		if (!Number.isNaN(ms) && (latest === null || ms > latest)) latest = ms;
	}
	const own = lastOrganizedAt ? Date.parse(lastOrganizedAt) : Number.NaN;
	if (!Number.isNaN(own) && (latest === null || own > latest)) latest = own;
	return latest;
}

export function organizedCard(lastMs: number | null, now: number): StateCard {
	if (lastMs === null) return { elapsedMs: null, level: "alert", label: "Never" };
	const elapsedMs = Math.max(0, now - lastMs);
	return { elapsedMs, level: elapsedMs >= ORGANIZED_ALERT_MS ? "alert" : "ok", label: null };
}

/** 前に記録を止めた時刻（worklog の to のいちばん新しいもの）。記録がなければ null */
export function lastWorklogStopMs(worklogs: readonly WorklogEntry[]): number | null {
	let latest: number | null = null;
	for (const l of worklogs) if (l.toMs !== null && (latest === null || l.toMs > latest)) latest = l.toMs;
	return latest;
}

/** 記録中があれば「止めていない」ので経過時間は出さない（label: Running）。なければ止めてからの時間 */
export function pausedCard(worklogs: readonly WorklogEntry[], now: number): StateCard {
	if (worklogs.some((l) => l.toMs === null)) return { elapsedMs: null, level: "ok", label: "Running" };
	const last = lastWorklogStopMs(worklogs);
	if (last === null) return { elapsedMs: null, level: "alert", label: "No worklog" };
	const elapsedMs = Math.max(0, now - last);
	return { elapsedMs, level: elapsedMs >= PAUSED_ALERT_MS ? "alert" : "ok", label: null };
}

/** タイマーの連続した経過時間。記録中のうち、いちばん前に始めたものから数える。記録中がなければ null */
export function focusElapsedMs(worklogs: readonly WorklogEntry[], now: number): number | null {
	let first: number | null = null;
	for (const l of worklogs) if (l.toMs === null && (first === null || l.fromMs < first)) first = l.fromMs;
	return first === null ? null : Math.max(0, now - first);
}

export function restCard(worklogs: readonly WorklogEntry[], now: number): StateCard {
	const elapsedMs = focusElapsedMs(worklogs, now);
	if (elapsedMs === null) return { elapsedMs: null, level: "idle", label: "Resting" };
	if (elapsedMs < FOCUS_OK_MS) return { elapsedMs, level: "ok", label: "Healthy" };
	if (elapsedMs < FOCUS_CAUTION_MS) return { elapsedMs, level: "caution", label: "Caution" };
	return { elapsedMs, level: "alert", label: "Over-focused" };
}

/** 実行中・保留中・一覧の 1 行 */
export interface NowTask {
	/** issue / routine の ID か、サブの合成キー */
	key: string;
	/** `i-12` や `i-12 › 題` の左側に出す ID */
	id: string;
	summary: string;
	/** 開くノート。索引にないときは null */
	path: string | null;
	/** 実行中のときの経過時間（ミリ秒）。それ以外は null */
	elapsedMs: number | null;
}

function describe(index: TaskIndex, key: string): Pick<NowTask, "id" | "summary" | "path"> {
	// サブは題をサブのものにし、開くのは親の md（ADR-0135）
	const task = index.sub(key) ?? index.issues.get(key) ?? index.routines.get(key);
	return { id: key.includes("#") ? key.split("#")[0]! : key, summary: task?.summary ?? "", path: task?.path ?? null };
}

/** 実行中のタスク（同じ鍵の複数のログは 1 つにまとめ、経過時間はいちばん長いもの）。始めた順 */
export function runningTasks(index: TaskIndex, now: number): NowTask[] {
	const elapsed = new Map<string, number>();
	for (const l of index.running()) {
		const key = workKey(l);
		elapsed.set(key, Math.max(elapsed.get(key) ?? 0, Math.max(0, now - l.fromMs)));
	}
	return [...elapsed.entries()].sort((a, b) => b[1] - a[1]).map(([key, ms]) => ({ key, ...describe(index, key), elapsedMs: ms }));
}

/** 保留した群のうち、今も始められるもの（消えた・終わったものは除く）。保留した順を保つ */
export function pausedTasks(index: TaskIndex, keys: readonly string[]): NowTask[] {
	const running = new Set(index.running().map(workKey));
	return keys
		.filter((key) => !running.has(key))
		.filter((key) => {
			const task = index.sub(key) ?? index.issues.get(key) ?? index.routines.get(key);
			if (!task) return false;
			return !("status" in task) || (task.status !== "closed" && task.status !== "canceled");
		})
		.map((key) => ({ key, ...describe(index, key), elapsedMs: null }));
}

/**
 * タスクリスト: 今日のボード（今日が実行日のものを含む）のうち、記録中でも片付いてもいないもの（次にやる順）。保留中の群は含めない。
 */
export function todoTasks(index: TaskIndex, today: LocalDate, excluded: ReadonlySet<string>): NowTask[] {
	// 今日が実行日でまだ載っていないものも、ボードと同じく自動で載せて数える（ADR-0034）
	const stored = index.board(today)?.board ?? emptyBoard();
	const board = { ...stored, issues: [...stored.issues, ...index.toAutoAdd(today)] };
	const lanes = boardLanes(index, today, board);
	return [...lanes.top, ...lanes.next, ...lanes.waiting]
		.filter((c) => !excluded.has(c.key))
		.map((c) => ({ key: c.key, ...describe(index, c.key), summary: cardSummary(c), path: cardPath(c), elapsedMs: null }));
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** `2026-11-15 SUN 14:03:09` の形（デイリーノートの題と同じ並び） */
export function formatNow(ms: number): string {
	const d = new Date(ms);
	const p = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${WEEKDAYS[d.getDay()]!.toUpperCase()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** 経過時間の表示。1 日以上は `1d 3h`、それ未満は `3h20m` / `42m` */
export function formatElapsed(ms: number): string {
	const minutes = Math.floor(ms / 60_000);
	if (minutes >= 24 * 60) return `${Math.floor(minutes / (24 * 60))}d ${Math.floor((minutes % (24 * 60)) / 60)}h`;
	return formatMinutes(minutes);
}
