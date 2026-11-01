import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { parse, stringify } from "yaml";
import { emptyVaultData, TaskIndex } from "../src/core/index";
import { parseIssue } from "../src/core/schema";
import type { TaskStore } from "../src/obsidian/store";
import { TaskWriter } from "../src/obsidian/writer";

vi.mock("obsidian", async () => {
	const yaml = await import("yaml");
	return { TFile: class {}, normalizePath: (path: string) => path, parseYaml: yaml.parse, stringifyYaml: yaml.stringify };
});

const date = "2026-10-31";
const initial = "---\nboard:\n  issues: [i-1]\n---\nメモ\n";

function fixture(status = "closed", source = initial) {
	let text = source;
	let failSave = false;
	const issue = parseIssue("issue/i-1.md", { type: "issue", id: "i-1", summary: "作業", status }).value!;
	const refreshSoon = vi.fn();
	const store = { index: new TaskIndex({ ...emptyVaultData(), issues: [issue] }), refreshSoon } as unknown as TaskStore;
	const process = vi.fn(async (_file: unknown, edit: (text: string) => string) => {
		const next = edit(text);
		if (failSave) throw new Error("save failed");
		text = next;
	});
	const processFrontMatter = vi.fn(async (_file: unknown, edit: (fm: Record<string, unknown>) => void) => {
		const fm = parse(text.split("---")[1]!);
		edit(fm);
		text = `---\n${stringify(fm)}---\nメモ\n`;
	});
	const app = { vault: { getFileByPath: () => ({}), process }, fileManager: { processFrontMatter } } as unknown as App;
	return { writer: new TaskWriter(app, store), read: () => text, fail: (value = true) => { failSave = value; }, process, processFrontMatter, refreshSoon };
}

describe("TaskWriter のボード保存", () => {
	it("closed と要約を一回の保存で確定する", async () => {
		const f = fixture();
		await f.writer.closeBoard(date);
		expect(f.read()).toContain("closed: true");
		expect(f.read()).toContain("## Task board");
		expect(f.process).toHaveBeenCalledTimes(1);
		expect(f.processFrontMatter).not.toHaveBeenCalled();
		expect(f.refreshSoon).toHaveBeenCalledTimes(1);
	});
	it("保存に失敗しても closed だけが残らず、再試行できる", async () => {
		const f = fixture();
		f.fail();
		await expect(f.writer.closeBoard(date)).rejects.toThrow("save failed");
		expect(f.read()).toBe(initial);
		expect(f.refreshSoon).not.toHaveBeenCalled();
		f.fail(false);
		await f.writer.closeBoard(date);
		expect(f.read()).toContain("closed: true");
		expect(f.read()).toContain("## Task board");
	});
	it("索引の古い board ではなく保存時の本文を検査する", async () => {
		const source = initial.replace("[i-1]", "[i-1, i-2]");
		const f = fixture("closed", source);
		await expect(f.writer.closeBoard(date)).rejects.toThrow(/i-2/);
		expect(f.read()).toBe(source);
	});
	it("未完了なら本文を書き換えない", async () => {
		const f = fixture("open");
		await expect(f.writer.closeBoard(date)).rejects.toThrow(/未完了/);
		expect(f.read()).toBe(initial);
	});
	it("不正な既存値を黙って消さずに更新を拒否する", async () => {
		const source = initial.replace("[i-1]", "[i-1, 3]");
		const f = fixture("closed", source);
		await expect(f.writer.updateBoard(date, (b) => { b.closed = false; })).rejects.toThrow();
		expect(f.read()).toBe(source);
	});
	it("操作後に不正になる場合も書き戻さない", async () => {
		const f = fixture();
		await expect(f.writer.updateBoard(date, (b) => { b.carried.push("i-missing"); })).rejects.toThrow();
		expect(f.read()).toBe(initial);
	});
});
