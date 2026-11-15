import { describe, expect, it } from "vitest";
import { serializeBoardLogEntry, type BoardOp } from "../src/core/board-log";
import { TaskIndex, sidebarCounts } from "../src/core/index";
import { collectVault } from "../src/core/load";

/** ADR-0034: 今日が実行日の issue を自動でボードに載せる（カードの置き場所は ADR-0137 で廃止） */

const line = (at: string, date: string, op: BoardOp) => serializeBoardLogEntry({ id: `bo_${at}`, at, date, ...op });
const issueMd = (id: string, scheduled: string[], status = "open") => ({
	path: `issue/${id}.md`,
	frontmatter: { type: "issue", id, summary: `s${id}`, status, scheduled },
});

function load(markdown: { path: string; frontmatter: Record<string, unknown> }[], lines: string[]) {
	const { data } = collectVault({ markdown, worklogs: [], labels: null, boardLogs: [{ path: "board/pc/2026-11.jsonl", text: lines.join("\n") }] });
	return new TaskIndex(data);
}

describe("今日が実行日の issue を自動で載せる", () => {
	it("実行日がその日で、active で、まだ載っていないものだけ", () => {
		const index = load(
			[issueMd("i-1", ["2026-11-06"]), issueMd("i-2", ["2026-11-06"]), issueMd("i-3", ["2026-11-07"]), issueMd("i-4", ["2026-11-06"], "closed")],
			[line("2026-11-06T00:00:00.000Z", "2026-11-06", { op: "add", task: "i-2" })],
		);
		expect(index.toAutoAdd("2026-11-06")).toEqual(["i-1"]);
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
		expect(index.toAutoAdd("2026-11-06")).toEqual(["i-1"]);
	});

	it("左サイドバーの Daily の件数は、外した issue を数えない", () => {
		const index = load(
			[issueMd("i-1", ["2026-11-06"]), issueMd("i-2", ["2026-11-06"])],
			[line("2026-11-06T00:00:00.000Z", "2026-11-06", { op: "add", task: "i-1" }), line("2026-11-06T01:00:00.000Z", "2026-11-06", { op: "remove", task: "i-1" })],
		);
		expect(sidebarCounts(index, "2026-11-06").daily).toBe(1);
	});
});
