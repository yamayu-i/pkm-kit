import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { callMcpTool, type McpContext } from "../cli/mcp";
import { readVault } from "../cli/read-vault";
import { TaskIndex } from "../src/core/index";

const now = new Date("2026-11-15T01:00:00.000Z");
// 親は整理済み（Inbox の Project のサブには期間を入れられない。ADR-0210）
const HEAD = "---\ntype: issue\nid: i-1\nsummary: 親\nstatus: open\nclarified: true\nestimated: 300\n---\n\n## Note\n\n親の本文\n";

describe("MCP のサブイシューの操作（ADR-0135）", () => {
	let root: string;
	let ctx: McpContext;
	const read = () => readFileSync(join(root, "issue/i-1.md"), "utf8");
	const subs = () => new TaskIndex(readVault(root).data).subs("i-1");

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "vault-sub-mcp-"));
		mkdirSync(join(root, "issue"));
		mkdirSync(join(root, "member"));
		writeFileSync(join(root, "issue/i-1.md"), HEAD);
		writeFileSync(join(root, "issue/i-2.md"), "---\ntype: issue\nid: i-2\nsummary: 別\nstatus: open\n---\n");
		writeFileSync(join(root, "member/m-1.md"), "---\ntype: member\nid: m-1\nname: 田中\n---\n");
		ctx = { root, device: "ai", now: () => now };
	});

	afterEach(() => rmSync(root, { recursive: true, force: true }));

	it("create_sub_issues で続けて足し、位置を指定して差し込める", () => {
		const r = callMcpTool(ctx, "create_sub_issues", { parent: "i-1", items: [{ summary: "仕様" }, { summary: "実装", estimated: 120, scheduled: "2026-11-16", body: "メモ" }] }) as { created: string[] };
		expect(r.created).toHaveLength(2);
		expect(subs().map((s) => [s.summary, s.status, s.estimated, s.scheduled, s.body, s.created])).toEqual([
			["仕様", "open", null, null, "# Note", subs()[0]!.created],
			["実装", "open", 120, "2026-11-16", "メモ", subs()[1]!.created],
		]);
		expect(subs().every((s) => s.created !== null)).toBe(true);
		callMcpTool(ctx, "create_sub_issues", { parent: "i-1", items: [{ summary: "前提" }], position: 0 });
		expect(subs().map((s) => s.summary)).toEqual(["前提", "仕様", "実装"]);
		expect(read().startsWith(HEAD)).toBe(true);
	});

	it("update_sub_issue で項目と本文を直し、status の変化を statuslog に書く", () => {
		const { created } = callMcpTool(ctx, "create_sub_issues", { parent: "i-1", items: [{ summary: "仕様" }, { summary: "実装" }] }) as { created: string[] };
		const key = created[1]!;
		const before = read();
		callMcpTool(ctx, "update_sub_issue", { key, summary: "実装する", status: "closed", start: "2026-11-16", end: "2026-11-20", body: "終わった" });
		const s = subs()[1]!;
		expect(s).toMatchObject({ summary: "実装する", status: "closed", start: "2026-11-16", end: "2026-11-20", body: "終わった" });
		expect(subs()[0]!.summary).toBe("仕様");
		expect(read().slice(0, before.indexOf("<!--"))).toBe(before.slice(0, before.indexOf("<!--")));
		expect(readFileSync(join(root, "statuslog/ai/2026-11.jsonl"), "utf8")).toContain(`"task":"i-1","sub":"${s.id}","from":"open","to":"closed","via":"mcp"`);
		// null で項目を消す
		callMcpTool(ctx, "update_sub_issue", { key, start: null, end: null });
		expect(subs()[1]).toMatchObject({ start: null, end: null });
	});

	it("サブの期限は end だけ。soft_deadline / deadline を渡すとエラーで、何も書かない（ADR-0190）", () => {
		const before = read();
		expect(() => callMcpTool(ctx, "create_sub_issues", { parent: "i-1", items: [{ summary: "x", deadline: "2026-11-20" }] })).toThrow("期限は end に入れてください");
		expect(read()).toBe(before);
		const { created } = callMcpTool(ctx, "create_sub_issues", { parent: "i-1", items: [{ summary: "x", end: "2026-11-20" }] }) as { created: string[] };
		const after = read();
		expect(() => callMcpTool(ctx, "update_sub_issue", { key: created[0], soft_deadline: "2026-11-18" })).toThrow("soft_deadline");
		expect(read()).toBe(after);
	});

	it("someday にすると Calendar の日と期間を外し、someday に期間を入れると open に戻す（ADR-0190）", () => {
		const { created } = callMcpTool(ctx, "create_sub_issues", { parent: "i-1", items: [{ summary: "x", start: "2026-11-16", end: "2026-11-20", scheduled: "2026-11-17" }] }) as { created: string[] };
		const key = created[0]!;
		callMcpTool(ctx, "update_sub_issue", { key, status: "someday" });
		expect(subs()[0]).toMatchObject({ status: "someday", start: null, end: null, scheduled: null });
		callMcpTool(ctx, "update_sub_issue", { key, end: "2026-11-25" });
		expect(subs()[0]).toMatchObject({ status: "open", end: "2026-11-25" });
		expect(readFileSync(join(root, "statuslog/ai/2026-11.jsonl"), "utf8")).toContain('"from":"someday","to":"open"');
		// canceled では期間を残す
		callMcpTool(ctx, "update_sub_issue", { key, status: "canceled" });
		expect(subs()[0]).toMatchObject({ status: "canceled", end: "2026-11-25" });
	});

	it("move_sub_issue で並べ替え、delete_sub_issue で消す（記録中のタイマーは止め、worklog の行は残す）", () => {
		const { created } = callMcpTool(ctx, "create_sub_issues", { parent: "i-1", items: [{ summary: "a" }, { summary: "b" }, { summary: "c" }] }) as { created: string[] };
		callMcpTool(ctx, "move_sub_issue", { key: created[2], position: 0 });
		expect(subs().map((s) => s.summary)).toEqual(["c", "a", "b"]);
		callMcpTool(ctx, "start_timer", { task_ids: [created[0]] });
		// 1 分未満の記録は止めると消える（MIN_WORKLOG_MS）ので、30 分後に消す
		callMcpTool({ ...ctx, now: () => new Date(now.getTime() + 30 * 60_000) }, "delete_sub_issue", { key: created[0] });
		expect(subs().map((s) => s.summary)).toEqual(["c", "b"]);
		const { data } = readVault(root);
		expect(data.worklogs).toHaveLength(1);
		expect(data.worklogs[0]!.toMs).not.toBeNull();
	});

	it("検査に通らない入力では何も書かない", () => {
		const { created } = callMcpTool(ctx, "create_sub_issues", { parent: "i-1", items: [{ summary: "a" }, { summary: "b" }] }) as { created: string[] };
		const [a, b] = created.map((k) => k.split("#")[1]!);
		const before = read();
		const bad: [string, Record<string, unknown>][] = [
			["create_sub_issues", { parent: "i-9", items: [{ summary: "x" }] }],
			["create_sub_issues", { parent: "i-1", items: [] }],
			["create_sub_issues", { parent: "i-1", items: [{ summary: "" }] }],
			["create_sub_issues", { parent: "i-1", items: [{ summary: "x", status: "done" }] }],
			["create_sub_issues", { parent: "i-1", items: [{ summary: "x", start: "明日" }] }],
			["create_sub_issues", { parent: "i-1", items: [{ summary: "x", depends_on: ["zzzzzz"] }] }],
			["create_sub_issues", { parent: "i-1", items: [{ summary: "a --> b" }] }],
			["update_sub_issue", { key: "i-1#zzzzzz", status: "closed" }],
			["update_sub_issue", { key: created[0], status: "delegated" }],
			["update_sub_issue", { key: created[0], status: "delegated", delegated_to: "m-9" }],
			["update_sub_issue", { key: created[0], depends_on: [a] }],
			["update_sub_issue", { key: created[0], depends_on: [b] }],
			["update_sub_issue", { key: created[0], estimated: -1 }],
			["move_sub_issue", { key: created[0], position: 5 }],
			["delete_sub_issue", { key: "i-1#zzzzzz" }],
			// b が a に依存しているので、a は消せない
			["delete_sub_issue", { key: created[0] }],
		];
		callMcpTool(ctx, "update_sub_issue", { key: created[1], depends_on: [a] });
		const withDep = read();
		for (const [tool, args] of bad) expect(() => callMcpTool(ctx, tool, args), `${tool} ${JSON.stringify(args)}`).toThrow();
		expect(read()).toBe(withDep);
		expect(before).not.toBe(withDep);
		// 委任は member があれば通る
		callMcpTool(ctx, "update_sub_issue", { key: created[0], status: "delegated", delegated_to: "m-1" });
		expect(subs()[0]).toMatchObject({ status: "delegated", delegatedTo: "m-1" });
	});

	it("get_issue はサブと実績を返し、親子の欄を返さない", () => {
		const { created } = callMcpTool(ctx, "create_sub_issues", { parent: "i-1", items: [{ summary: "a", estimated: 30 }] }) as { created: string[] };
		mkdirSync(join(root, "worklog/ai"), { recursive: true });
		writeFileSync(
			join(root, "worklog/ai/2026-11.jsonl"),
			`{"id":"wl_a","task_id":"i-1","sub":"${created[0]!.split("#")[1]}","from":"2026-11-15T00:00:00Z","to":"2026-11-15T00:30:00Z","description":""}\n{"id":"wl_b","task_id":"i-1","from":"2026-11-15T00:30:00Z","to":"2026-11-15T00:40:00Z","description":""}\n`,
		);
		const r = callMcpTool(ctx, "get_issue", { id: "i-1" }) as Record<string, unknown>;
		expect(r).not.toHaveProperty("ancestors");
		expect(r).not.toHaveProperty("children");
		expect(r.effortMinutes).toBe(40);
		expect(r.directEffortMinutes).toBe(10);
		expect(r.subIssues).toEqual([expect.objectContaining({ key: created[0], summary: "a", estimated: 30, effortMinutes: 30, body: "# Note" })]);
		expect(String(r.body)).not.toContain("<!-- sub-issue");
	});

	it("create_issue・update_issue・list_issues は parent を受け付けない", () => {
		expect(() => callMcpTool(ctx, "create_issue", { summary: "x", parent: "i-1" })).toThrow(/parent/);
		expect(() => callMcpTool(ctx, "update_issue", { id: "i-2", parent: "i-1" })).toThrow(/parent/);
		expect(() => callMcpTool(ctx, "list_issues", { parent: "i-1" })).toThrow(/parent/);
	});
});

