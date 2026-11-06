/**
 * vault-task の MCP サーバー（ADR-0025）。
 * 外部依存を追加せず、Node 標準機能のみで JSON-RPC 2.0 over stdio を実装する。
 *
 * 使い方: node .kit/bin/mcp.mjs [Vault のルート] [--device=ai]
 */
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { boardItems, emptyBoard, pendingBoards, routineResults, unfinished, type RoutineResult } from "../src/core/board";
import { isLocalDate, localToday, type LocalDate } from "../src/core/dates";
import { prorateEffort } from "../src/core/effort";
import { groupKeys } from "../src/core/groups";
import { isInbox, TaskIndex } from "../src/core/index";
import { lintVault } from "../src/core/lint";
import { defaultQuery, queryIssues, type IssueQuery, type SortKey } from "../src/core/list";
import { buildOverview, carryCounts } from "../src/core/metrics";
import { rawEffortMinutes, reviewWorklogs } from "../src/core/review";
import type { Priority, Status } from "../src/core/schema";
import { readVault } from "./read-vault";
import {
	addToBoardOnDisk,
	appendBoardOpsOnDisk,
	appendDailyNoteOnDisk,
	carryIssuesOnDisk,
	closeBoardOnDisk,
	createIssueOnDisk,
	moveCardOnDisk,
	readMarkdownBody,
	removeFromBoardOnDisk,
	setRoutineResultOnDisk,
	startTimerOnDisk,
	stopTimerOnDisk,
	updateIssueOnDisk,
} from "./vault-ops";

export interface McpContext {
	root: string;
	device: string;
	now?: () => Date;
}

export interface McpToolDef {
	name: string;
	description: string;
	inputSchema: {
		type: "object";
		properties: Record<string, unknown>;
		required?: string[];
	};
}

export interface JsonRpcRequest {
	jsonrpc?: string;
	id?: string | number | null;
	method: string;
	params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
	jsonrpc: "2.0";
	id: string | number | null;
	result?: unknown;
	error?: { code: number; message: string };
}

