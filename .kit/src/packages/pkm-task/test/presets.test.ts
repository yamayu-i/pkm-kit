import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { parse } from "yaml";
import { pathForId } from "../src/core/ids";
import { TaskIndex } from "../src/core/index";
import { collectVault, fileKind } from "../src/core/load";
import { matchPreset, newPresetContent, parsePreset, presetBodyError, presetBodyOf, presetBodyPreview, presetSubError } from "../src/core/presets";
import { appendParentBodyText, parseSubIssues } from "../src/core/sub-issue";
import type { TaskStore } from "../src/obsidian/store";
import { TaskWriter } from "../src/obsidian/writer";

vi.mock("obsidian", async () => {
	const yaml = await import("yaml");
	return { TFile: class {}, normalizePath: (path: string) => path, parseYaml: yaml.parse };
});

const HEAD = "---\ntype: issue\nid: i-1\nsummary: 親\nstatus: open\n---\n\n## Note\n\n親の本文\n";
const block = (id: string, extra = "") => `<!-- sub-issue\nid: ${id}\nsummary: ${id}\nstatus: open\n${extra}-->\n`;
const subsOf = (text: string) => parseSubIssues("issue/i-1.md", "i-1", text, parse).subs;
const fmOf = (text: string) => parse(/^---\n([\s\S]*?)\n---/.exec(text)![1]!) as Record<string, unknown>;
const PRESET = '---\ntype: preset\nid: p-1\nname: "Release"\nsub_issues:\n  - "Changelog"\n  - "Tag"\n---\n\n## Checklist\n\n- [ ] done\n';

describe("プリセットの md（ADR-0186）", () => {
	it("preset/ の md を索引に読み、本文は frontmatter の後ろ", () => {
		expect(fileKind("preset/p-1.md")).toBe("preset");
		expect(pathForId("p-3")).toBe("preset/p-3.md");
		const { data, problems } = collectVault({ markdown: [{ path: "preset/p-1.md", frontmatter: fmOf(PRESET), text: PRESET }], worklogs: [], labels: null });
		expect(problems).toEqual([]);
		expect(data.presets).toEqual([{ path: "preset/p-1.md", id: "p-1", name: "Release", subIssues: ["Changelog", "Tag"], body: "## Checklist\n\n- [ ] done", created: null }]);
	});

	it("作る md は読める。sub_issues は空、本文も空", () => {
		const text = newPresetContent("p-2", "引っ越し", "2026-11-16T10:00:00+09:00");
		const r = parsePreset("preset/p-2.md", fmOf(text), text);
		expect(r.problems).toEqual([]);
		expect(r.value).toMatchObject({ id: "p-2", name: "引っ越し", subIssues: [], body: "" });
	});

	it("書けない題・本文の区切り・ID の誤りは問題にする。重なる題はそのまま残す", () => {
		const text = '---\ntype: preset\nid: p-1\nname: a\nsub_issues: ["x", "x", "a --> b", 3]\n---\n<!-- sub-issue\n';
		const r = parsePreset("preset/p-1.md", fmOf(text), text);
		expect(r.value).toMatchObject({ subIssues: ["x", "x"], body: "" });
		expect(r.problems.map((p) => p.code)).toEqual(["invalid-preset-sub", "invalid-preset-sub", "invalid-preset-body"]);
		expect(parsePreset("preset/x.md", { type: "preset", id: "x" }, "").value).toBeNull();
	});

	it("題と本文の検査", () => {
		expect(presetSubError("")).not.toBeNull();
		expect(presetSubError("a\nb")).not.toBeNull();
		expect(presetSubError("a --> b")).not.toBeNull();
		expect(presetSubError("仕様を書く")).toBeNull();
		expect(presetBodyError("x\n<!-- sub-issue\n")).not.toBeNull();
		expect(presetBodyError("x <!-- sub-issue")).toBeNull();
	});

	it("本文と一覧の補足", () => {
		expect(presetBodyOf("---\na: 1\n---\n\n\nbody\n\n")).toBe("body");
		expect(presetBodyOf("no frontmatter")).toBe("no frontmatter");
		expect(presetBodyPreview("\n## 確認\n\n- a")).toBe("確認");
		const p = { path: "", id: "p-1", name: "Release", subIssues: ["Tag"], body: "Checklist", created: null };
		expect(matchPreset(p, "tag")).toBe(true);
		expect(matchPreset(p, "check")).toBe(true);
		expect(matchPreset(p, "zzz")).toBe(false);
	});
});

