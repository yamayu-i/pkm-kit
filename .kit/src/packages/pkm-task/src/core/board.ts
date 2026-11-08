import { addDays, type LocalDate } from "./dates";
import { isActive, routineOccursOn, type TaskIndex } from "./index";
import type { Issue, Routine } from "./schema";

/** routine のその日の結果（ADR-0010: その日のうちに closed か canceled にする） */
export type RoutineResult = "closed" | "canceled";

/**
 * その日の task board の状態。保存せず、操作ログを再生して作る（ADR-0020）
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

/** 既存のデイリーノートの frontmatter の `board`（読み取り専用）を読む。壊れた部分は捨てる */
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

/** `daily/YYYY/MM/YYYY-MM-DD.md`（.obsidian/daily-notes.json と同じ） */
export function dailyNotePath(date: LocalDate): string {
	return `daily/${date.slice(0, 4)}/${date.slice(5, 7)}/${date}.md`;
}

export const DAILY_PATH_RE = /^daily\/\d{4}\/\d{2}\/(\d{4}-\d{2}-\d{2})\.md$/;

export interface DailyBoard {
	date: LocalDate;
	path: string;
	board: BoardState;
	/** このボードの最新の操作の時刻（ミリ秒）。操作がなければなし */
	latestAt?: number;
	/** その日に外したままの issue（自動では載せ直さない。ADR-0034）。なければなし */
	removed?: string[];
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

/** 片付けた issue として記録する（ボードには残る） */
export function markCarried(board: BoardState, ids: string[]): void {
	for (const id of ids) if (!board.carried.includes(id)) board.carried.push(id);
}

/** routine のある日の結果。none は予定があって未記録、off は予定なし */
export interface RoutineDayResult {
	date: LocalDate;
	state: RoutineResult | "none" | "off";
}

/** 今日までの `days` 日分の結果（古い順。ADR-0018） */
export function routineResults(index: TaskIndex, routine: Routine, today: LocalDate, days: number): RoutineDayResult[] {
	return Array.from({ length: days }, (_, i) => {
		const date = addDays(today, i - days + 1);
		const result = index.board(date)?.board.routines[routine.id];
		return { date, state: result ?? (routineOccursOn(routine, date) ? "none" : "off") };
	});
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
 * カードの置き場所（グループの鍵）。その日に移したもの → 前に置いた場所（remembered。null は未分類に置いた）
 * → 既定（routine の group）→ 未分類（""）の順（ADR-0034）。今はないグループを指していたら未分類
 */
export function placementOf(board: BoardState, id: string, fallback: string | null, keys: readonly string[], remembered?: string | null): string {
	const key = board.groups[id] ?? (remembered !== undefined ? (remembered ?? "") : (fallback ?? ""));
	return key !== "" && keys.includes(key) ? key : "";
}
