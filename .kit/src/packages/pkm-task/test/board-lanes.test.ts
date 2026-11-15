import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { unfinished } from "../src/core/board";
import { parseBoardLog, serializeBoardLogEntry, type BoardOp } from "../src/core/board-log";
import { boardLanes, canStar, showRoutineLane, cardRuns, moveOps, stepOps, type BoardLanes } from "../src/core/board-lanes";
import { closeBoardNote } from "../src/core/board-note";
import { TaskIndex } from "../src/core/index";
import { lintVault } from "../src/core/lint";
import { collectVault, fileKind } from "../src/core/load";
import { boardSummary } from "../src/core/summary";

/** ADR-0137: status とタイマーで決まる欄、★、1 つの並び、サブのカード */

const DATE = "2026-11-16";
let seq = 0;
const line = (date: string, op: BoardOp, at = `2026-11-16T00:00:${String(seq++ % 60).padStart(2, "0")}.${String(seq).padStart(3, "0")}Z`) =>
	serializeBoardLogEntry({ id: `bo_${seq}`, at, date, ...op });

function issue(id: string, status = "open", extra: Record<string, unknown> = {}, subs = "") {
	const fm = { type: "issue", id, summary: `s${id}`, status, ...extra };
	const text = `---\n${JSON.stringify(fm)}\n---\n\n## Note\n\n${subs}`;
	return { path: `issue/${id}.md`, frontmatter: fm, text };
}
const sub = (id: string, summary: string, status = "open", scheduled: string[] = []) =>
	`<!-- sub-issue\nid: ${id}\nsummary: ${summary}\nstatus: ${status}\n${scheduled.length ? `scheduled: [${scheduled.join(", ")}]\n` : ""}-->\n\n`;
const routine = (id: string) => ({ path: `routine/${id}.md`, frontmatter: { type: "routine", id, name: `s${id}`, repeat: { every: "day" }, start: "2026-10-01" } });

function load(markdown: ReturnType<typeof issue>[] | { path: string; frontmatter: Record<string, unknown>; text?: string }[], lines: string[], worklog = "") {
	const { data, problems } = collectVault({
		markdown,
		worklogs: worklog ? [{ path: "worklog/pc/2026-11.jsonl", text: worklog }] : [],
		labels: null,
		boardLogs: [{ path: "board/pc/2026-11.jsonl", text: lines.join("\n") }],
		parseYaml: parse,
	});
	return { index: new TaskIndex(data), problems };
}
const keys = (lanes: BoardLanes) => Object.fromEntries(Object.entries(lanes).map(([k, v]) => [k, v.map((c) => c.key)]));
const lanesOf = (index: TaskIndex, date = DATE) => boardLanes(index, date, index.board(date)!.board);

describe("操作ログの star と order（ADR-0137）", () => {
	it("star と group のない order を読む", () => {
		const text = [line(DATE, { op: "star", task: "i-1#aaaaaa", on: true }), line(DATE, { op: "order", tasks: ["i-2", "i-1#aaaaaa"] })].join("\n");
		const r = parseBoardLog("board/pc/2026-11.jsonl", text);
		expect(r.problems).toEqual([]);
		expect(r.entries.map((e) => e.op)).toEqual([
			{ op: "star", task: "i-1#aaaaaa", on: true },
			{ op: "order", tasks: ["i-2", "i-1#aaaaaa"] },
		]);
	});

	it("以前の place と group 付きの order は、問題にせずに捨てる", () => {
		const text = [
			JSON.stringify({ id: "bo_1", at: "2026-11-09T00:00:00.000Z", date: "2026-11-09", op: "place", task: "i-1", group: "午前" }),
			JSON.stringify({ id: "bo_2", at: "2026-11-09T00:00:00.000Z", date: "2026-11-09", op: "order", group: "午前", tasks: ["i-1"] }),
			JSON.stringify({ id: "bo_3", at: "2026-11-09T00:00:00.000Z", date: "2026-11-09", op: "order", group: null, tasks: ["i-1"] }),
		].join("\n");
		const r = parseBoardLog("board/pc/2026-11.jsonl", text);
		expect(r.problems).toEqual([]);
		expect(r.entries).toEqual([]);
	});

	it("on が真偽値でない star は問題にする", () => {
		const bad = JSON.stringify({ id: "bo_1", at: "2026-11-09T00:00:00.000Z", date: "2026-11-09", op: "star", task: "i-1", on: "yes" });
		expect(parseBoardLog("board/pc/2026-11.jsonl", bad).problems.map((p) => p.code)).toEqual(["invalid-board-log"]);
	});

	it("★ はその日だけ。外すと消え、ボードから外しても消える", () => {
		const { index } = load(
			[issue("i-1"), issue("i-2"), issue("i-3")],
			[
				line(DATE, { op: "add", task: "i-1" }),
				line(DATE, { op: "add", task: "i-2" }),
				line(DATE, { op: "add", task: "i-3" }),
				line(DATE, { op: "star", task: "i-1", on: true }),
				line(DATE, { op: "star", task: "i-2", on: true }),
				line(DATE, { op: "star", task: "i-3", on: true }),
				line(DATE, { op: "star", task: "i-2", on: false }),
				line(DATE, { op: "remove", task: "i-3" }),
				line("2026-11-17", { op: "add", task: "i-1" }),
			],
		);
		expect(index.board(DATE)!.board.stars).toEqual(["i-1"]);
		expect(index.board("2026-11-17")!.board.stars).toEqual([]);
	});
});

