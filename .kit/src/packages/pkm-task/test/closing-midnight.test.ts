import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { serializeBoardLogEntry, type BoardOp } from "../src/core/board-log";
import { closingGroups, closingNotes, closingTarget, closingWindow, holdAutoClose } from "../src/core/closing";
import { TaskIndex } from "../src/core/index";
import { collectVault } from "../src/core/load";

/** ADR-0226: 締めの日付と、0 時から締めの猶予の時刻までの扱い */

const D = "2026-11-23";
const NEXT = "2026-11-24";
let seq = 0;
const line = (date: string, op: BoardOp) => serializeBoardLogEntry({ id: `bo_${++seq}`, at: `${date}T00:00:00.${String(seq).padStart(3, "0")}Z`, date, ...op });
const issue = (id: string, status = "open") => ({ path: `issue/${id}.md`, frontmatter: { type: "issue", id, summary: `s${id}`, status } });

function load(markdown: { path: string; frontmatter: Record<string, unknown> }[], boardLines: string[] = [], statusLines: string[] = []) {
	return new TaskIndex(
		collectVault({
			markdown,
			worklogs: [],
			labels: null,
			parseYaml: parse,
			boardLogs: [{ path: "board/pc/2026-11.jsonl", text: boardLines.join("\n") }],
			statusLogs: [{ path: "statuslog/pc/2026-11.jsonl", text: statusLines.join("\n") }],
		}).data,
	);
}

describe("締めの範囲", () => {
	it("その日の 0 時から翌日の猶予の時刻まで。猶予 0 ならその日の終わりまで", () => {
		expect(closingWindow(D, 4)).toEqual({ fromMs: new Date(2026, 10, 23).getTime(), toMs: new Date(2026, 10, 24, 4).getTime() });
		expect(closingWindow(D, 0)).toEqual({ fromMs: new Date(2026, 10, 23).getTime(), toMs: new Date(2026, 10, 24).getTime() });
	});
});

describe("締める日", () => {
	const open = load([issue("i-1")], [line(D, { op: "add", task: "i-1" })]);
	const closed = load([issue("i-1")], [line(D, { op: "add", task: "i-1" }), line(D, { op: "close", tasks: ["i-1"] })]);

	it("猶予の間で、前日のボードを締めていなければ前日", () => {
		expect(closingTarget(open, new Date(2026, 10, 24, 0, 30), 4)).toBe(D);
		expect(closingTarget(open, new Date(2026, 10, 24, 3, 59), 4)).toBe(D);
	});

	it("猶予を過ぎた・猶予 0・前日を締めてある・前日のボードがないなら今日", () => {
		expect(closingTarget(open, new Date(2026, 10, 24, 4), 4)).toBe(NEXT);
		expect(closingTarget(open, new Date(2026, 10, 24, 0, 30), 0)).toBe(NEXT);
		expect(closingTarget(closed, new Date(2026, 10, 24, 0, 30), 4)).toBe(NEXT);
		expect(closingTarget(load([]), new Date(2026, 10, 24, 0, 30), 4)).toBe(NEXT);
		expect(closingTarget(open, new Date(2026, 10, 23, 23, 50), 4)).toBe(D);
	});

	it("自動の締めは、猶予の間は前日のボードを待つ", () => {
		expect(holdAutoClose(D, new Date(2026, 10, 24, 1), 4)).toBe(true);
		expect(holdAutoClose(D, new Date(2026, 10, 24, 4), 4)).toBe(false);
		expect(holdAutoClose("2026-11-22", new Date(2026, 10, 24, 1), 4)).toBe(false);
		expect(holdAutoClose(D, new Date(2026, 10, 24, 1), 0)).toBe(false);
	});
});

describe("猶予の間にしたこと", () => {
	it("猶予の間に閉じた issue は前日の締めに出る。猶予 0 なら出ない", () => {
		const at = new Date(2026, 10, 24, 0, 20).toISOString();
		const index = load([issue("i-1"), issue("i-2", "closed")], [line(D, { op: "add", task: "i-1" })], [JSON.stringify({ id: "st_1", at, task: "i-2", from: "open", to: "closed", via: "ui" })]);
		const board = index.board(D)!.board;
		expect(closingGroups(index, D, board, 4).closed.map((i) => i.key)).toEqual(["i-2"]);
		expect(closingGroups(index, D, board, 0).closed).toEqual([]);
	});

	it("猶予の間に変えた・作ったノートは前日の締めに出る", () => {
		const late = new Date(2026, 10, 24, 0, 40);
		const notes = [
			{ path: "a.md", mtime: late.getTime(), created: late.toISOString(), title: "a" },
			{ path: "b.md", mtime: new Date(2026, 10, 24, 5).getTime(), created: null, title: "b" },
		];
		expect(closingNotes(notes, D, 4).map((n) => [n.note.path, n.created])).toEqual([["a.md", true]]);
		expect(closingNotes(notes, D, 0)).toEqual([]);
	});
});
