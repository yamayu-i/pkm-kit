import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { emptyBoard, unfinished } from "../src/core/board";
import { serializeBoardLogEntry, type BoardOp } from "../src/core/board-log";
import { boardLanes, unstarOps, type BoardLanes } from "../src/core/board-lanes";
import { pickCandidates } from "../src/core/daily";
import { isNext, isNextSub, TaskIndex } from "../src/core/index";
import { collectVault } from "../src/core/load";
import { parseIssue } from "../src/core/schema";
import { todoTasks } from "../src/core/tasks-now";

/** ADR-0184: Pick に in-progress を含め、ボードの Waiting の欄を Watch に差し替える */

const DATE = "2026-11-16";
let seq = 0;
const line = (date: string, op: BoardOp) => serializeBoardLogEntry({ id: `bo_${++seq}`, at: `2026-11-16T00:00:${String(seq % 60).padStart(2, "0")}.${String(seq).padStart(3, "0")}Z`, date, ...op });
const sub = (id: string, summary: string, status = "open", extra = "") => `<!-- sub-issue\nid: ${id}\nsummary: ${summary}\nstatus: ${status}\n${extra}-->\n\n`;
function issue(id: string, fm: Record<string, unknown> = {}, subs = "") {
	const frontmatter = { type: "issue", id, summary: `題${id}`, status: "open", ...fm };
	return { path: `issue/${id}.md`, frontmatter, text: `---\n---\n${subs}` };
}
function load(markdown: ReturnType<typeof issue>[], lines: string[] = [], worklog = "") {
	const { data } = collectVault({
		markdown,
		worklogs: worklog ? [{ path: "worklog/pc/2026-11.jsonl", text: worklog }] : [],
		labels: null,
		boardLogs: [{ path: "board/pc/2026-11.jsonl", text: lines.join("\n") }],
		parseYaml: parse,
	});
	return new TaskIndex(data);
}
const keys = (lanes: BoardLanes) => Object.fromEntries(Object.entries(lanes).map(([k, v]) => [k, v.map((c) => c.key)]));
const boardOf = (index: TaskIndex) => index.board(DATE)?.board ?? emptyBoard();

describe("Next に in-progress を含める", () => {
	const fm = (extra: Record<string, unknown>) => parseIssue("issue/i-1.md", { type: "issue", id: "i-1", summary: "s", status: "open", ...extra }).value!;

	it("in-progress は Next。着手したので clarified がなくてもよい。waiting / delegated / someday は Next でない", () => {
		expect(isNext(fm({ status: "in-progress", clarified: true }))).toBe(true);
		expect(isNext(fm({ status: "in-progress" }))).toBe(true);
		expect(isNext(fm({ status: "in-progress", scheduled: "2026-11-20" }))).toBe(false);
		expect(isNext(fm({ status: "in-progress", tickler: "2026-11-20" }))).toBe(false);
		expect(isNext(fm({ status: "open" }))).toBe(false);
		for (const status of ["waiting", "delegated", "someday", "closed", "canceled"]) expect(isNext(fm({ status, clarified: true }))).toBe(false);
	});

	it("サブの Next: open か in-progress で、Calendar がなく、親が Next で、今日が期間に入っている（ADR-0203）", () => {
		const today = `start: ${DATE}\nend: ${DATE}\n`;
		const index = load([
			issue("i-1", { clarified: true }, sub("aaaaaa", "a", "open", today) + sub("bbbbbb", "b", "in-progress", today) + sub("cccccc", "c", "waiting", today) + sub("dddddd", "d", "in-progress", "scheduled: 2026-11-20\n" + today) + sub("eeeeee", "e", "in-progress", "start: 2026-11-30\n") + sub("ffffff", "f", "delegated", "delegated_to: m-1\n" + today)),
		]);
		const next = index.data.subIssues.filter((s) => isNextSub(s, index.issues.get(s.parent), DATE)).map((s) => s.id);
		expect(next).toEqual(["aaaaaa", "bbbbbb"]);
	});

	it("Pick の候補に in-progress の issue とサブが出る。waiting / delegated は出ない", () => {
		const index = load([
			issue("i-1", { status: "in-progress" }),
			issue("i-2", { status: "waiting", clarified: true }),
			issue("i-3", { clarified: true }, sub("aaaaaa", "進行中", "in-progress", `start: ${DATE}\n`) + sub("bbbbbb", "待ち", "waiting", `start: ${DATE}\n`)),
		]);
		const { issues, groups } = pickCandidates(index, DATE, emptyBoard());
		expect(issues.map((i) => i.id)).toEqual(["i-1"]);
		expect(groups.map((g) => [g.parent.id, g.subs.map((s) => s.id)])).toEqual([["i-3", ["aaaaaa"]]]);
	});
});

