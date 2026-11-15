import { expect, it } from "vitest";
import { pickIssuePatch, pickSubPatch } from "../src/core/pick";
import { parseIssue } from "../src/core/schema";
import { parseSubIssues } from "../src/core/sub-issue";
import { isNext } from "../src/core/index";
import { parse } from "yaml";
it("Next なら変更せず、それ以外は Next に必要な項目を変更する", () => {
	const issue = parseIssue("issue/i-1.md", {type:"issue", id:"i-1", summary:"Task", status:"waiting", scheduled:"2026-11-20", tickler:"2026-11-19"}).value!;
	const patch = pickIssuePatch(issue)!;
	expect(patch).toMatchObject({status:"open", clarified:true, scheduled:null, tickler:null});
	const next = parseIssue(issue.path, {type:"issue",id:issue.id, summary:issue.summary, ...patch}).value!;
	expect(isNext(next)).toBe(true);
	expect(pickIssuePatch(next)).toBeNull();
});
it("サブの将来の開始日・Calendar・status を Next にする", () => {
	const sub = parseSubIssues("issue/i-1.md", "i-1", "<!-- sub-issue\nid: aaaaaa\nsummary: Task\nstatus: waiting\nstart: 2026-11-20\nend: 2026-11-25\nscheduled: 2026-11-21\ndeadline: 2026-11-30\n-->\n", parse).subs[0]!;
	expect(pickSubPatch(sub, "2026-11-15")).toEqual({status:"open", delegatedTo:null, scheduled:null, start:null});
	expect(pickSubPatch({...sub,status:"open",scheduled:null,start:"2026-11-14"}, "2026-11-15")).toBeNull();
});