describe("親の本文の末尾に追記する", () => {
	it("サブがなければ、本文の末尾に空行を挟んで足す", () => {
		expect(appendParentBodyText(HEAD, "## Checklist\n\n- [ ] a\n")).toBe(`${HEAD}\n## Checklist\n\n- [ ] a\n`);
	});

	it("サブがあれば、サブの領域の前に足し、サブは変えない", () => {
		const text = `${HEAD}\n${block("aaaaaa")}本文 a\n\n${block("bbbbbb")}`;
		const next = appendParentBodyText(text, "追記");
		expect(next).toBe(`${HEAD}\n追記\n\n${block("aaaaaa")}本文 a\n\n${block("bbbbbb")}`);
		expect(subsOf(next)).toEqual(subsOf(text));
	});

	it("frontmatter だけでも書ける。空の本文なら元のまま", () => {
		const fm = "---\ntype: issue\nid: i-1\nsummary: 親\nstatus: open\n---\n";
		expect(appendParentBodyText(fm, "x")).toBe(`${fm}\nx\n`);
		expect(appendParentBodyText(HEAD, " \n\n")).toBe(HEAD);
		expect(() => appendParentBodyText(HEAD, "<!-- sub-issue\n")).toThrow();
	});
});

function fixture(initial: string) {
	const texts = new Map<string, string>([["issue/i-1.md", initial]]);
	const store = {
		get index() {
			const markdown = [...texts].filter(([p]) => p.endsWith(".md")).map(([path, t]) => ({ path, text: t, frontmatter: fmOf(t) }));
			return new TaskIndex(collectVault({ markdown, worklogs: [], labels: null, parseYaml: parse }).data);
		},
		problems: [],
		refreshSoon: vi.fn(),
	} as unknown as TaskStore;
	const vault = {
		getFileByPath: (path: string) => (texts.has(path) ? { path } : null),
		getFolderByPath: () => null,
		getMarkdownFiles: () => [...texts.keys()].map((path) => ({ path, basename: path.replace(/^.*\//, "").replace(/\.md$/, "") })),
		createFolder: vi.fn(),
		create: vi.fn(async (path: string, t: string) => {
			texts.set(path, t);
			return { path };
		}),
		process: vi.fn(async (file: { path: string }, edit: (t: string) => string) => {
			texts.set(file.path, edit(texts.get(file.path) ?? ""));
		}),
	};
	const app = { vault, fileManager: {} } as unknown as App;
	return { writer: new TaskWriter(app, store, () => "pc"), texts, vault, store, text: () => texts.get("issue/i-1.md")! };
}

describe("writer のプリセット（ADR-0186）", () => {
	const preset = { subIssues: ["Changelog", "Tag"], body: "## Checklist\n\n- [ ] done" };

	it("作ると preset/p-N.md を連番で作る", async () => {
		const f = fixture(HEAD);
		expect(await f.writer.createPreset("Release")).toBe("p-1");
		expect(await f.writer.createPreset("Move")).toBe("p-2");
		expect(f.vault.createFolder).toHaveBeenCalledWith("preset");
		expect(f.store.index.data.presets.map((p) => [p.id, p.name])).toEqual([
			["p-1", "Release"],
			["p-2", "Move"],
		]);
	});

	it("当てると、1 回の書き込みでサブを末尾へ足し、本文を親の本文の末尾に追記する", async () => {
		const f = fixture(`${HEAD}\n${block("aaaaaa")}既存のサブの本文\n`);
		const keys = await f.writer.applyPreset("i-1", preset);
		expect(f.vault.process).toHaveBeenCalledTimes(1);
		expect(keys).toHaveLength(2);
		const subs = subsOf(f.text());
		expect(subs.map((s) => [s.summary, s.status])).toEqual([
			["aaaaaa", "open"],
			["Changelog", "open"],
			["Tag", "open"],
		]);
		expect(subs[0]!.body).toBe("既存のサブの本文");
		expect(f.text().startsWith(`${HEAD}\n## Checklist\n\n- [ ] done\n\n<!-- sub-issue\nid: aaaaaa`)).toBe(true);
	});

	it("索引のプリセット（md から読んだもの）をそのまま当てられる", async () => {
		const f = fixture(HEAD);
		f.texts.set("preset/p-1.md", PRESET);
		await f.writer.applyPreset("i-1", f.store.index.data.presets[0]!);
		expect(subsOf(f.text()).map((s) => s.summary)).toEqual(["Changelog", "Tag"]);
		expect(f.text().startsWith(`${HEAD}\n## Checklist\n\n- [ ] done\n\n<!-- sub-issue`)).toBe(true);
	});

	it("サブのないプリセットは本文だけ、本文のないプリセットはサブだけを足す", async () => {
		const f = fixture(HEAD);
		await f.writer.applyPreset("i-1", { subIssues: [], body: "追記" });
		expect(f.text()).toBe(`${HEAD}\n追記\n`);
		await f.writer.applyPreset("i-1", { subIssues: ["x"], body: "" });
		expect(f.text().startsWith(`${HEAD}\n追記\n\n<!-- sub-issue`)).toBe(true);
		expect(subsOf(f.text()).map((s) => s.summary)).toEqual(["x"]);
	});

	it("書けない題があれば何も書かない", async () => {
		const f = fixture(HEAD);
		await expect(f.writer.applyPreset("i-1", { subIssues: ["a --> b"], body: "x" })).rejects.toThrow();
		expect(f.text()).toBe(HEAD);
	});
});
