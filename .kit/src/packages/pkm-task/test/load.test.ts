import { describe, expect, it } from "vitest";
import { localDateTime } from "../src/core/dates";
import { dueLevel } from "../src/core/due";
import { newIssueContent, newMemberContent, newRoutineContent } from "../src/core/issue-file";
import { collectVault, fileKind } from "../src/core/load";
import { parseIssue } from "../src/core/schema";
import { parse } from "yaml";

describe("fileKind", () => {
	it("パスからデータの種類を決める", () => {
		expect(fileKind("issue/i-1.md")).toBe("issue");
		expect(fileKind("issue/labels.json")).toBe("labels");
		expect(fileKind("routine/r-1.md")).toBe("routine");
		expect(fileKind("member/m-1.md")).toBe("member");
		expect(fileKind("worklog/iphone/2026-10.jsonl")).toBe("worklog");
		expect(fileKind("worklog/2026-10.jsonl")).toBeNull();
		expect(fileKind("issue/sub/i-1.md")).toBeNull();
		expect(fileKind("daily/2026/10/2026-10-31.md")).toBe("daily");
		expect(fileKind("issue/board-groups.json")).toBe("groups");
		expect(fileKind("daily/2026-10-31.md")).toBeNull();
	});
});

describe("collectVault", () => {
	it("種類ごとに読み分け、frontmatter がないものは報告する", () => {
		const { data, problems } = collectVault({
			markdown: [
				{ path: "issue/i-10.md", frontmatter: { type: "issue", id: "i-10", summary: "b", status: "open" } },
				{ path: "issue/i-2.md", frontmatter: { type: "issue", id: "i-2", summary: "a", status: "open" } },
				{ path: "issue/i-3.md", frontmatter: null },
				{ path: "member/m-1.md", frontmatter: { type: "member", id: "m-1", name: "佐藤" } },
				{ path: "notes/x.md", frontmatter: { type: "issue" } },
			],
			worklogs: [{ path: "worklog/pc/2026-10.jsonl", text: '{"id":"w","task_id":"i-2","from":"2026-10-31T10:00:00Z","to":null}\n' }],
			labels: '[{"name":"仕事","color":"#ff0000"},{"name":"私用"}]',
		});
		expect(data.issues.map((i) => i.id)).toEqual(["i-2", "i-10"]);
		expect(data.members.map((m) => m.name)).toEqual(["佐藤"]);
		expect(data.worklogs).toHaveLength(1);
		expect(data.labels).toEqual([
			{ name: "仕事", color: "#ff0000" },
			{ name: "私用", color: "#d0d0d0" },
		]);
		expect(problems.map((p) => `${p.path} ${p.code}`)).toEqual(["issue/i-3.md missing-frontmatter"]);
	});
});

describe("newIssueContent", () => {
	it("作った md は YAML として読めて、そのまま issue になる", () => {
		const created = localDateTime(new Date("2026-10-31T01:02:03Z"));
		const text = newIssueContent("i-5", 'コロン: と "引用符" と #', created, "i-1");
		const fm = parse(/^---\n([\s\S]*?)\n---/.exec(text)![1]!) as Record<string, unknown>;
		const { value, problems } = parseIssue("issue/i-5.md", fm);
		expect(problems).toEqual([]);
		expect(value).toMatchObject({ id: "i-5", summary: 'コロン: と "引用符" と #', status: "open", parent: "i-1", created });
		expect(text).toContain("## ToDo\n\n- [ ] \n\n## Description\n\n## Note\n");
		expect(fm.updated).toBe(created);
	});

	it("member と routine も作成時に updated を created と同じ値で入れる", () => {
		const created = "2026-11-01T08:00:00+09:00";
		const member = parse(/^---\n([\s\S]*?)\n---/.exec(newMemberContent("m-1", "山田", created))![1]!) as Record<string, unknown>;
		expect(member).toMatchObject({ type: "member", id: "m-1", name: "山田", created, updated: created });
		const routine = parse(
			/^---\n([\s\S]*?)\n---/.exec(newRoutineContent("r-1", "週次", { every: "week", on: ["mon"] }, created))![1]!,
		) as Record<string, unknown>;
		expect(routine).toMatchObject({ type: "routine", id: "r-1", created, updated: created });
	});

	it("localDateTime はタイムゾーン付き", () => {
		expect(localDateTime(new Date())).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
	});
});

describe("dueLevel", () => {
	const issue = (status: string) => parseIssue("issue/i-1.md", { type: "issue", id: "i-1", status }).value!;
	it("3 日前から段階的に、過ぎたら overdue。閉じたものは none", () => {
		const open = issue("open");
		expect(dueLevel(open, "2026-11-04", "2026-10-31")).toBe("none");
		expect(dueLevel(open, "2026-11-03", "2026-10-31")).toBe("3");
		expect(dueLevel(open, "2026-10-31", "2026-10-31")).toBe("0");
		expect(dueLevel(open, "2026-10-30", "2026-10-31")).toBe("overdue");
		expect(dueLevel(open, null, "2026-10-31")).toBe("none");
		expect(dueLevel(issue("closed"), "2026-10-31", "2026-10-31")).toBe("none");
		expect(dueLevel(issue("someday"), "2026-10-31", "2026-10-31")).toBe("none");
	});
});
