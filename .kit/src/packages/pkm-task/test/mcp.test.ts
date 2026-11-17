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
			join(root, "issue/i-1.md"),
			"---\ntype: issue\nid: i-1\nsummary: 最初のタスク\nstatus: open\nestimated: 60\nscheduled: 2026-11-01\ncreated: 2026-10-30T10:00:00+09:00\n---\n## ToDo\n\n- [ ] サブタスク\n",
		);
		writeFileSync(
			join(root, "issue/i-2.md"),
			"---\ntype: issue\nid: i-2\nsummary: 2つ目のタスク\nstatus: open\nestimated: 120\ncreated: 2026-10-30T11:00:00+09:00\n---\n本文\n",
		);
		writeFileSync(
			join(root, "routine/r-1.md"),
			"---\ntype: routine\nid: r-1\nsummary: 朝会\nrepeat:\n  every: day\nstart: 2026-10-01\nactive: true\nestimated: 15\ncreated: 2026-10-01T09:00:00+09:00\n---\n",
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

	it("ボードへの追加・★・並べ替え・routine 結果記録・get_board が正しく動き、Obsidian 側の readVault でも整合する（ADR-0137）", () => {
		callMcpTool(ctx, "add_to_board", { date, issue_ids: ["i-1", "i-2"] });
		callMcpTool(ctx, "star_card", { date, key: "i-2", on: true });
		expect(() => callMcpTool(ctx, "order_card", { date, key: "r-1", before: "i-1" })).toThrow(/並べ替えられない/);
		expect(() => callMcpTool(ctx, "star_card", { date, key: "r-1", on: true })).toThrow(/routine/);
		callMcpTool(ctx, "star_card", { date, key: "i-1", on: true });
		// waiting にすると ★ が外れ、ボードの欄ではなく Watch に出る（ADR-0184）
		callMcpTool(ctx, "update_issue", { id: "i-1", status: "waiting" });
		expect(() => callMcpTool(ctx, "star_card", { date, key: "i-1", on: true })).toThrow(/待っている/);
		expect(() => callMcpTool(ctx, "order_card", { date, key: "i-1", before: null })).toThrow(/並べ替えられない/);

		type Card = { key: string; kind: string; status: string; starred: boolean };
		const read = () =>
			callMcpTool(ctx, "get_board", { date }) as {
				closed: boolean;
				lanes: Record<"working" | "top" | "routine" | "next" | "watch" | "done", Card[]>;
				unfinished: { issues: { id: string }[]; routines: { id: string }[] };
			};
		let board = read();
		expect(board.closed).toBe(false);
		expect(Object.fromEntries(Object.entries(board.lanes).map(([k, v]) => [k, v.map((c) => c.key)]))).toEqual({ working: [], top: ["i-2"], routine: ["r-1"], next: [], watch: ["i-1"], done: [] });
		expect(board.lanes.watch[0]).toMatchObject({ key: "i-1", status: "waiting", starred: false });
		expect(board.lanes.top[0]).toMatchObject({ key: "i-2", kind: "issue", status: "open", starred: true });

		callMcpTool(ctx, "set_routine_result", { date, routine_id: "r-1", result: "closed" });
		board = read();
		expect(board.lanes.routine.map((c) => c.key)).toEqual(["r-1"]);
		expect(board.lanes.routine[0]).toMatchObject({ status: "closed" });
		// waiting は未完了に数えない（ADR-0184）
		expect(board.unfinished.issues.map((i) => i.id)).toEqual(["i-2"]);
		expect(board.unfinished.routines).toEqual([]);

		// Obsidian 側の索引構築・lint でエラーが出ないことを確かめる
		const { data, problems, paths } = readVault(root);
		expect(problems).toEqual([]);
		expect(lintVault(data, { paths: new Set(paths) })).toEqual([]);
		const index = new TaskIndex(data);
		expect(index.board(date)?.board.issues).toEqual(["i-1", "i-2"]);
		expect(index.board(date)?.board.stars).toEqual(["i-2"]);
		expect(index.order(date)).toBeUndefined();
	});

	it("★ は 4 件まで。order_card は同じ欄の中だけ（ADR-0137）", () => {
		for (const n of [3, 4, 5]) {
			writeFileSync(join(root, `issue/i-${n}.md`), `---\ntype: issue\nid: i-${n}\nsummary: t${n}\nstatus: open\ncreated: 2026-10-30T10:00:00+09:00\n---\n`);
		}
		callMcpTool(ctx, "add_to_board", { date, issue_ids: ["i-1", "i-2", "i-3", "i-4", "i-5"] });
		for (const key of ["i-1", "i-2", "i-3", "i-5"]) callMcpTool(ctx, "star_card", { date, key, on: true });
		expect(() => callMcpTool(ctx, "star_card", { date, key: "i-4", on: true })).toThrow(/4 件/);
		expect(() => callMcpTool(ctx, "order_card", { date, key: "i-4", before: "i-1" })).toThrow(/同じ欄/);
		expect(() => callMcpTool(ctx, "order_card", { date, key: "i-9", before: null })).toThrow(/載っていません/);
		callMcpTool(ctx, "star_card", { date, key: "i-1", on: false });
		callMcpTool(ctx, "star_card", { date, key: "i-4", on: true });
		const board = callMcpTool(ctx, "get_board", { date }) as { stars: string[] };
		expect(board.stars).toEqual(["i-2", "i-3", "i-5", "i-4"]);
	});

	it("不正な操作（存在しない issue、廃止した move_card、廃止した parent）を拒否して書き込まない。未完了があっても close できる（ADR-0189）", () => {
		expect(() => callMcpTool(ctx, "add_to_board", { date, issue_ids: ["i-999"] })).toThrow(/i-999/);
		callMcpTool(ctx, "add_to_board", { date, issue_ids: ["i-1"] });
		expect(() => callMcpTool(ctx, "move_card", { date, id: "i-1", group: "午前" })).toThrow();
		callMcpTool(ctx, "close_board", { date });

		// 親子関係は廃止した（ADR-0135）。parent は受け付けない
		expect(() => callMcpTool(ctx, "update_issue", { id: "i-2", parent: "i-1" })).toThrow(/parent/);
	});

	it("clarified を create_issue と update_issue で読み書きでき、Inbox の一覧は clarified でない open の issue になる（ADR-0148）", () => {
		const inbox = () => (callMcpTool(ctx, "list_issues", { inbox_only: true }) as { id: string }[]).map((i) => i.id);
		// i-1 は実行日があっても未整理なので Inbox
		expect(inbox()).toEqual(["i-1", "i-2"]);
		callMcpTool(ctx, "update_issue", { id: "i-1", clarified: true });
		expect(readFileSync(join(root, "issue/i-1.md"), "utf8")).toMatch(/^clarified: true$/m);
		expect(inbox()).toEqual(["i-2"]);
		// false は項目を消す（未設定が未整理）
		callMcpTool(ctx, "update_issue", { id: "i-1", clarified: false });
		expect(readFileSync(join(root, "issue/i-1.md"), "utf8")).not.toMatch(/clarified/);
		const created = callMcpTool(ctx, "create_issue", { summary: "整理済みで作る", clarified: true }) as { id: string; clarified: boolean };
		expect(created.clarified).toBe(true);
		expect(inbox()).toEqual(["i-1", "i-2"]);
		expect(() => callMcpTool(ctx, "update_issue", { id: "i-2", clarified: "yes" })).toThrow(/clarified/);
	});

	it("carry_issues の next・tickler・today と、create_issue・update_issue の tickler（ADR-0152）", () => {
		callMcpTool(ctx, "add_to_board", { date, issue_ids: ["i-1", "i-2"] });
		// next: Calendar の日を消して整理済みの Next に戻す
		callMcpTool(ctx, "carry_issues", { date, issue_ids: ["i-1"], mode: "next" });
		// tickler: その日に Inbox に戻す
		callMcpTool(ctx, "carry_issues", { date, issue_ids: ["i-2"], mode: "tickler", reschedule_to: "2026-11-05" });
		let index = new TaskIndex(readVault(root).data);
		expect(index.issues.get("i-1")).toMatchObject({ scheduled: null, clarified: true, tickler: null });
		expect(index.issues.get("i-2")?.tickler).toBe("2026-11-05");
		expect(index.board(date)?.board.carried).toEqual(["i-1", "i-2"]);
		expect(() => callMcpTool(ctx, "carry_issues", { date, issue_ids: ["i-1"], mode: "tickler" })).toThrow(/reschedule_to/);

		// today: 今日（now の日付）のボードに載せる。日付は書かない
		const later: McpContext = { root, device: "ai", now: () => new Date("2026-11-03T10:00:00.000Z") };
		callMcpTool(later, "carry_issues", { date, issue_ids: ["i-1"], mode: "today" });
		index = new TaskIndex(readVault(root).data);
		expect(index.board("2026-11-03")?.board.issues).toEqual(["i-1"]);
		expect(index.issues.get("i-1")?.scheduled).toBeNull();

		const created = callMcpTool(ctx, "create_issue", { summary: "返金を確かめる", tickler: "2026-11-10" }) as { tickler: string };
		expect(created.tickler).toBe("2026-11-10");
		callMcpTool(ctx, "update_issue", { id: "i-2", tickler: null, scheduled: "2026-11-04" });
		expect(new TaskIndex(readVault(root).data).issues.get("i-2")).toMatchObject({ tickler: null, scheduled: "2026-11-04" });
		expect(() => callMcpTool(ctx, "update_issue", { id: "i-2", scheduled: ["2026-11-04", "2026-11-05"] })).toThrow(/日付 1 つ/);
	});

	it("carry_issues と update_issue で未完了を解消してから close_board で要約を書き、append_daily_note で末尾に助言を追記できる", () => {
		callMcpTool(ctx, "add_to_board", { date, issue_ids: ["i-1", "i-2"] });
		callMcpTool(ctx, "set_routine_result", { date, routine_id: "r-1", result: "closed" });
		callMcpTool(ctx, "update_issue", { id: "i-1", status: "closed" });
		callMcpTool(ctx, "carry_issues", { date, issue_ids: ["i-2"], mode: "move", reschedule_to: "2026-11-02" });

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
		expect(index.issues.get("i-2")?.scheduled).toBe("2026-11-02");
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

	it("get_overview は routine の積み残しを出し、set_routine_result でもとの日に結果を付けると消える（ADR-0206）", () => {
		const later: McpContext = { root, device: "ai", now: () => new Date("2026-11-20T10:00:00.000Z") };
		type Overview = { missedRoutines: { date: string; routineId: string }[]; missedRoutineCount: number };
		const before = callMcpTool(later, "get_overview", {}) as Overview;
		expect(before.missedRoutines).toEqual([
			{ date: "2026-11-18", routineId: "r-1", summary: "朝会" },
			{ date: "2026-11-19", routineId: "r-1", summary: "朝会" },
		]);
		callMcpTool(later, "set_routine_result", { date: "2026-11-18", routine_id: "r-1", result: "canceled" });
		const after = callMcpTool(later, "get_overview", {}) as Overview;
		expect(after.missedRoutineCount).toBe(1);
		expect(after.missedRoutines.map((m) => m.date)).toEqual(["2026-11-19"]);
	});

	it("JSON-RPC 2.0 の initialize / tools/list / tools/call リクエストに応答する", () => {
		const initRes = handleMcpRequest(ctx, { jsonrpc: "2.0", id: 1, method: "initialize", params: {} });
		expect(initRes?.result).toHaveProperty("serverInfo");

		const listRes = handleMcpRequest(ctx, { jsonrpc: "2.0", id: 2, method: "tools/list" });
		const tools = (listRes?.result as { tools: { name: string }[] }).tools;
		// ADR-0156: task_ の接頭辞を付けて公開する（旧名は呼べるが、一覧には出さない）
		expect(tools.some((t) => t.name === "task_get_overview")).toBe(true);
		expect(tools.some((t) => t.name === "task_get_board")).toBe(true);
		expect(tools.some((t) => t.name === "get_board")).toBe(false);

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
