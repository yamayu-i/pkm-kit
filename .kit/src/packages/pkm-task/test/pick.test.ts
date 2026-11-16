import { expect, it } from "vitest";
import { pickIssuePatch, pickSubPatch, pickTimerControl } from "../src/core/pick";
import { STATUSES } from "../src/core/schema";
import { parseIssue } from "../src/core/schema";
import { parseSubIssues } from "../src/core/sub-issue";
import { isNext } from "../src/core/index";
import { parse } from "yaml";

it.each(STATUSES)("issue とサブの %s で Pick・再生・停止の条件をそろえる（ADR-0183）", (status) => {
	// 終わったもの・待っているものには出さない。someday は Pick だけ（Pick で open になる）
	const none = status === "closed" || status === "canceled" || status === "waiting" || status === "delegated";
	expect(pickTimerControl(status, false, false)).toBe(none ? null : "pick");
	expect(pickTimerControl(status, true, false)).toBe(none ? null : status === "someday" ? "pick" : "start");
	// 済みにした後やボードから外れた後も、記録を停止できる。
	expect(pickTimerControl(status, false, true)).toBe("stop");
	expect(pickTimerControl(status, true, true)).toBe("stop");
});
it("Next なら変更せず、それ以外は Next に必要な項目を変更する", () => {
	const issue = parseIssue("issue/i-1.md", {type:"issue", id:"i-1", summary:"Task", status:"someday", scheduled:"2026-11-20", tickler:"2026-11-19"}).value!;
	const patch = pickIssuePatch(issue)!;
	expect(patch).toMatchObject({status:"open", clarified:true, scheduled:null, tickler:null});
	const next = parseIssue(issue.path, {type:"issue",id:issue.id, summary:issue.summary, ...patch}).value!;
	expect(isNext(next)).toBe(true);
	expect(pickIssuePatch(next)).toBeNull();
});
it("サブの将来の開始日・Calendar・status を Next にする", () => {
	const sub = parseSubIssues("issue/i-1.md", "i-1", "<!-- sub-issue\nid: aaaaaa\nsummary: Task\nstatus: someday\nstart: 2026-11-20\nend: 2026-11-25\nscheduled: 2026-11-21\ndeadline: 2026-11-30\n-->\n", parse).subs[0]!;
	expect(pickSubPatch(sub, "2026-11-15")).toEqual({status:"open", delegatedTo:null, scheduled:null, start:null});
	expect(pickSubPatch({...sub,status:"open",scheduled:null,start:"2026-11-14"}, "2026-11-15")).toBeNull();
});
it("待っているものを Pick しても open には下げない（遷移表に沿う。ADR-0183）", () => {
	const issue = parseIssue("issue/i-1.md", {type:"issue", id:"i-1", summary:"Task", status:"delegated", delegated_to:"m-1"}).value!;
	expect(pickIssuePatch(issue)).toMatchObject({status:"in-progress", delegated_to:null});
});
