import { describe, expect, it } from "vitest";
import { emptyBoard, parseBoardForWrite } from "../src/core/board";
import { closeBoardNote } from "../src/core/board-note";
import { emptyVaultData, TaskIndex } from "../src/core/index";
import { parseIssue, parseRoutine } from "../src/core/schema";
import { parse, stringify } from "yaml";

const date = "2026-10-31";
const codec = { parse, stringify };
const issue = (status = "open") => parseIssue("issue/i-1.md", { type: "issue", id: "i-1", summary: "作業", status }).value!;
const index = (status = "closed") => new TaskIndex({ ...emptyVaultData(), issues: [issue(status)] });
const note = "---\ntitle: 'その日' # keep\nboard:\n  issues: [i-1]\nother: true\n---\n人のメモ\n";

describe("board の書き込み", () => {
	it("未作成と正しい値を読み、carried を保持する", () => {
		expect(parseBoardForWrite(undefined)).toEqual(emptyBoard());
		expect(parseBoardForWrite({ issues: ["i-1"], carried: ["i-1"] }).carried).toEqual(["i-1"]);
	});
	it.each([null, [], "broken", { issues: ["i-1", 3] }, { issues: ["i-1", "i-1"] },
		{ routines: { "r-1": "done" } }, { groups: { "i-1": 3 } }, { closed: "true" },
		{ carried: ["i-1"] }, { futureField: true }])("失われる値があるなら保存を拒否する: %j", (raw) => {
		expect(() => parseBoardForWrite(raw)).toThrow();
	});
});

describe("ボードと要約を一度に締める", () => {
	it("人の本文・board 以外の YAML の書式を保持する", () => {
		const next = closeBoardNote(note, date, index(), codec);
		expect(next).toContain("title: 'その日' # keep\n");
		expect(next).toContain("other: true\n---\n人のメモ\n");
		expect(next).toContain("closed: true");
		expect(next).toContain("## Task board");
		expect(next).toContain("[i-1 作業](issue/i-1.md)");
		expect(closeBoardNote(next, date, index(), codec)).toBe(next);
	});
	it("未完了の issue は締めない", () => {
		expect(() => closeBoardNote(note, date, index("open"), codec)).toThrow(/未完了/);
	});
	it("未完了の routine は締めない", () => {
		const routine = parseRoutine("routine/r-1.md", { type: "routine", id: "r-1", summary: "習慣", repeat: { every: "day" }, start: date }).value!;
		const tasks = new TaskIndex({ ...index().data, routines: [routine] });
		expect(() => closeBoardNote(note, date, tasks, codec)).toThrow(/未完了/);
	});
	it("存在しない issue を完了扱いしない", () => {
		expect(() => closeBoardNote(note, date, new TaskIndex(emptyVaultData()), codec)).toThrow(/i-1/);
	});
	it("壊れた board とマージ競合を上書きしない", () => {
		expect(() => closeBoardNote(note.replace("[i-1]", "[i-1, 3]"), date, index(), codec)).toThrow();
		expect(() => closeBoardNote(note + "<<<<<<< local\nx\n=======\ny\n>>>>>>> remote\n", date, index(), codec)).toThrow();
	});
	it("YAML 保存や要約生成に失敗したら変更結果を返さない", () => {
		expect(() => closeBoardNote(note, date, index(), { parse, stringify: () => { throw new Error("disk preparation failed"); } })).toThrow();
	});
	it("CRLF と引用符付きの board キーを扱う", () => {
		const next = closeBoardNote(note.replace("board:", "'board':").replaceAll("\n", "\r\n"), date, index(), codec);
		expect(next).toContain("title: 'その日' # keep\r\n");
		expect(next).toContain("closed: true");
	});
	it("別の YAML 値が board 内のアンカーを参照する場合は壊さず停止する", () => {
		const linked = note.replace("[i-1]", "&tasks [i-1]").replace("other: true", "other: *tasks");
		expect(() => closeBoardNote(linked, date, index(), codec)).toThrow();
	});
});
