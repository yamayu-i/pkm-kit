import type { BoardState } from "./board";
import { boardItems } from "./board";
import { addDays, localToday, type LocalDate } from "./dates";
import type { TaskIndex } from "./index";
import { routinesOnDay } from "./routine-order";
import type { Issue, Routine, Status } from "./schema";
import type { SubIssue } from "./sub-issue";
import { workKey } from "./worklog";

/**
 * Closing の画面（ADR-0206）の中身。その日の作業を群に分けた一覧と、その日に変えたノート
 */

/** 端末のタイムゾーンでの日付 */
export function localDateOf(ms: number): LocalDate {
	const d = new Date(ms);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 締めの猶予（時）の既定（ADR-0226）。0 時からこの時刻までは前日を締める */
export const DEFAULT_CLOSING_GRACE_HOUR = 4;

function startOf(date: LocalDate, hour = 0): number {
	const [y, m, d] = date.split("-").map(Number) as [number, number, number];
	return new Date(y, m - 1, d, hour).getTime();
}

/** 締めの範囲（ADR-0226）: その日の 0 時から、翌日の猶予の時刻まで（猶予 0 ならその日の終わりまで） */
export function closingWindow(date: LocalDate, graceHour: number): { fromMs: number; toMs: number } {
	return { fromMs: startOf(date), toMs: startOf(addDays(date, 1), graceHour) };
}

const inWindow = (ms: number, w: { fromMs: number; toMs: number }) => ms >= w.fromMs && ms < w.toMs;

/** 猶予の間か（暦の今日の 0 時から猶予の時刻まで） */
function inGrace(now: Date, graceHour: number): boolean {
	return now.getHours() < graceHour;
}

/** Close board が締める日（ADR-0226）。猶予の間で、前日のボードがあって締めていなければ前日、ほかは今日 */
export function closingTarget(index: TaskIndex, now: Date, graceHour: number): LocalDate {
	const today = localToday(now);
	if (!inGrace(now, graceHour)) return today;
	const yesterday = addDays(today, -1);
	const daily = index.board(yesterday);
	return daily && !daily.board.closed ? yesterday : today;
}

/** 未完了のない過去のボードの自動の締めを待つか（ADR-0226）。猶予の間の前日のボード */
export function holdAutoClose(date: LocalDate, now: Date, graceHour: number): boolean {
	return inGrace(now, graceHour) && date === addDays(localToday(now), -1);
}

export type ClosingGroup = "closed" | "not-done" | "waiting" | "canceled";
export const CLOSING_GROUPS: readonly ClosingGroup[] = ["closed", "not-done", "waiting", "canceled"];

export type ClosingItem =
	| { kind: "issue"; key: string; issue: Issue; minutes: number }
	| { kind: "sub"; key: string; sub: SubIssue; minutes: number }
	| { kind: "routine"; key: string; routine: Routine; minutes: number };

export function groupOf(status: Status): ClosingGroup {
	if (status === "closed") return "closed";
	if (status === "canceled" || status === "someday") return "canceled";
	if (status === "waiting" || status === "delegated") return "waiting";
	return "not-done";
}

export function itemStatus(board: BoardState, item: ClosingItem): Status {
	if (item.kind === "issue") return item.issue.status;
	if (item.kind === "sub") return item.sub.status;
	return board.routines[item.routine.id] ?? "open";
}

/** その日の作業時間（分。終わった記録だけ。鍵ごと） */
export function workedMinutes(index: TaskIndex, date: LocalDate): Map<string, number> {
	const out = new Map<string, number>();
	for (const l of index.data.worklogs) {
		if (l.toMs === null || localDateOf(l.fromMs) !== date) continue;
		const key = workKey(l);
		out.set(key, (out.get(key) ?? 0) + (l.toMs - l.fromMs) / 60_000);
	}
	return out;
}

/**
 * その日の作業の群。ボードに載っているもの、締めの範囲（ADR-0226）に closed / canceled にしたもの（statuslog。ボードの外も）、
 * その日の routine（closing を除く。closing は画面の上の節に出す）。群の中は、issue とサブはボードに載せた順（ボードの外は後ろ）、routine は後ろに並び順
 */
export function closingGroups(index: TaskIndex, date: LocalDate, board: BoardState, graceHour = 0): Record<ClosingGroup, ClosingItem[]> {
	const minutes = workedMinutes(index, date);
	const window = closingWindow(date, graceHour);
	const items: ClosingItem[] = [];
	const seen = new Set<string>();
	const push = (item: ClosingItem) => {
		if (seen.has(item.key)) return;
		seen.add(item.key);
		items.push(item);
	};
	const on = boardItems(index, date, board);
	for (const key of board.issues) {
		const issue = index.issues.get(key);
		if (issue) push({ kind: "issue", key, issue, minutes: minutes.get(key) ?? 0 });
		const sub = issue ? undefined : index.sub(key);
		if (sub) push({ kind: "sub", key, sub, minutes: minutes.get(key) ?? 0 });
	}
	for (const log of index.data.statusLogs) {
		if (log.to !== "closed" && log.to !== "canceled") continue;
		if (!inWindow(log.atMs, window)) continue;
		const key = log.sub ? `${log.task}#${log.sub}` : log.task;
		if (log.sub) {
			const sub = index.sub(key);
			if (sub) push({ kind: "sub", key, sub, minutes: minutes.get(key) ?? 0 });
		} else {
			const issue = index.issues.get(key);
			if (issue) push({ kind: "issue", key, issue, minutes: minutes.get(key) ?? 0 });
		}
	}
	for (const routine of on.routines) if (routine.category !== "closing") push({ kind: "routine", key: routine.id, routine, minutes: minutes.get(routine.id) ?? 0 });
	const groups: Record<ClosingGroup, ClosingItem[]> = { closed: [], "not-done": [], waiting: [], canceled: [] };
	for (const item of items) groups[groupOf(itemStatus(board, item))].push(item);
	return groups;
}

/** その日に出てくる closing の routine（並び順） */
export function closingRoutines(index: TaskIndex, date: LocalDate): Routine[] {
	return routinesOnDay(index, date, "closing");
}

/** ノートの一覧に出す候補 */
export interface NoteStat {
	path: string;
	/** ファイルの更新時刻（ミリ秒） */
	mtime: number;
	/** frontmatter の created（なければ null） */
	created: string | null;
	title: string;
}

const TASK_FOLDERS = ["daily/", "issue/", "routine/", "member/", "preset/", "tmp/", "template/"];

/** Closing に出すノートか: md で、タスク管理のデータ・tmp/・template/・隠しパスでない（ADR-0206） */
export function isClosingNote(path: string): boolean {
	if (!path.endsWith(".md")) return false;
	if (TASK_FOLDERS.some((f) => path.startsWith(f))) return false;
	return !path.split("/").some((part) => part.startsWith("."));
}

/** 締めの範囲（ADR-0226）に変えたノート（新しい順）。作ったかは created が同じ範囲かで決める */
export function closingNotes(notes: readonly NoteStat[], date: LocalDate, graceHour = 0): { note: NoteStat; created: boolean }[] {
	const window = closingWindow(date, graceHour);
	return notes
		.filter((n) => isClosingNote(n.path) && inWindow(n.mtime, window))
		.sort((a, b) => b.mtime - a.mtime)
		.map((note) => ({ note, created: createdIn(note.created, date, window) }));
}

function createdIn(created: string | null, date: LocalDate, window: { fromMs: number; toMs: number }): boolean {
	if (!created) return false;
	const ms = Date.parse(created);
	return Number.isNaN(ms) ? created.slice(0, 10) === date : inWindow(ms, window);
}
