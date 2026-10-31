import type { LocalDate } from "./dates";
import { isActive, type TaskIndex } from "./index";
import type { Issue, Routine } from "./schema";

/** routine のその日の結果（ADR-0010: その日のうちに closed か canceled にする） */
export type RoutineResult = "closed" | "canceled";

/**
 * その日の task board の状態（ADR-0009）。デイリーノートの frontmatter の `board` に置く
 */
export interface BoardState {
	/** ボードに載せた issue の ID（載せた順） */
	issues: string[];
	/** issue / routine の ID → グループ（`親` か `親/子`）。ないものは未分類 */
	groups: Record<string, string>;
	routines: Record<string, RoutineResult>;
	/** リスケや Inbox で片付けた issue（ボードには残すが未完了に数えない） */
	carried: string[];
	/** 締めたか */
	closed: boolean;
}

export const BOARD_KEY = "board";

export function emptyBoard(): BoardState {
	return { issues: [], groups: {}, routines: {}, carried: [], closed: false };
}

function record(value: unknown): Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

/** frontmatter の `board` を読む。壊れた部分は捨てる */
export function parseBoard(value: unknown): BoardState {
	const raw = record(value);
	const board = emptyBoard();
	if (Array.isArray(raw.issues)) {
		for (const id of raw.issues) if (typeof id === "string" && !board.issues.includes(id)) board.issues.push(id);
	}
	if (Array.isArray(raw.carried)) {
		for (const id of raw.carried) if (typeof id === "string" && !board.carried.includes(id)) board.carried.push(id);
	}
	for (const [id, g] of Object.entries(record(raw.groups))) if (typeof g === "string" && g) board.groups[id] = g;
	for (const [id, r] of Object.entries(record(raw.routines))) if (r === "closed" || r === "canceled") board.routines[id] = r;
	board.closed = raw.closed === true;
	return board;
}

/** frontmatter に書く形。空の欄は省く */
export function serializeBoard(board: BoardState): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	if (board.issues.length > 0) out.issues = board.issues;
	if (Object.keys(board.groups).length > 0) out.groups = board.groups;
	if (Object.keys(board.routines).length > 0) out.routines = board.routines;
	if (board.carried.length > 0) out.carried = board.carried;
	if (board.closed) out.closed = true;
	return out;
}

/** `daily/YYYY/MM/YYYY-MM-DD.md`（.obsidian/daily-notes.json と同じ） */
export function dailyNotePath(date: LocalDate): string {
	return `daily/${date.slice(0, 4)}/${date.slice(5, 7)}/${date}.md`;
}

export const DAILY_PATH_RE = /^daily\/\d{4}\/\d{2}\/(\d{4}-\d{2}-\d{2})\.md$/;

export interface DailyBoard {
	date: LocalDate;
	path: string;
	board: BoardState;
}

/** ボードに載っているもの（その日に出てくる routine も含む） */
export function boardItems(index: TaskIndex, date: LocalDate, board: BoardState): { issues: Issue[]; routines: Routine[] } {
	const issues = board.issues.map((id) => index.issues.get(id)).filter((i): i is Issue => i !== undefined);
	return { issues, routines: index.routinesOn(date) };
}

/** 未完了: closed / canceled / someday になっておらず、片付けて（carried）もいない issue と、結果のない routine */
export function unfinished(index: TaskIndex, date: LocalDate, board: BoardState): { issues: Issue[]; routines: Routine[] } {
	const items = boardItems(index, date, board);
	return {
		issues: items.issues.filter((i) => isActive(i) && !board.carried.includes(i.id)),
		routines: items.routines.filter((r) => board.routines[r.id] === undefined),
	};
}

/**
 * 今日より前で、締めていないボード（古い順）。何日も開かなかったときは溜まった分をまとめて扱う（ADR-0009）
 */
export function pendingBoards(index: TaskIndex, boards: DailyBoard[], today: LocalDate): DailyBoard[] {
	return boards
		.filter((b) => b.date < today && !b.board.closed)
		.filter((b) => {
			const u = unfinished(index, b.date, b.board);
			return u.issues.length > 0 || u.routines.length > 0;
		})
		.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * カードの置き場所（グループの鍵）。ボードで移したもの → 既定（routine の group）→ 未分類（""）の順。
 * 今はないグループを指していたら未分類
 */
export function placementOf(board: BoardState, id: string, fallback: string | null, keys: readonly string[]): string {
	const key = board.groups[id] ?? fallback ?? "";
	return key !== "" && keys.includes(key) ? key : "";
}
