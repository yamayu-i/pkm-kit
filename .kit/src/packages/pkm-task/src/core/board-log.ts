import { emptyBoard, markCarried, type BoardState, type RoutineResult } from "./board";
import { isLocalDate, type LocalDate } from "./dates";
import type { Problem } from "./problem";
import { sanitizeDeviceName } from "./worklog";

/** ボードへの 1 操作（ADR-0020）。どの順で再生しても BoardState は有効なままになる */
export type BoardOp =
	| { op: "add"; task: string }
	| { op: "remove"; task: string }
	/** 以前のグループの置き場所（ADR-0034）。ADR-0137 で廃止。読むが再生では使わない */
	| { op: "place"; task: string; group: string | null }
	| { op: "routine"; task: string; result: RoutineResult | null }
	| { op: "carry"; task: string }
	| { op: "close"; tasks: string[] }
	| { op: "reopen" }
	/** ★ 今日の最重要（ADR-0137）。その日だけ */
	| { op: "star"; task: string; on: boolean }
	/** ボードの並び全体（ADR-0114, 0137）。BoardState は変えず、並びの履歴から決める */
	| { op: "order"; tasks: string[] };

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

/** 以前の形式で、読んでも捨てる行（ADR-0137: place と group 付きの order） */
const IGNORED = "ignored" as const;

function parseOp(o: Record<string, unknown>): BoardOp | typeof IGNORED | null {
	const task = typeof o.task === "string" && o.task ? o.task : null;
	switch (o.op) {
		case "add":
		case "remove":
		case "carry":
			return task ? { op: o.op, task } : null;
		case "place":
			return IGNORED;
		case "star":
			return task && typeof o.on === "boolean" ? { op: "star", task, on: o.on } : null;
		case "routine":
			return task && (o.result === null || o.result === "closed" || o.result === "canceled") ? { op: "routine", task, result: o.result } : null;
		case "close":
			return Array.isArray(o.tasks) && o.tasks.every((id) => typeof id === "string" && id) ? { op: "close", tasks: o.tasks as string[] } : null;
		case "reopen":
			return { op: "reopen" };
		case "order":
			if ("group" in o) return IGNORED;
			return Array.isArray(o.tasks) && o.tasks.every((id) => typeof id === "string" && id) ? { op: "order", tasks: o.tasks as string[] } : null;
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
		if (op === IGNORED) return;
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
			board.stars = board.stars.filter((id) => id !== op.task);
			break;
		case "place":
			break;
		case "star":
			board.stars = board.stars.filter((id) => id !== op.task);
			if (op.on) board.stars.push(op.task);
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
		case "order":
			break;
	}
}

/** 鍵を読み替える（移行したサブの以前の ID → 合成キー。ADR-0135, 0137） */
export function renameBoardOp(op: BoardOp, rename: (key: string) => string): BoardOp {
	switch (op.op) {
		case "close":
			return { op: "close", tasks: op.tasks.map(rename) };
		case "order":
			return { op: "order", tasks: op.tasks.map(rename) };
		case "reopen":
			return op;
		default:
			return { ...op, task: rename(op.task) };
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

/** その日のボードから外したままの issue（最後の add / remove が remove のもの。ADR-0034: 自動では載せ直さない） */
export function removedTasks(entries: BoardLogEntry[]): string[] {
	const last = new Map<string, "add" | "remove">();
	for (const e of [...entries].sort(compareEntries)) {
		if (e.op.op === "add" || e.op.op === "remove") last.set(e.op.task, e.op.op);
	}
	return [...last].filter(([, op]) => op === "remove").map(([id]) => id);
}

/** ボードを並べた記録（ADR-0114, 0137） */
export interface OrderRecord {
	date: LocalDate;
	atMs: number;
	tasks: string[];
}

/** 並べた記録をボードの日付 → 時刻の順に並べる */
export function orderHistory(entries: BoardLogEntry[]): OrderRecord[] {
	const records: OrderRecord[] = [];
	for (const e of [...entries].sort(compareEntries)) {
		if (e.op.op === "order") records.push({ date: e.date, atMs: e.atMs, tasks: e.op.tasks });
	}
	return records.sort((a, b) => (a.date !== b.date ? a.date.localeCompare(b.date) : a.atMs - b.atMs));
}

/** その日までで最後の並び。並べたことがなければ undefined */
export function lastOrder(history: readonly OrderRecord[], date: LocalDate): string[] | undefined {
	let found: string[] | undefined;
	for (const r of history) {
		if (r.date > date) break;
		found = r.tasks;
	}
	return found;
}
