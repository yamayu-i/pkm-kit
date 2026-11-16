import { describe, expect, it, vi } from "vitest";

vi.mock("obsidian", () => ({ SuggestModal: class {}, Keymap: {}, MarkdownRenderChild: class {}, editorInfoField: {}, editorLivePreviewField: {}, setIcon: () => {} }));
import { emptyVaultData, TaskIndex } from "../src/core/index";
import type { Issue, Member, Routine } from "../src/core/schema";
import type { SubIssue } from "../src/core/sub-issue";
import type { TaskContext } from "../src/obsidian/context";
import { chipFor } from "../src/obsidian/link-insert";

const data = emptyVaultData();
data.issues.push({ id: "i-12", path: "issue/i-12.md", summary: "仕様", status: "closed" } as Issue);
data.subIssues.push({ parent: "i-12", path: "issue/i-12.md", id: "k3f9a2", key: "i-12#k3f9a2", summary: "書く", status: "open" } as SubIssue);
data.routines.push({ id: "r-1", path: "routine/r-1.md", summary: "週報", active: true } as Routine);
data.members.push({ id: "m-1", path: "member/m-1.md", name: "山田", nickname: "やまだ", alias: "y" } as Member);
const files = new Set(["issue/i-12.md", "routine/r-1.md", "member/m-1.md", "wiki/a.md"]);
const ctx = {
	store: { index: new TaskIndex(data) },
	app: { vault: { getFileByPath: (p: string) => (files.has(p) ? { path: p } : null) }, metadataCache: { getFirstLinkpathDest: () => null } },
} as unknown as TaskContext;
const chip = (path: string, anchor = "") => chipFor(ctx, { path, anchor, text: "", source: "note.md" });

describe("pkm-task のチップ（ADR-0194）", () => {
	it("issue・sub-issue・routine・member は置き換える。題と status を key に持つ", () => {
		expect(chip("issue/i-12.md")).toMatchObject({ mode: "replace", key: "i-12|closed|仕様", open: "issue/i-12.md" });
		expect(chip("issue/i-12.md", "k3f9a2")).toMatchObject({ mode: "replace", key: "i-12#k3f9a2|open|書く|仕様" });
		expect(chip("routine/r-1.md")?.mode).toBe("replace");
		expect(chip("member/m-1.md")?.mode).toBe("replace");
	});
	it("知らないサブのアンカーは issue のチップ。索引にないもの・ほかのノートは描き替えない", () => {
		expect(chip("issue/i-12.md", "zzzzzz")?.key).toBe("i-12|closed|仕様");
		expect(chip("issue/i-99.md")).toBeNull();
		expect(chip("wiki/a.md")).toBeNull();
	});
});
