import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { serializeBoardLogEntry, type BoardOp } from "../src/core/board-log";
import { boardLanes, LANES } from "../src/core/board-lanes";
import { subCalendarPeriodError } from "../src/core/calendar-subs";
import { emptyVaultData, TaskIndex } from "../src/core/index";
import { collectVault } from "../src/core/load";
import { loadItems, needsEstimate, projectGroups } from "../src/core/projects";
import { parseIssue } from "../src/core/schema";
import { parseSubIssues, type SubIssue } from "../src/core/sub-issue";
import { canConnect, daysOf, periodBarOf, timelineToggle } from "../src/core/timeline";

/** ADR-0255: ボードの Calendar の欄と、サブの Calendar か期間のどちらか一方 */

const DATE = "2026-11-16";
let seq = 0;
const line = (date: string, op: BoardOp) => serializeBoardLogEntry({ id: `bo_${++seq}`, at: `2026-11-16T00:00:${String(seq % 60).padStart(2, "0")}.000Z`, date, ...op });

function issueFile(id: string, extra: Record<string, unknown> = {}, body = "") {
	const fm = { type: "issue", id, summary: `s${id}`, status: "open", clarified: true, ...extra };
	return { path: `issue/${id}.md`, frontmatter: fm, text: `---\n${JSON.stringify(fm)}\n---\n\n## Note\n\n${body}` };
}
const subBlock = (id: string, extra = "", status = "open") => `<!-- sub-issue\nid: ${id}\nsummary: ${id}\nstatus: ${status}\n${extra}-->\n\n`;

function load(markdown: ReturnType<typeof issueFile>[], lines: string[], worklog = "") {
	const { data } = collectVault({
		markdown,
		worklogs: worklog ? [{ path: "worklog/pc/2026-11.jsonl", text: worklog }] : [],
		labels: null,
		boardLogs: [{ path: "board/pc/2026-11.jsonl", text: lines.join("\n") }],
		parseYaml: parse,
	});
	return new TaskIndex(data);
}
const lanesOf = (index: TaskIndex) => boardLanes(index, DATE, index.board(DATE)!.board);

describe("ボードの Calendar の欄", () => {
	it("欄の並びは Calendar がいちばん上", () => {
		expect(LANES[0]).toBe("calendar");
		expect(LANES).toEqual(["calendar", "working", "top", "routine", "next", "watch", "done"]);
	});

	it("今日が scheduled の issue とサブは Calendar の欄。別の日の scheduled と、ないものは Next", () => {
		const index = load(
			[
				issueFile("i-1", { scheduled: DATE }),
				issueFile("i-2", { scheduled: "2026-11-15" }),
				issueFile("i-3"),
				issueFile("i-4", {}, subBlock("aaaaaa", `scheduled: ${DATE}\n`)),
			],
			["i-1", "i-2", "i-3", "i-4#aaaaaa"].map((task) => line(DATE, { op: "add", task })),
		);
		const lanes = lanesOf(index);
		expect(lanes.calendar.map((c) => c.key)).toEqual(["i-1", "i-4#aaaaaa"]);
		expect(lanes.next.map((c) => c.key)).toEqual(["i-2", "i-3"]);
	});

	it("記録中なら Working、片付いたら Done、waiting は Watch。★ が付いていても Calendar", () => {
		const worklog = '{"id":"wl_1","task_id":"i-2","from":"2026-11-16T01:00:00Z","to":null,"description":""}\n';
		const index = load(
			[
				issueFile("i-1", { scheduled: DATE }),
				issueFile("i-2", { scheduled: DATE }),
				issueFile("i-3", { scheduled: DATE, status: "closed" }),
				issueFile("i-4", { scheduled: DATE, status: "waiting" }),
			],
			[...["i-1", "i-2", "i-3", "i-4"].map((task) => line(DATE, { op: "add", task })), line(DATE, { op: "star", task: "i-1", on: true })],
			worklog,
		);
		const lanes = lanesOf(index);
		expect(lanes.calendar.map((c) => c.key)).toEqual(["i-1"]);
		expect(lanes.top.map((c) => c.key)).toEqual([]);
		expect(lanes.working.map((c) => c.key)).toEqual(["i-2"]);
		expect(lanes.done.map((c) => c.key)).toEqual(["i-3"]);
		expect(lanes.watch.map((c) => c.key)).toEqual(["i-4"]);
	});

	it("Calendar の欄は載せた順", () => {
		const index = load(
			[issueFile("i-1", { scheduled: DATE }), issueFile("i-2", { scheduled: DATE })],
			[line(DATE, { op: "add", task: "i-2" }), line(DATE, { op: "add", task: "i-1" }), line(DATE, { op: "order", tasks: ["i-1", "i-2"] })],
		);
		expect(lanesOf(index).calendar.map((c) => c.key)).toEqual(["i-2", "i-1"]);
	});
});

