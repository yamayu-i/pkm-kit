import { BOARD_KEY, DAILY_PATH_RE, dailyNotePath, emptyBoard, parseBoard, type BoardState } from "./board";
import { BOARD_LOG_PATH_RE, orderHistory, parseBoardLog, removedTasks, renameBoardOp, replayBoard, type BoardLogEntry } from "./board-log";
import type { VaultData } from "./index";
import { LABELS_PATH, parseLabels } from "./labels";
import type { Problem } from "./problem";
import { parseIssue, parseMember, parseRoutine } from "./schema";
import { parseSubIssues, subKey, type YamlParse } from "./sub-issue";
import { STATUS_LOG_PATH_RE, compareStatusLog, parseStatusLog } from "./status-log";
import { WORKLOG_PATH_RE, parseWorklog } from "./worklog";

export type FileKind = "issue" | "routine" | "member" | "worklog" | "labels" | "daily" | "board" | "statuslog";

/** パスからどのデータのファイルかを決める（ADR-0002, 0004, 0007, 0010, 0020, 0031） */
export function fileKind(path: string): FileKind | null {
	if (path === LABELS_PATH) return "labels";
	if (DAILY_PATH_RE.test(path)) return "daily";
	if (WORKLOG_PATH_RE.test(path)) return "worklog";
	if (BOARD_LOG_PATH_RE.test(path)) return "board";
	if (STATUS_LOG_PATH_RE.test(path)) return "statuslog";
	const m = /^(issue|routine|member)\/[^/]+\.md$/.exec(path);
	return m ? (m[1] as FileKind) : null;
}

export interface VaultInput {
	/** issue / routine / member / デイリーノートの md。frontmatter が読めなかったら null */
	markdown: { path: string; frontmatter: Record<string, unknown> | null; text?: string }[];
	/** issue の md の全文（text）からサブを読むための YAML の関数（ADR-0135）。ないならサブは読まない */
	parseYaml?: YamlParse;
	/** worklog の jsonl */
	worklogs: { path: string; text: string }[];
	/** `issue/labels.json` の中身（ないなら null） */
	labels: string | null;
	/** ボードの操作ログの jsonl */
	boardLogs?: { path: string; text: string }[];
	/** status の記録の jsonl（ADR-0031） */
	statusLogs?: { path: string; text: string }[];
}

/**
 * 移行で子の issue をサブにした後も、旧 ID の worklog・statuslog の行をそのサブの行として読む（ADR-0135）。
 * jsonl は追記だけの記録なので書き換えず、読むときに置き換える。旧 ID の issue がまだあるなら置き換えない
 */
function migratedIds(data: VaultData): Map<string, { parent: string; id: string }> {
	const issueIds = new Set(data.issues.map((i) => i.id));
	const byOld = new Map<string, { parent: string; id: string }>();
	for (const s of data.subIssues) {
		if (s.migratedFrom !== null && !issueIds.has(s.migratedFrom) && !byOld.has(s.migratedFrom)) byOld.set(s.migratedFrom, { parent: s.parent, id: s.id });
	}
	return byOld;
}

function resolveMigrated(data: VaultData, byOld: Map<string, { parent: string; id: string }>): void {
	if (byOld.size === 0) return;
	data.worklogs = data.worklogs.map((l) => {
		const to = l.sub ? undefined : byOld.get(l.taskId);
		return to ? { ...l, taskId: to.parent, sub: to.id } : l;
	});
	data.statusLogs = data.statusLogs.map((e) => {
		const to = e.sub ? undefined : byOld.get(e.task);
		return to ? { ...e, task: to.parent, sub: to.id } : e;
	});
}

