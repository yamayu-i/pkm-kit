import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { parseBoardLog } from "../src/core/board-log";
import { emptyVaultData, TaskIndex } from "../src/core/index";
import { collectVault } from "../src/core/load";
import { parseIssue } from "../src/core/schema";
import type { TaskStore } from "../src/obsidian/store";
import { TaskWriter } from "../src/obsidian/writer";

vi.mock("obsidian", () => ({ TFile: class {}, normalizePath: (path: string) => path }));

const date = "2026-10-31";
const notePath = "daily/2026/10/2026-10-31.md";
const logPath = "board/pc/2026-10.jsonl";
const note = "---\ntype: daily\nboard:\n  issues: [i-1]\n---\nメモ\n";

function fixture(status = "closed", files: Record<string, string> = { [notePath]: note }) {
	const texts = new Map(Object.entries(files));
	let failSave: string | null = null;
	const issue = parseIssue("issue/i-1.md", { type: "issue", id: "i-1", summary: "作業", status }).value!;
	const refreshSoon = vi.fn();
	const store = {
		get index() {
			const markdown = [...texts].filter(([p]) => p.startsWith("daily/")).map(([path, text]) => ({ path, frontmatter: text.includes("issues: [i-1]") ? { board: { issues: ["i-1"] } } : {} }));
			const boardLogs = [...texts].filter(([p]) => p.startsWith("board/")).map(([path, text]) => ({ path, text }));
			const { data } = collectVault({ markdown, worklogs: [], labels: null, boardLogs });
			return new TaskIndex({ ...emptyVaultData(), ...data, issues: [issue] });
		},
		refreshSoon,
	} as unknown as TaskStore;
	const vault = {
		getFileByPath: (path: string) => (texts.has(path) ? { path } : null),
		getFolderByPath: () => ({}),
		create: vi.fn(async (path: string, text: string) => {
			texts.set(path, text);
			return { path };
		}),
		process: vi.fn(async (file: { path: string }, edit: (text: string) => string) => {
			const next = edit(texts.get(file.path)!);
			if (failSave === file.path) throw new Error("save failed");
			texts.set(file.path, next);
		}),
	};
	const processFrontMatter = vi.fn();
	const app = { vault, fileManager: { processFrontMatter } } as unknown as App;
	return { writer: new TaskWriter(app, store), texts, store, vault, processFrontMatter, refreshSoon, fail: (path: string | null) => { failSave = path; } };
}
const ops = (f: ReturnType<typeof fixture>, path = logPath) => parseBoardLog(path, f.texts.get(path) ?? "").entries;

describe("ボードの操作の追記", () => {
	it("端末のログに追記し、デイリーノートは作らず変えない", async () => {
		const f = fixture("closed", {});
		await f.writer.appendBoardOps(date, "pc", [{ op: "add", task: "i-1" }]);
		await f.writer.appendBoardOps(date, "pc", [{ op: "carry", task: "i-1" }, { op: "reopen" }]);
		expect(ops(f).map((e) => e.op.op)).toEqual(["add", "carry", "reopen"]);
		expect(ops(f).every((e) => e.date === date)).toBe(true);
		expect(f.texts.has(notePath)).toBe(false);
		expect(f.processFrontMatter).not.toHaveBeenCalled();
		expect(f.refreshSoon).toHaveBeenCalled();
	});
	it("既存の frontmatter の board を書き換えない", async () => {
		const f = fixture();
		await f.writer.appendBoardOps(date, "pc", [{ op: "remove", task: "i-1" }]);
		expect(f.texts.get(notePath)).toBe(note);
		expect(f.store.index.board(date)!.board.issues).toEqual([]);
	});
	it("端末名がないと書かない", async () => {
		const f = fixture();
		await expect(f.writer.appendBoardOps(date, "", [{ op: "reopen" }])).rejects.toThrow(/端末名/);
	});
	it("時計が遅れていても、見えている操作より後の時刻で書く", async () => {
		const future = new Date(Date.now() + 3_600_000).toISOString();
		const line = JSON.stringify({ id: "bo_x", at: future, date, op: "add", task: "i-1" });
		const f = fixture("closed", { "board/phone/2026-10.jsonl": `${line}\n` });
		await f.writer.appendBoardOps(date, "pc", [{ op: "reopen" }, { op: "reopen" }]);
		const [a, b] = ops(f);
		expect(a!.atMs).toBe(Date.parse(future) + 1);
		expect(b!.atMs).toBe(Date.parse(future) + 2);
	});
});

describe("ボードを締める", () => {
	it("要約を書いてから close を追記する", async () => {
		const f = fixture();
		await f.writer.closeBoard(date, "pc");
		expect(f.texts.get(notePath)).toContain("## Task board");
		expect(f.texts.get(notePath)).toContain("issues: [i-1]");
		expect(ops(f).map((e) => e.op)).toEqual([{ op: "close", tasks: ["i-1"] }]);
		expect(f.store.index.board(date)!.board.closed).toBe(true);
	});
	it("要約の保存に失敗したら close を書かず、再試行できる", async () => {
		const f = fixture();
		f.fail(notePath);
		await expect(f.writer.closeBoard(date, "pc")).rejects.toThrow("save failed");
		expect(f.texts.has(logPath)).toBe(false);
		f.fail(null);
		await f.writer.closeBoard(date, "pc");
		expect(ops(f)).toHaveLength(1);
	});
	it("close の追記に失敗しても、再試行で要約は重複しない", async () => {
		const f = fixture();
		f.texts.set(logPath, "");
		f.fail(logPath);
		await expect(f.writer.closeBoard(date, "pc")).rejects.toThrow("save failed");
		f.fail(null);
		await f.writer.closeBoard(date, "pc");
		expect(f.texts.get(notePath)!.match(/## Task board/g)).toHaveLength(1);
		expect(ops(f)).toHaveLength(1);
	});
	it("未完了なら本文もログも書かない", async () => {
		const f = fixture("open");
		await expect(f.writer.closeBoard(date, "pc")).rejects.toThrow(/未完了/);
		expect(f.texts.get(notePath)).toBe(note);
		expect(f.texts.has(logPath)).toBe(false);
	});
	it("デイリーノートがなければ type と created 付きで作る", async () => {
		const line = JSON.stringify({ id: "bo_x", at: "2026-10-31T00:00:00.000Z", date, op: "add", task: "i-1" });
		const f = fixture("closed", { [logPath]: `${line}\n` });
		await f.writer.closeBoard(date, "pc");
		const text = f.texts.get(notePath)!;
		expect(text).toMatch(/^---\ntype: daily\ncreated: (\d{4}-\d{2}-\d{2}T[^\n]+)\nupdated: \1\n---\n/);
		expect(text).toContain("## Task board");
	});
	it("締めたボードにはもう書かない", async () => {
		const f = fixture();
		await f.writer.closeBoard(date, "pc");
		await f.writer.closeBoard(date, "pc");
		expect(ops(f)).toHaveLength(1);
	});
});
