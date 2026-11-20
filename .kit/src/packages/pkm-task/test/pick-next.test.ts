import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { emptyBoard } from "../src/core/board";
import { calendarWithSubsError, subsWithCalendarError } from "../src/core/calendar-subs";
import { pickCandidates } from "../src/core/daily";
import { inPeriod, isNextSub, needsPeriod, TaskIndex } from "../src/core/index";
import { lintVault } from "../src/core/lint";
import { collectVault } from "../src/core/load";
import { pickTimerControl, showsPrimaryStep } from "../src/core/pick";
import { STATUSES } from "../src/core/schema";

/** ADR-0203: issue 画面の Pick と Start を Next に沿わせ、Calendar とサブを同時に持たせない */

const today = "2026-11-17";
const sub = (id: string, summary: string, extra = "", status = "open") => `<!-- sub-issue\nid: ${id}\nsummary: ${summary}\nstatus: ${status}\n${extra}-->\n\n`;
function issue(id: string, fm: Record<string, unknown>, subs = "") {
	const frontmatter = { type: "issue", id, summary: `題${id}`, status: "open", ...fm };
	return { path: `issue/${id}.md`, frontmatter, text: `---\n---\n${subs}` };
}
const indexOf = (markdown: ReturnType<typeof issue>[]) => new TaskIndex(collectVault({ markdown, worklogs: [], labels: null, parseYaml: parse }).data);
const period = (start: string | null, end: string | null) => `${start ? `start: ${start}\n` : ""}${end ? `end: ${end}\n` : ""}`;

describe("サブの Next は、親が Next で、今日が期間に入っているもの", () => {
	it("期間は start〜end（両端を含む）。片方だけならその 1 日。期間がなければ入らない", () => {
		expect(inPeriod({ start: "2026-11-15", end: "2026-11-17" }, today)).toBe(true);
		expect(inPeriod({ start: "2026-11-17", end: "2026-11-20" }, today)).toBe(true);
		expect(inPeriod({ start: "2026-11-18", end: "2026-11-20" }, today)).toBe(false);
		expect(inPeriod({ start: "2026-11-10", end: "2026-11-16" }, today)).toBe(false);
		expect(inPeriod({ start: today, end: null }, today)).toBe(true);
		expect(inPeriod({ start: null, end: today }, today)).toBe(true);
		expect(inPeriod({ start: "2026-11-16", end: null }, today)).toBe(false);
		expect(inPeriod({ start: null, end: null }, today)).toBe(false);
	});

	const index = indexOf([
		issue(
			"i-1",
			{ clarified: true },
			sub("aaaaaa", "今日を含む", period("2026-11-16", "2026-11-18")) +
				sub("bbbbbb", "期間なし") +
				sub("cccccc", "過ぎた", period("2026-11-10", "2026-11-16")) +
				sub("dddddd", "まだ", period("2026-11-20", "2026-11-21")) +
				sub("eeeeee", "進行中", period(today, today), "in-progress") +
				sub("ffffff", "Calendar", `scheduled: ${today}\n` + period(today, today)) +
				sub("gggggg", "待ち", period(today, today), "waiting"),
		),
		issue("i-2", {}, sub("hhhhhh", "Inbox の親", period(today, today))),
		issue("i-3", { status: "in-progress" }, sub("iiiiii", "着手した親", period(today, today))),
	]);
	const parentOf = (s: { parent: string }) => index.issues.get(s.parent);

	it("Next になるのは、open か in-progress で、Calendar がなく、親が Next で、今日が期間に入るもの", () => {
		const next = index.data.subIssues.filter((s) => isNextSub(s, parentOf(s), today)).map((s) => s.id);
		expect(next).toEqual(["aaaaaa", "eeeeee", "iiiiii"]);
	});

	it("期間のほかは Next の条件を満たすサブは needsPeriod（期間がない・過ぎた・まだ）", () => {
		const need = index.data.subIssues.filter((s) => needsPeriod(s, parentOf(s), today)).map((s) => s.id);
		expect(need).toEqual(["bbbbbb", "cccccc", "dddddd"]);
	});

	it("親が読めなければ Next にも needsPeriod にもならない", () => {
		const s = index.data.subIssues[0]!;
		expect(isNextSub(s, undefined, today)).toBe(false);
		expect(needsPeriod(s, undefined, today)).toBe(false);
	});
});

