import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { emptyBoard, unfinished } from "../src/core/board";
import { boardLanes } from "../src/core/board-lanes";
import { serializeBoardLogEntry, type BoardOp } from "../src/core/board-log";
import { closingGroups, closingRoutines } from "../src/core/closing";
import { TaskIndex } from "../src/core/index";
import { collectVault } from "../src/core/load";
import { carriedFrom, missedRoutines, routinesOnDay } from "../src/core/routine-order";
import { parseRoutine } from "../src/core/schema";

/** ADR-0234: 積み残したら今日やる routine を、今日のボードに持ち越す（missed: carry） */

const SINCE = "2026-11-18";
let seq = 0;
const line = (date: string, op: BoardOp) => serializeBoardLogEntry({ id: `bo_${++seq}`, at: `${date}T00:00:00.${String(seq).padStart(3, "0")}Z`, date, ...op });
const result = (date: string, task: string, r: "closed" | "canceled" | null = "closed") => line(date, { op: "routine", task, result: r });
const routine = (id: string, extra: Record<string, unknown> = {}) => ({
	path: `routine/${id}.md`,
	frontmatter: { type: "routine", id, summary: `s${id}`, repeat: { every: "day" }, start: "2026-10-01", ...extra },
});
/** 月曜だけの週 1（2026-11-23 が月曜） */
const weekly = (id: string, extra: Record<string, unknown> = {}) => routine(id, { repeat: { every: "week", on: ["mon"] }, missed: "carry", ...extra });

function load(markdown: { path: string; frontmatter: Record<string, unknown> }[], boardLines: string[] = []) {
	return new TaskIndex(
		collectVault({
			markdown,
			worklogs: [],
			labels: null,
			parseYaml: parse,
			boardLogs: [{ path: "board/pc/2026-11.jsonl", text: boardLines.join("\n") }],
			statusLogs: [],
		}).data,
	);
}
const boardOf = (index: TaskIndex, date: string) => index.board(date)?.board ?? emptyBoard();
const from = (index: TaskIndex, id: string, date: string) => carriedFrom(index, index.routines.get(id)!, date, SINCE);

describe("missed の読み取り", () => {
	it("carry だけを読む。なしは null、知らない値は問題を出して null", () => {
		expect(parseRoutine("routine/r-1.md", { type: "routine", id: "r-1", repeat: { every: "day" }, missed: "carry" }).value?.missed).toBe("carry");
		expect(parseRoutine("routine/r-2.md", { type: "routine", id: "r-2", repeat: { every: "day" } }).value?.missed).toBeNull();
		const bad = parseRoutine("routine/r-3.md", { type: "routine", id: "r-3", repeat: { every: "day" }, missed: "later" });
		expect(bad.value?.missed).toBeNull();
		expect(bad.problems.map((p) => p.code)).toEqual(["invalid-missed"]);
	});
});

