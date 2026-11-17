import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { boardLanes } from "../src/core/board-lanes";
import { serializeBoardLogEntry, type BoardOp } from "../src/core/board-log";
import { closingGroups, closingNotes, closingRoutines, isClosingNote, localDateOf } from "../src/core/closing";
import { TaskIndex } from "../src/core/index";
import { collectVault } from "../src/core/load";
import { DEFAULT_REVIEW_TEMPLATE, insertReviewTemplate, snippetBody } from "../src/core/review-template";
import { missedRoutines, moveRoutine, routineGroups } from "../src/core/routine-order";
import { parseRoutine } from "../src/core/schema";

/** ADR-0206: Closing の画面、routine の category・並び・積み残し、振り返りの型 */

const DATE = "2026-11-20";
let seq = 0;
const line = (date: string, op: BoardOp) => serializeBoardLogEntry({ id: `bo_${++seq}`, at: `${date}T00:00:00.${String(seq).padStart(3, "0")}Z`, date, ...op });
const routine = (id: string, extra: Record<string, unknown> = {}) => ({
	path: `routine/${id}.md`,
	frontmatter: { type: "routine", id, summary: `s${id}`, repeat: { every: "day" }, start: "2026-10-01", ...extra },
});
const issue = (id: string, status = "open") => ({ path: `issue/${id}.md`, frontmatter: { type: "issue", id, summary: `s${id}`, status } });

function load(markdown: { path: string; frontmatter: Record<string, unknown> }[], boardLines: string[] = [], statusLines: string[] = [], worklogs: string[] = []) {
	return new TaskIndex(
		collectVault({
			markdown,
			worklogs: [{ path: "worklog/pc/2026-11.jsonl", text: worklogs.join("\n") }],
			labels: null,
			parseYaml: parse,
			boardLogs: [{ path: "board/pc/2026-11.jsonl", text: boardLines.join("\n") }],
			statusLogs: [{ path: "statuslog/pc/2026-11.jsonl", text: statusLines.join("\n") }],
		}).data,
	);
}

describe("routine の category と order", () => {
	it("category は closing だけ。なしは null（default）", () => {
		const r = parseRoutine("routine/r-1.md", { type: "routine", id: "r-1", repeat: { every: "day" }, category: "closing", order: 2 });
		expect(r.problems).toEqual([]);
		expect(r.value).toMatchObject({ category: "closing", order: 2 });
		expect(parseRoutine("routine/r-2.md", { type: "routine", id: "r-2", repeat: { every: "day" } }).value).toMatchObject({ category: null, order: null });
	});

	it("default は予約語、知らない値と数でない order は問題を出して読まない", () => {
		const reserved = parseRoutine("routine/r-1.md", { type: "routine", id: "r-1", repeat: { every: "day" }, category: "default" });
		expect(reserved.value?.category).toBeNull();
		expect(reserved.problems.map((p) => p.code)).toEqual(["reserved-category"]);
		const unknown = parseRoutine("routine/r-2.md", { type: "routine", id: "r-2", repeat: { every: "day" }, category: "morning", order: "x" });
		expect(unknown.value).toMatchObject({ category: null, order: null });
		expect(unknown.problems.map((p) => p.code)).toEqual(["invalid-category", "invalid-field"]);
	});

	it("群は default → closing。群の中は order の順、ないものは後ろに ID の順", () => {
		const index = load([routine("r-1"), routine("r-2", { order: 2 }), routine("r-3", { order: 1 }), routine("r-10"), routine("r-4", { category: "closing" })]);
		const groups = routineGroups(index.routines.values()).map((g) => [g.category, g.routines.map((r) => r.id)]);
		expect(groups).toEqual([
			[null, ["r-3", "r-2", "r-1", "r-10"]],
			["closing", ["r-4"]],
		]);
	});

	it("ドラッグ: 落とした群の order を 1 から振り直し、動かしたものは category も書く", () => {
		const index = load([routine("r-1", { order: 1 }), routine("r-2", { order: 2 }), routine("r-3", { category: "closing", order: 1 })]);
		// r-2 を closing の r-3 の前へ
		expect(moveRoutine(index.routines.values(), "r-2", "closing", "r-3")).toEqual([
			{ path: "routine/r-2.md", order: 1, category: "closing" },
			{ path: "routine/r-3.md", order: 2 },
		]);
		// 同じ群の中で r-1 を末尾へ
		expect(moveRoutine(index.routines.values(), "r-1", null, null)).toEqual([
			{ path: "routine/r-2.md", order: 1 },
			{ path: "routine/r-1.md", order: 2 },
		]);
		// closing から default へ（category を null に）
		expect(moveRoutine(index.routines.values(), "r-3", null, "r-1")).toEqual([
			{ path: "routine/r-3.md", category: null },
			{ path: "routine/r-1.md", order: 2 },
			{ path: "routine/r-2.md", order: 3 },
		]);
	});

	it("ボードの routine の欄は default だけを並び順で出す。closing は Closing の画面", () => {
		const index = load([routine("r-1", { order: 2 }), routine("r-2", { order: 1 }), routine("r-3", { category: "closing" })]);
		const board = index.board(DATE)?.board ?? { issues: [], stars: [], routines: {}, carried: [], closed: false };
		expect(boardLanes(index, DATE, board).routine.map((c) => c.key)).toEqual(["r-2", "r-1"]);
		expect(closingRoutines(index, DATE).map((r) => r.id)).toEqual(["r-3"]);
	});
});