describe("MCP も遷移表を通す（ADR-0183）", () => {
	let root: string;
	let ctx: McpContext;
	const index = () => new TaskIndex(readVault(root).data);

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "vault-transition-mcp-"));
		mkdirSync(join(root, "issue"));
		mkdirSync(join(root, "member"));
		writeFileSync(join(root, "issue/i-1.md"), "---\ntype: issue\nid: i-1\nsummary: 親\nstatus: waiting\ndeadline: 2026-11-30\ntickler: 2026-11-20\n---\n");
		writeFileSync(join(root, "member/m-1.md"), "---\ntype: member\nid: m-1\nname: 田中\n---\n");
		ctx = { root, device: "ai", now: () => now };
	});

	afterEach(() => rmSync(root, { recursive: true, force: true }));

	it("update_issue は表にない遷移をエラーにし、移れる先を返す", () => {
		expect(() => callMcpTool(ctx, "update_issue", { id: "i-1", status: "open" })).toThrow(/移れる先: in-progress, someday, closed, canceled/);
		expect(() => callMcpTool(ctx, "update_issue", { id: "i-1", status: "delegated", delegated_to: "m-1" })).toThrow(/移れる先/);
		expect(index().issues.get("i-1")!.status).toBe("waiting");
	});

	it("update_issue の付随の変更は画面と同じ表（canceled は期限と Tickler を消す）", () => {
		callMcpTool(ctx, "update_issue", { id: "i-1", status: "canceled" });
		expect(index().issues.get("i-1")).toMatchObject({ status: "canceled", deadline: null, tickler: null });
		// closed / canceled からは閉じる前（waiting）にだけ戻せる
		expect(() => callMcpTool(ctx, "update_issue", { id: "i-1", status: "in-progress" })).toThrow(/waiting（Reopen）/);
		callMcpTool(ctx, "update_issue", { id: "i-1", status: "waiting" });
		expect(index().issues.get("i-1")!.status).toBe("waiting");
	});

	it("update_sub_issue も表にない遷移をエラーにする", () => {
		const { created } = callMcpTool(ctx, "create_sub_issues", { parent: "i-1", items: [{ summary: "a" }] }) as { created: string[] };
		const key = created[0]!;
		callMcpTool(ctx, "update_sub_issue", { key, status: "in-progress" });
		expect(() => callMcpTool(ctx, "update_sub_issue", { key, status: "open" })).toThrow(/in-progress から open/);
		callMcpTool(ctx, "update_sub_issue", { key, status: "someday" });
		expect(index().sub(key)!.status).toBe("someday");
	});
});

