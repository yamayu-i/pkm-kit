import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { closeBoardOnDisk } from "../cli/vault-ops";
import { emptyBoard } from "../src/core/board";
import { closeBoardNote } from "../src/core/board-note";
import { emptyVaultData, TaskIndex } from "../src/core/index";
import { newDailyContent } from "../src/core/issue-file";
import { parseIssue, parseRoutine } from "../src/core/schema";
import { DEFAULT_REVIEW_TEMPLATE, insertReviewTemplate, templateMarker } from "../src/core/review-template";

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
	it("振り返りの型を入れた後に、ほかの内容が書き足されていても、記録は振り返りの直下に入れる", () => {
		const reviewed = `${insertReviewTemplate(note, DEFAULT_REVIEW_TEMPLATE)}\n## 後から足した節\n- x\n`;
		const next = closeBoardNote(reviewed, date, index(), board, templateMarker(DEFAULT_REVIEW_TEMPLATE));
		const pos = (s: string) => next.indexOf(s);
		expect(pos("### Problem → Try")).toBeLessThan(pos("## Task board"));
		expect(pos("## Task board")).toBeLessThan(pos("\n---\n\n人のメモ"));
		expect(pos("人のメモ")).toBeLessThan(pos("## 後から足した節"));
		expect(next.replace(/## Task board[\s\S]*?\n\n(?=---)/, "")).toBe(reviewed);
		expect(closeBoardNote(next, date, index(), board, templateMarker(DEFAULT_REVIEW_TEMPLATE))).toBe(next);
	});
	it("MCP の締めも、その Vault のスニペットの見出しの直下に書く", () => {
		const root = mkdtempSync(join(tmpdir(), "close-"));
		try {
			mkdirSync(join(root, "template/snippet"), { recursive: true });
			writeFileSync(join(root, "template/snippet/daily-review.md"), "---\nname: daily-review\n---\n## ふりかえり\n\n- \n");
			mkdirSync(join(root, "daily/2026/10"), { recursive: true });
			const path = join(root, "daily/2026/10/2026-10-31.md");
			writeFileSync(path, "---\ntype: daily\n---\n## ふりかえり\n\n- よし\n\n## 別の節\n- x\n");
			closeBoardOnDisk(root, index(), date, "pc", new Date());
			const text = readFileSync(path, "utf8");
			expect(text.indexOf("- よし")).toBeLessThan(text.indexOf("## Task board"));
			expect(text.indexOf("## Task board")).toBeLessThan(text.indexOf("## 別の節"));
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});
	it("未完了の issue があっても締め、持ち越しと書く（締めは記録だけ。ADR-0189）", () => {
		expect(closeBoardNote(note, date, index("open"), board)).toContain("[i-1 作業](issue/i-1.md)（持ち越し）");
	});
	it("未完了の routine があっても締める（ADR-0189）", () => {
		const routine = parseRoutine("routine/r-1.md", { type: "routine", id: "r-1", summary: "習慣", repeat: { every: "day" }, start: date }).value!;
		const tasks = new TaskIndex({ ...index().data, routines: [routine] });
		expect(closeBoardNote(note, date, tasks, board)).toContain("## Task board");
	});
	it("鍵が指すものがない issue は、完了にも未完了にも数えず、締めを止めない（ADR-0137）", () => {
		const text = closeBoardNote(note, date, new TaskIndex(emptyVaultData()), board);
		expect(text.slice(note.length)).not.toContain("i-1");
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
		expect(text).toBe("---\ntype: daily\ncreated: 2026-11-01T08:00:00+09:00\nupdated: 2026-11-01T08:00:00+09:00\n---\n");
	});
});
