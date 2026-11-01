import { describe, expect, it } from "vitest";
import { emptyBoard } from "../src/core/board";
import { closeBoardNote } from "../src/core/board-note";
import { emptyVaultData, TaskIndex } from "../src/core/index";
import { newDailyContent } from "../src/core/issue-file";
import { parseIssue, parseRoutine } from "../src/core/schema";

const date = "2026-10-31";
const issue = (status = "open") => parseIssue("issue/i-1.md", { type: "issue", id: "i-1", summary: "作業", status }).value!;
const index = (status = "closed") => new TaskIndex({ ...emptyVaultData(), issues: [issue(status)] });
const note = "---\ntitle: 'その日' # keep\nboard:\n  issues: [i-1]\nother: true\n---\n人のメモ\n";
const board = { ...emptyBoard(), issues: ["i-1"] };

describe("要約を書いて締める", () => {
	it("人の本文と frontmatter をそのまま残して要約を足す", () => {
		const next = closeBoardNote(note, date, index(), board);
		expect(next.startsWith(`${note}\n`)).toBe(true);
		expect(next).toContain("## Task board");
		expect(next).toContain("[i-1 作業](issue/i-1.md)");
		expect(next).not.toContain("closed: true");
		expect(closeBoardNote(next, date, index(), board)).toBe(next);
	});
	it("未完了の issue は締めない", () => {
		expect(() => closeBoardNote(note, date, index("open"), board)).toThrow(/未完了/);
	});
	it("未完了の routine は締めない", () => {
		const routine = parseRoutine("routine/r-1.md", { type: "routine", id: "r-1", summary: "習慣", repeat: { every: "day" }, start: date }).value!;
		const tasks = new TaskIndex({ ...index().data, routines: [routine] });
		expect(() => closeBoardNote(note, date, tasks, board)).toThrow(/未完了/);
	});
	it("存在しない issue を完了扱いしない", () => {
		expect(() => closeBoardNote(note, date, new TaskIndex(emptyVaultData()), board)).toThrow(/i-1/);
	});
	it("マージ競合を上書きしない", () => {
		expect(() => closeBoardNote(`${note}<<<<<<< local\nx\n=======\ny\n>>>>>>> remote\n`, date, index(), board)).toThrow();
	});
	it("不正な日付を拒否する", () => {
		expect(() => closeBoardNote(note, "11/01", index(), board)).toThrow();
	});
});

describe("newDailyContent", () => {
	it("規約の type と created を持ち、board を持たない", () => {
		const text = newDailyContent("2026-11-01T08:00:00+09:00");
		expect(text).toBe("---\ntype: daily\ncreated: 2026-11-01T08:00:00+09:00\nupdated:\n---\n");
	});
});