describe("routine の積み残し", () => {
	it("予定日を過ぎて結果のない日を、日付の古い順・同じ日は並び順で出す。今日と結果のある日は出さない", () => {
		const index = load(
			[routine("r-1", { order: 2 }), routine("r-2", { order: 1, repeat: { every: "week", on: ["wed"] } })],
			[line("2026-11-17", { op: "routine", task: "r-1", result: "closed" }), line("2026-11-18", { op: "routine", task: "r-1", result: "canceled" })],
		);
		const missed = missedRoutines(index, DATE, "2026-11-17");
		expect(missed.map((m) => `${m.date} ${m.routine.id}`)).toEqual(["2026-11-18 r-2", "2026-11-19 r-1"]);
	});

	it("数え始めは start と導入日の遅いほう。一時停止と end の後は数えない", () => {
		const index = load([routine("r-1", { start: "2026-11-19" }), routine("r-2", { active: false }), routine("r-3", { end: "2026-11-18" })]);
		expect(missedRoutines(index, DATE, "2026-11-17").map((m) => `${m.date} ${m.routine.id}`)).toEqual(["2026-11-17 r-3", "2026-11-18 r-3", "2026-11-19 r-1"]);
	});
});

describe("Closing の群", () => {
	it("ボードのものとその日に閉じたもの、closing 以外の routine を、status で群に分ける", () => {
		const at = new Date(2026, 10, 20, 15).toISOString();
		const index = load(
			[issue("i-1"), issue("i-2", "closed"), issue("i-3", "waiting"), issue("i-4", "canceled"), issue("i-5", "closed"), issue("i-6", "closed"), routine("r-1"), routine("r-2"), routine("r-3", { category: "closing" })],
			[
				line(DATE, { op: "add", task: "i-1" }),
				line(DATE, { op: "add", task: "i-2" }),
				line(DATE, { op: "add", task: "i-3" }),
				line(DATE, { op: "add", task: "i-4" }),
				line(DATE, { op: "routine", task: "r-1", result: "closed" }),
			],
			[JSON.stringify({ id: "st_1", at, task: "i-5", from: "open", to: "closed", via: "ui" })],
			[JSON.stringify({ id: "w1", task_id: "i-1", from: new Date(2026, 10, 20, 9).toISOString(), to: new Date(2026, 10, 20, 9, 45).toISOString(), description: "" })],
		);
		const groups = closingGroups(index, DATE, index.board(DATE)!.board);
		const keys = Object.fromEntries(Object.entries(groups).map(([g, items]) => [g, items.map((i) => i.key)]));
		expect(keys).toEqual({ closed: ["i-2", "i-5", "r-1"], "not-done": ["i-1", "r-2"], waiting: ["i-3"], canceled: ["i-4"] });
		expect(groups["not-done"][0]!.minutes).toBe(45);
	});

	it("ノート: タスク管理のデータ・tmp・template・隠しパスを除き、その日に変えたものを新しい順。作った日なら created", () => {
		const day = (h: number) => new Date(2026, 10, 20, h).getTime();
		expect(isClosingNote("daily/2026/11/2026-11-20.md")).toBe(false);
		expect(isClosingNote(".kit/a.md")).toBe(false);
		expect(isClosingNote("wiki/a.md")).toBe(true);
		const notes = closingNotes(
			[
				{ path: "a.md", mtime: day(9), created: new Date(2026, 10, 20, 8).toISOString(), title: "a" },
				{ path: "b.md", mtime: day(18), created: "2026-10-01T00:00:00+09:00", title: "b" },
				{ path: "c.md", mtime: day(-24), created: null, title: "c" },
				{ path: "issue/i-1.md", mtime: day(10), created: null, title: "i" },
			],
			DATE,
		);
		expect(notes.map((n) => [n.note.path, n.created])).toEqual([
			["b.md", false],
			["a.md", true],
		]);
		expect(localDateOf(day(23))).toBe(DATE);
	});
});

describe("振り返りの型", () => {
	const template = snippetBody("---\nname: daily-review\nalias: dr\n---\n## 日次振り返り\n\n### Keep\n- \n\n---\n");

	it("スニペットの frontmatter を除いた本文を、frontmatter の直後に入れる。既にある本文は変えない", () => {
		expect(template).toBe("## 日次振り返り\n\n### Keep\n- \n\n---\n");
		const text = "---\ntype: daily\n---\n\nメモ\n\n## Task board\n";
		expect(insertReviewTemplate(text, template)).toBe("---\ntype: daily\n---\n## 日次振り返り\n\n### Keep\n- \n\n---\n\nメモ\n\n## Task board\n");
	});

	it("見出しがすでにあれば入れない。本文が空でも、frontmatter がなくても入れる", () => {
		const once = insertReviewTemplate("---\ntype: daily\n---\n", template);
		expect(once).toBe(`---\ntype: daily\n---\n${template}`);
		expect(insertReviewTemplate(once, template)).toBe(once);
		expect(insertReviewTemplate("メモ\n", template)).toBe(`${template}\nメモ\n`);
	});

	it("既定の型は上流のスニペットと同じ", async () => {
		const { readFileSync } = await import("node:fs");
		const text = readFileSync(new URL("../../../../templates/snippet/daily-review.md", import.meta.url), "utf8");
		expect(snippetBody(text)).toBe(DEFAULT_REVIEW_TEMPLATE);
	});
});
