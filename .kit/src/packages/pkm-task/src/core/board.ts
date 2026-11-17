import { addDays, type LocalDate } from "./dates";
import { isActive, isWatchStatus, routineOccursOn, type TaskIndex } from "./index";
import type { Issue, Routine, Status } from "./schema";
import { routinesOnDay } from "./routine-order";
import type { SubIssue } from "./sub-issue";

/** routine のその日の結果（ADR-0010）。付けないまま日が過ぎたものは積み残し（ADR-0206） */
export type RoutineResult = "closed" | "canceled";

/**
 * その日の task board の状態。保存せず、操作ログを再生して作る（ADR-0020）
 */
export interface BoardState {
	/** ボードに載せた issue の ID とサブの合成キー（載せた順。ADR-0137） */
	issues: string[];
	/** ★ 今日の最重要（付けた順。ADR-0137） */
	stars: string[];
	routines: Record<string, RoutineResult>;
	/** リスケや Inbox で片付けた issue とサブ（ボードには残すが未完了に数えない） */
	carried: string[];
	/** 締めたか */
	closed: boolean;
}

export const BOARD_KEY = "board";

export function emptyBoard(): BoardState {
	return { issues: [], stars: [], routines: {}, carried: [], closed: false };
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
	// 以前の groups（グループの置き場所）は読まない（ADR-0137）
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

/** issue の ID かサブの合成キーが、その日のボードに載っているか */
export function isOnBoard(index: TaskIndex, date: LocalDate, key: string): boolean {
	return index.board(date)?.board.issues.includes(key) ?? false;
}

/** ボードに載っているもの（その日に出てくる routine も含む）。鍵が指すものがなくなったものは除く（ADR-0137） */
export function boardItems(index: TaskIndex, date: LocalDate, board: BoardState): { issues: Issue[]; subs: SubIssue[]; routines: Routine[] } {
	const issues = board.issues.map((id) => index.issues.get(id)).filter((i): i is Issue => i !== undefined);
	const subs = board.issues.map((key) => index.sub(key)).filter((s): s is SubIssue => s !== undefined);
	return { issues, subs, routines: routinesOnDay(index, date) };
}

/**
 * 未完了: closed / canceled / someday になっておらず、片付けて（carried）もいない issue とサブと、結果のない routine。
 * waiting / delegated は数えない（今日の自分の作業は終わり、続きは Watch の欄で見張る。ADR-0184）
 */
export function unfinished(index: TaskIndex, date: LocalDate, board: BoardState): { issues: Issue[]; subs: SubIssue[]; routines: Routine[] } {
	const items = boardItems(index, date, board);
	const left = (status: Status, key: string) => isActive({ status }) && !isWatchStatus(status) && !board.carried.includes(key);
	return {
		issues: items.issues.filter((i) => left(i.status, i.id)),
		subs: items.subs.filter((s) => left(s.status, s.key)),
		routines: items.routines.filter((r) => board.routines[r.id] === undefined),
	};
}

/** 未完了の件数 */
export function unfinishedCount(u: { issues: unknown[]; subs: unknown[]; routines: unknown[] }): number {
	return u.issues.length + u.subs.length + u.routines.length;
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

/** 並び（ADR-0114）にあるものはその順に、ないものは元の順で末尾に出す */
export function sortByOrder<T>(items: readonly T[], idOf: (item: T) => string, order: readonly string[] | undefined): T[] {
	if (!order || order.length === 0) return [...items];
	const rank = new Map(order.map((id, i) => [id, i]));
	const inOrder = items.filter((it) => rank.has(idOf(it))).sort((a, b) => (rank.get(idOf(a)) ?? 0) - (rank.get(idOf(b)) ?? 0));
	return [...inOrder, ...items.filter((it) => !rank.has(idOf(it)))];
}

/** 画面の並び（visible）から id を抜き、before の前（null か見つからなければ末尾）に入れる */
export function reorder(visible: readonly string[], id: string, before: string | null): string[] {
	const rest = visible.filter((x) => x !== id);
	const at = before === null ? -1 : rest.indexOf(before);
	return at < 0 ? [...rest, id] : [...rest.slice(0, at), id, ...rest.slice(at)];
}

/**
 * 書く並び（ADR-0114）。画面の並びに、前の並びにあって画面にない ID を、前の並びで直前にあった ID の後ろに差し込む
 * （直前がなければ先頭）。今日は出ていない routine などの位置を失わないため
 */
export function nextOrder(visible: readonly string[], previous: readonly string[] | undefined): string[] {
	const result = [...visible];
	if (!previous) return result;
	const shown = new Set(visible);
	let prev: string | null = null;
	let headAt = 0;
	for (const id of previous) {
		if (!shown.has(id) && !result.includes(id)) {
			if (prev === null) result.splice(headAt++, 0, id);
			else result.splice(result.indexOf(prev) + 1, 0, id);
		}
		prev = id;
	}
	return result;
}
