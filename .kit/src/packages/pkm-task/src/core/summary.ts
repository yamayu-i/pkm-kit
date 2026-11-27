import { formatMinutes } from "./format";
import type { TaskIndex } from "./index";
import type { BoardState } from "./board";
import type { LocalDate } from "./dates";

const SECTION = "## Task board";
const THEMATIC_BREAK = /^ {0,3}-{3,}[ \t]*\r?$/;

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
		const sub = index.sub(id);
		if (sub) return `[${sub.parent} › ${sub.summary}](${sub.path})`;
		const routine = index.routines.get(id);
		return routine ? `[${routine.id} ${routine.summary}](${routine.path})` : id;
	};
	const lines = [SECTION, ""];
	// 鍵が指すものがなくなったもの（消したサブなど）は書かない（ADR-0137）
	const present = board.issues.filter((id) => index.issues.has(id) || index.sub(id) !== undefined);
	const statusOf = (id: string) => index.issues.get(id)?.status ?? index.sub(id)?.status;
	const closed = present.filter((id) => statusOf(id) === "closed");
	const others = present.filter((id) => !closed.includes(id));
	const routines = Object.entries(board.routines);
	lines.push("### 完了", "");
	if (closed.length === 0 && routines.every(([, r]) => r !== "closed")) lines.push("- なし");
	for (const id of closed) lines.push(`- ${link(id)}`);
	for (const [id, r] of routines) if (r === "closed") lines.push(`- ${link(id)}`);
	if (others.length > 0 || routines.some(([, r]) => r === "canceled")) {
		lines.push("", "### 持ち越し・中止", "");
		for (const id of others) {
			// 片付けずに締めた未完了（open / in-progress）も持ち越しと書く（締めは記録だけ。ADR-0189）
			const status = statusOf(id);
			const note = board.carried.includes(id) || status === "open" || status === "in-progress" ? "持ち越し" : (status ?? "?");
			lines.push(`- ${link(id)}（${note}）`);
		}
		for (const [id, r] of routines) if (r === "canceled") lines.push(`- ${link(id)}（canceled）`);
	}
	const logs = index.data.worklogs.filter((l) => sameLocalDate(l.fromMs, date) && l.toMs !== null).sort((a, b) => a.fromMs - b.fromMs);
	if (logs.length > 0) {
		lines.push("", "### worklog", "");
		for (const l of logs) {
			const desc = l.description ? ` ${l.description}` : "";
			lines.push(`- ${hm(l.fromMs)}–${hm(l.toMs!)}（${formatMinutes((l.toMs! - l.fromMs) / 60_000)}） ${link(l.sub ? `${l.taskId}#${l.sub}` : l.taskId)}${desc}`);
		}
	}
	return `${lines.join("\n")}\n`;
}

/**
 * 本文の `## Task board` 節を置き換える。frontmatter は触らない。
 * 節がなければ、振り返りの型の目印の行（`after`。`## 日次振り返り` など）がある場合はその節の終わり
 * （次の `---` か、同じ以上の階層の見出しの前）に入れ、ない場合は末尾に足す
 * （ほかのノートやプラグインが本文に書き足していても、振り返りの直下に並ぶように）
 */
export function upsertSummary(text: string, summary: string, after: string | null = null): string {
	const fm = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.exec(text);
	const head = fm ? fm[0] : "";
	const body = text.slice(head.length);
	const lines = body.split("\n");
	const start = lines.findIndex((l) => l.trim() === SECTION);
	if (start < 0) {
		const marker = after === null ? -1 : lines.findIndex((l) => l.trimEnd() === after);
		if (marker >= 0) return head + insertAfterSection(lines, marker, summary);
		const sep = body.length === 0 || body.endsWith("\n\n") ? "" : body.endsWith("\n") ? "\n" : "\n\n";
		return head + body + sep + summary;
	}
	// 節の終わりは次の `## ` 見出しか `---`（振り返りの直下に入れたとき、区切りの後の本文を消さない）
	let end = lines.findIndex((l, i) => i > start && (/^## /.test(l) || THEMATIC_BREAK.test(l)));
	if (end < 0) end = lines.length;
	const rest = lines.slice(end).join("\n");
	return head + [...lines.slice(0, start), summary.trimEnd(), ...(rest ? ["", rest] : [""])].join("\n");
}

/** 目印の行から始まる節の終わりに要約を入れる。前後は空行 1 つで区切る */
function insertAfterSection(lines: readonly string[], marker: number, summary: string): string {
	const level = /^(#{1,6}) /.exec(lines[marker]!)?.[1]!.length ?? null;
	let end = lines.findIndex((l, i) => {
		if (i <= marker) return false;
		if (THEMATIC_BREAK.test(l)) return true;
		const h = /^(#{1,6}) /.exec(l);
		return h !== null && level !== null && h[1]!.length <= level;
	});
	if (end < 0) end = lines.length;
	let last = end;
	while (last > marker + 1 && lines[last - 1]!.trim() === "") last--;
	const before = lines.slice(0, last);
	const rest = lines.slice(end).join("\n");
	return [...before, "", summary.trimEnd(), ...(rest ? ["", rest] : [""])].join("\n");
}
