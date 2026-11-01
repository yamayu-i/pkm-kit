import type { LocalDate } from "./dates";
import { SCHEMA_VERSION } from "./schema";

/** 新しい issue の本文の既定の見出し（ADR-0012） */
export const ISSUE_BODY_TEMPLATE = "## ToDo\n\n- [ ] \n\n## Description\n\n## Note\n";

/** YAML の文字列。JSON の文字列は YAML の二重引用符スカラーとしてそのまま読める */
function yamlString(s: string): string {
	return JSON.stringify(s);
}

/** 新しい issue のファイルの中身。scheduled がなければ Inbox に入る（ADR-0011） */
export function newIssueContent(id: string, summary: string, created: string, parent: string | null = null, scheduled: LocalDate[] = []): string {
	const lines = ["---", `schema: ${SCHEMA_VERSION}`, "type: issue", `id: ${id}`, `summary: ${yamlString(summary)}`, "status: open"];
	if (parent !== null) lines.push(`parent: ${parent}`);
	if (scheduled.length > 0) lines.push(`scheduled: ${JSON.stringify(scheduled)}`);
	lines.push(`created: ${created}`, "---", "", ISSUE_BODY_TEMPLATE);
	return lines.join("\n");
}

export function newMemberContent(id: string, name: string, created: string): string {
	return ["---", `schema: ${SCHEMA_VERSION}`, "type: member", `id: ${id}`, `name: ${yamlString(name)}`, `created: ${created}`, "---", ""].join(
		"\n",
	);
}

/** 新しい routine（ADR-0010）。repeat は JSON の形で書く（YAML のフロー形式として読める） */
export function newRoutineContent(
	id: string,
	summary: string,
	repeat: Record<string, unknown>,
	created: string,
	extra: { group?: string | null; estimated?: number | null; start?: string | null } = {},
): string {
	const lines = ["---", `schema: ${SCHEMA_VERSION}`, "type: routine", `id: ${id}`, `summary: ${yamlString(summary)}`, `repeat: ${JSON.stringify(repeat)}`];
	if (extra.start) lines.push(`start: ${extra.start}`);
	lines.push("active: true");
	if (extra.group) lines.push(`group: ${yamlString(extra.group)}`);
	if (extra.estimated) lines.push(`estimated: ${extra.estimated}`);
	lines.push(`created: ${created}`, "---", "", "## 手順", "", "- [ ] ", "");
	return lines.join("\n");
}

/** frontmatter の範囲（始まりから、閉じる `---` の行の終わりまで）。なければ null */
export function frontmatterRange(text: string): { from: number; to: number } | null {
	const m = /^---[ \t]*\r?\n(?:[\s\S]*?\r?\n)?---[ \t]*(?=\r?\n|$)/.exec(text);
	return m ? { from: 0, to: m[0].length } : null;
}

/** デイリーノート（ボードを締めるときにまだないとき） */
export function newDailyContent(created: string): string {
	return `---\ntype: daily\ncreated: ${created}\nupdated:\n---\n`;
}
