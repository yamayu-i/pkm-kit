import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readVault } from "../cli/read-vault";
import { callMcpTool, handleMcpRequest, type McpContext } from "../cli/mcp";
import { TaskIndex } from "../src/core/index";
import { DEFAULT_LABEL_COLOR } from "../src/core/labels";
import { lintVault } from "../src/core/lint";

const date = "2026-11-01";
const now = new Date("2026-11-01T10:00:00.000Z");

describe("MCP サーバーと検査付き操作", () => {
	let root: string;
	let ctx: McpContext;

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "vault-mcp-test-"));
		mkdirSync(join(root, "issue"), { recursive: true });
		mkdirSync(join(root, "routine"), { recursive: true });
		mkdirSync(join(root, "member"), { recursive: true });
		writeFileSync(
			join(root, "issue/labels.json"),
			JSON.stringify([{ name: "dev", color: DEFAULT_LABEL_COLOR }], null, 2),
		);
		writeFileSync(
			join(root, "issue/board-groups.json"),
			JSON.stringify([{ name: "午前", children: [{ name: "集中" }] }, { name: "午後" }], null, 2),
		);
		writeFileSync(
			join(root, "issue/i-1.md"),
			"---\ntype: issue\nid: i-1\nsummary: 最初のタスク\nstatus: open\nestimated: 60\nscheduled:\n  - 2026-11-01\ncreated: 2026-10-30T10:00:00+09:00\n---\n## ToDo\n\n- [ ] サブタスク\n",
		);
		writeFileSync(
			join(root, "issue/i-2.md"),
			"---\ntype: issue\nid: i-2\nsummary: 2つ目のタスク\nstatus: open\nestimated: 120\ncreated: 2026-10-30T11:00:00+09:00\n---\n本文\n",
		);
		writeFileSync(
			join(root, "routine/r-1.md"),
			"---\ntype: routine\nid: r-1\nsummary: 朝会\nrepeat:\n  every: day\nstart: 2026-10-01\nactive: true\ngroup: 午前\nestimated: 15\ncreated: 2026-10-01T09:00:00+09:00\n---\n",
		);
		writeFileSync(
			join(root, "member/m-1.md"),
			"---\ntype: member\nid: m-1\nname: 田中\ncreated: 2026-10-01T09:00:00+09:00\n---\n",
		);
		ctx = { root, device: "ai", now: () => now };
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it("ボードへの追加・グループ移動・routine 結果記録・get_board が正しく動き、Obsidian 側の readVault でも整合する", () => {
		callMcpTool(ctx, "add_to_board", { date, issue_ids: ["i-1", "i-2"] });
		callMcpTool(ctx, "move_card", { date, id: "i-1", group: "午前/集中" });
		callMcpTool(ctx, "set_routine_result", { date, routine_id: "r-1", result: "closed" });

		const board = callMcpTool(ctx, "get_board", { date }) as {
			closed: boolean;
			items: { issues: { id: string; group: string }[]; routines: { id: string; result: string | null }[] };
			unfinished: { issues: { id: string }[]; routines: { id: string }[] };
		};
		expect(board.closed).toBe(false);
		expect(board.items.issues.map((i) => ({ id: i.id, group: i.group }))).toEqual([
			{ id: "i-1", group: "午前/集中" },
			{ id: "i-2", group: "" },
		]);
		expect(board.items.routines[0]!.result).toBe("closed");
		expect(board.unfinished.issues.map((i) => i.id)).toEqual(["i-1", "i-2"]);
		expect(board.unfinished.routines).toEqual([]);

		// Obsidian 側の索引構築・lint でエラーが出ないことを確かめる
		const { data, problems, paths } = readVault(root);
		expect(problems).toEqual([]);
		expect(lintVault(data, { paths: new Set(paths) })).toEqual([]);
		const index = new TaskIndex(data);
		expect(index.board(date)?.board.issues).toEqual(["i-1", "i-2"]);
		expect(index.board(date)?.board.groups["i-1"]).toBe("午前/集中");
	});

	it("get_board はグループの中を手で並べた順で返す（ADR-0114）", () => {
		callMcpTool(ctx, "add_to_board", { date, issue_ids: ["i-1", "i-2"] });
		callMcpTool(ctx, "move_card", { date, id: "i-1", group: "午前" });
		callMcpTool(ctx, "move_card", { date, id: "i-2", group: "午前" });
		mkdirSync(join(root, "board/pc"), { recursive: true });
		writeFileSync(
			join(root, "board/pc/2026-11.jsonl"),
			`${JSON.stringify({ id: "bo_order00001", at: "2026-11-01T11:00:00.000Z", date, op: "order", group: "午前", tasks: ["i-2", "r-1", "i-1"] })}\n`,
		);
		const board = callMcpTool(ctx, "get_board", { date }) as {
			items: { issues: { id: string }[] };
			byGroup: Record<string, { issues: string[]; routines: string[]; cards: string[] }>;
		};
		expect(board.byGroup["午前"]).toEqual({ issues: ["i-2", "i-1"], routines: ["r-1"], cards: ["i-2", "r-1", "i-1"] });
		expect(board.byGroup[""]!.cards).toEqual([]);
		expect(readVault(root).problems).toEqual([]);
	});

	it("不正な操作（存在しない issue、未定義のグループ、未完了がある状態での close、親子の循環）を拒否して書き込まない", () => {
		expect(() => callMcpTool(ctx, "add_to_board", { date, issue_ids: ["i-999"] })).toThrow(/i-999/);
		callMcpTool(ctx, "add_to_board", { date, issue_ids: ["i-1"] });
		expect(() => callMcpTool(ctx, "move_card", { date, id: "i-1", group: "存在しないグループ" })).toThrow(/グループ/);
		expect(() => callMcpTool(ctx, "close_board", { date })).toThrow(/未完了/);

		// 親子循環の拒否
		callMcpTool(ctx, "update_issue", { id: "i-2", parent: "i-1" });
		expect(() => callMcpTool(ctx, "update_issue", { id: "i-1", parent: "i-2" })).toThrow(/親/);
	});

	it("carry_issues と update_issue で未完了を解消してから close_board で要約を書き、append_daily_note で末尾に助言を追記できる", () => {
		callMcpTool(ctx, "add_to_board", { date, issue_ids: ["i-1", "i-2"] });
		callMcpTool(ctx, "set_routine_result", { date, routine_id: "r-1", result: "closed" });
		callMcpTool(ctx, "update_issue", { id: "i-1", status: "closed" });
		callMcpTool(ctx, "carry_issues", { date, issue_ids: ["i-2"], mode: "reschedule", reschedule_to: "2026-11-02" });

		const closed = callMcpTool(ctx, "close_board", { date }) as { closed: boolean };
		expect(closed.closed).toBe(true);

		callMcpTool(ctx, "append_daily_note", {
			date,
			heading: "AI 振り返り",
			content: "- i-1 を予定通り完了できました。i-2 は明日にリスケしました。",
		});

		const dailyText = readFileSync(join(root, "daily/2026/11/2026-11-01.md"), "utf8");
		expect(dailyText).toContain("## Task board");
		expect(dailyText).toContain("## AI 振り返り");
		expect(dailyText).toContain("i-1 を予定通り完了できました");

		const { data, problems } = readVault(root);
		expect(problems).toEqual([]);
		const index = new TaskIndex(data);
		expect(index.issues.get("i-2")?.scheduled).toEqual(["2026-11-02"]);
		expect(index.board(date)?.board.closed).toBe(true);
	});

	it("create_issue と start_timer / stop_timer、get_overview が連携して動く", () => {
		const created = callMcpTool(ctx, "create_issue", {
			summary: "新規タスク",
			priority: "high",
			labels: ["dev"],
			estimated: 45,
			add_to_board_date: date,
		}) as { id: string };
		expect(created.id).toBe("i-3");

		callMcpTool(ctx, "start_timer", { task_ids: ["i-3"] });
		const overview = callMcpTool(ctx, "get_overview", { date, available_minutes: 30 }) as {
			runningTimers: { taskId: string }[];
			workload: { overloadedByMinutes: number };
		};
		expect(overview.runningTimers.map((t) => t.taskId)).toEqual(["i-3"]);
		// i-3 (45) + r-1 (15) = 60 > 30
		expect(overview.workload.overloadedByMinutes).toBe(30);

		const laterCtx: McpContext = { root, device: "ai", now: () => new Date("2026-11-01T10:30:00.000Z") };
		callMcpTool(laterCtx, "stop_timer", { task_ids: ["i-3"] });

		const issueDetail = callMcpTool(laterCtx, "get_issue", { id: "i-3" }) as { effortMinutes: number };
		expect(issueDetail.effortMinutes).toBe(30);
	});

	it("JSON-RPC 2.0 の initialize / tools/list / tools/call リクエストに応答する", () => {
		const initRes = handleMcpRequest(ctx, { jsonrpc: "2.0", id: 1, method: "initialize", params: {} });
		expect(initRes?.result).toHaveProperty("serverInfo");

		const listRes = handleMcpRequest(ctx, { jsonrpc: "2.0", id: 2, method: "tools/list" });
		const tools = (listRes?.result as { tools: { name: string }[] }).tools;
		expect(tools.some((t) => t.name === "get_overview")).toBe(true);
		expect(tools.some((t) => t.name === "get_board")).toBe(true);

		const callRes = handleMcpRequest(ctx, {
			jsonrpc: "2.0",
			id: 3,
			method: "tools/call",
			params: { name: "get_board", arguments: { date } },
		});
		expect((callRes?.result as { isError?: boolean }).isError).toBeUndefined();
	});
	it("update_issue で status を変えると statuslog に書き、閉じたら記録中のタイマーを止める（ADR-0031）", () => {
		callMcpTool(ctx, "start_timer", { task_ids: ["i-1"] });
		let { data } = readVault(root);
		expect(data.issues.find((i) => i.id === "i-1")!.status).toBe("in-progress");
		callMcpTool(ctx, "update_issue", { id: "i-1", status: "closed" });
		({ data } = readVault(root));
		const index = new TaskIndex(data);
		expect(index.issues.get("i-1")!.status).toBe("closed");
		expect(index.running("i-1")).toEqual([]);
		expect(data.statusLogs.map((e) => [e.task, e.from, e.to, e.via])).toEqual([
			["i-1", "open", "in-progress", "timer"],
			["i-1", "in-progress", "closed", "mcp"],
		]);
		expect(readFileSync(join(root, "statuslog/ai/2026-11.jsonl"), "utf8").trim().split("\n")).toHaveLength(2);
		expect(index.statusBefore("i-1")).toBe("in-progress");
		const { problems, paths } = readVault(root);
		expect(problems).toEqual([]);
		expect(lintVault(data, { paths: new Set(paths) })).toEqual([]);
	});
});
