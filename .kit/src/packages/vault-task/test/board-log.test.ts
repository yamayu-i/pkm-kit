import { describe, expect, it } from "vitest";
import { boardLogPath, nextBoardAt, parseBoardLog, replayBoard, serializeBoardLogEntry, type BoardLogEntry, type BoardOp } from "../src/core/board-log";
import { emptyBoard } from "../src/core/board";
import { collectVault, fileKind } from "../src/core/load";
import { lintVault } from "../src/core/lint";

const date = "2026-11-01";
const initial = { issues: ["i-6", "i-8", "i-9"], groups: { "i-8": "午前" }, routines: {}, carried: [], closed: false };

/** 1 端末分のログを作る。分は at の分（並び順を決める） */
function log(device: string, ops: [number, BoardOp][]): BoardLogEntry[] {
	const text = ops.map(([min, op], i) => serializeBoardLogEntry({ id: `bo_${device}${i}`, at: `2026-11-01T00:${String(min).padStart(2, "0")}:00.000Z`, date, ...op })).join("\n");
	return parseBoardLog(boardLogPath(device, date), text).entries;
}

describe("操作ログの再生", () => {
	it("それぞれ issue を追加すると、両方載る", () => {
		const b = replayBoard(initial, [...log("pc", [[1, { op: "add", task: "i-20" }]]), ...log("phone", [[2, { op: "add", task: "i-21" }]])]);
		expect(b.issues).toEqual(["i-6", "i-8", "i-9", "i-20", "i-21"]);
	});
	it("それぞれ別の routine を完了すると、両方残る", () => {
		const b = replayBoard(emptyBoard(), [...log("pc", [[1, { op: "routine", task: "r-1", result: "closed" }]]), ...log("phone", [[2, { op: "routine", task: "r-2", result: "canceled" }]])]);
		expect(b.routines).toEqual({ "r-1": "closed", "r-2": "canceled" });
	});
	it("routine の完了と別の issue の持ち越しが両方残る", () => {
		const b = replayBoard(initial, [...log("pc", [[1, { op: "routine", task: "r-1", result: "closed" }]]), ...log("phone", [[2, { op: "carry", task: "i-9" }]])]);
		expect(b.routines).toEqual({ "r-1": "closed" });
		expect(b.carried).toEqual(["i-9"]);
	});
	it("隣のカードをそれぞれ移しても両方残り、同じカードは後の操作が勝つ", () => {
		const b = replayBoard(initial, [
			...log("pc", [[1, { op: "place", task: "i-6", group: "午後" }], [3, { op: "place", task: "i-8", group: "午後" }]]),
			...log("phone", [[2, { op: "place", task: "i-8", group: "夜" }]]),
		]);
		expect(b.groups).toEqual({ "i-6": "午後", "i-8": "午後" });
	});
	it("外すと持ち越しが重なっても、どの順でも carried は issues の中に収まる", () => {
		const remove: BoardOp = { op: "remove", task: "i-8" };
		const carry: BoardOp = { op: "carry", task: "i-8" };
		const removeFirst = replayBoard(initial, [...log("pc", [[1, remove]]), ...log("phone", [[2, carry]])]);
		const carryFirst = replayBoard(initial, [...log("pc", [[2, remove]]), ...log("phone", [[1, carry]])]);
		for (const b of [removeFirst, carryFirst]) {
			expect(b.issues).toEqual(["i-6", "i-9"]);
			expect(b.carried).toEqual([]);
			expect(b.groups).toEqual({});
		}
	});
	it("読み込みの順によらず同じ結果になる", () => {
		const a = log("pc", [[1, { op: "add", task: "i-20" }], [3, { op: "remove", task: "i-20" }]]);
		const b = log("phone", [[2, { op: "carry", task: "i-20" }], [4, { op: "add", task: "i-21" }]]);
		expect(replayBoard(emptyBoard(), [...a, ...b])).toEqual(replayBoard(emptyBoard(), [...b, ...a]));
	});
	it("同じ時刻は端末名 → 行番号の順に並ぶ", () => {
		const entries = [...log("phone", [[1, { op: "place", task: "i-6", group: "B" }]]), ...log("pc", [[1, { op: "place", task: "i-6", group: "A" }], [1, { op: "place", task: "i-6", group: "C" }]])];
		// pc < phone なので phone が最後
		expect(replayBoard(initial, entries).groups["i-6"]).toBe("B");
	});
	it("空のグループや null で未分類・結果なしに戻す", () => {
		const b = replayBoard(emptyBoard(), log("pc", [
			[1, { op: "place", task: "i-6", group: "午後" }],
			[2, { op: "place", task: "i-6", group: null }],
			[3, { op: "routine", task: "r-1", result: "closed" }],
			[4, { op: "routine", task: "r-1", result: null }],
		]));
		expect(b.groups).toEqual({});
		expect(b.routines).toEqual({});
	});
	it("add は持ち越しを外し、締めを解く。順番は変えない", () => {
		const b = replayBoard(initial, log("pc", [
			[1, { op: "carry", task: "i-8" }],
			[2, { op: "close", tasks: ["i-6", "i-8", "i-9"] }],
			[3, { op: "add", task: "i-8" }],
		]));
		expect(b.issues).toEqual(["i-6", "i-8", "i-9"]);
		expect(b.carried).toEqual([]);
		expect(b.closed).toBe(false);
	});
	it("close と reopen", () => {
		expect(replayBoard(initial, log("pc", [[1, { op: "close", tasks: initial.issues }]])).closed).toBe(true);
		expect(replayBoard(initial, log("pc", [[1, { op: "close", tasks: initial.issues }], [2, { op: "reopen" }]])).closed).toBe(false);
	});
	it("他の端末が締めた後に、未同期の issue が届くと締めが解ける", () => {
		const b = replayBoard(initial, [
			...log("pc", [[1, { op: "add", task: "i-20" }]]),
			...log("phone", [[2, { op: "close", tasks: initial.issues }]]),
		]);
		expect(b.issues).toContain("i-20");
		expect(b.closed).toBe(false);
	});
	it("初期状態を変更しない", () => {
		const start = structuredClone(initial);
		replayBoard(start, log("pc", [[1, { op: "remove", task: "i-8" }], [2, { op: "close", tasks: [] }]]));
		expect(start).toEqual(initial);
	});
});