describe("MCP の Tickler は open だけ（ADR-0183）", () => {
	let root: string;
	let ctx: McpContext;
	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "vault-tickler-mcp-"));
		mkdirSync(join(root, "issue"));
		writeFileSync(join(root, "issue/i-1.md"), "---\ntype: issue\nid: i-1\nsummary: 作業中\nstatus: in-progress\n---\n");
		writeFileSync(join(root, "issue/i-2.md"), "---\ntype: issue\nid: i-2\nsummary: 未着手\nstatus: open\nclarified: true\n---\n");
		ctx = { root, device: "ai", now: () => now };
	});
	afterEach(() => rmSync(root, { recursive: true, force: true }));

	it("update_issue で open でないものに付けるとエラー。open には付けられる", () => {
		expect(() => callMcpTool(ctx, "update_issue", { id: "i-1", tickler: "2026-11-20" })).toThrow(/Tickler は open/);
		callMcpTool(ctx, "update_issue", { id: "i-2", tickler: "2026-11-20" });
		expect(new TaskIndex(readVault(root).data).issues.get("i-2")!.tickler).toBe("2026-11-20");
	});
});

describe("MCP の Inbox に戻す（ADR-0189）", () => {
	let root: string;
	let ctx: McpContext;
	const issueOf = (id: string) => new TaskIndex(readVault(root).data).issues.get(id)!;
	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "vault-inbox-mcp-"));
		mkdirSync(join(root, "issue"));
		writeFileSync(join(root, "issue/i-1.md"), "---\ntype: issue\nid: i-1\nsummary: 作業中\nstatus: in-progress\n---\n");
		writeFileSync(join(root, "issue/i-2.md"), "---\ntype: issue\nid: i-2\nsummary: 未着手\nstatus: open\nclarified: true\n---\n");
		writeFileSync(join(root, "issue/i-3.md"), "---\ntype: issue\nid: i-3\nsummary: いつか\nstatus: someday\nclarified: true\n---\n");
		ctx = { root, device: "ai", now: () => now };
	});
	afterEach(() => rmSync(root, { recursive: true, force: true }));

	it("clarified を外せるのは open だけ。carry_issues に inbox はない", () => {
		expect(() => callMcpTool(ctx, "update_issue", { id: "i-1", clarified: false })).toThrow(/open の issue だけ/);
		callMcpTool(ctx, "update_issue", { id: "i-2", clarified: false });
		expect(issueOf("i-2").clarified).toBe(false);
		expect(() => callMcpTool(ctx, "carry_issues", { date: "2026-11-15", issue_ids: ["i-2"], mode: "inbox" })).toThrow(/inbox はありません/);
	});

	it("someday に期限を入れて戻すと、clarified を外して Inbox に入れる", () => {
		callMcpTool(ctx, "update_issue", { id: "i-3", deadline: "2026-11-30" });
		expect(issueOf("i-3")).toMatchObject({ status: "open", clarified: false, deadline: "2026-11-30" });
	});
});

