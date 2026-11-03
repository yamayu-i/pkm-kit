import type { Problem } from "./problem";
import { STATUSES, type Status } from "./schema";
import { sanitizeDeviceName } from "./worklog";

/** status の変更をどこから行ったか（ADR-0031） */
export const STATUS_VIAS = ["ui", "timer", "undo", "mcp"] as const;
export type StatusVia = (typeof STATUS_VIAS)[number];

/** status の記録の 1 行（ADR-0031）。分析のための履歴で、status の正本ではない */
export interface StatusLogEntry {
	path: string;
	line: number;
	id: string;
	/** UTC のミリ秒まで */
	at: string;
	atMs: number;
	task: string;
	from: Status;
	to: Status;
	via: StatusVia;
}

/** `statuslog/<端末名>/YYYY-MM.jsonl`（月は変えた時刻の月） */
export const STATUS_LOG_PATH_RE = /^statuslog\/([^/]+)\/(\d{4}-\d{2})\.jsonl$/;

export function statusLogPath(device: string, at: Date): string {
	const safe = sanitizeDeviceName(device);
	if (!safe) throw new Error("端末名が空です");
	const month = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}`;
	return `statuslog/${safe}/${month}.jsonl`;
}

/** 記録の ID（`st_` + 10 文字） */
export function newStatusLogId(random: () => number = Math.random): string {
	const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
	return `st_${Array.from({ length: 10 }, () => chars[Math.floor(random() * chars.length)]).join("")}`;
}

export function serializeStatusLogEntry(e: Pick<StatusLogEntry, "id" | "at" | "task" | "from" | "to" | "via">): string {
	return JSON.stringify({ id: e.id, at: e.at, task: e.task, from: e.from, to: e.to, via: e.via });
}

/** 1 回の変更を 1 行にする。status が変わっていなければ null */
export function statusLogLine(task: string, from: Status, to: Status, via: StatusVia, at: Date, random: () => number = Math.random): string | null {
	if (from === to) return null;
	return serializeStatusLogEntry({ id: newStatusLogId(random), at: at.toISOString(), task, from, to, via });
}

const isStatus = (v: unknown): v is Status => typeof v === "string" && (STATUSES as readonly string[]).includes(v);

/** 読めない行は問題として報告し、その行だけ飛ばす */
export function parseStatusLog(path: string, text: string): { entries: StatusLogEntry[]; problems: Problem[] } {
	const entries: StatusLogEntry[] = [];
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
		if (typeof o.id !== "string" || !o.id) return problem(line, "invalid-status-log", "id がありません");
		const atMs = typeof o.at === "string" ? Date.parse(o.at) : Number.NaN;
		if (Number.isNaN(atMs)) return problem(line, "invalid-status-log", "at が日時ではありません");
		if (typeof o.task !== "string" || !o.task) return problem(line, "invalid-status-log", "task がありません");
		if (!isStatus(o.from) || !isStatus(o.to)) return problem(line, "invalid-status-log", "from / to が status ではありません");
		const via = (STATUS_VIAS as readonly unknown[]).includes(o.via) ? (o.via as StatusVia) : null;
		if (via === null) return problem(line, "invalid-status-log", "via が不正です");
		entries.push({ path, line, id: o.id, at: o.at as string, atMs, task: o.task, from: o.from, to: o.to, via });
	});
	return { entries, problems };
}

/** at → 端末名（パス）→ 行番号の順 */
export function compareStatusLog(a: StatusLogEntry, b: StatusLogEntry): number {
	if (a.atMs !== b.atMs) return a.atMs - b.atMs;
	if (a.path !== b.path) return a.path < b.path ? -1 : 1;
	return a.line - b.line;
}

/** 記録から、その issue が今の status になる前の status（分からなければ null）。logs は compareStatusLog の順 */
export function statusBefore(logs: readonly StatusLogEntry[], task: string, current: Status): Status | null {
	for (let i = logs.length - 1; i >= 0; i--) {
		const e = logs[i]!;
		if (e.task !== task) continue;
		return e.to === current && e.from !== current ? e.from : null;
	}
	return null;
}

/** issue ごとの、最後に closed にした時刻（ミリ秒）。今 closed のものだけ（reviewWorklogs の closedAt） */
export function closedAtMap(logs: readonly StatusLogEntry[], closedIds: Iterable<string>): Map<string, number> {
	const ids = new Set(closedIds);
	const out = new Map<string, number>();
	for (const e of logs) if (ids.has(e.task) && e.to === "closed") out.set(e.task, e.atMs);
	return out;
}

/** カードの「次の status」ボタン（ADR-0031）。closed / canceled の「戻す」は別に扱う */
export function nextStatuses(status: Status): Status[] {
	switch (status) {
		case "open":
		case "waiting":
			return ["in-progress"];
		case "in-progress":
			return ["closed"];
		case "delegated":
			return ["in-progress", "closed"];
		default:
			return [];
	}
}

/**
 * task board のカードの status メニューに出す status（ADR-0032）。
 * issue は delegated も選べる（委任先はその場で選ぶ）。someday はボードの上では選ばない。routine はその日の結果だけ
 */
export function boardMenuStatuses(kind: "issue" | "routine"): Status[] {
	return kind === "issue" ? ["open", "in-progress", "waiting", "delegated", "closed", "canceled"] : ["open", "closed", "canceled"];
}

export function isDoneStatus(status: Status): boolean {
	return status === "closed" || status === "canceled";
}