describe("欄（ADR-0137）", () => {
	const md = [
		issue("i-1"),
		issue("i-2", "in-progress"),
		issue("i-3", "waiting"),
		issue("i-4", "delegated", { delegated_to: "m-1" }),
		issue("i-5", "closed"),
		issue("i-6"),
		issue("i-7", "someday"),
		issue("i-8"),
		issue("i-9"),
		routine("r-1"),
		routine("r-2"),
	];
	const base = ["i-1", "i-2", "i-3", "i-4", "i-5", "i-6", "i-7"].map((task) => line(DATE, { op: "add", task }));

	it("作業中はタイマーだけで決まり、in-progress は次にやる順に入る。待ち・片付いたも status で決まる", () => {
		const worklog = '{"id":"wl_1","task_id":"i-6","from":"2026-11-16T01:00:00Z","to":null,"description":""}\n';
		const { index } = load(md, [...base, line(DATE, { op: "carry", task: "i-1" }), line(DATE, { op: "routine", task: "r-2", result: "closed" })], worklog);
		expect(keys(lanesOf(index))).toEqual({
			working: ["i-6"],
			top: [],
			routine: ["r-1", "r-2"],
			next: ["i-2"],
			waiting: ["i-3", "i-4"],
			done: ["i-1", "i-5", "i-7"],
		});
	});

	it("★ を付けたまま waiting なら待ち・委任に出る。open なら ★ の欄", () => {
		const { index } = load(md, [...base, line(DATE, { op: "star", task: "i-3", on: true }), line(DATE, { op: "star", task: "i-1", on: true })]);
		const lanes = lanesOf(index);
		expect(keys(lanes).top).toEqual(["i-1"]);
		expect(keys(lanes).waiting).toEqual(["i-3", "i-4"]);
	});

	it("並びは 1 つで、★・次にやる順・待ちのそれぞれの中の順になる。並びにないものは載せた順で末尾", () => {
		const { index } = load(md, [...base, line(DATE, { op: "star", task: "i-6", on: true }), line(DATE, { op: "order", tasks: ["i-2", "i-4", "i-6", "i-3"] })]);
		expect(keys(lanesOf(index))).toMatchObject({ top: ["i-6"], next: ["i-2", "i-1"], waiting: ["i-4", "i-3"], routine: ["r-1", "r-2"] });
	});

	it("並びは翌日以降にも引き継ぐ", () => {
		const { index } = load(md, [...base, line("2026-11-15", { op: "order", tasks: ["i-2", "i-1"] }), line("2026-11-17", { op: "add", task: "i-1" })]);
		expect(index.order("2026-11-17")).toEqual(["i-2", "i-1"]);
		expect(index.order("2026-11-14")).toBeUndefined();
	});

	it("★ は 4 件まで。2 台が同時に付けて 5 件になったら全部出す", () => {
		const stars = ["i-1", "i-2", "i-6", "i-8", "i-9"].map((task) => line(DATE, { op: "star", task, on: true }));
		const more = ["i-8", "i-9"].map((task) => line(DATE, { op: "add", task }));
		const { index } = load(md, [...base, ...more, ...stars.slice(0, 2)]);
		expect(canStar(lanesOf(index))).toBe(true);
		const four = load(md, [...base, ...more, ...stars.slice(0, 4)]).index;
		expect(canStar(lanesOf(four))).toBe(false);
		const five = load(md, [...base, ...more, ...stars]).index;
		expect(keys(lanesOf(five)).top).toEqual(["i-1", "i-2", "i-6", "i-8", "i-9"]);
	});

	it("routine は★・作業中でも routine の欄に入り、すべて結果が付いたら欄を隠す", () => {
		const worklog = '{"id":"wl_1","task_id":"r-1","from":"2026-11-16T01:00:00Z","to":null,"description":""}\n';
		const star = line(DATE, { op: "star", task: "r-1", on: true });
		const one = load(md, [...base, star, line(DATE, { op: "routine", task: "r-2", result: "closed" })], worklog);
		const lanes = lanesOf(one.index);
		expect(keys(lanes).routine).toEqual(["r-1", "r-2"]);
		expect(keys(lanes).working).toEqual([]);
		const board = one.index.board(DATE)!.board;
		expect(showRoutineLane(board, lanes)).toBe(true);
		const all = load(md, [...base, line(DATE, { op: "routine", task: "r-1", result: "closed" }), line(DATE, { op: "routine", task: "r-2", result: "canceled" })]);
		expect(showRoutineLane(all.index.board(DATE)!.board, lanesOf(all.index))).toBe(false);
	});
});