describe("MCP で Calendar とサブを同時に持たせない（ADR-0203）", () => {
	let root: string;
	let ctx: McpContext;
	const SUB = "<!-- sub-issue\nid: aaaaaa\nsummary: サブ\nstatus: closed\n-->\n";
	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "vault-calendar-subs-mcp-"));
		mkdirSync(join(root, "issue"));
		writeFileSync(join(root, "issue/i-1.md"), `---\ntype: issue\nid: i-1\nsummary: Project\nstatus: open\nclarified: true\n---\n${SUB}`);
		writeFileSync(join(root, "issue/i-2.md"), "---\ntype: issue\nid: i-2\nsummary: Calendar\nstatus: open\nclarified: true\nscheduled: 2026-11-20\n---\n");
		ctx = { root, device: "ai", now: () => now };
	});
	afterEach(() => rmSync(root, { recursive: true, force: true }));

	it("サブ（閉じたものも）を持つ issue に update_issue で Calendar の日を付けるとエラー。消すのはよい", () => {
		expect(() => callMcpTool(ctx, "update_issue", { id: "i-1", scheduled: "2026-11-20" })).toThrow(/サブイシューを持つ issue には Calendar/);
		callMcpTool(ctx, "update_issue", { id: "i-1", scheduled: null });
		expect(new TaskIndex(readVault(root).data).issues.get("i-1")!.scheduled).toBeNull();
	});

	it("Calendar の日を持つ issue に create_sub_issues でサブを足すとエラーで、何も書かない", () => {
		const before = readFileSync(join(root, "issue/i-2.md"), "utf8");
		expect(() => callMcpTool(ctx, "create_sub_issues", { parent: "i-2", items: [{ summary: "x" }] })).toThrow(/Calendar の日を持つ issue にはサブイシューを足せません/);
		expect(readFileSync(join(root, "issue/i-2.md"), "utf8")).toBe(before);
	});
});
