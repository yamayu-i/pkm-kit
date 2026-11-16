import { describe, expect, it } from "vitest";
import { issueLink, memberInitial, memberLink, routineLink, searchIssues, searchMembers, searchRoutines, searchSubs, subLink, subShortcut } from "../src/core/link-search";
import type { Issue, Member, Routine, Status } from "../src/core/schema";
import type { SubIssue } from "../src/core/sub-issue";

const issue = (n: number, summary: string, status: Status = "open") => ({ id: `i-${n}`, path: `issue/i-${n}.md`, summary, status }) as Issue;
const issues = [issue(1, "設計を見直す"), issue(12, "仕様を決める"), issue(120, "仕様書", "closed"), issue(3, "掃除", "canceled"), issue(4, "待つ", "waiting")];
const mtime: Record<string, number> = { "issue/i-1.md": 1, "issue/i-12.md": 5, "issue/i-120.md": 9, "issue/i-3.md": 2, "issue/i-4.md": 3 };
const recency = (p: string) => mtime[p] ?? 0;
const ids = (list: { id: string }[]) => list.map((i) => i.id);

describe("searchIssues（ADR-0194）", () => {
	it("既定は closed と canceled を除き、新しい順", () => {
		expect(ids(searchIssues(issues, "", recency))).toEqual(["i-12", "i-4", "i-1"]);
	});
	it("題の部分一致", () => {
		expect(ids(searchIssues(issues, "仕様", recency))).toEqual(["i-12"]);
	});
	it("s: で status を絞る。カンマで複数、all ですべて", () => {
		expect(ids(searchIssues(issues, "s:closed", recency))).toEqual(["i-120"]);
		expect(ids(searchIssues(issues, "s:closed,waiting", recency))).toEqual(["i-120", "i-4"]);
		expect(ids(searchIssues(issues, "仕様 s:all", recency))).toEqual(["i-120", "i-12"]);
	});
	it("数字だけなら ID。同じ数を先に", () => {
		expect(ids(searchIssues(issues, "12 s:all", recency))).toEqual(["i-12", "i-120"]);
		expect(ids(searchIssues(issues, "i-1", recency))).toEqual(["i-1", "i-12"]);
	});
});

describe("searchSubs", () => {
	const sub = (id: string, summary: string, order: number, status: Status = "open") =>
		({ parent: "i-12", path: "issue/i-12.md", id, key: `i-12#${id}`, order, summary, status }) as SubIssue;
	const subs = [sub("aaaaaa", "仕様を書く", 0), sub("bbbbbb", "レビュー", 1, "closed"), sub("cccccc", "仕様の確認", 2)];
	it("md の順で、既定は終わったものを除く", () => {
		expect(ids(searchSubs(subs, ""))).toEqual(["aaaaaa", "cccccc"]);
		expect(ids(searchSubs(subs, "s:all"))).toEqual(["aaaaaa", "bbbbbb", "cccccc"]);
		expect(ids(searchSubs(subs, "確認"))).toEqual(["cccccc"]);
	});
	it("12# の形で親を飛ばす", () => {
		expect(subShortcut("12#")).toEqual({ parent: "i-12", rest: "" });
		expect(subShortcut("i-12#仕様")).toEqual({ parent: "i-12", rest: "仕様" });
		expect(subShortcut("12")).toBeNull();
	});
	it("リンクは合成キーとアンカー", () => {
		expect(subLink(subs[0]!)).toBe("[i-12#aaaaaa 仕様を書く](issue/i-12.md#aaaaaa)");
	});
});

describe("member と routine", () => {
	const members = [
		{ id: "m-1", path: "member/m-1.md", name: "山田 太郎", nickname: "たろう", alias: "taro" },
		{ id: "m-2", path: "member/m-2.md", name: "Suzuki Hanako", nickname: "hanako", alias: "hana" },
	] as Member[];
	it("name・nickname・alias と ID で探す", () => {
		expect(ids(searchMembers(members, "taro", recency))).toEqual(["m-1"]);
		expect(ids(searchMembers(members, "suzuki", recency))).toEqual(["m-2"]);
		expect(ids(searchMembers(members, "2", recency))).toEqual(["m-2"]);
	});
	it("リンクと頭文字", () => {
		expect(memberLink(members[1]!)).toBe("[hanako](member/m-2.md)");
		expect(memberInitial(members[1]!)).toBe("H");
		expect(memberInitial(members[0]!)).toBe("た");
	});
	const routines = [
		{ id: "r-1", path: "routine/r-1.md", summary: "週報", active: true },
		{ id: "r-2", path: "routine/r-2.md", summary: "棚卸し", active: false },
	] as Routine[];
	it("routine は既定で一時停止を除く", () => {
		expect(ids(searchRoutines(routines, "", recency))).toEqual(["r-1"]);
		expect(ids(searchRoutines(routines, "s:paused", recency))).toEqual(["r-2"]);
		expect(ids(searchRoutines(routines, "s:all", recency))).toEqual(["r-1", "r-2"]);
	});
	it("リンクの文字は退避する", () => {
		expect(routineLink(routines[0]!)).toBe("[r-1 週報](routine/r-1.md)");
		expect(issueLink(issue(5, "a [b]"))).toBe("[i-5 a \\[b\\]](issue/i-5.md)");
	});
});