describe("時刻", () => {
	it("時計が遅れていても、見えていた操作より後ろに並ぶ", () => {
		expect(nextBoardAt(1000, null)).toBe(1000);
		expect(nextBoardAt(1000, 500)).toBe(1000);
		expect(nextBoardAt(1000, 5000)).toBe(5001);
	});
});

describe("ログの読み書き", () => {
	it("端末別・ボードの月別のパス。端末ごとに別のファイルになる", () => {
		expect(boardLogPath("pc", date)).toBe("board/pc/2026-11.jsonl");
		expect(boardLogPath("phone", "2026-12-31")).toBe("board/phone/2026-12.jsonl");
		expect(boardLogPath("a/b", date)).toBe("board/a-b/2026-11.jsonl");
		expect(() => boardLogPath("", date)).toThrow();
		expect(fileKind("board/pc/2026-11.jsonl")).toBe("board");
		expect(fileKind("board/pc/2026-11 (conflict x).jsonl")).toBeNull();
	});
	it("書いた行を読み戻せる", () => {
		const ops: BoardOp[] = [
			{ op: "add", task: "i-1" }, { op: "remove", task: "i-1" }, { op: "place", task: "i-1", group: "午前/集中" }, { op: "place", task: "i-1", group: null },
			{ op: "routine", task: "r-1", result: "closed" }, { op: "routine", task: "r-1", result: null }, { op: "carry", task: "i-1" }, { op: "close", tasks: ["i-1"] }, { op: "reopen" },
		];
		const text = ops.map((op, i) => serializeBoardLogEntry({ id: `bo_${i}`, at: "2026-11-01T00:00:00.000Z", date, ...op })).join("\n");
		const { entries, problems } = parseBoardLog("board/pc/2026-11.jsonl", text);
		expect(problems).toEqual([]);
		expect(entries.map((e) => e.op)).toEqual(ops);
	});
	it.each([
		["JSON ではない", "{"],
		["オブジェクトではない", "[]"],
		["id がない", '{"at":"2026-11-01T00:00:00.000Z","date":"2026-11-01","op":"reopen"}'],
		["at が不正", '{"id":"a","at":"x","date":"2026-11-01","op":"reopen"}'],
		["date が不正", '{"id":"a","at":"2026-11-01T00:00:00.000Z","date":"11/01","op":"reopen"}'],
		["未知の op", '{"id":"a","at":"2026-11-01T00:00:00.000Z","date":"2026-11-01","op":"zap"}'],
		["task がない", '{"id":"a","at":"2026-11-01T00:00:00.000Z","date":"2026-11-01","op":"add"}'],
		["result が不正", '{"id":"a","at":"2026-11-01T00:00:00.000Z","date":"2026-11-01","op":"routine","task":"r-1","result":"done"}'],
		["tasks が不正", '{"id":"a","at":"2026-11-01T00:00:00.000Z","date":"2026-11-01","op":"close","tasks":[1]}'],
	])("読めない行は報告し、その行だけ飛ばす: %s", (_name, bad) => {
		const good = serializeBoardLogEntry({ id: "ok", at: "2026-11-01T00:00:00.000Z", date, op: "add", task: "i-1" });
		const { entries, problems } = parseBoardLog("board/pc/2026-11.jsonl", `${bad}\n${good}\n`);
		expect(entries.map((e) => e.id)).toEqual(["ok"]);
		expect(problems).toHaveLength(1);
		expect(problems[0]!.message).toContain("1 行目");
	});
});