const TOOLS: McpToolDef[] = [
	{
		name: "get_overview",
		description: "指定日（既定は今日）のボード、負荷、期限切れ・期限間近、Inbox件数、未締めの過去ボード、記録中タイマー、持ち越し過多・停滞タスク、見積もり精度をまとめて取得する",
		inputSchema: {
			type: "object",
			properties: {
				date: { type: "string", description: "YYYY-MM-DD（省略時は今日）" },
				available_minutes: { type: "number", description: "1日の使える時間（分、既定 240）" },
				stale_days: { type: "number", description: "in-progress の停滞判定日数（既定 3）" },
				caution_days: { type: "number", description: "期限間近の判定日数（既定 3）" },
			},
		},
	},
	{
		name: "get_board",
		description: "指定日（既定は今日）のタスクボードの状態（issue / routine、グループごとの並び、未完了、記録中のタイマー、締めたか）を取得する",
		inputSchema: {
			type: "object",
			properties: {
				date: { type: "string", description: "YYYY-MM-DD（省略時は今日）" },
			},
		},
	},
	{
		name: "list_pending_boards",
		description: "今日より前で、未完了が残っていて締めていない過去のボード一覧を取得する",
		inputSchema: {
			type: "object",
			properties: {
				today: { type: "string", description: "基準日 YYYY-MM-DD（省略時は今日）" },
			},
		},
	},
	{
		name: "list_issues",
		description: "条件（status、priority、label、予定の有無、親、Inboxのみ、文字列検索、並び順）で絞った issue 一覧を取得する",
		inputSchema: {
			type: "object",
			properties: {
				text: { type: "string" },
				statuses: { type: "array", items: { type: "string" } },
				priorities: { type: "array", items: { type: "string" } },
				labels: { type: "array", items: { type: "string" } },
				scheduled: { type: "string", enum: ["any", "yes", "no"] },
				parent: { type: "string" },
				inbox_only: { type: "boolean", description: "true のとき Inbox の issue のみ返す" },
				sort: { type: "string", enum: ["id", "summary", "status", "priority", "soft_deadline", "deadline", "created", "next_scheduled"] },
				desc: { type: "boolean" },
				limit: { type: "number", description: "最大件数（既定 100）" },
			},
		},
	},
	{
		name: "get_issue",
		description: "issue の詳細（frontmatter、Markdown本文、親・子タスク、按分後の実績工数、持ち越し回数）を取得する",
		inputSchema: {
			type: "object",
			properties: {
				id: { type: "string", description: "例: i-1" },
			},
			required: ["id"],
		},
	},
	{
		name: "get_worklog_summary",
		description: "期間内のタスク別実績工数（按分後・按分前）、記録中のタイマー、怪しい worklog の候補を取得する",
		inputSchema: {
			type: "object",
			properties: {
				from: { type: "string", description: "開始日 YYYY-MM-DD（省略時は全期間）" },
				to: { type: "string", description: "終了日 YYYY-MM-DD（省略時は全期間）" },
			},
		},
	},
	{
		name: "get_routine_stats",
		description: "routine の直近 N 日間の実施結果と継続率を取得する",
		inputSchema: {
			type: "object",
			properties: {
				id: { type: "string", description: "例: r-1（省略時は有効な全 routine）" },
				days: { type: "number", description: "遡る日数（既定 14）" },
				today: { type: "string", description: "基準日 YYYY-MM-DD（省略時は今日）" },
			},
		},
	},
	{
		name: "add_to_board",
		description: "指定日のボードに issue を載せる",
		inputSchema: {
			type: "object",
			properties: {
				date: { type: "string", description: "YYYY-MM-DD" },
				issue_ids: { type: "array", items: { type: "string" } },
			},
			required: ["date", "issue_ids"],
		},
	},
	{
		name: "remove_from_board",
		description: "指定日のボードから issue を外す",
		inputSchema: {
			type: "object",
			properties: {
				date: { type: "string", description: "YYYY-MM-DD" },
				issue_id: { type: "string" },
			},
			required: ["date", "issue_id"],
		},
	},
	{
		name: "move_card",
		description: "ボード上のカード（issue / routine）のグループを変える（null または空文字で未分類）",
		inputSchema: {
			type: "object",
			properties: {
				date: { type: "string", description: "YYYY-MM-DD" },
				id: { type: "string" },
				group: { type: ["string", "null"] },
			},
			required: ["date", "id", "group"],
		},
	},
	{
		name: "set_routine_result",
		description: "指定日の routine の結果（closed / canceled / null）を記録する",
		inputSchema: {
			type: "object",
			properties: {
				date: { type: "string", description: "YYYY-MM-DD" },
				routine_id: { type: "string" },
				result: { type: ["string", "null"], enum: ["closed", "canceled", null] },
			},
			required: ["date", "routine_id", "result"],
		},
	},
	{
		name: "carry_issues",
		description: "ボード上の未完了 issue をリスケ（別の日へ移動）または Inbox 戻しで片付け、carried にする",
		inputSchema: {
			type: "object",
			properties: {
				date: { type: "string", description: "ボードの日付 YYYY-MM-DD" },
				issue_ids: { type: "array", items: { type: "string" } },
				mode: { type: "string", enum: ["reschedule", "inbox"] },
				reschedule_to: { type: "string", description: "mode=reschedule のときの移動先 YYYY-MM-DD" },
			},
			required: ["date", "issue_ids", "mode"],
		},
	},
	{
		name: "close_board",
		description: "未完了が 0 件ならその日のボードを締め、デイリーノート本文の ## Task board に要約を書く",
		inputSchema: {
			type: "object",
			properties: {
				date: { type: "string", description: "YYYY-MM-DD" },
			},
			required: ["date"],
		},
	},
	{
		name: "reopen_board",
		description: "締めたボードを開き直す",
		inputSchema: {
			type: "object",
			properties: {
				date: { type: "string", description: "YYYY-MM-DD" },
			},
			required: ["date"],
		},
	},
	{
		name: "create_issue",
		description: "新しい issue を作成する（必要ならその日のボードにも載せる）",
		inputSchema: {
			type: "object",
			properties: {
				summary: { type: "string" },
				parent: { type: ["string", "null"] },
				scheduled: { type: "array", items: { type: "string" } },
				priority: { type: ["string", "null"], enum: ["high", "mid", "low", "chore", null] },
				labels: { type: "array", items: { type: "string" } },
				estimated: { type: ["number", "null"] },
				soft_deadline: { type: ["string", "null"] },
				deadline: { type: ["string", "null"] },
				add_to_board_date: { type: ["string", "null"], description: "指定した日付（YYYY-MM-DD）のボードにも載せる" },
			},
			required: ["summary"],
		},
	},
	{
		name: "update_issue",
		description: "issue の frontmatter（status, priority, scheduled, deadline, estimated, parent など）を検査付きで更新する",
		inputSchema: {
			type: "object",
			properties: {
				id: { type: "string" },
				summary: { type: "string" },
				status: { type: "string", enum: ["open", "in-progress", "waiting", "delegated", "someday", "closed", "canceled"] },
				status_detail: { type: ["string", "null"] },
				delegated_to: { type: ["string", "null"] },
				priority: { type: ["string", "null"], enum: ["high", "mid", "low", "chore", null] },
				labels: { type: "array", items: { type: "string" } },
				parent: { type: ["string", "null"] },
				scheduled: { type: "array", items: { type: "string" } },
				soft_deadline: { type: ["string", "null"] },
				deadline: { type: ["string", "null"] },
				revisit: { type: ["string", "null"] },
				reviewed: { type: ["string", "null"] },
				estimated: { type: ["number", "null"] },
			},
			required: ["id"],
		},
	},
	{
		name: "start_timer",
		description: "指定した issue / routine の作業記録タイマーを開始する",
		inputSchema: {
			type: "object",
			properties: {
				task_ids: { type: "array", items: { type: "string" } },
			},
			required: ["task_ids"],
		},
	},
	{
		name: "stop_timer",
		description: "記録中のタイマーを停止する（task_ids 省略時はすべての記録中タイマーを止める）",
		inputSchema: {
			type: "object",
			properties: {
				task_ids: { type: "array", items: { type: "string" } },
			},
		},
	},
	{
		name: "append_daily_note",
		description: "デイリーノート本文の末尾に AI のアドバイスや振り返りセクションを追記する（既存の本文は変更・削除しない）",
		inputSchema: {
			type: "object",
			properties: {
				date: { type: "string", description: "YYYY-MM-DD" },
				heading: { type: "string", description: "見出し名（例: AI 振り返り）" },
				content: { type: "string", description: "追記する本文" },
			},
			required: ["date", "heading", "content"],
		},
	},
];

