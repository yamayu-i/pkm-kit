import { SCHEMA_VERSION, Reader, type Frontmatter } from "./schema";
import type { Problem } from "./problem";
import { SUB_ISSUE_MARKER } from "./sub-issue";

/** issue のプリセットの md（ADR-0186）。`preset/p-N.md` */
export const PRESET_PATH_RE = /^preset\/[^/]+\.md$/;

/** issue のプリセット（ADR-0186）。サブの題の一覧と、親の本文に追記する本文 */
export interface IssuePreset {
	path: string;
	id: string;
	name: string;
	/** サブの題（md に書いた順。重なってもよい） */
	subIssues: string[];
	/** frontmatter の後ろの本文（前の空行と末尾の空白を除く）。issue の本文の末尾に追記する */
	body: string;
	created: string | null;
}

const FRONTMATTER_RE = /^---[ \t]*\r?\n(?:[\s\S]*?\r?\n)?---[ \t]*(?:\r?\n|$)/;

/** md の frontmatter の後ろ（本文）。前の空行と末尾の空白を除く */
export function presetBodyOf(text: string): string {
	const fm = FRONTMATTER_RE.exec(text);
	return text
		.slice(fm ? fm[0].length : 0)
		.replace(/^(?:[ \t]*\r?\n)+/, "")
		.trimEnd();
}

/** プリセットの md を読む（ADR-0186）。書けない題は問題にして飛ばし、本文に区切りがあれば本文を使わない */
export function parsePreset(path: string, fm: Frontmatter, text: string | undefined): { value: IssuePreset | null; problems: Problem[] } {
	const r = new Reader(path, fm);
	const id = r.common("preset", "p");
	const name = r.string("name") ?? "";
	if (!name) r.problem("missing-name", "name がありません", "warning");
	const subIssues: string[] = [];
	for (const v of r.list("sub_issues")) {
		const error = typeof v === "string" ? presetSubError(v) : "文字列ではありません";
		if (error !== null) r.problem("invalid-preset-sub", `sub_issues: ${error}: ${JSON.stringify(v)}`);
		else subIssues.push((v as string).trim());
	}
	let body = text === undefined ? "" : presetBodyOf(text);
	const bodyError = presetBodyError(body);
	if (bodyError !== null) {
		r.problem("invalid-preset-body", `本文: ${bodyError}`);
		body = "";
	}
	if (id === null) return { value: null, problems: r.problems };
	return { value: { path, id, name: name || id, subIssues, body, created: r.datetime("created") }, problems: r.problems };
}

/** サブの題の検査（サブの項目に書けない値を止める。ADR-0135） */
export function presetSubError(summary: string): string | null {
	if (!summary.trim()) return "題を入れてください";
	if (/[\r\n]/.test(summary)) return "題に改行は書けません";
	if (summary.includes("-->")) return "題に --> は書けません";
	return null;
}

/** 本文の検査。行頭の `<!-- sub-issue` は issue の中でサブの区切りと読まれる */
export function presetBodyError(body: string): string | null {
	if (body.split(/\r?\n/).some((l) => l.startsWith(SUB_ISSUE_MARKER))) return `行頭に ${SUB_ISSUE_MARKER} は書けません`;
	return null;
}

/** 新しいプリセットの md */
export function newPresetContent(id: string, name: string, created: string): string {
	return ["---", `schema: ${SCHEMA_VERSION}`, "type: preset", `id: ${id}`, `name: ${JSON.stringify(name)}`, "sub_issues: []", `created: ${created}`, `updated: ${created}`, "---", "", ""].join("\n");
}

/** 一覧の 1 行の補足に使う、本文の最初の空でない行（見出しの # は外す） */
export function presetBodyPreview(body: string): string {
	const line = body.split(/\r?\n/).find((l) => l.trim() !== "") ?? "";
	return line.replace(/^#+\s*/, "").trim();
}

/** 一覧の検索。ID・名前・サブの題・本文のどれかに含むか（大文字と小文字を区別しない） */
export function matchPreset(p: IssuePreset, text: string): boolean {
	const q = text.trim().toLowerCase();
	if (!q) return true;
	return [p.id, p.name, ...p.subIssues, p.body].some((s) => s.toLowerCase().includes(q));
}
