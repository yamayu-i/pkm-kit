import { formatMinutes } from "./format";
import type { TaskIndex } from "./index";
import type { BoardState } from "./board";
import type { LocalDate } from "./dates";

const SECTION = "## Task board";

function hm(ms: number): string {
	const d = new Date(ms);
	return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function sameLocalDate(ms: number, date: LocalDate): boolean {
	const d = new Date(ms);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` === date;
}

/** ボードを締めたときにデイリーノートへ書く要約（ADR-0009）。リンクは Vault ルートからのパス */
export function boardSummary(index: TaskIndex, date: LocalDate, board: BoardState): string {
	const link = (id: string) => {
		const issue = index.issues.get(id);
		if (issue) return `[${issue.id} ${issue.summary}](${issue.path})`;
		const routine = index.routines.get(id);
		return routine ? `[${routine.id} ${routine.summary}](${routine.path})` : id;
	};
	const lines = [SECTION, ""];
	const closed = board.issues.filter((id) => index.issues.get(id)?.status === "closed");
	const others = board.issues.filter((id) => !closed.includes(id));
	const routines = Object.entries(board.routines);
	lines.push("### 完了", "");
	if (closed.length === 0 && routines.every(([, r]) => r !== "closed")) lines.push("- なし");
	for (const id of closed) lines.push(`- ${link(id)}`);
	for (const [id, r] of routines) if (r === "closed") lines.push(`- ${link(id)}`);
	if (others.length > 0 || routines.some(([, r]) => r === "canceled")) {
		lines.push("", "### 持ち越し・中止", "");
		for (const id of others) {
			const note = board.carried.includes(id) ? "持ち越し" : (index.issues.get(id)?.status ?? "?");
			lines.push(`- ${link(id)}（${note}）`);
		}
		for (const [id, r] of routines) if (r === "canceled") lines.push(`- ${link(id)}（canceled）`);
	}
	const logs = index.data.worklogs.filter((l) => sameLocalDate(l.fromMs, date) && l.toMs !== null).sort((a, b) => a.fromMs - b.fromMs);
	if (logs.length > 0) {
		lines.push("", "### worklog", "");
		for (const l of logs) {
			const desc = l.description ? ` ${l.description}` : "";
			lines.push(`- ${hm(l.fromMs)}–${hm(l.toMs!)}（${formatMinutes((l.toMs! - l.fromMs) / 60_000)}） ${link(l.taskId)}${desc}`);
		}
	}
	return `${lines.join("\n")}\n`;
}

/**
 * 本文の `## Task board` 節を置き換える（なければ末尾に足す）。frontmatter は触らない
 */
export function upsertSummary(text: string, summary: string): string {
	const fm = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.exec(text);
	const head = fm ? fm[0] : "";
	const body = text.slice(head.length);
	const start = body.split("\n").findIndex((l) => l.trim() === SECTION);
	if (start < 0) {
		const sep = body.length === 0 || body.endsWith("\n\n") ? "" : body.endsWith("\n") ? "\n" : "\n\n";
		return head + body + sep + summary;
	}
	const lines = body.split("\n");
	let end = lines.findIndex((l, i) => i > start && /^## /.test(l));
	if (end < 0) end = lines.length;
	const after = lines.slice(end).join("\n");
	return head + [...lines.slice(0, start), summary.trimEnd(), ...(after ? ["", after] : [""])].join("\n");
}
