import { diffDays, type LocalDate } from "./dates";
import { isActive } from "./index";
import type { Issue } from "./schema";

export interface DueLists {
	deadline: Issue[];
	midDue: Issue[];
}

const byDate = (key: "deadline" | "midDue") => (a: Issue, b: Issue) => (a[key] ?? "").localeCompare(b[key] ?? "") || a.id.localeCompare(b.id, "en", { numeric: true });

/** 期限を過ぎたもの（ADR-0009 の dead issue）。deadline と mid_due は別の表 */
export function deadIssues(issues: Iterable<Issue>, today: LocalDate): DueLists {
	const deadline: Issue[] = [];
	const midDue: Issue[] = [];
	for (const i of issues) {
		if (!isActive(i)) continue;
		if (i.deadline !== null && i.deadline < today) deadline.push(i);
		if (i.midDue !== null && i.midDue < today) midDue.push(i);
	}
	return { deadline: deadline.sort(byDate("deadline")), midDue: midDue.sort(byDate("midDue")) };
}

/** 期限まで `days` 日以内（今日を含む）。ADR-0009 の caution */
export function cautionIssues(issues: Iterable<Issue>, today: LocalDate, days = 3): DueLists {
	const within = (d: LocalDate | null) => d !== null && diffDays(d, today) >= 0 && diffDays(d, today) <= days;
	const deadline: Issue[] = [];
	const midDue: Issue[] = [];
	for (const i of issues) {
		if (!isActive(i)) continue;
		if (within(i.deadline)) deadline.push(i);
		if (within(i.midDue)) midDue.push(i);
	}
	return { deadline: deadline.sort(byDate("deadline")), midDue: midDue.sort(byDate("midDue")) };
}

/** その日が実行日の issue（ボードに載せたものを除く） */
export function scheduledOn(issues: Iterable<Issue>, date: LocalDate, exclude: ReadonlySet<string> = new Set()): Issue[] {
	return [...issues]
		.filter((i) => isActive(i) && i.scheduled.includes(date) && !exclude.has(i.id))
		.sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
}
