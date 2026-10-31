import type { VaultData } from "./index";
import { LABELS_PATH, parseLabels } from "./labels";
import type { Problem } from "./problem";
import { parseIssue, parseMember, parseRoutine } from "./schema";
import { WORKLOG_PATH_RE, parseWorklog } from "./worklog";

export type FileKind = "issue" | "routine" | "member" | "worklog" | "labels";

/** パスからどのデータのファイルかを決める（ADR-0002, 0004, 0007, 0010） */
export function fileKind(path: string): FileKind | null {
	if (path === LABELS_PATH) return "labels";
	if (WORKLOG_PATH_RE.test(path)) return "worklog";
	const m = /^(issue|routine|member)\/[^/]+\.md$/.exec(path);
	return m ? (m[1] as FileKind) : null;
}

export interface VaultInput {
	/** issue / routine / member の md。frontmatter が読めなかったら null */
	markdown: { path: string; frontmatter: Record<string, unknown> | null }[];
	/** worklog の jsonl */
	worklogs: { path: string; text: string }[];
	/** `issue/labels.json` の中身（ないなら null） */
	labels: string | null;
}

/** ファイルの中身から VaultData を作る。プラグイン（metadataCache）と CLI（yaml）の両方から使う */
export function collectVault(input: VaultInput): { data: VaultData; problems: Problem[] } {
	const data: VaultData = { issues: [], routines: [], members: [], labels: [], worklogs: [] };
	const problems: Problem[] = [];
	for (const { path, frontmatter } of [...input.markdown].sort((a, b) => a.path.localeCompare(b.path, "en", { numeric: true }))) {
		const kind = fileKind(path);
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
	return { data, problems };
}
