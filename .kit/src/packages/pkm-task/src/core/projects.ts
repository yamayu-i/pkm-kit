import { addDays, diffDays, weekdayOf, type LocalDate } from "./dates";
import type { TaskIndex } from "./index";
import type { Issue } from "./schema";
import { isDone, visibleSubs, type SubIssue } from "./sub-issue";
import { barOf } from "./timeline";

/**
 * Project を横断するタイムライン（Projects）と負荷の行、見積もりのサイズ（ADR-0231）。
 * 表示のときに毎回求める値で、保存しない（ADR-0002）
 */

/** Projects の 1 群: Project の issue と、出すサブ（md の順） */
export interface ProjectGroup {
	issue: Issue;
	subs: SubIssue[];
	/** 隠している closed・canceled のサブの数 */
	closed: number;
}

const ID_NUM = (id: string) => Number(id.slice(2)) || 0;
const earlier = (a: LocalDate | null, b: LocalDate | null) => (a === null ? b : b === null ? a : a < b ? a : b);
const compareNullable = (a: LocalDate | null, b: LocalDate | null) => (a === b ? 0 : a === null ? 1 : b === null ? -1 : a.localeCompare(b));

/** 親の期限（deadline、なければ soft_deadline） */
export function projectDue(issue: Pick<Issue, "deadline" | "softDeadline">): LocalDate | null {
	return issue.deadline ?? issue.softDeadline;
}

/**
 * Projects に出す群。closed・canceled でない Project を、親の期限 → 閉じていないサブの end のいちばん早い日 → ID の順に並べる。
 * サブは showClosed のときだけ closed・canceled も出す（親の画面と同じ。ADR-0181）
 */
export function projectGroups(index: TaskIndex, showClosed: boolean): ProjectGroup[] {
	const groups: (ProjectGroup & { firstEnd: LocalDate | null })[] = [];
	for (const issue of index.issues.values()) {
		if (issue.status === "closed" || issue.status === "canceled" || !index.isProject(issue.id)) continue;
		const all = index.subs(issue.id);
		const firstEnd = all.filter((s) => !isDone(s)).reduce<LocalDate | null>((acc, s) => earlier(acc, barOf(s)?.end ?? null), null);
		groups.push({ issue, subs: visibleSubs(all, showClosed), closed: all.filter(isDone).length, firstEnd });
	}
	groups.sort((a, b) => compareNullable(projectDue(a.issue), projectDue(b.issue)) || compareNullable(a.firstEnd, b.firstEnd) || ID_NUM(a.issue.id) - ID_NUM(b.issue.id));
	return groups.map(({ firstEnd: _, ...g }) => g);
}

/** サブに使う見積もり。sub はサブの値、budget は親の予算の割り振り */
export type EffectiveEstimate = { minutes: number; source: "sub" | "budget" } | null;

/**
 * 使う見積もり（ADR-0231）。サブの estimated があればそれ。なければ、親の estimated の残りを、
 * 見積もりのない閉じていないサブで等分する。残り = 親の estimated − canceled 以外のサブの estimated の合計。
 * 親に estimated がない・残りが 0 以下なら null（見積もりなし）
 */
export function effectiveEstimates(parent: Pick<Issue, "estimated"> | undefined, subs: readonly SubIssue[]): Map<string, EffectiveEstimate> {
	const out = new Map<string, EffectiveEstimate>();
	const used = subs.filter((s) => s.status !== "canceled" && s.estimated !== null).reduce((n, s) => n + s.estimated!, 0);
	const candidates = subs.filter((s) => s.estimated === null && !isDone(s));
	const rest = parent?.estimated == null ? 0 : parent.estimated - used;
	const share = candidates.length > 0 && rest > 0 ? rest / candidates.length : null;
	for (const s of subs) {
		if (s.estimated !== null) out.set(s.key, { minutes: s.estimated, source: "sub" });
		else out.set(s.key, share !== null && !isDone(s) ? { minutes: share, source: "budget" } : null);
	}
	return out;
}

/** 1 日に使える時間（分）。端末ごとの設定 */
export interface Capacity {
	weekday: number;
	weekend: number;
}

export const DEFAULT_CAPACITY: Capacity = { weekday: 360, weekend: 0 };

