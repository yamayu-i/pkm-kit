import { emptyBoard, markCarried, type BoardState, type RoutineResult } from "./board";
import { isLocalDate, type LocalDate } from "./dates";
import type { Problem } from "./problem";
import { sanitizeDeviceName } from "./worklog";

/** ボードへの 1 操作（ADR-0020）。どの順で再生しても BoardState は有効なままになる */
export type BoardOp =
	| { op: "add"; task: string }
	| { op: "remove"; task: string }
	| { op: "place"; task: string; group: string | null }
	| { op: "routine"; task: string; result: RoutineResult | null }
	| { op: "carry"; task: string }
	| { op: "close"; tasks: string[] }
	| { op: "reopen" };

/** 操作ログの 1 行 */
export interface BoardLogEntry {
	/** どのファイルの何行目か（エラー表示と再生の順番用） */
	path: string;
	line: number;
	id: string;
	/** UTC のミリ秒まで */
	at: string;
	atMs: number;
	/** 対象のボードの日付 */
	date: LocalDate;
	op: BoardOp;
}

/** `board/<端末名>/YYYY-MM.jsonl`（月は対象のボードの日付の月） */
export const BOARD_LOG_PATH_RE = /^board\/([^/]+)\/(\d{4}-\d{2})\.jsonl$/;

export function boardLogPath(device: string, date: LocalDate): string {
	const safe = sanitizeDeviceName(device);
	if (!safe) throw new Error("端末名が空です");
	return `board/${safe}/${date.slice(0, 7)}.jsonl`;
}

/** 書く時刻。時計が遅れていても、見えている最新の操作より後ろに並べる */
export function nextBoardAt(nowMs: number, latestMs: number | null): number {
	return latestMs === null ? nowMs : Math.max(nowMs, latestMs + 1);
}

function parseOp(o: Record<string, unknown>): BoardOp | null {
	const task = typeof o.task === "string" && o.task ? o.task : null;
	switch (o.op) {
		case "add":
		case "remove":
		case "carry":
			return task ? { op: o.op, task } : null;
		case "place":
			return task && (o.group === null || (typeof o.group === "string" && o.group)) ? { op: "place", task, group: o.group as string | null } : null;
		case "routine":
			return task && (o.result === null || o.result === "closed" || o.result === "canceled") ? { op: "routine", task, result: o.result } : null;
		case "close":
			return Array.isArray(o.tasks) && o.tasks.every((id) => typeof id === "string" && id) ? { op: "close", tasks: o.tasks as string[] } : null;
		case "reopen":
			return { op: "reopen" };
		default:
			return null;
	}
}

/** 読めない行は問題として報告し、その行だけ飛ばす */
export function parseBoardLog(path: string, text: string): { entries: BoardLogEntry[]; problems: Problem[] } {
	const entries: BoardLogEntry[] = [];
	const problems: Problem[] = [];
	const problem = (line: number, code: string, message: string) =>
		problems.push({ severity: "error", path, code, message: `${line} 行目: ${message}` });

	text.split("\n").forEach((raw, i) => {
		const line = i + 1;
		if (!raw.trim()) return;
		let obj: unknown;
		try {
			obj = JSON.parse(raw);
		} catch {
			problem(line, "invalid-json", "JSON として読めません");
			return;
		}
		if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
			problem(line, "invalid-json", "オブジェクトではありません");
			return;
		}
		const o = obj as Record<string, unknown>;
		if (typeof o.id !== "string" || !o.id) return problem(line, "invalid-board-log", "id がありません");
		const atMs = typeof o.at === "string" ? Date.parse(o.at) : Number.NaN;
		if (Number.isNaN(atMs)) return problem(line, "invalid-board-log", "at が日時ではありません");
		if (typeof o.date !== "string" || !isLocalDate(o.date)) return problem(line, "invalid-board-log", "date が日付ではありません");
		const op = parseOp(o);
		if (!op) return problem(line, "invalid-board-log", "操作が不正です");
		entries.push({ path, line, id: o.id, at: o.at as string, atMs, date: o.date, op });
	});
	return { entries, problems };
}

export function serializeBoardLogEntry(e: { id: string; at: string; date: LocalDate } & BoardOp): string {
	return JSON.stringify(e);
}

/** ログの ID（`bo_` + 10 文字） */
export function newBoardLogId(random: () => number = Math.random): string {
	const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
	return `bo_${Array.from({ length: 10 }, () => chars[Math.floor(random() * chars.length)]).join("")}`;
}

/** at → 端末名（パス）→ 行番号の順 */
function compareEntries(a: BoardLogEntry, b: BoardLogEntry): number {
	if (a.atMs !== b.atMs) return a.atMs - b.atMs;
	if (a.path !== b.path) return a.path < b.path ? -1 : 1;
	return a.line - b.line;
}

function apply(board: BoardState, op: BoardOp): void {
	switch (op.op) {
		case "add":
			if (!board.issues.includes(op.task)) board.issues.push(op.task);
			board.carried = board.carried.filter((id) => id !== op.task);
			board.closed = false;
			break;
		case "remove":
			board.issues = board.issues.filter((id) => id !== op.task);
			board.carried = board.carried.filter((id) => id !== op.task);
			delete board.groups[op.task];
			break;
		case "place":
			if (op.group === null) delete board.groups[op.task];
			else board.groups[op.task] = op.group;
			break;
		case "routine":
			if (op.result === null) delete board.routines[op.task];
			else board.routines[op.task] = op.result;
			break;
		case "carry":
			if (board.issues.includes(op.task)) markCarried(board, [op.task]);
			break;
		case "close":
		case "reopen":
			board.closed = op.op === "close";
			break;
	}
}

/** ログを再生してボードの状態を作る。initial は既存の frontmatter の board（読み取り専用） */
export function replayBoard(initial: BoardState, entries: BoardLogEntry[]): BoardState {
	const board = { ...emptyBoard(), ...structuredClone(initial) };
	let lastClose: string[] | null = null;
	for (const e of [...entries].sort(compareEntries)) {
		apply(board, e.op);
		if (e.op.op === "close") lastClose = e.op.tasks;
	}
	// 締めた端末が見ていなかった issue があれば、締めを解く
	const seen = lastClose;
	if (board.closed && seen !== null && board.issues.some((id) => !seen.includes(id))) board.closed = false;
	return board;
}
