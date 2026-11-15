import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { backToNextPatch, calendarPatch, inboxPatch, nextPatch, somedayPatch, ticklerPatch } from "../src/core/actions";
import { missedIssues, missedSubs } from "../src/core/daily";
import { TaskIndex, emptyVaultData, isInbox, isNext, organizeQueue } from "../src/core/index";
import { collectVault } from "../src/core/load";
import { parseIssue, type Issue } from "../src/core/schema";
import { formatSubIssue, newSubIssueInput, parseSubIssues } from "../src/core/sub-issue";

/** ADR-0152: scheduled を Calendar（その日にやる。日付 1 つ）に絞り、Tickler を別の項目にする */

const today = "2026-11-16";
function issue(id: string, fm: Record<string, unknown> = {}): Issue {
	return parseIssue(`issue/${id}.md`, { type: "issue", id, summary: id, status: "open", ...fm }).value!;
}

describe("scheduled は日付 1 つ", () => {
	it("日付 1 つで読む", () => {
		const r = parseIssue("issue/i-1.md", { type: "issue", id: "i-1", summary: "x", status: "open", scheduled: "2026-11-20" });
		expect(r.value?.scheduled).toBe("2026-11-20");
		expect(r.problems).toEqual([]);
	});

	it("以前のリストは最も早い日を読み、移行を促す警告を出す", () => {
		const r = parseIssue("issue/i-1.md", { type: "issue", id: "i-1", summary: "x", status: "open", scheduled: ["2026-11-22", "2026-11-20"] });
		expect(r.value?.scheduled).toBe("2026-11-20");
		expect(r.problems).toEqual([expect.objectContaining({ code: "legacy-scheduled-list", severity: "warning" })]);
	});

	it("要素が 1 つのリストも警告する（移行で日付 1 つに書き直す）", () => {
		const r = parseIssue("issue/i-1.md", { type: "issue", id: "i-1", summary: "x", status: "open", scheduled: ["2026-11-20"] });
		expect(r.value?.scheduled).toBe("2026-11-20");
		expect(r.problems.map((p) => p.code)).toEqual(["legacy-scheduled-list"]);
	});

	it("空のリストは日付なし", () => {
		const r = parseIssue("issue/i-1.md", { type: "issue", id: "i-1", summary: "x", status: "open", scheduled: [] });
		expect(r.value?.scheduled).toBeNull();
	});

	it("サブも日付 1 つで読み書きする", () => {
		const text = "<!-- sub-issue\nid: aaaaaa\nsummary: s\nstatus: open\nscheduled: 2026-11-20\n-->\n";
		const { subs, problems } = parseSubIssues("issue/i-1.md", "i-1", text, parse);
		expect(problems).toEqual([]);
		expect(subs[0]?.scheduled).toBe("2026-11-20");
		expect(formatSubIssue(newSubIssueInput({ summary: "s", scheduled: "2026-11-20" }, "aaaaaa", "2026-11-16T00:00:00+09:00"))).toMatch(/^scheduled: 2026-11-20$/m);
	});
});

describe("Tickler", () => {
	it("tickler を日付で読む", () => {
		expect(issue("i-1", { tickler: "2026-11-20" }).tickler).toBe("2026-11-20");
		expect(issue("i-1").tickler).toBeNull();
	});

	it("日付の前は Inbox にも Next にも出ない", () => {
		const i = issue("i-1", { tickler: "2026-11-20", clarified: true });
		expect(isInbox(i, today)).toBe(false);
		expect(isNext(i, today)).toBe(false);
		expect(isInbox(issue("i-2", { tickler: "2026-11-20" }), today)).toBe(false);
	});

	it("日付が来たら、clarified でも Inbox に出る（整理を先送りしたものが戻る）", () => {
		expect(isInbox(issue("i-1", { tickler: today, clarified: true }), today)).toBe(true);
		expect(isInbox(issue("i-1", { tickler: "2026-11-10" }), today)).toBe(true);
		expect(isNext(issue("i-1", { tickler: today, clarified: true }), today)).toBe(false);
	});

	it("Organize のキューにも、日付が来たものだけが Inbox として出る", () => {
		const q = organizeQueue([issue("i-1", { tickler: "2026-11-20" }), issue("i-2", { tickler: today, clarified: true }), issue("i-3")], today);
		expect(q.map((i) => i.id).sort()).toEqual(["i-2", "i-3"]);
	});
});