export function capacityOn(date: LocalDate, cap: Capacity): number {
	const wd = weekdayOf(date);
	return wd === 0 || wd === 6 ? cap.weekend : cap.weekday;
}

/** 負荷に数える 1 件: 閉じていないサブの期間と、使う見積もり（null は見積もりなし） */
export interface LoadItem {
	key: string;
	start: LocalDate;
	end: LocalDate;
	minutes: number | null;
}

/** 1 日の負荷: 割り振った見積もりの合計（分）と、その日にかかる見積もりのないサブ */
export interface DayLoad {
	minutes: number;
	unknown: string[];
}

/** 見積もりを期間の中の使える時間のある日に等分する。使える時間のある日がなければ、期間のすべての日に等分する */
export function dayLoad(items: readonly LoadItem[], cap: Capacity): Map<LocalDate, DayLoad> {
	const out = new Map<LocalDate, DayLoad>();
	const at = (d: LocalDate) => {
		let v = out.get(d);
		if (!v) out.set(d, (v = { minutes: 0, unknown: [] }));
		return v;
	};
	for (const item of items) {
		const days: LocalDate[] = [];
		for (let i = 0; i <= diffDays(item.end, item.start); i++) days.push(addDays(item.start, i));
		if (item.minutes === null) {
			for (const d of days) at(d).unknown.push(item.key);
			continue;
		}
		const working = days.filter((d) => capacityOn(d, cap) > 0);
		const spread = working.length > 0 ? working : days;
		for (const d of spread) at(d).minutes += item.minutes / spread.length;
	}
	return out;
}

/** 列（from から days 日）の負荷。未見積もりはサブの数（重なりを除く） */
export function columnLoad(load: ReadonlyMap<LocalDate, DayLoad>, from: LocalDate, days: number, cap: Capacity): { minutes: number; capacity: number; unknown: number; over: boolean } {
	let minutes = 0;
	let capacity = 0;
	const unknown = new Set<string>();
	for (let i = 0; i < days; i++) {
		const d = addDays(from, i);
		capacity += capacityOn(d, cap);
		const v = load.get(d);
		if (!v) continue;
		minutes += v.minutes;
		for (const k of v.unknown) unknown.add(k);
	}
	minutes = Math.round(minutes * 100) / 100;
	return { minutes, capacity, unknown: unknown.size, over: minutes > capacity };
}

/** 群のサブから、負荷に数える項目（閉じていない・期間がある） */
export function loadItems(groups: readonly ProjectGroup[], index: TaskIndex): LoadItem[] {
	const out: LoadItem[] = [];
	for (const g of groups) {
		const est = effectiveEstimates(g.issue, index.subs(g.issue.id));
		for (const s of g.subs) {
			const bar = barOf(s);
			if (!bar || isDone(s)) continue;
			out.push({ key: s.key, ...bar, minutes: est.get(s.key)?.minutes ?? null });
		}
	}
	return out;
}

/** 負荷の行の文言: `5h`、`5h?`、`?`。時間は 0.5 刻みに丸める */
export function loadLabel(minutes: number, unknown: number): string {
	const h = Math.round((minutes / 60) * 2) / 2;
	const text = h > 0 ? `${h}h` : "";
	return unknown > 0 ? `${text}?` : text;
}

/** 見積もりのサイズのチップ（ADR-0231） */
export const SIZES = [
	{ label: "S", minutes: 30 },
	{ label: "M", minutes: 120 },
	{ label: "L", minutes: 240 },
] as const;

export type SizeLabel = (typeof SIZES)[number]["label"];

export const XL_MESSAGE = "4 時間を超える作業は、サブを分けてください";

/** 今の値のサイズ（ちょうど一致するものだけ） */
export function sizeOf(minutes: number | null): SizeLabel | null {
	return SIZES.find((s) => s.minutes === minutes)?.label ?? null;
}

/** 近いうちの見積もりのないサブの印を出す日数 */
export const ESTIMATE_HORIZON_DAYS = 14;

/** 閉じていない・estimated がない・期間が今日から 14 日のうちにかかるサブ（ADR-0231） */
export function needsEstimate(sub: SubIssue, today: LocalDate): boolean {
	if (isDone(sub) || sub.estimated !== null) return false;
	const bar = barOf(sub);
	if (!bar) return false;
	return bar.end >= today && bar.start <= addDays(today, ESTIMATE_HORIZON_DAYS - 1);
}
