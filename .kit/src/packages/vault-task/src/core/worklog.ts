import type { Problem } from "./problem";

/** worklog の 1 行（ADR-0004） */
export interface WorklogEntry {
	/** どのファイルの何行目か（エラー表示と書き戻し用） */
	path: string;
	line: number;
	id: string;
	/** issue（i-N）か routine（r-N） */
	taskId: string;
	from: string;
	/** 動いている間は null */
	to: string | null;
	description: string;
	fromMs: number;
	toMs: number | null;
}

/** `worklog/<端末名>/YYYY-MM.jsonl` */
export const WORKLOG_PATH_RE = /^worklog\/([^/]+)\/(\d{4}-\d{2})\.jsonl$/;

export function worklogPath(device: string, from: Date): string {
	const month = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}`;
	return `worklog/${device}/${month}.jsonl`;
}

export function parseWorklog(path: string, text: string): { entries: WorklogEntry[]; problems: Problem[] } {
	const entries: WorklogEntry[] = [];
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
		if (typeof o.id !== "string" || !o.id) return problem(line, "invalid-worklog", "id がありません");
		if (typeof o.task_id !== "string" || !o.task_id) return problem(line, "invalid-worklog", "task_id がありません");
		const fromMs = typeof o.from === "string" ? Date.parse(o.from) : Number.NaN;
		if (Number.isNaN(fromMs)) return problem(line, "invalid-worklog", "from が日時ではありません");
		let toMs: number | null = null;
		if (o.to !== null && o.to !== undefined) {
			toMs = typeof o.to === "string" ? Date.parse(o.to) : Number.NaN;
			if (Number.isNaN(toMs)) return problem(line, "invalid-worklog", "to が日時ではありません");
		}
		entries.push({
			path,
			line,
			id: o.id,
			taskId: o.task_id,
			from: o.from as string,
			to: toMs === null ? null : (o.to as string),
			description: typeof o.description === "string" ? o.description : "",
			fromMs,
			toMs,
		});
	});
	return { entries, problems };
}

export function serializeWorklogEntry(e: Pick<WorklogEntry, "id" | "taskId" | "from" | "to" | "description">): string {
	return JSON.stringify({ id: e.id, task_id: e.taskId, from: e.from, to: e.to, description: e.description });
}
