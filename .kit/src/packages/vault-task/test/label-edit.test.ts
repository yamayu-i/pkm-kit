import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { TaskIndex, emptyVaultData } from "../src/core/index";
import { labelColorError, labelNameError, labelUsage, planLabelSave, renameLabelField, type LabelDraft } from "../src/core/label-edit";
import { LABELS_PATH, parseLabels, serializeLabels, type LabelDef } from "../src/core/labels";
import { parseIssue, parseRoutine } from "../src/core/schema";
import type { Problem } from "../src/core/problem";
import type { TaskStore } from "../src/obsidian/store";
import { TaskWriter } from "../src/obsidian/writer";

vi.mock("obsidian", () => ({ TFile: class {}, normalizePath: (path: string) => path }));

const issue = (id: string, label: unknown) => parseIssue(`issue/${id}.md`, { type: "issue", id, summary: id, status: "open", label }).value!;
const routine = (id: string, label: unknown) => parseRoutine(`routine/${id}.md`, { type: "routine", id, summary: id, repeat: { every: "day" }, label }).value!;

let key = 1;
const draft = (from: string | null, name: string, color = "#d0d0d0"): LabelDraft => ({ key: key++, from, name, color });

describe("label の名前の検査（ADR-0022）", () => {
	it("空と、前後の空白を除いた重複はエラー", () => {
		expect(labelNameError("", [])).not.toBeNull();
		expect(labelNameError("  ", [])).not.toBeNull();
		expect(labelNameError(" 仕事 ", ["仕事"])).not.toBeNull();
		expect(labelNameError("仕事", ["私用"])).toBeNull();
	});
});

describe("label の色の検査（ADR-0022）", () => {
	it("16 進の 3 / 6 / 8 桁でなければエラー", () => {
		expect(labelColorError("d0d0d0")).not.toBeNull();
		expect(labelColorError("#d0d0d")).not.toBeNull();
		expect(labelColorError("#zzzzzz")).not.toBeNull();
		expect(labelColorError("#d0d0d0")).toBeNull();
		expect(labelColorError("#ddd")).toBeNull();
	});

	it("文字とのコントラストが足りなければエラー（low-contrast-label と同じ基準）", () => {
		expect(labelColorError("#555555")).toMatch(/4\.5/);
		expect(labelColorError("#00000080")).not.toBeNull();
	});
});

describe("label の使用件数", () => {
	it("issue と routine の両方を数える", () => {
		const index = new TaskIndex({ ...emptyVaultData(), issues: [issue("i-1", ["仕事", "急ぎ"]), issue("i-2", "仕事")], routines: [routine("r-1", ["仕事"])] });
		const usage = labelUsage(index);
		expect(usage.get("仕事")).toBe(3);
		expect(usage.get("急ぎ")).toBe(1);
		expect(usage.get("私用")).toBeUndefined();
	});
});

describe("frontmatter の label 欄の書き換え", () => {
	const renames = new Map([["仕事", "work"], ["私用", "home"]]);

	it("改名した名前だけを置き換え、ほかの値は残す", () => {
		expect(renameLabelField(["仕事", "急ぎ"], renames)).toEqual(["work", "急ぎ"]);
		expect(renameLabelField("仕事", renames)).toBe("work");
	});

	it("置き換えて重なった名前は 1 つにまとめる", () => {
		expect(renameLabelField(["仕事", "work"], renames)).toEqual(["work"]);
	});

	it("名前を入れ替えても、それぞれ 1 回だけ置き換える", () => {
		const swap = new Map([["a", "b"], ["b", "a"]]);
		expect(renameLabelField(["a", "b"], swap)).toEqual(["b", "a"]);
	});

	it("変わらないなら undefined", () => {
		expect(renameLabelField(["急ぎ"], renames)).toBeUndefined();
		expect(renameLabelField(undefined, renames)).toBeUndefined();
		expect(renameLabelField(3, renames)).toBeUndefined();
	});
});

