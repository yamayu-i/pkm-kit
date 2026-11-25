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
	/** サブの見積もりの既定値（分。subIssues と同じ並び。ADR-0231）。どれかに値があるときだけ持つ */
	subEstimates?: (number | null)[];
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
	const subEstimates: (number | null)[] = [];
	for (const v of r.list("sub_issues")) {
		const item = presetSubItem(v);
		if (typeof item === "string") {
			r.problem("invalid-preset-sub", `sub_issues: ${item}: ${JSON.stringify(v)}`);
			continue;
		}
		if (item.estimateError !== null) r.problem("invalid-preset-sub", `sub_issues: ${item.estimateError}: ${JSON.stringify(v)}`);
		subIssues.push(item.summary);
		subEstimates.push(item.estimated);
	}
	let body = text === undefined ? "" : presetBodyOf(text);
	const bodyError = presetBodyError(body);
	if (bodyError !== null) {
		r.problem("invalid-preset-body", `本文: ${bodyError}`);
		body = "";
	}
	if (id === null) return { value: null, problems: r.problems };
	const estimates = subEstimates.some((e) => e !== null) ? { subEstimates } : {};
	return { value: { path, id, name: name || id, subIssues, ...estimates, body, created: r.datetime("created") }, problems: r.problems };
}

/**
 * sub_issues の 1 件（ADR-0186, 0231）: 題の文字列か、summary と estimated（分）の対応。
 * 題が書けなければエラーの文。見積もりが書けなければ、見積もりなしにして estimateError に理由を入れる
 */
function presetSubItem(v: unknown): { summary: string; estimated: number | null; estimateError: string | null } | string {
	if (typeof v === "string") {
		const error = presetSubError(v);
		return error ?? { summary: v.trim(), estimated: null, estimateError: null };
	}
	if (typeof v !== "object" || v === null || Array.isArray(v)) return "文字列か、summary と estimated の対応にしてください";
	const o = v as Record<string, unknown>;
	if (typeof o.summary !== "string") return "summary がありません";
	const error = presetSubError(o.summary);
	if (error !== null) return error;
	const e = o.estimated;
	if (e === undefined || e === null) return { summary: o.summary.trim(), estimated: null, estimateError: null };
	if (typeof e === "number" && Number.isFinite(e) && e >= 0) return { summary: o.summary.trim(), estimated: e, estimateError: null };
	return { summary: o.summary.trim(), estimated: null, estimateError: "estimated は 0 以上の数（分）にしてください" };
}

/** frontmatter の sub_issues に書く値。見積もりのない行は今までどおり文字列（ADR-0231） */
export function presetSubItems(subIssues: readonly string[], subEstimates: readonly (number | null)[] | undefined): (string | { summary: string; estimated: number })[] {
	return subIssues.map((summary, i) => {
		const estimated = subEstimates?.[i] ?? null;
		return estimated === null ? summary : { summary, estimated };
	});
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