describe("Watch の欄", () => {
	const md = [
		issue("i-1", { status: "waiting", priority: "low" }),
		issue("i-2", { status: "delegated", delegated_to: "m-1", priority: "high" }),
		issue("i-3", { status: "waiting", priority: "high", deadline: "2026-11-18" }, sub("aaaaaa", "待つサブ", "waiting") + sub("bbbbbb", "開いたサブ")),
		issue("i-4", { clarified: true, priority: "mid" }, sub("cccccc", "委任したサブ", "delegated", "delegated_to: m-1\n") + sub("dddddd", "待つサブ 2", "waiting")),
		issue("i-5", { status: "closed" }, sub("eeeeee", "閉じた親のサブ", "waiting")),
		issue("i-6", { status: "in-progress" }),
		issue("i-7", { status: "waiting" }),
	];

	it("ボードに載っていない waiting / delegated の issue とサブもすべて出る。親が active でないサブは出ない。並びは Pick と同じで、同じ親のサブは親の中の順", () => {
		const index = load(md, [line(DATE, { op: "add", task: "i-6" })]);
		const lanes = boardLanes(index, DATE, boardOf(index));
		expect(keys(lanes).watch).toEqual(["i-3", "i-3#aaaaaa", "i-2", "i-4#cccccc", "i-4#dddddd", "i-1", "i-7"]);
		expect(keys(lanes).next).toEqual(["i-6"]);
		expect(lanes).not.toHaveProperty("waiting");
	});

	it("ボードに載った waiting はボードの欄に入らず Watch に出る。記録中なら Working に出て Watch には出ない", () => {
		const worklog = '{"id":"wl_1","task_id":"i-7","from":"2026-11-16T01:00:00Z","to":null,"description":""}\n';
		const index = load(md, ["i-1", "i-7", "i-6"].map((task) => line(DATE, { op: "add", task })), worklog);
		const lanes = keys(boardLanes(index, DATE, boardOf(index)));
		expect(lanes.working).toEqual(["i-7"]);
		expect(lanes.next).toEqual(["i-6"]);
		expect(lanes.watch).toContain("i-1");
		expect(lanes.watch).not.toContain("i-7");
		expect(lanes.done).toEqual([]);
	});

	it("★ を付けたまま waiting にしたものは ★ の欄に出ない", () => {
		const index = load(md, [line(DATE, { op: "add", task: "i-1" }), line(DATE, { op: "star", task: "i-1", on: true })]);
		const lanes = keys(boardLanes(index, DATE, boardOf(index)));
		expect(lanes.top).toEqual([]);
		expect(lanes.watch).toContain("i-1");
	});

	it("waiting / delegated は未完了に数えない（締められる）", () => {
		const index = load(md, ["i-1", "i-2", "i-3#aaaaaa", "i-6"].map((task) => line(DATE, { op: "add", task })));
		const u = unfinished(index, DATE, boardOf(index));
		expect(u.issues.map((i) => i.id)).toEqual(["i-6"]);
		expect(u.subs).toEqual([]);
	});

	it("タスクリストに waiting / delegated を出さない", () => {
		const index = load(md, ["i-1", "i-2", "i-6"].map((task) => line(DATE, { op: "add", task })));
		expect(todoTasks(index, DATE, new Set()).map((t) => t.key)).toEqual(["i-6"]);
	});
});

describe("waiting / delegated にしたら ★ を外す", () => {
	const md = [issue("i-1", { status: "in-progress" }, sub("aaaaaa", "a", "in-progress")), issue("i-2")];
	const index = load(md, [
		line(DATE, { op: "add", task: "i-1" }),
		line(DATE, { op: "add", task: "i-1#aaaaaa" }),
		line(DATE, { op: "star", task: "i-1", on: true }),
		line(DATE, { op: "star", task: "i-1#aaaaaa", on: true }),
	]);

	it("今日のボードで ★ が付いていれば、外す op を返す", () => {
		expect(unstarOps(index, DATE, "i-1", "waiting")).toEqual([{ op: "star", task: "i-1", on: false }]);
		expect(unstarOps(index, DATE, "i-1#aaaaaa", "delegated")).toEqual([{ op: "star", task: "i-1#aaaaaa", on: false }]);
	});

	it("ほかの status、★ のないもの、ボードのない日は何もしない", () => {
		expect(unstarOps(index, DATE, "i-1", "closed")).toEqual([]);
		expect(unstarOps(index, DATE, "i-1", "open")).toEqual([]);
		expect(unstarOps(index, DATE, "i-2", "waiting")).toEqual([]);
		expect(unstarOps(index, "2026-11-17", "i-1", "waiting")).toEqual([]);
	});
});
