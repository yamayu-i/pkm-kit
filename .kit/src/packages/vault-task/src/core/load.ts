import { BOARD_KEY, DAILY_PATH_RE, parseBoard } from "./board";
import { GROUPS_PATH, parseGroups } from "./groups";
import type { VaultData } from "./index";
import { LABELS_PATH, parseLabels } from "./labels";
import type { Problem } from "./problem";
import { parseIssue, parseMember, parseRoutine } from "./schema";
import { WORKLOG_PATH_RE, parseWorklog } from "./worklog";

export type FileKind = "issue" | "routine" | "member" | "worklog" | "labels" | "groups" | "daily";

/** パスからどのデータのファイルかを決める（ADR-0002, 0004, 0007, 0010） */
export function fileKind(path: string): FileKind | null {
	if (path === LABELS_PATH) return "labels";
	if (path === GROUPS_PATH) return "groups";
	if (DAILY_PATH_RE.test(path)) return "daily";
	if (WORKLOG_PATH_RE.test(path)) return "worklog";
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
}

/** ファイルの中身から VaultData を作る。プラグイン（metadataCache）と CLI（yaml）の両方から使う */
export function collectVault(input: VaultInput): { data: VaultData; problems: Problem[] } {
	const data: VaultData = { issues: [], routines: [], members: [], labels: [], worklogs: [], boards: [], groups: [] };
	const problems: Problem[] = [];
	for (const { path, frontmatter } of [...input.markdown].sort((a, b) => a.path.localeCompare(b.path, "en", { numeric: true }))) {
		const kind = fileKind(path);
		if (kind === "daily") {
			// ボードの状態だけを読む。board がないデイリーノートは対象外
			if (frontmatter && frontmatter[BOARD_KEY] !== undefined) {
				data.boards.push({ date: DAILY_PATH_RE.exec(path)![1]!, path, board: parseBoard(frontmatter[BOARD_KEY]) });
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