describe("Vault からの読み込み", () => {
	const line = (at: string, d: string, op: BoardOp) => serializeBoardLogEntry({ id: "x", at, date: d, ...op });

	it("既存の frontmatter の board の上にログを重ねる", () => {
		const { data, problems } = collectVault({
			markdown: [
				{ path: "daily/2026/10/2026-10-31.md", frontmatter: { board: { issues: ["i-1"], closed: true } } },
				{ path: "daily/2026/11/2026-11-01.md", frontmatter: { board: { issues: ["i-2"] } } },
				{ path: "daily/2026/11/2026-11-03.md", frontmatter: { type: "daily" } },
			],
			worklogs: [],
			labels: null,
			boardLogs: [{ path: "board/pc/2026-11.jsonl", text: `${line("2026-11-01T00:00:00.000Z", "2026-11-01", { op: "add", task: "i-3" })}\n${line("2026-11-02T00:00:00.000Z", "2026-11-02", { op: "add", task: "i-4" })}\nbroken\n` }],
		});
		expect(data.boards.map((b) => [b.date, b.path, b.board.issues, b.board.closed])).toEqual([
			["2026-10-31", "daily/2026/10/2026-10-31.md", ["i-1"], true],
			["2026-11-01", "daily/2026/11/2026-11-01.md", ["i-2", "i-3"], false],
			["2026-11-02", "daily/2026/11/2026-11-02.md", ["i-4"], false],
		]);
		expect(data.boards[1]!.latestAt).toBe(Date.parse("2026-11-01T00:00:00.000Z"));
		expect(data.boards[0]!.latestAt).toBeUndefined();
		expect(problems.map((p) => p.path)).toEqual(["board/pc/2026-11.jsonl"]);
	});
	it("ログのボードにも lint の dangling-board-issue が効く", () => {
		const { data } = collectVault({
			markdown: [],
			worklogs: [],
			labels: null,
			boardLogs: [{ path: "board/pc/2026-11.jsonl", text: line("2026-11-01T00:00:00.000Z", "2026-11-01", { op: "add", task: "i-9" }) }],
		});
		expect(lintVault(data).map((p) => p.code)).toContain("dangling-board-issue");
	});
});
