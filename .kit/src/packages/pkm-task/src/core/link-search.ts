/**
 * @issue・@sub-issue・@member・@routine の検索とリンクの形（ADR-0194）。Obsidian に依存しない
 */
import { markdownLink, parseLinkQuery, searchItems } from "../../../shared/src/link-query.ts";
import { STATUSES, type Issue, type Member, type Routine, type Status } from "./schema";
import type { SubIssue } from "./sub-issue";

/** 何も付けないときに除く status */
const DONE: readonly Status[] = ["closed", "canceled"];

export function isDoneStatus(status: Status): boolean {
	return DONE.includes(status);
}

/** `s:` の値から、出す status。`all` ならすべて、知らない値は無視する。何も付けなければ closed / canceled を除く */
export function statusFilter(values: readonly string[] | undefined): (status: Status) => boolean {
	if (!values || values.length === 0) return (s) => !isDoneStatus(s);
	if (values.includes("all")) return () => true;
	const set = new Set(values.filter((v): v is Status => (STATUSES as readonly string[]).includes(v)));
	return (s) => set.has(s);
}

/** issue を探す。recency は新しいほど大きい値（ファイルの更新日時） */
export function searchIssues(issues: readonly Issue[], input: string, recency: (path: string) => number): Issue[] {
	const q = parseLinkQuery(input, ["s"], "i");
	const ok = statusFilter(q.filters.s);
	return searchItems(
		issues.filter((i) => ok(i.status)),
		q,
		{ haystacks: (i) => [i.summary, i.id], id: (i) => i.id, recency: (i) => recency(i.path) },
	);
}

/** `12#…` / `i-12#…` の形なら、親の ID と、`#` の後ろの検索語 */
export function subShortcut(input: string): { parent: string; rest: string } | null {
	const m = /^\s*(?:i-)?(\d+)#(.*)$/.exec(input);
	return m ? { parent: `i-${m[1]}`, rest: m[2]! } : null;
}

/** サブを探す（md の順）。何も付けなければ closed / canceled を除く */
export function searchSubs(subs: readonly SubIssue[], input: string): SubIssue[] {
	const q = parseLinkQuery(input, ["s"]);
	const ok = statusFilter(q.filters.s);
	// サブの id は数字の連番ではないので、数字も題の語として探す
	const words = q.number !== null ? [q.number] : q.words;
	return searchItems(
		subs.filter((s) => ok(s.status)),
		{ ...q, words, number: null },
		{ haystacks: (s) => [s.summary, s.id] },
	);
}

export function searchMembers(members: readonly Member[], input: string, recency: (path: string) => number): Member[] {
	const q = parseLinkQuery(input, [], "m");
	return searchItems(members, q, { haystacks: (m) => [m.nickname, m.name, m.alias, m.id], id: (m) => m.id, recency: (m) => recency(m.path) });
}

/** routine を探す。何も付けなければ一時停止を除く。`s:paused` で一時停止だけ、`s:all` ですべて */
export function searchRoutines(routines: readonly Routine[], input: string, recency: (path: string) => number): Routine[] {
	const q = parseLinkQuery(input, ["s"], "r");
	const s = q.filters.s ?? [];
	const ok = s.includes("all") ? () => true : s.includes("paused") ? (r: Routine) => !r.active : (r: Routine) => r.active;
	return searchItems(routines.filter(ok), q, { haystacks: (r) => [r.summary, r.id], id: (r) => r.id, recency: (r) => recency(r.path) });
}

export function issueLink(issue: Pick<Issue, "id" | "summary" | "path">): string {
	return markdownLink(`${issue.id} ${issue.summary}`, issue.path);
}

export function subLink(sub: Pick<SubIssue, "key" | "id" | "summary" | "path">): string {
	return markdownLink(`${sub.key} ${sub.summary}`, sub.path, sub.id);
}

export function memberLink(member: Pick<Member, "nickname" | "path">): string {
	return markdownLink(member.nickname, member.path);
}

export function routineLink(routine: Pick<Routine, "id" | "summary" | "path">): string {
	return markdownLink(`${routine.id} ${routine.summary}`, routine.path);
}

/** member の頭文字（呼び名の最初の 1 文字） */
export function memberInitial(member: Pick<Member, "nickname" | "name">): string {
	return Array.from((member.nickname || member.name).trim())[0]?.toUpperCase() ?? "?";
}