describe("サブは Calendar か期間のどちらか一方", () => {
	const none = { start: null, end: null, scheduled: null };
	it("書いた後に両方を持つならエラー", () => {
		expect(subCalendarPeriodError(none, { scheduled: DATE, start: DATE, end: DATE })).toMatch(/Calendar の日と期間/);
		expect(subCalendarPeriodError({ ...none, start: DATE, end: DATE }, { scheduled: DATE })).toMatch(/Calendar の日と期間/);
		expect(subCalendarPeriodError({ ...none, scheduled: DATE }, { start: DATE, end: DATE })).toMatch(/Calendar の日と期間/);
	});

	it("片方だけ・切り替え（1 回で片方を消す）・日付に触れない変更はよい", () => {
		expect(subCalendarPeriodError(none, { scheduled: DATE })).toBeNull();
		expect(subCalendarPeriodError(none, { start: DATE, end: DATE })).toBeNull();
		expect(subCalendarPeriodError({ ...none, start: DATE, end: DATE }, { scheduled: DATE, start: null, end: null })).toBeNull();
		expect(subCalendarPeriodError({ ...none, scheduled: DATE }, { scheduled: null, start: DATE, end: DATE })).toBeNull();
		// 既に両方を持つサブ（移行 0255 が報告する）でも、日付に触れなければ止めない。片方を消すのもよい
		const both = { start: DATE, end: DATE, scheduled: DATE };
		expect(subCalendarPeriodError(both, {})).toBeNull();
		expect(subCalendarPeriodError(both, { scheduled: null })).toBeNull();
		expect(subCalendarPeriodError(both, { start: null, end: null })).toBeNull();
		expect(subCalendarPeriodError(null, { summary: "x" } as never)).toBeNull();
	});
});

describe("ガントの棒と日（issue 画面と Projects で共通）", () => {
	const s = (extra: Partial<{ start: string; end: string; scheduled: string }>) => ({ id: "a", start: null, end: null, scheduled: null, dependsOn: [], ...extra });
	it("Calendar のサブは棒を描かず、日は Calendar の 1 日。両方持ちは Calendar を優先する", () => {
		expect(periodBarOf(s({ start: "2026-11-16", end: "2026-11-18" }))).toEqual({ start: "2026-11-16", end: "2026-11-18" });
		expect(periodBarOf(s({ scheduled: "2026-11-17" }))).toBeNull();
		expect(periodBarOf(s({ start: "2026-11-16", end: "2026-11-18", scheduled: "2026-11-17" }))).toBeNull();
		expect(daysOf(s({ scheduled: "2026-11-17" }))).toEqual({ start: "2026-11-17", end: "2026-11-17" });
		expect(daysOf(s({ start: "2026-11-16", end: "2026-11-18", scheduled: "2026-11-17" }))).toEqual({ start: "2026-11-17", end: "2026-11-17" });
		expect(daysOf(s({ start: "2026-11-16", end: "2026-11-18" }))).toEqual({ start: "2026-11-16", end: "2026-11-18" });
		expect(daysOf(s({}))).toBeNull();
	});

	it("1 日の棒と Calendar の切り替え。2 日以上の棒は切り替えない", () => {
		expect(timelineToggle(s({ start: "2026-11-16", end: "2026-11-16" }))).toEqual({ scheduled: "2026-11-16", start: null, end: null });
		expect(timelineToggle(s({ scheduled: "2026-11-17" }))).toEqual({ scheduled: null, start: "2026-11-17", end: "2026-11-17" });
		expect(timelineToggle(s({ start: "2026-11-16", end: "2026-11-17" }))).toBeNull();
		expect(timelineToggle(s({}))).toBeNull();
	});

	it("Calendar のサブには依存の矢印をつなげない", () => {
		const a = s({ start: "2026-11-16", end: "2026-11-16" });
		const b = { ...s({ scheduled: "2026-11-18" }), id: "b" };
		expect(canConnect([a, b], "a", "b")).toBe(false);
	});
});

describe("Projects の計算での Calendar のサブ", () => {
	const today = "2026-11-16";
	const issue = (id: string, fm: Record<string, unknown> = {}) => parseIssue(`issue/${id}.md`, { type: "issue", id, summary: id, status: "open", clarified: true, ...fm }).value!;
	const subsOf = (parent: string, text: string): SubIssue[] => parseSubIssues(`issue/${parent}.md`, parent, text, parse).subs;

	it("負荷と見積もりのない印は、Calendar の 1 日に数える", () => {
		const data = emptyVaultData();
		data.issues = [issue("i-1")];
		data.subIssues = subsOf("i-1", subBlock("aaaaaa", "scheduled: 2026-11-18\nestimated: 60\n") + subBlock("bbbbbb", "scheduled: 2026-11-19\n"));
		const index = new TaskIndex(data);
		const items = loadItems(projectGroups(index, false), index);
		expect(items).toEqual([
			{ key: "i-1#aaaaaa", start: "2026-11-18", end: "2026-11-18", minutes: 60 },
			{ key: "i-1#bbbbbb", start: "2026-11-19", end: "2026-11-19", minutes: null },
		]);
		expect(needsEstimate(data.subIssues[1]!, today)).toBe(true);
	});

	it("Project の並びは、Calendar の日も終わりの日として数える", () => {
		const data = emptyVaultData();
		data.issues = [issue("i-1"), issue("i-2")];
		data.subIssues = [...subsOf("i-1", subBlock("aaaaaa", "start: 2026-11-20\nend: 2026-11-25\n")), ...subsOf("i-2", subBlock("bbbbbb", "scheduled: 2026-11-18\n"))];
		expect(projectGroups(new TaskIndex(data), false).map((g) => g.issue.id)).toEqual(["i-2", "i-1"]);
	});
});

describe("lint: 既に両方を持つサブ", () => {
	it("scheduled と期間の両方を持つサブを sub-calendar-and-period で警告する", () => {
		const head = "---\ntype: issue\nid: i-1\n---\n";
		const codes = (extra: string) => parseSubIssues("issue/i-1.md", "i-1", `${head}\n${subBlock("aaaaaa", extra)}`, parse).problems.map((p) => [p.severity, p.code]);
		expect(codes("scheduled: 2026-11-18\nstart: 2026-11-18\nend: 2026-11-18\n")).toEqual([["warning", "sub-calendar-and-period"]]);
		expect(codes("scheduled: 2026-11-18\n")).toEqual([]);
		expect(codes("start: 2026-11-18\nend: 2026-11-18\n")).toEqual([]);
	});
});
