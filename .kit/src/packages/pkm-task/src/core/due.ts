import { diffDays, type LocalDate } from "./dates";
import { isActive } from "./index";
import type { Issue } from "./schema";

/** 期限の色の段階（ADR-0006）。3 日前から 3 → 0（当日）、過ぎたら overdue */
export type DueLevel = "none" | "3" | "2" | "1" | "0" | "overdue";

export function dueLevel(issue: Issue, due: LocalDate | null, today: LocalDate): DueLevel {
	if (due === null || !isActive(issue)) return "none";
	const left = diffDays(due, today);
	if (left < 0) return "overdue";
	if (left > 3) return "none";
	return String(left) as DueLevel;
}
