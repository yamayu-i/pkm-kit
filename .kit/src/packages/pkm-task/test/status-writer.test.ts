import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { boardLogPath, parseBoardLog, serializeBoardLogEntry } from "../src/core/board-log";
import { localToday } from "../src/core/dates";
import { emptyVaultData, TaskIndex } from "../src/core/index";
import { collectVault } from "../src/core/load";
import { parseStatusLog } from "../src/core/status-log";
import type { TaskStore } from "../src/obsidian/store";
import { TaskWriter, type StatusChange } from "../src/obsidian/writer";

vi.mock("obsidian", () => ({ TFile: class {}, normalizePath: (path: string) => path }));

const issuePath = "issue/i-1.md";

/** frontmatter とファイルをメモリに持つ Vault（ADR-0031 の書き込みを確かめる） */
function fixture(fm: Record<string, unknown>, device = "pc", worklog = "") {
	const frontmatters = new Map<string, Record<string, unknown>>([[issuePath, { type: "issue", id: "i-1", summary: "作業", ...fm }]]);
	const texts = new Map<string, string>(worklog ? [["worklog/pc/2026-11.jsonl", worklog]] : []);
	const store = {
		get index() {
			const markdown = [...frontmatters].map(([path, frontmatter]) => ({ path, frontmatter }));
			const worklogs = [...texts].filter(([p]) => p.startsWith("worklog/")).map(([path, text]) => ({ path, text }));
			const statusLogs = [...texts].filter(([p]) => p.startsWith("statuslog/")).map(([path, text]) => ({ path, text }));
			const boardLogs = [...texts].filter(([p]) => p.startsWith("board/")).map(([path, text]) => ({ path, text }));
			return new TaskIndex({ ...emptyVaultData(), ...collectVault({ markdown, worklogs, labels: null, statusLogs, boardLogs }).data });
		},
		refreshSoon: vi.fn(),
	} as unknown as TaskStore;
	const vault = {
		getFileByPath: (path: string) => (texts.has(path) || frontmatters.has(path) ? { path } : null),
		getFolderByPath: () => ({}),
		createFolder: vi.fn(),
		create: vi.fn(async (path: string, text: string) => {
			texts.set(path, text);
			return { path };
		}),
		process: vi.fn(async (file: { path: string }, edit: (text: string) => string) => {
			texts.set(file.path, edit(texts.get(file.path) ?? ""));
		}),
	};
	const processFrontMatter = vi.fn(async (file: { path: string }, fn: (fm: Record<string, unknown>) => void) => fn(frontmatters.get(file.path)!));
	const app = { vault, fileManager: { processFrontMatter } } as unknown as App;
	const writer = new TaskWriter(app, store, () => device);
	const changes: StatusChange[] = [];
	writer.onStatusChange = (c) => changes.push(c);
	const logs = () => [...texts].filter(([p]) => p.startsWith("statuslog/")).flatMap(([p, t]) => parseStatusLog(p, t).entries);
	return { writer, frontmatters, texts, changes, logs, fm: () => frontmatters.get(issuePath)! };
}

describe("waiting / delegated にしたら ★ を外す（ADR-0184）", () => {
	const today = localToday();
	const boardPath = boardLogPath("pc", today);
	const star = (on: boolean, n: number) => serializeBoardLogEntry({ id: `bo_${n}`, at: `${today}T00:00:0${n}.000Z`, date: today, op: "star", task: "i-1", on });
	const stars = (texts: Map<string, string>) => parseBoardLog(boardPath, texts.get(boardPath) ?? "").entries.filter((e) => e.op.op === "star").map((e) => (e.op as { on: boolean }).on);

	it("今日のボードで ★ が付いていれば、外す op を書く。in-progress に戻しても付け直さない", async () => {
		const f = fixture({ status: "in-progress" });
		f.texts.set(boardPath, [serializeBoardLogEntry({ id: "bo_0", at: `${today}T00:00:00.000Z`, date: today, op: "add", task: "i-1" }), star(true, 1)].join("\n"));
		await f.writer.update(issuePath, { status: "waiting" });
		expect(stars(f.texts)).toEqual([true, false]);
		await f.writer.update(issuePath, { status: "in-progress" });
		expect(stars(f.texts)).toEqual([true, false]);
	});

	it("★ がなければ、ボードに何も書かない", async () => {
		const f = fixture({ status: "open" });
		await f.writer.update(issuePath, { status: "delegated", delegated_to: "m-1" });
		expect(f.texts.has(boardPath)).toBe(false);
	});
});

describe("status の変更の書き込み（ADR-0031）", () => {
	it("status が変わったら statuslog に追記し、変える前の値を渡す", async () => {
		const f = fixture({ status: "delegated", delegated_to: "m-1" });
		await f.writer.update(issuePath, { status: "in-progress", delegated_to: null, revisit: null });
		expect(f.fm().status).toBe("in-progress");
		expect(f.fm().delegated_to).toBeUndefined();
		expect(f.logs().map((e) => [e.task, e.from, e.to, e.via])).toEqual([["i-1", "delegated", "in-progress", "ui"]]);
		expect(f.changes).toHaveLength(1);
		expect(f.changes[0]!.before).toEqual({ status: "delegated", delegated_to: "m-1", revisit: undefined });
	});

	it("変える前の値で update すると元に戻り、undo として記録する", async () => {
		const f = fixture({ status: "delegated", delegated_to: "m-1" });
		await f.writer.update(issuePath, { status: "closed", delegated_to: null, revisit: null });
		await f.writer.update(issuePath, f.changes[0]!.before, "undo");
		expect(f.fm()).toMatchObject({ status: "delegated", delegated_to: "m-1" });
		expect(f.fm()).not.toHaveProperty("revisit");
		expect(f.logs().map((e) => e.via)).toEqual(["ui", "undo"]);
		expect(f.changes.map((c) => c.via)).toEqual(["ui", "undo"]);
	});

	it("status 以外の変更や、同じ status では記録しない", async () => {
		const f = fixture({ status: "open" });
		await f.writer.update(issuePath, { priority: "high" });
		await f.writer.update(issuePath, { status: "open" });
		expect(f.logs()).toEqual([]);
		expect(f.changes).toEqual([]);
	});

	it("端末名がなければ記録しないが、status は変える", async () => {
		const f = fixture({ status: "open" }, "");
		await f.writer.update(issuePath, { status: "in-progress" });
		expect(f.fm().status).toBe("in-progress");
		expect(f.logs()).toEqual([]);
		expect(f.changes).toHaveLength(1);
	});

	it("closed / canceled にしたら、記録中のタイマーを止める", async () => {
		const running = JSON.stringify({ id: "wl_1", task_id: "i-1", from: "2026-11-03T09:00:00+09:00", to: null, description: "" });
		const f = fixture({ status: "in-progress" }, "pc", `${running}\n`);
		await f.writer.update(issuePath, { status: "closed" });
		expect(JSON.parse(f.texts.get("worklog/pc/2026-11.jsonl")!.trim()).to).not.toBeNull();
	});

	it("open の issue のタイマーを始めたら in-progress にする。open 以外は変えない", async () => {
		const f = fixture({ status: "open" });
		await f.writer.startTimer(["i-1"], "pc");
		expect(f.fm().status).toBe("in-progress");
		expect(f.logs().map((e) => [e.from, e.to, e.via])).toEqual([["open", "in-progress", "timer"]]);

		const g = fixture({ status: "waiting" });
		await g.writer.startTimer(["i-1"], "pc");
		expect(g.fm().status).toBe("waiting");
		expect(g.logs()).toEqual([]);
	});
});
