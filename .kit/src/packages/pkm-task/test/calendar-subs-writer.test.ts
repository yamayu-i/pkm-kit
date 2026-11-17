import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { parse } from "yaml";
import { TaskIndex } from "../src/core/index";
import { collectVault } from "../src/core/load";
import type { TaskStore } from "../src/obsidian/store";
import { TaskWriter } from "../src/obsidian/writer";

vi.mock("obsidian", () => ({ TFile: class {}, normalizePath: (path: string) => path, parseYaml: (s: string) => parse(s) }));

/** ADR-0203: Calendar とサブを同時に持たせない（Obsidian の書き込み） */

const path = "issue/i-1.md";
const SUB = "<!-- sub-issue\nid: aaaaaa\nsummary: サブ\nstatus: closed\n-->\n";

function fixture(fm: Record<string, unknown>, body: string) {
	const frontmatter: Record<string, unknown> = { type: "issue", id: "i-1", summary: "作業", status: "open", ...fm };
	const texts = new Map<string, string>([[path, `---\n---\n${body}`]]);
	const store = {
		get index() {
			return new TaskIndex(collectVault({ markdown: [{ path, frontmatter, text: texts.get(path)! }], worklogs: [], labels: null, parseYaml: parse }).data);
		},
		refreshSoon: vi.fn(),
	} as unknown as TaskStore;
	const vault = {
		getFileByPath: (p: string) => (texts.has(p) ? { path: p } : null),
		process: vi.fn(async (file: { path: string }, edit: (text: string) => string) => {
			texts.set(file.path, edit(texts.get(file.path) ?? ""));
		}),
	};
	const processFrontMatter = vi.fn(async (_file: unknown, fn: (fm: Record<string, unknown>) => void) => fn(frontmatter));
	const app = { vault, fileManager: { processFrontMatter } } as unknown as App;
	return { writer: new TaskWriter(app, store, () => "pc"), frontmatter, texts };
}

describe("Calendar とサブを同時に持たせない", () => {
	it("サブ（閉じたものも）を持つ issue に Calendar の日を書かない。消すのはよい", async () => {
		const f = fixture({ scheduled: "2026-11-20" }, SUB);
		await expect(f.writer.update(path, { scheduled: "2026-11-21" })).rejects.toThrow(/サブイシューを持つ issue には Calendar/);
		expect(f.frontmatter.scheduled).toBe("2026-11-20");
		await f.writer.update(path, { scheduled: null });
		expect(f.frontmatter.scheduled).toBeUndefined();
	});

	it("サブのない issue には Calendar の日を書ける", async () => {
		const f = fixture({}, "");
		await f.writer.update(path, { scheduled: "2026-11-21" });
		expect(f.frontmatter.scheduled).toBe("2026-11-21");
	});

	it("Calendar の日を持つ issue に、サブもプリセットのサブも足さない", async () => {
		const f = fixture({ scheduled: "2026-11-20" }, "");
		await expect(f.writer.createSubs("i-1", ["新しいサブ"])).rejects.toThrow(/Calendar の日を持つ issue にはサブイシューを足せません/);
		await expect(f.writer.applyPreset("i-1", { subIssues: ["a"], body: "" })).rejects.toThrow(/Calendar の日を持つ issue にはサブイシューを足せません/);
		expect(f.texts.get(path)).toBe("---\n---\n");
	});
});
