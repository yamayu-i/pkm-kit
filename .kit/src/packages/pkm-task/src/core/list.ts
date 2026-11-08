import { isActive } from "./index";
import { PRIORITIES, STATUSES, type Issue, type Priority, type Status } from "./schema";

export type SortKey = "id" | "summary" | "status" | "priority" | "soft_deadline" | "deadline" | "created" | "next_scheduled";

/** Issue List の条件（ADR-0009） */
export interface IssueQuery {
	text: string;
	/** 空なら「閉じていないもの」（closed / canceled / someday を隠す） */
	statuses: Status[];
	priorities: (Priority | "none")[];
	labels: string[];
	scheduled: "any" | "yes" | "no";
	parent: string | null;
	sort: SortKey;
	desc: boolean;
}

export function defaultQuery(): IssueQuery {
	return { text: "", statuses: [], priorities: [], labels: [], scheduled: "any", parent: null, sort: "id", desc: true };
}

function nextScheduled(issue: Issue, today: string): string | null {
	return issue.scheduled.find((d) => d >= today) ?? null;
}

function sortValue(issue: Issue, key: SortKey, today: string): string | number | null {
	switch (key) {
		case "id":
			return Number(issue.id.slice(2));
		case "summary":
			return issue.summary;
		case "status":
			return STATUSES.indexOf(issue.status);
		case "priority":
			return issue.priority === null ? null : PRIORITIES.indexOf(issue.priority);
		case "soft_deadline":
			return issue.softDeadline;
		case "deadline":
			return issue.deadline;
		case "created":
			return issue.created;
		case "next_scheduled":
			return nextScheduled(issue, today);
	}
}

/** 絞り込みと並び替え。値のないものは並び順にかかわらず後ろ */
export function queryIssues(issues: Iterable<Issue>, q: IssueQuery, today: string): Issue[] {
	const words = q.text.toLowerCase().split(/\s+/).filter(Boolean);
	const out = [...issues].filter((i) => {
		if (q.statuses.length > 0 ? !q.statuses.includes(i.status) : !isActive(i)) return false;
		if (q.priorities.length > 0 && !q.priorities.includes(i.priority ?? "none")) return false;
		if (q.labels.length > 0 && !q.labels.every((l) => i.labels.includes(l))) return false;
		if (q.scheduled === "yes" && i.scheduled.length === 0) return false;
		if (q.scheduled === "no" && i.scheduled.length > 0) return false;
		if (q.parent !== null && i.parent !== q.parent) return false;
		const hay = `${i.id} ${i.summary}`.toLowerCase();
		return words.every((w) => hay.includes(w));
	});
	return out.sort((a, b) => {
		const va = sortValue(a, q.sort, today);
		const vb = sortValue(b, q.sort, today);
		if (va === vb) return a.id.localeCompare(b.id, "en", { numeric: true });
		if (va === null) return 1;
		if (vb === null) return -1;
		const c = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
		return q.desc ? -c : c;
	});
}