export function listMcpTools(): McpToolDef[] {
	return TOOLS;
}

function loadIndex(root: string) {
	const { data, problems, paths } = readVault(root);
	const lintProblems = lintVault(data, { paths: new Set(paths) });
	return {
		index: new TaskIndex(data),
		problems: [...problems, ...lintProblems],
	};
}

export function callMcpTool(ctx: McpContext, name: string, args: Record<string, unknown> = {}): unknown {
	const now = ctx.now ? ctx.now() : new Date();
	const today = localToday(now);
	const { index, problems } = loadIndex(ctx.root);

	switch (name) {
		case "get_overview": {
			const date = typeof args.date === "string" ? args.date : today;
			if (!isLocalDate(date)) throw new Error(`date が YYYY-MM-DD ではありません: ${String(args.date)}`);
			const overview = buildOverview(index, date, now.getTime(), {
				availableMinutes: typeof args.available_minutes === "number" ? args.available_minutes : undefined,
				staleDays: typeof args.stale_days === "number" ? args.stale_days : undefined,
				cautionDays: typeof args.caution_days === "number" ? args.caution_days : undefined,
			});
			return { ...overview, problems };
		}
		case "get_board": {
			const date = typeof args.date === "string" ? args.date : today;
			if (!isLocalDate(date)) throw new Error(`date が YYYY-MM-DD ではありません: ${String(args.date)}`);
			const board = index.board(date)?.board ?? emptyBoard();
			const keys = groupKeys(index.data.groups);
			const items = boardItems(index, date, board);
			const rem = unfinished(index, date, board);
			const issuesWithGroup = items.issues.map((i) => ({
				...i,
				group: index.placement(date, board, i.id, null, keys),
				carried: board.carried.includes(i.id),
			}));
			const routinesWithGroup = items.routines.map((r) => ({
				...r,
				group: index.placement(date, board, r.id, r.group, keys),
				result: board.routines[r.id] ?? null,
			}));
			const byGroup: Record<string, { issues: string[]; routines: string[] }> = { "": { issues: [], routines: [] } };
			for (const k of keys) byGroup[k] = { issues: [], routines: [] };
			for (const i of issuesWithGroup) byGroup[i.group]!.issues.push(i.id);
			for (const r of routinesWithGroup) byGroup[r.group]!.routines.push(r.id);

			return {
				date,
				closed: board.closed,
				groups: keys,
				items: { issues: issuesWithGroup, routines: routinesWithGroup },
				byGroup,
				unfinished: rem,
				carried: board.carried,
				routineResults: board.routines,
				runningTimers: index.running(),
			};
		}
		case "list_pending_boards": {
			const refDate = typeof args.today === "string" ? args.today : today;
			if (!isLocalDate(refDate)) throw new Error(`today が YYYY-MM-DD ではありません: ${String(args.today)}`);
			return pendingBoards(index, index.data.boards, refDate).map((b) => {
				const u = unfinished(index, b.date, b.board);
				return {
					date: b.date,
					unfinishedIssues: u.issues,
					unfinishedRoutines: u.routines,
				};
			});
		}
		case "list_issues": {
			const limit = typeof args.limit === "number" && args.limit > 0 ? args.limit : 100;
			if (args.inbox_only === true) {
				return index.data.issues.filter(isInbox).slice(0, limit);
			}
			const q: IssueQuery = {
				...defaultQuery(),
				...(typeof args.text === "string" ? { text: args.text } : {}),
				...(Array.isArray(args.statuses) ? { statuses: args.statuses as Status[] } : {}),
				...(Array.isArray(args.priorities) ? { priorities: args.priorities as (Priority | "none")[] } : {}),
				...(Array.isArray(args.labels) ? { labels: args.labels as string[] } : {}),
				...(args.scheduled === "any" || args.scheduled === "yes" || args.scheduled === "no" ? { scheduled: args.scheduled } : {}),
				...(typeof args.parent === "string" ? { parent: args.parent } : {}),
				...(typeof args.sort === "string" ? { sort: args.sort as SortKey } : {}),
				...(typeof args.desc === "boolean" ? { desc: args.desc } : {}),
			};
			return queryIssues(index.data.issues, q, today).slice(0, limit);
		}
		case "get_issue": {
			const id = String(args.id ?? "");
			const issue = index.issues.get(id);
			if (!issue) throw new Error(`issue がありません: ${id}`);
			const efforts = index.effortMinutes(now.getTime());
			const counts = carryCounts(index.data.boards);
			return {
				...issue,
				body: readMarkdownBody(ctx.root, issue.path),
				ancestors: index.ancestors(id).map((a) => ({ id: a.id, summary: a.summary, status: a.status })),
				children: index.children(id).map((c) => ({ id: c.id, summary: c.summary, status: c.status })),
				effortMinutes: Math.round(efforts.get(id) ?? 0),
				carryCount: counts.get(id) ?? 0,
			};
		}
		case "get_worklog_summary": {
			const from = typeof args.from === "string" ? args.from : null;
			const to = typeof args.to === "string" ? args.to : null;
			if (from !== null && !isLocalDate(from)) throw new Error(`from が YYYY-MM-DD ではありません: ${from}`);
			if (to !== null && !isLocalDate(to)) throw new Error(`to が YYYY-MM-DD ではありません: ${to}`);
			const logs = index.data.worklogs.filter((l) => {
				const d = l.from.slice(0, 10);
				if (from !== null && d < from) return false;
				if (to !== null && d > to) return false;
				return true;
			});
			const nowMs = now.getTime();
			const proratedMs = prorateEffort(logs, nowMs);
			const rawMins = rawEffortMinutes(logs, nowMs);
			const byTask = [...rawMins.entries()].map(([taskId, raw]) => ({
				taskId,
				summary: index.issues.get(taskId)?.summary ?? index.routines.get(taskId)?.summary ?? null,
				rawMinutes: Math.round(raw),
				proratedMinutes: Math.round((proratedMs.get(taskId) ?? 0) / 60_000),
			}));
			return {
				from,
				to,
				entryCount: logs.length,
				byTask,
				running: index.running(),
				findings: reviewWorklogs(index, nowMs),
			};
		}
		case "get_routine_stats": {
			const refDate = typeof args.today === "string" ? args.today : today;
			if (!isLocalDate(refDate)) throw new Error(`today が YYYY-MM-DD ではありません: ${String(args.today)}`);
			const days = typeof args.days === "number" && args.days > 0 ? Math.trunc(args.days) : 14;
			const targets =
				typeof args.id === "string"
					? [index.routines.get(args.id)].filter((r) => r !== undefined)
					: [...index.routines.values()].filter((r) => r.active);
			if (typeof args.id === "string" && targets.length === 0) {
				throw new Error(`routine がありません: ${args.id}`);
			}
			return targets.map((r) => {
				const results = routineResults(index, r!, refDate, days);
				const scheduledDays = results.filter((d) => d.state !== "off");
				const closedDays = scheduledDays.filter((d) => d.state === "closed");
				return {
					id: r!.id,
					summary: r!.summary,
					active: r!.active,
					scheduledCount: scheduledDays.length,
					closedCount: closedDays.length,
					completionRate: scheduledDays.length > 0 ? Math.round((closedDays.length / scheduledDays.length) * 100) / 100 : null,
					days: results,
				};
			});
		}
		case "add_to_board": {
			const date = String(args.date ?? "");
			const ids = Array.isArray(args.issue_ids) ? args.issue_ids.map(String) : [];
			addToBoardOnDisk(ctx.root, index, date, ids, ctx.device, now);
			return { ok: true, date, added: ids };
		}
		case "remove_from_board": {
			const date = String(args.date ?? "");
			const issueId = String(args.issue_id ?? "");
			removeFromBoardOnDisk(ctx.root, index, date, issueId, ctx.device, now);
			return { ok: true, date, removed: issueId };
		}
		case "move_card": {
			const date = String(args.date ?? "");
			const id = String(args.id ?? "");
			const group = args.group === null || args.group === undefined ? null : String(args.group);
			moveCardOnDisk(ctx.root, index, date, id, group, ctx.device, now);
			return { ok: true, date, id, group };
		}
		case "set_routine_result": {
			const date = String(args.date ?? "");
			const routineId = String(args.routine_id ?? "");
			const result = (args.result ?? null) as RoutineResult | null;
			setRoutineResultOnDisk(ctx.root, index, date, routineId, result, ctx.device, now);
			return { ok: true, date, routineId, result };
		}
		case "carry_issues": {
			const date = String(args.date ?? "");
			const ids = Array.isArray(args.issue_ids) ? args.issue_ids.map(String) : [];
			const mode = args.mode as "reschedule" | "inbox";
			const rescheduleTo = typeof args.reschedule_to === "string" ? args.reschedule_to : null;
			carryIssuesOnDisk(ctx.root, index, date, ids, mode, rescheduleTo, ctx.device, now);
			return { ok: true, date, carried: ids, mode, rescheduleTo };
		}
		case "close_board": {
			const date = String(args.date ?? "");
			return closeBoardOnDisk(ctx.root, index, date, ctx.device, now);
		}
		case "reopen_board": {
			const date = String(args.date ?? "");
			appendBoardOpsOnDisk(ctx.root, index, date, ctx.device, [{ op: "reopen" }], now);
			return { ok: true, date, reopened: true };
		}
		case "create_issue": {
			return createIssueOnDisk(
				ctx.root,
				index,
				{
					summary: String(args.summary ?? ""),
					parent: (args.parent as string | null | undefined) ?? null,
					scheduled: Array.isArray(args.scheduled) ? args.scheduled.map(String) : [],
					priority: args.priority as Priority | null | undefined,
					labels: Array.isArray(args.labels) ? args.labels.map(String) : undefined,
					estimated: args.estimated as number | null | undefined,
					soft_deadline: args.soft_deadline as LocalDate | null | undefined,
					deadline: args.deadline as LocalDate | null | undefined,
					add_to_board_date: args.add_to_board_date as LocalDate | null | undefined,
				},
				ctx.device,
				now,
			);
		}
		case "update_issue": {
			return updateIssueOnDisk(ctx.root, index, {
				id: String(args.id ?? ""),
				...(args.summary !== undefined ? { summary: String(args.summary) } : {}),
				...(args.status !== undefined ? { status: args.status as Status } : {}),
				...(args.status_detail !== undefined ? { status_detail: args.status_detail as string | null } : {}),
				...(args.delegated_to !== undefined ? { delegated_to: args.delegated_to as string | null } : {}),
				...(args.priority !== undefined ? { priority: args.priority as Priority | null } : {}),
				...(Array.isArray(args.labels) ? { labels: args.labels.map(String) } : {}),
				...(args.parent !== undefined ? { parent: args.parent as string | null } : {}),
				...(Array.isArray(args.scheduled) ? { scheduled: args.scheduled.map(String) } : {}),
				...(args.soft_deadline !== undefined ? { soft_deadline: args.soft_deadline as LocalDate | null } : {}),
				...(args.deadline !== undefined ? { deadline: args.deadline as LocalDate | null } : {}),
				...(args.revisit !== undefined ? { revisit: args.revisit as LocalDate | null } : {}),
				...(args.reviewed !== undefined ? { reviewed: args.reviewed as LocalDate | null } : {}),
				...(args.estimated !== undefined ? { estimated: args.estimated as number | null } : {}),
			}, { device: ctx.device, now });
		}
		case "start_timer": {
			const ids = Array.isArray(args.task_ids) ? args.task_ids.map(String) : [];
			const started = startTimerOnDisk(ctx.root, index, ids, ctx.device, now);
			return { ok: true, started };
		}
		case "stop_timer": {
			const ids = Array.isArray(args.task_ids) ? args.task_ids.map(String) : undefined;
			const stopped = stopTimerOnDisk(ctx.root, index, ids, now);
			return { ok: true, stopped };
		}
		case "append_daily_note": {
			const date = String(args.date ?? "");
			const heading = String(args.heading ?? "");
			const content = String(args.content ?? "");
			return appendDailyNoteOnDisk(ctx.root, date, heading, content, now);
		}
		default:
			throw new Error(`未知のツールです: ${name}`);
	}
}