describe("保存内容の計画（ADR-0022）", () => {
	const original: LabelDef[] = [
		{ name: "仕事", color: "#d0d0d0" },
		{ name: "私用", color: "#c0e0c0" },
		{ name: "古い", color: "#d0d0d0" },
	];

	it("並べ替え・改名・色・追加・使われていない label の削除", () => {
		const plan = planLabelSave(original, [draft("私用", "home", "#e0e0f0"), draft("仕事", " 仕事 "), draft(null, "新規")], new Map([["仕事", 2], ["私用", 1]]));
		expect(plan.labels).toEqual([
			{ name: "home", color: "#e0e0f0" },
			{ name: "仕事", color: "#d0d0d0" },
			{ name: "新規", color: "#d0d0d0" },
		]);
		expect([...plan.renames]).toEqual([["私用", "home"]]);
		expect(plan.removed).toEqual(["古い"]);
	});

	it("使われている label は削除できない", () => {
		expect(() => planLabelSave(original, [draft("仕事", "仕事"), draft("古い", "古い")], new Map([["私用", 1]]))).toThrow(/私用/);
	});

	it("名前か色にエラーがあれば保存しない", () => {
		expect(() => planLabelSave(original, [draft("仕事", "仕事"), draft("私用", "仕事"), draft("古い", "古い")], new Map())).toThrow();
		expect(() => planLabelSave(original, [draft("仕事", "仕事", "#555555"), draft("私用", "私用"), draft("古い", "古い")], new Map())).toThrow();
	});
});

describe("labels.json の書き出し", () => {
	it("読み直すと同じになる", () => {
		const labels = [{ name: "仕事", color: "#d0d0d0" }, { name: "私用", color: "#c0e0c0" }];
		expect(parseLabels(serializeLabels(labels)).labels).toEqual(labels);
		expect(serializeLabels(labels).endsWith("\n")).toBe(true);
	});
});

describe("TaskWriter.saveLabels", () => {
	function fixture(problems: Problem[] = []) {
		const labels: LabelDef[] = [{ name: "仕事", color: "#d0d0d0" }, { name: "古い", color: "#d0d0d0" }];
		const frontmatters = new Map<string, Record<string, unknown>>([
			["issue/i-1.md", { label: ["仕事", "急ぎ"] }],
			["issue/i-2.md", { label: ["急ぎ"] }],
			["routine/r-1.md", { label: "仕事" }],
		]);
		const index = new TaskIndex({
			...emptyVaultData(),
			labels,
			issues: [issue("i-1", ["仕事", "急ぎ"]), issue("i-2", ["急ぎ"])],
			routines: [routine("r-1", "仕事")],
		});
		const texts = new Map<string, string>([[LABELS_PATH, serializeLabels(labels)]]);
		const order: string[] = [];
		const vault = {
			getFileByPath: (path: string) => (texts.has(path) || frontmatters.has(path) ? { path } : null),
			getFolderByPath: () => ({}),
			create: vi.fn(async (path: string, text: string) => {
				texts.set(path, text);
				return { path };
			}),
			modify: vi.fn(async (file: { path: string }, text: string) => {
				order.push(file.path);
				texts.set(file.path, text);
			}),
		};
		const processFrontMatter = vi.fn(async (file: { path: string }, fn: (fm: Record<string, unknown>) => void) => {
			order.push(file.path);
			fn(frontmatters.get(file.path)!);
		});
		const store = { index, problems, refreshSoon: vi.fn() } as unknown as TaskStore;
		const app = { vault, fileManager: { processFrontMatter } } as unknown as App;
		return { writer: new TaskWriter(app, store), texts, frontmatters, order, processFrontMatter };
	}

	it("改名した label が付いた issue と routine を書き換えてから labels.json を書く", async () => {
		const f = fixture();
		await f.writer.saveLabels({ labels: [{ name: "work", color: "#d0d0d0" }], renames: new Map([["仕事", "work"]]), removed: ["古い"] });
		expect(f.frontmatters.get("issue/i-1.md")!.label).toEqual(["work", "急ぎ"]);
		expect(f.frontmatters.get("routine/r-1.md")!.label).toBe("work");
		expect(f.processFrontMatter).toHaveBeenCalledTimes(2);
		expect(f.order.at(-1)).toBe(LABELS_PATH);
		expect(parseLabels(f.texts.get(LABELS_PATH)!).labels).toEqual([{ name: "work", color: "#d0d0d0" }]);
	});

	it("使われている label を消そうとしたら何も書かない", async () => {
		const f = fixture();
		await expect(f.writer.saveLabels({ labels: [], renames: new Map(), removed: ["仕事"] })).rejects.toThrow(/仕事/);
		expect(f.order).toEqual([]);
	});

	it("labels.json に読めない定義があるなら保存しない", async () => {
		const f = fixture([{ severity: "error", path: LABELS_PATH, code: "invalid-labels", message: "x" }]);
		await expect(f.writer.saveLabels({ labels: [], renames: new Map(), removed: [] })).rejects.toThrow();
		expect(f.order).toEqual([]);
	});
});
