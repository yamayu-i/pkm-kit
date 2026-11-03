import { diffDays, type LocalDate } from "./dates";
import { isActive } from "./index";
import type { Issue } from "./schema";

export interface DueLists {
	deadline: Issue[];
	softDeadline: Issue[];
}

const byDate = (key: "deadline" | "softDeadline") => (a: Issue, b: Issue) => (a[key] ?? "").localeCompare(b[key] ?? "") || a.id.localeCompare(b.id, "en", { numeric: true });

/** 期限を過ぎたもの（ADR-0009 の dead issue）。deadline と soft_deadline は別の表 */
export function deadIssues(issues: Iterable<Issue>, today: LocalDate): DueLists {
	const deadline: Issue[] = [];
	const softDeadline: Issue[] = [];
	for (const i of issues) {
		if (!isActive(i)) continue;
		if (i.deadline !== null && i.deadline < today) deadline.push(i);
		if (i.softDeadline !== null && i.softDeadline < today) softDeadline.push(i);
	}
	return { deadline: deadline.sort(byDate("deadline")), softDeadline: softDeadline.sort(byDate("softDeadline")) };
}

/** 期限まで `days` 日以内（今日を含む）。ADR-0009 の caution */
export function cautionIssues(issues: Iterable<Issue>, today: LocalDate, days = 3): DueLists {
	const within = (d: LocalDate | null) => d !== null && diffDays(d, today) >= 0 && diffDays(d, today) <= days;
	const deadline: Issue[] = [];
	const softDeadline: Issue[] = [];
	for (const i of issues) {
		if (!isActive(i)) continue;
		if (within(i.deadline)) deadline.push(i);
		if (within(i.softDeadline)) softDeadline.push(i);
	}
	return { deadline: deadline.sort(byDate("deadline")), softDeadline: softDeadline.sort(byDate("softDeadline")) };
}

/** その日が実行日の issue（ボードに載せたものを除く） */
export function scheduledOn(issues: Iterable<Issue>, date: LocalDate, exclude: ReadonlySet<string> = new Set()): Issue[] {
	return [...issues]
		.filter((i) => isActive(i) && i.scheduled.includes(date) && !exclude.has(i.id))
		.sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
}