export function handleMcpRequest(ctx: McpContext, req: JsonRpcRequest): JsonRpcResponse | null {
	const id = req.id ?? null;
	if (req.method === "notifications/initialized" || req.method.startsWith("notifications/")) {
		return null;
	}
	if (req.method === "initialize") {
		return {
			jsonrpc: "2.0",
			id,
			result: {
				protocolVersion: "2024-11-05",
				capabilities: { tools: {} },
				serverInfo: { name: "vault-task-mcp", version: "1.0.0" },
			},
		};
	}
	if (req.method === "ping") {
		return { jsonrpc: "2.0", id, result: {} };
	}
	if (req.method === "tools/list") {
		return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
	}
	if (req.method === "tools/call") {
		const params = req.params ?? {};
		const name = String(params.name ?? "");
		const args =
			typeof params.arguments === "object" && params.arguments !== null && !Array.isArray(params.arguments)
				? (params.arguments as Record<string, unknown>)
				: {};
		try {
			const out = callMcpTool(ctx, name, args);
			return {
				jsonrpc: "2.0",
				id,
				result: {
					content: [{ type: "text", text: JSON.stringify(out, null, 2) }],
				},
			};
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			return {
				jsonrpc: "2.0",
				id,
				result: {
					isError: true,
					content: [{ type: "text", text: message }],
				},
			};
		}
	}
	return {
		jsonrpc: "2.0",
		id,
		error: { code: -32601, message: `Method not found: ${req.method}` },
	};
}

function parseMcpArgs(argv: string[]): { root: string; device: string } {
	let device = process.env.VAULT_TASK_DEVICE ?? "ai";
	let root = process.cwd();
	for (const a of argv) {
		if (a.startsWith("--device=")) {
			device = a.slice("--device=".length);
		} else if (!a.startsWith("--")) {
			root = a;
		}
	}
	return { root, device };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	const { root, device } = parseMcpArgs(process.argv.slice(2));
	const ctx: McpContext = { root, device };
	const rl = createInterface({ input: process.stdin, terminal: false });
	rl.on("line", (line) => {
		const trimmed = line.trim();
		if (!trimmed) return;
		try {
			const req = JSON.parse(trimmed) as JsonRpcRequest;
			const res = handleMcpRequest(ctx, req);
			if (res !== null) process.stdout.write(`${JSON.stringify(res)}\n`);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message } })}\n`);
		}
	});
}