/** ファイルの中身から VaultData を作る。プラグイン（metadataCache）と CLI（yaml）の両方から使う */
export function collectVault(input: VaultInput): { data: VaultData; problems: Problem[] } {
	const data: VaultData = { issues: [], subIssues: [], routines: [], members: [], labels: [], worklogs: [], boards: [], statusLogs: [], orders: [] };
	const problems: Problem[] = [];
	const initialBoards = new Map<string, BoardState>();
	for (const { path, frontmatter, text } of [...input.markdown].sort((a, b) => a.path.localeCompare(b.path, "en", { numeric: true }))) {
		const kind = fileKind(path);
		if (kind === "daily") {
			// 既存の board は読み取り専用の初期状態（ADR-0020）。board がないデイリーノートは対象外
			if (frontmatter && frontmatter[BOARD_KEY] !== undefined) {
				initialBoards.set(DAILY_PATH_RE.exec(path)![1]!, parseBoard(frontmatter[BOARD_KEY]));
			}
			continue;
		}
		if (kind !== "issue" && kind !== "routine" && kind !== "member") continue;
		if (frontmatter === null) {
			problems.push({ severity: "error", path, code: "missing-frontmatter", message: "frontmatter がないか、YAML として読めません" });
			continue;
		}
		if (kind === "issue") {
			const r = parseIssue(path, frontmatter);
			problems.push(...r.problems);
			if (r.value) {
				data.issues.push(r.value);
				if (text !== undefined && input.parseYaml) {
					const s = parseSubIssues(path, r.value.id, text, input.parseYaml);
					problems.push(...s.problems);
					data.subIssues.push(...s.subs);
				}
			}
		} else if (kind === "routine") {
			const r = parseRoutine(path, frontmatter);
			problems.push(...r.problems);
			if (r.value) data.routines.push(r.value);
		} else {
			const r = parseMember(path, frontmatter);
			problems.push(...r.problems);
			if (r.value) data.members.push(r.value);
		}
	}
	for (const { path, text } of [...input.worklogs].sort((a, b) => a.path.localeCompare(b.path))) {
		const r = parseWorklog(path, text);
		problems.push(...r.problems);
		data.worklogs.push(...r.entries);
	}
	// 移行したサブの以前の ID を指すボードの記録も、そのサブの合成キーとして読む（ADR-0137）
	const byOld = migratedIds(data);
	const renameKey = (key: string) => {
		const to = byOld.get(key);
		return to ? subKey(to.parent, to.id) : key;
	};
	for (const [date, board] of initialBoards) {
		initialBoards.set(date, { ...board, issues: board.issues.map(renameKey), carried: board.carried.map(renameKey) });
	}
	const logsByDate = new Map<string, BoardLogEntry[]>();
	const allLogs: BoardLogEntry[] = [];
	for (const { path, text } of [...(input.boardLogs ?? [])].sort((a, b) => a.path.localeCompare(b.path))) {
		const r = parseBoardLog(path, text);
		problems.push(...r.problems);
		const entries = byOld.size === 0 ? r.entries : r.entries.map((e) => ({ ...e, op: renameBoardOp(e.op, renameKey) }));
		allLogs.push(...entries);
		for (const e of entries) logsByDate.set(e.date, [...(logsByDate.get(e.date) ?? []), e]);
	}
	for (const date of [...new Set([...initialBoards.keys(), ...logsByDate.keys()])].sort()) {
		const logs = logsByDate.get(date) ?? [];
		const removed = removedTasks(logs);
		data.boards.push({
			date,
			path: dailyNotePath(date),
			board: replayBoard(initialBoards.get(date) ?? emptyBoard(), logs),
			...(logs.length > 0 ? { latestAt: Math.max(...logs.map((e) => e.atMs)) } : {}),
			...(removed.length > 0 ? { removed } : {}),
		});
	}
	data.orders = orderHistory(allLogs);
	for (const { path, text } of [...(input.statusLogs ?? [])].sort((a, b) => a.path.localeCompare(b.path))) {
		const r = parseStatusLog(path, text);
		problems.push(...r.problems);
		data.statusLogs.push(...r.entries);
	}
	data.statusLogs.sort(compareStatusLog);
	resolveMigrated(data, byOld);
	if (input.labels !== null) {
		const r = parseLabels(input.labels);
		problems.push(...r.problems);
		data.labels = r.labels;
	}
	return { data, problems };
}
