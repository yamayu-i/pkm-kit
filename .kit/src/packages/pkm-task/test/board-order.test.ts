import { describe, expect, it } from "vitest";
import { nextOrder, reorder, sortByOrder } from "../src/core/board";
import { parseBoardLog, serializeBoardLogEntry, type BoardOp } from "../src/core/board-log";
import { TaskIndex } from "../src/core/index";
import { collectVault } from "../src/core/load";

/** ADR-0114: グループの中でカードを手で並べ替える */

const line = (at: string, date: string, op: BoardOp) => serializeBoardLogEntry({ id: `bo_${at}`, at, date, ...op });

function load(lines: string[], path = "board/pc/2026-11.jsonl") {
	const { data, problems } = collectVault({ markdown: [], worklogs: [], labels: null, groups: "[]", boardLogs: [{ path, text: lines.join("\n") }] });
	return { index: new TaskIndex(data), problems };
}

describe("order の読み取り", () => {
	it("group と tasks を読む。group が null なら未分類", () => {
		const text = [
			line("2026-11-09T00:00:00.000Z", "2026-11-09", { op: "order", group: "午前/集中", tasks: ["i-3", "r-1"] }),
			line("2026-11-09T00:00:01.000Z", "2026-11-09", { op: "order", group: null, tasks: [] }),
		].join("\n");
		const r = parseBoardLog("board/pc/2026-11.jsonl", text);
		expect(r.problems).toEqual([]);
		expect(r.entries.map((e) => e.op)).toEqual([
			{ op: "order", group: "午前/集中", tasks: ["i-3", "r-1"] },
			{ op: "order", group: null, tasks: [] },
		]);
	});

	it("tasks が文字列の配列でないもの、group が空文字のものは問題にする", () => {
		const bad = [
			JSON.stringify({ id: "bo_1", at: "2026-11-09T00:00:00.000Z", date: "2026-11-09", op: "order", group: "午前", tasks: [1] }),
			JSON.stringify({ id: "bo_2", at: "2026-11-09T00:00:00.000Z", date: "2026-11-09", op: "order", group: "", tasks: ["i-1"] }),
			JSON.stringify({ id: "bo_3", at: "2026-11-09T00:00:00.000Z", date: "2026-11-09", op: "order", group: "午前" }),
		].join("\n");
		expect(parseBoardLog("board/pc/2026-11.jsonl", bad).problems.map((p) => p.code)).toEqual(["invalid-board-log", "invalid-board-log", "invalid-board-log"]);
	});
});

describe("並びの決め方", () => {
	it("その日までの、そのグループの最後の並び。翌日以降にも引き継ぐ", () => {
		const { index } = load([
			line("2026-11-08T00:00:00.000Z", "2026-11-08", { op: "order", group: "午前", tasks: ["i-1", "i-2"] }),
			line("2026-11-08T01:00:00.000Z", "2026-11-08", { op: "order", group: "午前", tasks: ["i-2", "i-1"] }),
			line("2026-11-08T01:00:00.000Z", "2026-11-08", { op: "order", group: null, tasks: ["i-9"] }),
		]);
		expect(index.order("2026-11-08", "午前")).toEqual(["i-2", "i-1"]);
		expect(index.order("2026-11-10", "午前")).toEqual(["i-2", "i-1"]);
		expect(index.order("2026-11-08", "")).toEqual(["i-9"]);
		expect(index.order("2026-11-07", "午前")).toBeUndefined();
		expect(index.order("2026-11-08", "午後")).toBeUndefined();
	});

	it("後の日付のボードの並びは、前の日付のボードには効かない。並べる順はボードの日付 → 時刻", () => {
		const { index } = load([
			line("2026-11-09T00:00:00.000Z", "2026-11-09", { op: "order", group: "午前", tasks: ["i-2", "i-1"] }),
			// 後から前の日のボードを並べ替えても、次の日のボードの並びが勝つ
			line("2026-11-09T05:00:00.000Z", "2026-11-08", { op: "order", group: "午前", tasks: ["i-1", "i-2"] }),
		]);
		expect(index.order("2026-11-08", "午前")).toEqual(["i-1", "i-2"]);
		expect(index.order("2026-11-09", "午前")).toEqual(["i-2", "i-1"]);
		expect(index.order("2026-11-10", "午前")).toEqual(["i-2", "i-1"]);
	});

	it("並びにあるものはその順、ないものはこれまでの順で末尾", () => {
		const items = ["i-1", "i-2", "i-3", "r-1", "r-2"];
		expect(sortByOrder(items, (x) => x, ["r-1", "i-3", "i-9"])).toEqual(["r-1", "i-3", "i-1", "i-2", "r-2"]);
		expect(sortByOrder(items, (x) => x, undefined)).toEqual(items);
	});
});

describe("書く並び", () => {
	it("動かしたカードを、指したカードの前か末尾に入れる", () => {
		expect(reorder(["a", "b", "c"], "c", "a")).toEqual(["c", "a", "b"]);
		expect(reorder(["a", "b", "c"], "a", null)).toEqual(["b", "c", "a"]);
		// 別のグループから来たカード
		expect(reorder(["a", "b"], "x", "b")).toEqual(["a", "x", "b"]);
		expect(reorder(["a", "b"], "x", null)).toEqual(["a", "b", "x"]);
		// 指したカードがないときは末尾
		expect(reorder(["a", "b"], "a", "zz")).toEqual(["b", "a"]);
	});

	it("今日は出ていない ID を、前の並びで直前にあった ID の後ろに残す", () => {
		// r-w（週 1 の routine）は今日は出ていない
		expect(nextOrder(["i-2", "i-1"], ["i-1", "r-w", "i-2"])).toEqual(["i-2", "i-1", "r-w"]);
		expect(nextOrder(["i-1", "i-2"], ["r-w", "i-1", "i-2"])).toEqual(["r-w", "i-1", "i-2"]);
		expect(nextOrder(["i-1", "i-2"], ["i-1", "r-w", "r-x", "i-2"])).toEqual(["i-1", "r-w", "r-x", "i-2"]);
		expect(nextOrder(["i-1", "i-2"], undefined)).toEqual(["i-1", "i-2"]);
	});
});