describe("issue 画面の Pick・タイマーのボタン", () => {
	const base = { picked: false, running: false, next: false, needsPeriod: false };

	it.each(STATUSES)("%s: 記録中なら停止。終わったもの・待ち・someday には出さない", (status) => {
		expect(pickTimerControl({ ...base, status, running: true })).toBe("stop");
		const none = ["closed", "canceled", "waiting", "delegated", "someday"].includes(status);
		if (none) {
			expect(pickTimerControl({ ...base, status, picked: true, next: true })).toBeNull();
			expect(pickTimerControl({ ...base, status, next: true })).toBeNull();
		}
	});

	it("今日のボードにあれば再生。Next なら Pick。期間を決めれば Next になるサブは Timeline。それ以外は何も出さない", () => {
		for (const status of ["open", "in-progress"] as const) {
			expect(pickTimerControl({ ...base, status, picked: true })).toBe("start");
			expect(pickTimerControl({ ...base, status, next: true })).toBe("pick");
			expect(pickTimerControl({ ...base, status, needsPeriod: true })).toBe("timeline");
			expect(pickTimerControl({ ...base, status })).toBeNull();
		}
	});
});

describe("status のボタンの Start", () => {
	it.each(STATUSES)("%s: Start（open → in-progress）は今日のボードに載せたものにだけ出す。ほかのボタンはいつも出す", (status) => {
		expect(showsPrimaryStep(status, true)).toBe(true);
		expect(showsPrimaryStep(status, false)).toBe(status !== "open");
	});
});

describe("DailyTaskView の Pick", () => {
	const index = indexOf([
		issue("i-1", { clarified: true, priority: "high" }, sub("aaaaaa", "期間なし") + sub("bbbbbb", "まだ", period("2026-11-20", "2026-11-21"))),
		issue("i-2", { clarified: true }, sub("cccccc", "今日", period(today, today)) + sub("dddddd", "期間なし")),
		issue("i-3", {}, sub("eeeeee", "Inbox の親")),
		issue("i-4", { clarified: true }, sub("ffffff", "済んだ", period(today, today), "closed")),
		issue("i-5", { clarified: true }),
		issue("i-6", { clarified: true }, sub("gggggg", "過ぎた", period("2026-11-10", "2026-11-16"))),
	]);

	it("サブの候補は新しい Next で選ぶ（期間の外と、Next でない親のサブは出ない）", () => {
		const { groups, issues } = pickCandidates(index, today, emptyBoard());
		expect(groups.map((g) => [g.parent.id, g.subs.map((s) => s.id)])).toEqual([["i-2", ["cccccc"]]]);
		// サブがすべて閉じた i-4 も Project のまま。単独の行にならない（ADR-0210）
		expect(issues.map((i) => i.id)).toEqual(["i-5"]);
	});

	it("Next のサブが 1 つもない Next の Project を、次の行動のない Project として出す（Inbox の親は出さない）", () => {
		// i-1 は先の期間のサブがあるので出さない。サブがすべて閉じた i-4 は出す（ADR-0210）
		expect(pickCandidates(index, today, emptyBoard()).stalled.map((i) => i.id)).toEqual(["i-4", "i-6"]);
	});

	it("Next のサブが今日のボードに載っていれば、次の行動はあるので出さない", () => {
		const board = { ...emptyBoard(), issues: ["i-2#cccccc"] };
		const r = pickCandidates(index, today, board);
		expect(r.groups).toEqual([]);
		expect(r.stalled.map((i) => i.id)).toEqual(["i-4", "i-6"]);
	});
});

describe("Calendar とサブを同時に持たせない", () => {
	it("サブを持つ issue に Calendar の日を付けようとするとエラーの文を返す。消すのはよい", () => {
		expect(calendarWithSubsError("i-1", 1, today)).toMatch(/サブイシューを持つ issue には Calendar/);
		expect(calendarWithSubsError("i-1", 1, null)).toBeNull();
		expect(calendarWithSubsError("i-1", 0, today)).toBeNull();
	});

	it("Calendar の日を持つ issue にサブを足そうとするとエラーの文を返す", () => {
		expect(subsWithCalendarError({ id: "i-1", scheduled: today })).toMatch(/Calendar の日を持つ issue にはサブイシューを足せません/);
		expect(subsWithCalendarError({ id: "i-1", scheduled: null })).toBeNull();
	});

	it("両方を持つ issue を lint が calendar-with-subs で知らせる（閉じたサブも数える）", () => {
		const idx = indexOf([issue("i-1", { scheduled: today }, sub("aaaaaa", "閉じた", "", "closed")), issue("i-2", { scheduled: today }), issue("i-3", {}, sub("bbbbbb", "s"))]);
		const found = lintVault(idx.data).filter((f) => f.code === "calendar-with-subs");
		expect(found.map((f) => f.path)).toEqual(["issue/i-1.md"]);
		expect(found[0]!.severity).toBe("warning");
	});
});
