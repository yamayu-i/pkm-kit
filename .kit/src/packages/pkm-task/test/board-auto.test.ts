import { describe, expect, it } from "vitest";
import { emptyBoard, placementOf } from "../src/core/board";
import { lastPlacement, serializeBoardLogEntry, type BoardOp } from "../src/core/board-log";
import { TaskIndex, sidebarCounts } from "../src/core/index";
import { collectVault } from "../src/core/load";

/** ADR-0034: 今日が実行日の issue を自動でボードに載せる / カードの置き場所を覚える */

const line = (at: string, date: string, op: BoardOp) => serializeBoardLogEntry({ id: `bo_${at}`, at, date, ...op });
const issueMd = (id: string, scheduled: string[], status = "open") => ({
	path: `issue/${id}.md`,
	frontmatter: { type: "issue", id, summary: `s${id}`, status, scheduled },
});
const routineMd = (id: string, group: string) => ({
	path: `routine/${id}.md`,
	frontmatter: { type: "routine", id, name: `s${id}`, repeat: { every: "day" }, start: "2026-10-01", group },
});
const groups = JSON.stringify([{ name: "午前", children: [{ name: "集中" }] }, { name: "午後" }]);

function load(markdown: { path: string; frontmatter: Record<string, unknown> }[], lines: string[]) {
	const { data } = collectVault({ markdown, worklogs: [], labels: null, groups, boardLogs: [{ path: "board/pc/2026-11.jsonl", text: lines.join("\n") }] });
	return new TaskIndex(data);
}

describe("今日が実行日の issue を自動で載せる", () => {
	it("実行日がその日で、active で、まだ載っていないものだけ", () => {
		const index = load(
			[issueMd("i-1", ["2026-11-06"]), issueMd("i-2", ["2026-11-06"]), issueMd("i-3", ["2026-11-07"]), issueMd("i-4", ["2026-11-06"], "closed")],
			[line("2026-11-06T00:00:00.000Z", "2026-11-06", { op: "add", task: "i-2" })],
		);
		expect(index.toAutoAdd("2026-11-06").map((i) => i.id)).toEqual(["i-1"]);
	});

	it("その日に外した issue は載せ直さない。もう一度載せたら外したことは消える", () => {
		const md = [issueMd("i-1", ["2026-11-06"]), issueMd("i-2", ["2026-11-06"])];
		const removed = [
			line("2026-11-06T00:00:00.000Z", "2026-11-06", { op: "add", task: "i-1" }),
			line("2026-11-06T00:00:00.000Z", "2026-11-06", { op: "add", task: "i-2" }),
			line("2026-11-06T01:00:00.000Z", "2026-11-06", { op: "remove", task: "i-1" }),
			line("2026-11-06T01:00:00.000Z", "2026-11-06", { op: "remove", task: "i-2" }),
		];
		const index = load(md, removed);
		expect(index.board("2026-11-06")!.removed).toEqual(["i-1", "i-2"]);
		expect(index.toAutoAdd("2026-11-06")).toEqual([]);

		const readded = load(md, [...removed, line("2026-11-06T02:00:00.000Z", "2026-11-06", { op: "add", task: "i-2" })]);
		expect(readded.board("2026-11-06")!.removed).toEqual(["i-1"]);
	});

	it("別の日に外したことは関係しない", () => {
		const index = load([issueMd("i-1", ["2026-11-05", "2026-11-06"])], [line("2026-11-05T01:00:00.000Z", "2026-11-05", { op: "remove", task: "i-1" })]);
		expect(index.toAutoAdd("2026-11-06").map((i) => i.id)).toEqual(["i-1"]);
	});

	it("左サイドバーの Daily の件数は、外した issue を数えない", () => {
		const index = load(
			[issueMd("i-1", ["2026-11-06"]), issueMd("i-2", ["2026-11-06"])],
			[line("2026-11-06T00:00:00.000Z", "2026-11-06", { op: "add", task: "i-1" }), line("2026-11-06T01:00:00.000Z", "2026-11-06", { op: "remove", task: "i-1" })],
		);
		expect(sidebarCounts(index, "2026-11-06").daily).toBe(1);
	});
});