describe("Next は scheduled も tickler もない整理済みの open", () => {
	it("Calendar（scheduled）があるものは Next に入れない", () => {
		expect(isNext(issue("i-1", { clarified: true }), today)).toBe(true);
		expect(isNext(issue("i-1", { clarified: true, scheduled: "2026-11-20" }), today)).toBe(false);
		// 過ぎた Calendar は Missed で扱う
		expect(isNext(issue("i-1", { clarified: true, scheduled: "2026-11-10" }), today)).toBe(false);
	});
});

describe("Missed（過ぎた Calendar）", () => {
	it("scheduled が今日より前で active な issue とサブ", () => {
		const issues = [
			issue("i-1", { scheduled: "2026-11-10" }),
			issue("i-2", { scheduled: today }),
			issue("i-3", { scheduled: "2026-11-10", status: "closed" }),
			issue("i-4", { scheduled: "2026-11-12", status: "waiting" }),
		];
		expect(missedIssues(issues, today).map((i) => i.id)).toEqual(["i-1", "i-4"]);
		const sub = "<!-- sub-issue\nid: aaaaaa\nsummary: s\nstatus: open\nscheduled: 2026-11-10\n-->\n\n<!-- sub-issue\nid: bbbbbb\nsummary: t\nstatus: closed\nscheduled: 2026-11-10\n-->\n";
		const fm = { type: "issue", id: "i-9", summary: "親", status: "open" };
		const index = new TaskIndex(collectVault({ markdown: [{ path: "issue/i-9.md", frontmatter: fm, text: `---\n---\n${sub}` }], worklogs: [], labels: null, parseYaml: parse }).data);
		expect(missedSubs(index, today).map((s) => s.key)).toEqual(["i-9#aaaaaa"]);
	});

	it("今日が scheduled のものは自動でボードに載せる（日付 1 つ）", () => {
		const index = new TaskIndex({ ...emptyVaultData(), issues: [issue("i-1", { scheduled: today }), issue("i-2", { scheduled: "2026-11-20" })] });
		expect(index.toAutoAdd(today)).toEqual(["i-1"]);
	});
});

describe("操作の patch", () => {
	it("Tickler: 日付を書く。someday なら open に戻す", () => {
		expect(ticklerPatch(issue("i-1"), "2026-11-20")).toEqual({ tickler: "2026-11-20" });
		expect(ticklerPatch(issue("i-1", { status: "someday", revisit: "2026-12-01" }), "2026-11-20")).toEqual({ tickler: "2026-11-20", status: "open", revisit: null });
	});

	it("Calendar: scheduled を日付 1 つで書き、整理済みにし、tickler を消す", () => {
		expect(calendarPatch(issue("i-1", { tickler: today }), "2026-11-20")).toEqual({ scheduled: "2026-11-20", clarified: true, tickler: null });
		expect(calendarPatch(issue("i-1", { status: "someday", revisit: "2026-12-01" }), "2026-11-20")).toEqual({ scheduled: "2026-11-20", clarified: true, tickler: null, status: "open", revisit: null });
	});

	it("Next・Inbox に戻す・Someday は tickler を消す", () => {
		expect(nextPatch(issue("i-1", { tickler: today }))).toEqual({ clarified: true, tickler: null });
		expect(inboxPatch()).toMatchObject({ clarified: null, tickler: null });
		expect(somedayPatch()).toMatchObject({ scheduled: null, tickler: null });
	});

	it("Back to Next: scheduled と tickler を消して、整理済みのまま Next に戻す", () => {
		expect(backToNextPatch()).toEqual({ scheduled: null, tickler: null, clarified: true });
	});
});