describe("並べ替えと ★ の操作（ADR-0137）", () => {
	const md = [issue("i-1"), issue("i-2"), issue("i-3"), issue("i-4", "waiting")];
	const base = ["i-1", "i-2", "i-3", "i-4"].map((task) => line(DATE, { op: "add", task }));

	it("★ の欄に落とすと ★ を付け、並びではその欄の末尾（次にやる順の先頭の前）に入る", () => {
		const { index } = load(md, [...base, line(DATE, { op: "star", task: "i-1", on: true })]);
		const lanes = lanesOf(index);
		expect(moveOps(lanes, index.board(DATE)!.board, "i-3", "top", null, index.order(DATE))).toEqual([
			{ op: "star", task: "i-3", on: true },
			{ op: "order", tasks: ["i-1", "i-3", "i-2", "i-4"] },
		]);
	});

	it("★ の欄から次にやる順に出すと ★ を外す。カードの上に落とすとその前に入る", () => {
		const { index } = load(md, [...base, line(DATE, { op: "star", task: "i-1", on: true })]);
		expect(moveOps(lanesOf(index), index.board(DATE)!.board, "i-1", "next", "i-3", index.order(DATE))).toEqual([
			{ op: "star", task: "i-1", on: false },
			{ op: "order", tasks: ["i-2", "i-1", "i-3", "i-4"] },
		]);
	});

	it("今日は出ていないものの位置を並びに残す（ADR-0114）", () => {
		const { index } = load(md, [...base, line("2026-11-15", { op: "order", tasks: ["i-9", "i-3", "i-1", "i-2"] })]);
		const ops = moveOps(lanesOf(index), index.board(DATE)!.board, "i-2", "next", "i-3", index.order(DATE));
		expect(ops).toEqual([{ op: "order", tasks: ["i-9", "i-2", "i-3", "i-1", "i-4"] }]);
	});

	it("Move up / Move down は同じ欄の中だけ。端では動かせない", () => {
		const { index } = load(md, base);
		const lanes = lanesOf(index);
		const board = index.board(DATE)!.board;
		expect(stepOps(lanes, board, "i-2", -1, undefined)).toEqual([{ op: "order", tasks: ["i-2", "i-1", "i-3", "i-4"] }]);
		expect(stepOps(lanes, board, "i-2", 1, undefined)).toEqual([{ op: "order", tasks: ["i-1", "i-3", "i-2", "i-4"] }]);
		expect(stepOps(lanes, board, "i-1", -1, undefined)).toBeNull();
		expect(stepOps(lanes, board, "i-3", 1, undefined)).toBeNull();
		expect(stepOps(lanes, board, "i-4", 1, undefined)).toBeNull();
	});
});