describe("カードの置き場所を覚える", () => {
	const keys = ["午前", "午前/集中", "午後"];

	it("前の日に置いたグループに、次の日も初めから置く（issue も routine も）", () => {
		const index = load(
			[issueMd("i-1", ["2026-11-05", "2026-11-06"]), routineMd("r-1", "午後")],
			[
				line("2026-11-05T01:00:00.000Z", "2026-11-05", { op: "place", task: "i-1", group: "午前/集中" }),
				line("2026-11-05T01:00:00.000Z", "2026-11-05", { op: "place", task: "r-1", group: "午前" }),
			],
		);
		const board = emptyBoard();
		expect(index.placement("2026-11-06", board, "i-1", null, keys)).toBe("午前/集中");
		expect(index.placement("2026-11-06", board, "r-1", "午後", keys)).toBe("午前");
	});

	it("置いたことがなければ既定（routine の group）、それもなければ未分類", () => {
		const index = load([routineMd("r-1", "午後")], []);
		expect(index.placement("2026-11-06", emptyBoard(), "r-1", "午後", keys)).toBe("午後");
		expect(index.placement("2026-11-06", emptyBoard(), "i-1", null, keys)).toBe("");
	});

	it("最後に未分類へ移したなら未分類（routine の group に戻らない）", () => {
		const index = load(
			[routineMd("r-1", "午後")],
			[
				line("2026-11-04T01:00:00.000Z", "2026-11-04", { op: "place", task: "r-1", group: "午前" }),
				line("2026-11-05T01:00:00.000Z", "2026-11-05", { op: "place", task: "r-1", group: null }),
			],
		);
		expect(index.placement("2026-11-06", emptyBoard(), "r-1", "午後", keys)).toBe("");
	});

	it("その日に移した場所がいちばん強い。後の日の記録は前の日のボードに効かない", () => {
		const index = load(
			[issueMd("i-1", [])],
			[
				line("2026-11-04T01:00:00.000Z", "2026-11-04", { op: "place", task: "i-1", group: "午前" }),
				line("2026-11-06T01:00:00.000Z", "2026-11-06", { op: "place", task: "i-1", group: "午後" }),
			],
		);
		expect(index.placement("2026-11-05", emptyBoard(), "i-1", null, keys)).toBe("午前");
		expect(index.placement("2026-11-06", index.board("2026-11-06")!.board, "i-1", null, keys)).toBe("午後");
	});

	it("ボードの日付の順で決める（前の日のボードを後から触っても、新しい日の記録が勝つ）", () => {
		const index = load(
			[issueMd("i-1", [])],
			[
				line("2026-11-05T01:00:00.000Z", "2026-11-05", { op: "place", task: "i-1", group: "午後" }),
				line("2026-11-05T02:00:00.000Z", "2026-11-04", { op: "place", task: "i-1", group: "午前" }),
			],
		);
		expect(index.placement("2026-11-06", emptyBoard(), "i-1", null, keys)).toBe("午後");
	});

	it("既存の frontmatter の board の groups も記録として使う", () => {
		const { data } = collectVault({
			markdown: [{ path: "daily/2026/11/2026-11-01.md", frontmatter: { board: { issues: ["i-1"], groups: { "i-1": "午後" } } } }],
			worklogs: [],
			labels: null,
		});
		expect(lastPlacement(data.placements, "i-1", "2026-11-06")).toBe("午後");
		expect(lastPlacement(data.placements, "i-1", "2026-10-31")).toBeUndefined();
	});

	it("今はないグループを覚えていたら未分類", () => {
		expect(placementOf(emptyBoard(), "i-1", null, keys, "消えたグループ")).toBe("");
		expect(placementOf(emptyBoard(), "r-1", "午後", keys, null)).toBe("");
		expect(placementOf(emptyBoard(), "r-1", "午後", keys, undefined)).toBe("午後");
	});
});
