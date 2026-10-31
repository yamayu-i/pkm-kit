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

/** 端末名をフォルダ名に使える形にする（区切り文字と先頭の . を除く）。空になったら使えない */
export function sanitizeDeviceName(name: string): string {
	return name.trim().replace(/[\\/:*?"<>|#^[\]]/g, "-").replace(/^\.+/, "");
}

export function worklogPath(device: string, from: Date): string {
	const safe = sanitizeDeviceName(device);
	if (!safe) throw new Error("端末名が空です");
	const month = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}`;
	return `worklog/${safe}/${month}.jsonl`;
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

/**
 * jsonl の中の `entry` の行を書き換える。next が null なら行を消す。
 * 読み込んだ後にファイルが変わって行がずれていたら（その行の ID が合わなければ）例外にする
 */
export function replaceWorklogLine(
	text: string,
	entry: Pick<WorklogEntry, "line" | "id" | "taskId">,
	next: Pick<WorklogEntry, "from" | "to" | "description"> | null,
): string {
	const lines = text.split("\n");
	const i = entry.line - 1;
	let current: unknown;
	try {
		current = JSON.parse(lines[i] ?? "");
	} catch {
		current = null;
	}
	if (typeof current !== "object" || current === null || (current as { id?: unknown }).id !== entry.id) {
		throw new Error("worklog のファイルが変わっています。開き直してから編集してください");
	}
	if (next === null) lines.splice(i, 1);
	else lines[i] = serializeWorklogEntry({ id: entry.id, taskId: entry.taskId, ...next });
	return lines.join("\n");
}

/** worklog の ID（`wl_` + 10 文字）。random は 0 以上 1 未満を返す関数 */
export function newWorklogId(random: () => number = Math.random): string {
	const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
	return `wl_${Array.from({ length: 10 }, () => chars[Math.floor(random() * chars.length)]).join("")}`;
}

/** jsonl の末尾に 1 行足す（最後に改行がなければ補う） */
export function appendWorklogLine(text: string, line: string): string {
	return `${text}${text.length > 0 && !text.endsWith("\n") ? "\n" : ""}${line}\n`;
}