describe("サブのカード（ADR-0137）", () => {
	const parent = issue("i-1", "open", {}, sub("aaaaaa", "仕様", "open", [DATE]) + sub("bbbbbb", "実装", "open", [DATE]) + sub("cccccc", "試験", "closed", [DATE]));
	const other = issue("i-2", "open", { scheduled: [DATE] });

	it("今日が scheduled の active なサブを自動で載せる。その日に外したものは載せない。親は自分の scheduled がなければ載らない", () => {
		const { index } = load([parent, other], [line(DATE, { op: "add", task: "i-1#bbbbbb" }), line(DATE, { op: "remove", task: "i-1#bbbbbb" })]);
		expect(index.toAutoAdd(DATE)).toEqual(["i-2", "i-1#aaaaaa"]);
	});

	it("隣り合った同じ親のサブはまとまり、間に別のカードが入ると分かれる", () => {
		const { index } = load(
			[parent, other],
			["i-1#aaaaaa", "i-1#bbbbbb", "i-2", "i-1#cccccc"].map((task) => line(DATE, { op: "add", task })).concat(line(DATE, { op: "order", tasks: ["i-1#aaaaaa", "i-1#bbbbbb", "i-2"] })),
		);
		const runs = cardRuns(lanesOf(index).next);
		expect(runs.map((r) => [r.parent, r.cards.map((c) => c.key)])).toEqual([
			["i-1", ["i-1#aaaaaa", "i-1#bbbbbb"]],
			[null, ["i-2"]],
		]);
		const split = load([parent, other], [...["i-1#aaaaaa", "i-2", "i-1#bbbbbb"].map((task) => line(DATE, { op: "add", task }))]).index;
		expect(cardRuns(lanesOf(split).next).map((r) => r.parent)).toEqual(["i-1", null, "i-1"]);
	});

	it("サブが消えたカードは出さず、未完了に数えず、締めを止めない", () => {
		const { index } = load([parent], [line(DATE, { op: "add", task: "i-1#zzzzzz" }), line(DATE, { op: "add", task: "i-1#cccccc" })]);
		const board = index.board(DATE)!.board;
		expect(keys(lanesOf(index)).done).toEqual(["i-1#cccccc"]);
		expect(unfinished(index, DATE, board)).toMatchObject({ issues: [], subs: [] });
		expect(() => closeBoardNote("", DATE, index, board)).not.toThrow();
	});

	it("未完了にサブを数える。要約ではサブを `i-12 › 題` で書く", () => {
		const { index } = load([parent], [line(DATE, { op: "add", task: "i-1#aaaaaa" }), line(DATE, { op: "add", task: "i-1#cccccc" })]);
		const board = index.board(DATE)!.board;
		expect(unfinished(index, DATE, board).subs.map((s) => s.key)).toEqual(["i-1#aaaaaa"]);
		expect(() => closeBoardNote("", DATE, index, board)).toThrow();
		const summary = boardSummary(index, DATE, board);
		expect(summary).toContain("- [i-1 › 試験](issue/i-1.md)");
		expect(summary).toContain("- [i-1 › 仕様](issue/i-1.md)（open）");
	});

	it("移行したサブの以前の ID を指すボードの記録は、そのサブの合成キーとして読む", () => {
		const migrated = issue("i-1", "open", {}, "<!-- sub-issue\nid: aaaaaa\nsummary: 元の子\nstatus: open\nmigrated_from: i-9\n-->\n");
		const { index } = load([migrated], [line(DATE, { op: "add", task: "i-9" }), line(DATE, { op: "star", task: "i-9", on: true })]);
		expect(index.board(DATE)!.board.issues).toEqual(["i-1#aaaaaa"]);
		expect(keys(lanesOf(index)).top).toEqual(["i-1#aaaaaa"]);
	});

	it("lint: ボードの合成キーが指すサブがなければ warning", () => {
		const { index } = load([parent], [line(DATE, { op: "add", task: "i-1#zzzzzz" }), line(DATE, { op: "add", task: "i-1#aaaaaa" })]);
		const codes = lintVault(index.data).filter((p) => p.code === "dangling-board-issue");
		expect(codes.map((p) => p.message)).toEqual(["ボードに載っている i-1#zzzzzz がありません"]);
	});
});

describe("グループの廃止（ADR-0137）", () => {
	it("routine に group が残っていれば warning を出す（routine はそのまま読める）", () => {
		const r = { path: "routine/r-1.md", frontmatter: { type: "routine", id: "r-1", name: "朝", repeat: { every: "day" }, start: "2026-10-01", group: "午前" } };
		const { index, problems } = load([r], []);
		expect(problems.map((p) => [p.severity, p.code, p.path])).toEqual([["warning", "legacy-routine-group", "routine/r-1.md"]]);
		expect(problems[0]!.message).toContain("node .kit/migrate.mjs");
		expect(index.routines.get("r-1")).toBeDefined();
	});

	it("issue/board-groups.json はタスク管理のファイルとして読まない", () => {
		expect(fileKind("issue/board-groups.json")).toBeNull();
	});
});