describe("持ち越しの判定", () => {
	it("予定日に結果がなければ、次の日から起点の日を付けて持ち越す", () => {
		const index = load([weekly("r-1")]);
		expect(from(index, "r-1", "2026-11-23")).toBeNull(); // 当日はまだ持ち越しではない
		expect(from(index, "r-1", "2026-11-24")).toBe("2026-11-23");
		expect(from(index, "r-1", "2026-11-26")).toBe("2026-11-23");
	});

	it("持ち越した日に結果を付けると（canceled も）、次の日からは出ない。結果を外すとまた持ち越す", () => {
		const closed = load([weekly("r-1")], [result("2026-11-24", "r-1")]);
		expect(from(closed, "r-1", "2026-11-24")).toBe("2026-11-23"); // その日の付記は残す
		expect(from(closed, "r-1", "2026-11-25")).toBeNull();
		const canceled = load([weekly("r-1")], [result("2026-11-24", "r-1", "canceled")]);
		expect(from(canceled, "r-1", "2026-11-25")).toBeNull();
		const reopened = load([weekly("r-1")], [result("2026-11-24", "r-1"), result("2026-11-24", "r-1", null)]);
		expect(from(reopened, "r-1", "2026-11-25")).toBe("2026-11-23");
	});

	it("何回分抜かしても 1 枚で、起点は一番古い日。後の日の結果で、それより前はすべて片付く", () => {
		const index = load([weekly("r-1", { start: "2026-11-01" })], [], );
		// 11/16 は数え始めの前。11/23 と 11/30 を抜かした
		expect(from(index, "r-1", "2026-12-01")).toBe("2026-11-23");
		const done = load([weekly("r-1")], [result("2026-11-30", "r-1")]);
		expect(from(done, "r-1", "2026-12-01")).toBeNull();
	});

	it("carry でない routine、一時停止した routine は持ち越さない", () => {
		const index = load([routine("r-1", { repeat: { every: "week", on: ["mon"] } }), weekly("r-2", { active: false })]);
		expect(from(index, "r-1", "2026-11-24")).toBeNull();
		expect(from(index, "r-2", "2026-11-24")).toBeNull();
	});

	it("end の前に片付いていない予定日は、end を過ぎても持ち越す", () => {
		const index = load([weekly("r-1", { end: "2026-11-23" })]);
		expect(from(index, "r-1", "2026-11-26")).toBe("2026-11-23");
	});
});

describe("ボードと積み残し", () => {
	it("予定日でない日にも、その日のボードに出す。予定と重なっても 1 枚", () => {
		const index = load([weekly("r-1"), routine("r-2", { missed: "carry" })]);
		expect(routinesOnDay(index, "2026-11-24").map((r) => r.id)).toContain("r-1");
		// r-2 は毎日。11/24 は予定日で、11/23 からの持ち越しもある
		const lanes = boardLanes(index, "2026-11-24", boardOf(index, "2026-11-24"));
		expect(lanes.routine.filter((c) => c.key === "r-2")).toHaveLength(1);
	});

	it("持ち越しのカードに起点の日を持たせ、欄の先に並べる", () => {
		const index = load([routine("r-1", { order: 1 }), weekly("r-2", { order: 2 })], [result("2026-11-23", "r-1")]);
		const cards = boardLanes(index, "2026-11-24", boardOf(index, "2026-11-24")).routine;
		expect(cards.map((c) => c.key)).toEqual(["r-2", "r-1"]);
		expect(cards.map((c) => (c.kind === "routine" ? c.carriedFrom : undefined))).toEqual(["2026-11-23", null]);
	});

	it("結果のない持ち越しは未完了に数える", () => {
		const index = load([weekly("r-1")]);
		expect(unfinished(index, "2026-11-24", boardOf(index, "2026-11-24")).routines.map((r) => r.id)).toEqual(["r-1"]);
	});

	it("Calendar の Missed には carry の routine を出さない", () => {
		const index = load([weekly("r-1"), routine("r-2", { repeat: { every: "week", on: ["mon"] } })]);
		expect(missedRoutines(index, "2026-11-24", SINCE).map((m) => m.routine.id)).toEqual(["r-2"]);
	});

	it("closing の routine は Closing の画面に持ち越す", () => {
		const index = load([weekly("r-1", { category: "closing" })]);
		expect(closingRoutines(index, "2026-11-24").map((r) => r.id)).toEqual(["r-1"]);
		expect(boardLanes(index, "2026-11-24", boardOf(index, "2026-11-24")).routine).toEqual([]);
	});

	it("Closing の Tasks の行にも起点の日を持たせる", () => {
		const index = load([weekly("r-1")]);
		const notDone = closingGroups(index, "2026-11-24", boardOf(index, "2026-11-24"))["not-done"];
		expect(notDone.map((i) => (i.kind === "routine" ? [i.key, i.carriedFrom] : null))).toEqual([["r-1", "2026-11-23"]]);
	});
});
