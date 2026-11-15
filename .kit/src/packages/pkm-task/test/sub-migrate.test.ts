import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { TaskIndex } from "../src/core/index";
import { lintVault } from "../src/core/lint";
import { collectVault } from "../src/core/load";
import { parseIssue } from "../src/core/schema";

const PARENT = `---\ntype: issue\nid: i-1\nsummary: 親\nstatus: open\nrelated: ["i-1#k3f9a2"]\n---\n\n## Note\n\n<!-- sub-issue\nid: k3f9a2\nsummary: 元の子\nstatus: open\ncreated: 2026-10-01T10:00:00+09:00\nmigrated_from: i-2\n-->\n`;

function vault(extra: { worklog?: string; statuslog?: string; board?: string; other?: string } = {}) {
	return collectVault({
		markdown: [
			{ path: "issue/i-1.md", frontmatter: parse(/^---\n([\s\S]*?)\n---/.exec(PARENT)![1]!) as Record<string, unknown>, text: PARENT },
			...(extra.other ? [{ path: "issue/i-3.md", frontmatter: parse(extra.other) as Record<string, unknown>, text: `---\n${extra.other}\n---\n` }] : []),
		],
		worklogs: extra.worklog ? [{ path: "worklog/pc/2026-10.jsonl", text: extra.worklog }] : [],
		statusLogs: extra.statuslog ? [{ path: "statuslog/pc/2026-10.jsonl", text: extra.statuslog }] : [],
		boardLogs: extra.board ? [{ path: "board/pc/2026-10.jsonl", text: extra.board }] : [],
		labels: null,
		parseYaml: parse,
	});
}

describe("移行で変換したサブ（migrated_from）", () => {
	it("旧 ID の worklog の行を、そのサブの行として読む（jsonl は書き換えない）", () => {
		const { data, problems } = vault({
			worklog: '{"id":"wl_1","task_id":"i-2","from":"2026-10-01T01:00:00Z","to":"2026-10-01T02:00:00Z","description":""}\n',
		});
		expect(problems).toEqual([]);
		expect(data.worklogs.map((l) => [l.taskId, l.sub])).toEqual([["i-1", "k3f9a2"]]);
		const index = new TaskIndex(data);
		expect(index.effortByKey(Date.parse("2026-10-02T00:00:00Z")).get("i-1#k3f9a2")).toBe(60);
		expect(index.effortMinutes(Date.parse("2026-10-02T00:00:00Z")).get("i-1")).toBe(60);
		expect(lintVault(data)).toEqual([]);
	});

	it("旧 ID の statuslog の行を、そのサブの記録として読み、親の履歴に混ぜない", () => {
		const { data } = vault({
			statuslog: '{"id":"st_1","at":"2026-10-01T01:00:00.000Z","task":"i-2","from":"open","to":"closed","via":"ui"}\n',
		});
		expect(data.statusLogs.map((e) => [e.task, e.sub])).toEqual([["i-1", "k3f9a2"]]);
		expect(new TaskIndex(data).lastStatusLog("i-1")).toBeUndefined();
	});

	it("過去のボードに残る旧 ID は、ない issue の警告にしない", () => {
		const { data } = vault({
			board: '{"id":"bl_1","at":"2026-10-01T01:00:00.000Z","date":"2026-10-01","op":"add","task":"i-2"}\n{"id":"bl_2","at":"2026-10-01T01:00:01.000Z","date":"2026-10-01","op":"add","task":"i-9"}\n',
		});
		expect(lintVault(data).map((p) => `${p.code} ${p.message}`)).toEqual(["dangling-board-issue ボードに載っている i-9 がありません"]);
	});
});

describe("related の合成キー", () => {
	it("あるサブを指せば通り、ないサブはエラー", () => {
		expect(lintVault(vault().data)).toEqual([]);
		const { data } = vault({ other: 'type: issue\nid: i-3\nsummary: x\nstatus: open\nrelated: ["i-1#zzzzzz", "i-1#k3f9a2"]' });
		expect(lintVault(data).map((p) => `${p.path} ${p.code}`)).toEqual(["issue/i-3.md dangling-related"]);
	});
});

describe("parent の廃止", () => {
	it("frontmatter に parent が残っていたら legacy-parent のエラーにし、移行を案内する", () => {
		const { value, problems } = parseIssue("issue/i-2.md", { type: "issue", id: "i-2", summary: "x", status: "open", parent: "i-1" });
		expect(value).not.toHaveProperty("parent");
		expect(problems.map((p) => p.code)).toEqual(["legacy-parent"]);
		expect(problems[0]!.message).toContain("0135-sub-issues");
	});
});
