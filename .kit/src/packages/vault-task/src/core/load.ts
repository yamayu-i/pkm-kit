import { BOARD_KEY, DAILY_PATH_RE, dailyNotePath, emptyBoard, parseBoard, type BoardState } from "./board";
import { BOARD_LOG_PATH_RE, parseBoardLog, placementHistory, removedTasks, replayBoard, type BoardLogEntry } from "./board-log";
import { GROUPS_PATH, parseGroups } from "./groups";
import type { VaultData } from "./index";
import { LABELS_PATH, parseLabels } from "./labels";
import type { Problem } from "./problem";
import { parseIssue, parseMember, parseRoutine } from "./schema";
import { STATUS_LOG_PATH_RE, compareStatusLog, parseStatusLog } from "./status-log";
import { WORKLOG_PATH_RE, parseWorklog } from "./worklog";

export type FileKind = "issue" | "routine" | "member" | "worklog" | "labels" | "groups" | "daily" | "board" | "statuslog";

/** パスからどのデータのファイルかを決める（ADR-0002, 0004, 0007, 0010, 0020, 0031） */
export function fileKind(path: string): FileKind | null {
	if (path === LABELS_PATH) return "labels";
	if (path === GROUPS_PATH) return "groups";
	if (DAILY_PATH_RE.test(path)) return "daily";
	if (WORKLOG_PATH_RE.test(path)) return "worklog";
	if (BOARD_LOG_PATH_RE.test(path)) return "board";
	if (STATUS_LOG_PATH_RE.test(path)) return "statuslog";
	const m = /^(issue|routine|member)\/[^/]+\.md$/.exec(path);
	return m ? (m[1] as FileKind) : null;
}

export interface VaultInput {
	/** issue / routine / member / デイリーノートの md。frontmatter が読めなかったら null */
	markdown: { path: string; frontmatter: Record<string, unknown> | null }[];
	/** worklog の jsonl */
	worklogs: { path: string; text: string }[];
	/** `issue/labels.json` の中身（ないなら null） */
	labels: string | null;
	/** `issue/board-groups.json` の中身（ないなら null） */
	groups?: string | null;
	/** ボードの操作ログの jsonl */
	boardLogs?: { path: string; text: string }[];
	/** status の記録の jsonl（ADR-0031） */
	statusLogs?: { path: string; text: string }[];
}

/** ファイルの中身から VaultData を作る。プラグイン（metadataCache）と CLI（yaml）の両方から使う */
export function collectVault(input: VaultInput): { data: VaultData; problems: Problem[] } {
	const data: VaultData = { issues: [], routines: [], members: [], labels: [], worklogs: [], boards: [], groups: [], statusLogs: [], placements: [] };
	const problems: Problem[] = [];
	const initialBoards = new Map<string, BoardState>();
	for (const { path, frontmatter } of [...input.markdown].sort((a, b) => a.path.localeCompare(b.path, "en", { numeric: true }))) {
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
			if (r.value) data.issues.push(r.value);
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
	const logsByDate = new Map<string, BoardLogEntry[]>();
	const allLogs: BoardLogEntry[] = [];
	for (const { path, text } of [...(input.boardLogs ?? [])].sort((a, b) => a.path.localeCompare(b.path))) {
		const r = parseBoardLog(path, text);
		problems.push(...r.problems);
		allLogs.push(...r.entries);
		for (const e of r.entries) logsByDate.set(e.date, [...(logsByDate.get(e.date) ?? []), e]);
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
	data.placements = placementHistory(initialBoards, allLogs);
	for (const { path, text } of [...(input.statusLogs ?? [])].sort((a, b) => a.path.localeCompare(b.path))) {
		const r = parseStatusLog(path, text);
		problems.push(...r.problems);
		data.statusLogs.push(...r.entries);
	}
	data.statusLogs.sort(compareStatusLog);
	if (input.labels !== null) {
		const r = parseLabels(input.labels);
		problems.push(...r.problems);
		data.labels = r.labels;
	}
	if (input.groups) {
		const r = parseGroups(input.groups);
		problems.push(...r.problems);
		data.groups = r.groups;
	}
	return { data, problems };
}
