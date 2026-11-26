import { addDays, type LocalDate } from "./dates";
import { routineAnchor, routineOccursOn, type TaskIndex } from "./index";
import { ROUTINE_CATEGORIES, type Routine, type RoutineCategory } from "./schema";

/**
 * routine の category と並び（ADR-0206）。
 * category ごとの群（default → closing）の中で、order の小さい順、order のないものは後ろに ID の順
 */

/** 一覧の群の順。null は default */
export const CATEGORY_GROUPS: readonly (RoutineCategory | null)[] = [null, ...ROUTINE_CATEGORIES];

export function compareRoutines(a: Routine, b: Routine): number {
	if (a.order !== null && b.order !== null && a.order !== b.order) return a.order - b.order;
	if (a.order !== null && b.order === null) return -1;
	if (a.order === null && b.order !== null) return 1;
	return a.id.localeCompare(b.id, "en", { numeric: true });
}

export function sortRoutines(routines: Iterable<Routine>): Routine[] {
	return [...routines].sort(compareRoutines);
}

/** category ごとの群（空の群も返す） */
export function routineGroups(routines: Iterable<Routine>): { category: RoutineCategory | null; routines: Routine[] }[] {
	const all = sortRoutines(routines);
	return CATEGORY_GROUPS.map((category) => ({ category, routines: all.filter((r) => r.category === category) }));
}

/** 書く frontmatter（変わるものだけ） */
export interface RoutinePatch {
	path: string;
	category?: RoutineCategory | null;
	order?: number;
}

/**
 * routine を category の群の before の前（null なら末尾）に動かすときに書く値。
 * 落とした群の routine の order を 1 から振り直す（変わるものだけ）。動かした routine は category も書く
 */
export function moveRoutine(routines: Iterable<Routine>, id: string, category: RoutineCategory | null, before: string | null): RoutinePatch[] {
	const all = sortRoutines(routines);
	const moved = all.find((r) => r.id === id);
	if (!moved || before === id) return [];
	const group = all.filter((r) => r.category === category && r.id !== id);
	const at = before === null ? -1 : group.findIndex((r) => r.id === before);
	group.splice(at < 0 ? group.length : at, 0, moved);
	const patches: RoutinePatch[] = [];
	group.forEach((r, i) => {
		const patch: RoutinePatch = { path: r.path };
		if (r.order !== i + 1) patch.order = i + 1;
		if (r.id === id && r.category !== category) patch.category = category;
		if (patch.order !== undefined || patch.category !== undefined) patches.push(patch);
	});
	return patches;
}

/**
 * その日に出てくる routine。予定日のものと、持ち越し（ADR-0234）のもの。category を渡すとその群だけ。
 * 持ち越しを先に（起点の古い順、同じ日は並び順）、その後ろに並び順
 */
export function routinesOnDay(index: TaskIndex, date: LocalDate, category?: RoutineCategory | null): Routine[] {
	const carried: { from: LocalDate; routine: Routine }[] = [];
	const rest: Routine[] = [];
	for (const routine of index.routines.values()) {
		if (category !== undefined && routine.category !== category) continue;
		const from = carriedFrom(index, routine, date);
		if (from !== null) carried.push({ from, routine });
		else if (routineOccursOn(routine, date)) rest.push(routine);
	}
	carried.sort((a, b) => (a.from === b.from ? compareRoutines(a.routine, b.routine) : a.from < b.from ? -1 : 1));
	return [...carried.map((c) => c.routine), ...sortRoutines(rest)];
}

/**
 * 積み残しを数え始める日（ADR-0206）。これより前の結果のない日は積み残しにしない
 * （導入した日に、今までの結果のない日が一度に出ないように）
 */
export const MISSED_ROUTINES_SINCE: LocalDate = "2026-11-18";

export interface MissedRoutine {
	date: LocalDate;
	routine: Routine;
}

/** 数え始め: start（なければ作った日）と since の遅いほう */
function countFrom(routine: Routine, since: LocalDate): LocalDate | null {
	const anchor = routineAnchor(routine);
	if (!routine.active || routine.repeat === null || anchor === null) return null;
	return anchor > since ? anchor : since;
}

/**
 * 持ち越しの起点（ADR-0234）。missed: carry の routine で、date より前の予定日のうち、
 * その日から date の前の日までのどのボードにも結果（closed / canceled）がないものの、一番古い日。なければ null。
 * ある日の結果は、それより前の片付いていない予定日をすべて片付ける（過去の日のボードには書かない）
 */
export function carriedFrom(index: TaskIndex, routine: Routine, date: LocalDate, since: LocalDate = MISSED_ROUTINES_SINCE): LocalDate | null {
	if (routine.missed !== "carry") return null;
	const start = countFrom(routine, since);
	if (start === null) return null;
	let pending: LocalDate | null = null;
	for (let d = start; d < date; d = addDays(d, 1)) {
		if (index.board(d)?.board.routines[routine.id] !== undefined) pending = null;
		else if (pending === null && routineOccursOn(routine, d)) pending = d;
	}
	return pending;
}

/**
 * routine の積み残し（ADR-0206）: 実行予定日を過ぎて、その日のボードに結果（closed / canceled）のないもの。
 * 数え始めは start（なければ作った日）と MISSED_ROUTINES_SINCE の遅いほう。今日は含めない。
 * missed: carry の routine は除く（ボードに持ち越す。ADR-0234）。日付の古い順、同じ日は routine の並び順
 */
export function missedRoutines(index: TaskIndex, today: LocalDate, since: LocalDate = MISSED_ROUTINES_SINCE): MissedRoutine[] {
	const out: MissedRoutine[] = [];
	for (const routine of index.routines.values()) {
		const from = countFrom(routine, since);
		if (from === null || routine.missed === "carry") continue;
		for (let d = from; d < today; d = addDays(d, 1)) {
			if (!routineOccursOn(routine, d)) continue;
			if (index.board(d)?.board.routines[routine.id] !== undefined) continue;
			out.push({ date: d, routine });
		}
	}
	return out.sort((a, b) => (a.date === b.date ? compareRoutines(a.routine, b.routine) : a.date < b.date ? -1 : 1));
}
