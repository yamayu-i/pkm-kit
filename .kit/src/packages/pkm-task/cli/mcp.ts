/**
 * pkm-task の MCP サーバー（ADR-0025）。
 * 外部依存を追加せず、Node 標準機能のみで JSON-RPC 2.0 over stdio を実装する。
 *
 * 使い方: node .kit/bin/mcp.mjs [Vault のルート] [--device=ai]
 */
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { emptyBoard, pendingBoards, routineResults, unfinished, type RoutineResult } from "../src/core/board";
import { isLocalDate, localToday, type LocalDate } from "../src/core/dates";
import { prorateEffort } from "../src/core/effort";
import { LANES, boardLanes, cardStatus, cardSummary, type BoardCard } from "../src/core/board-lanes";
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
	orderCardOnDisk,
	starCardOnDisk,
	readMarkdownBody,
	removeFromBoardOnDisk,
	setRoutineResultOnDisk,
	startTimerOnDisk,
	stopTimerOnDisk,
	createSubIssuesOnDisk,
	deleteSubIssueOnDisk,
	moveSubIssueOnDisk,
	updateIssueOnDisk,
	updateSubIssueOnDisk,
} from "./vault-ops";
import { splitSubIssueText, type NewSubIssue, type SubIssuePatch } from "../src/core/sub-issue";

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
		description:
			"指定日（既定は今日）のタスクボードの状態を取得する。lanes は欄ごとのカード（working: タイマーが動いているもの、top: ★今日の最重要（3 件まで）、next: 次にやる順、waiting: waiting / delegated、done: 片付いたもの）で、それぞれ画面の順。カードの key は issue の ID・サブの合成キー（i-N#xxxxxx）・routine の ID",
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
		description: "条件（status、priority、label、予定の有無、Inboxのみ、文字列検索、並び順）で絞った issue 一覧を取得する",
		inputSchema: {
			type: "object",
			properties: {
				text: { type: "string" },
				statuses: { type: "array", items: { type: "string" } },
				priorities: { type: "array", items: { type: "string" } },
				labels: { type: "array", items: { type: "string" } },
				scheduled: { type: "string", enum: ["any", "yes", "no"] },
				inbox_only: { type: "boolean", description: "true のとき Inbox（open で clarified でない。日付は見ない。ADR-0148）の issue のみ返す" },
				sort: { type: "string", enum: ["id", "summary", "status", "priority", "soft_deadline", "deadline", "created", "next_scheduled"] },
				desc: { type: "boolean" },
				limit: { type: "number", description: "最大件数（既定 100）" },
			},
		},
	},
	{
		name: "get_issue",
		description:
			"issue の詳細（frontmatter、Markdown本文、サブイシューの一覧、按分後の実績工数、持ち越し回数）を取得する。effortMinutes は親に直接付けた分とサブの分の合計、directEffortMinutes は親に直接付けた分だけ",
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
		description: "指定日のボードに issue かサブ（合成キー i-N#xxxxxx）を載せる。その日が scheduled でないサブは、scheduled に足してから載せる",
		inputSchema: {
			type: "object",
			properties: {
				date: { type: "string", description: "YYYY-MM-DD" },
				issue_ids: { type: "array", items: { type: "string" }, description: "issue の ID かサブの合成キー" },
			},
			required: ["date", "issue_ids"],
		},
	},
	{
		name: "remove_from_board",
		description: "指定日のボードから issue かサブ（合成キー）を外す",
		inputSchema: {
			type: "object",
			properties: {
				date: { type: "string", description: "YYYY-MM-DD" },
				issue_id: { type: "string", description: "issue の ID かサブの合成キー" },
			},
			required: ["date", "issue_id"],
		},
	},
	{
		name: "order_card",
		description: "ボードのカードを、同じ欄（top / next / waiting）の before の前に動かす（before が null なら欄の末尾）。並びは翌日以降にも引き継ぐ",
		inputSchema: {
			type: "object",
			properties: {
				date: { type: "string", description: "YYYY-MM-DD" },
				key: { type: "string", description: "カードの key（issue の ID・サブの合成キー・routine の ID）" },
				before: { type: ["string", "null"], description: "前に来るカードの key。null なら欄の末尾" },
			},
			required: ["date", "key", "before"],
		},
	},
	{
		name: "star_card",
		description: "ボードのカードに ★ 今日の最重要を付ける（on: true）か外す（on: false）。★ は 3 件まで。その日だけで翌日には引き継がない",
		inputSchema: {
			type: "object",
			properties: {
				date: { type: "string", description: "YYYY-MM-DD" },
				key: { type: "string", description: "カードの key" },
				on: { type: "boolean" },
			},
			required: ["date", "key", "on"],
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
		description: "ボード上の未完了 issue・サブをリスケ（別の日へ移動）または Inbox 戻し（clarified を外す。日付は残す）で片付け、carried にする。サブは Inbox に戻せない",
		inputSchema: {
			type: "object",
			properties: {
				date: { type: "string", description: "ボードの日付 YYYY-MM-DD" },
				issue_ids: { type: "array", items: { type: "string" }, description: "issue の ID かサブの合成キー" },
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
				scheduled: { type: "array", items: { type: "string" } },
				priority: { type: ["string", "null"], enum: ["high", "mid", "low", "chore", null] },
				labels: { type: "array", items: { type: "string" } },
				estimated: { type: ["number", "null"] },
				soft_deadline: { type: ["string", "null"] },
				deadline: { type: ["string", "null"] },
				clarified: { type: "boolean", description: "整理済み（何をするか決めた）で作る。省くと Inbox（未整理）に入る（ADR-0148）" },
				add_to_board_date: { type: ["string", "null"], description: "指定した日付（YYYY-MM-DD）のボードにも載せる" },
			},
			required: ["summary"],
		},
	},
	{
		name: "update_issue",
		description: "issue の frontmatter（status, priority, scheduled, deadline, estimated など）を検査付きで更新する。サブイシューは update_sub_issue で直す",
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
				scheduled: { type: "array", items: { type: "string" } },
				soft_deadline: { type: ["string", "null"] },
				deadline: { type: ["string", "null"] },
				revisit: { type: ["string", "null"] },
				reviewed: { type: ["string", "null"] },
				estimated: { type: ["number", "null"] },
				clarified: { type: ["boolean", "null"], description: "整理済みか（ADR-0148）。true で Inbox から出る。false / null で Inbox に戻す（日付は残る）" },
			},
			required: ["id"],
		},
	},
	{
		name: "create_sub_issues",
		description:
			"issue の md の中にサブイシューを足す（ADR-0135。サブのサブは作れない）。items の順に、末尾か position の位置に置く。作ったサブの合成キー（i-12#k3f9a2）を返す。大きい issue を分けるときに使う",
		inputSchema: {
			type: "object",
			properties: {
				parent: { type: "string", description: "親の issue の ID（i-N）" },
				items: {
					type: "array",
					items: {
						type: "object",
						properties: {
							summary: { type: "string" },
							status: { type: "string", enum: ["open", "in-progress", "waiting", "delegated", "someday", "closed", "canceled"] },
							delegated_to: { type: ["string", "null"], description: "status が delegated のときだけ（m-N）" },
							start: { type: ["string", "null"], description: "ガントチャートの開始日（YYYY-MM-DD）" },
							end: { type: ["string", "null"], description: "ガントチャートの終了日（YYYY-MM-DD）" },
							scheduled: { type: ["array", "null"], items: { type: "string" } },
							soft_deadline: { type: ["string", "null"] },
							deadline: { type: ["string", "null"] },
							estimated: { type: ["number", "null"], description: "分。親の estimated（全体の予算）には足さない" },
							depends_on: { type: ["array", "null"], items: { type: "string" }, description: "同じ親のサブの id（6 文字）" },
							body: { type: "string", description: "サブの本文（Markdown）" },
						},
						required: ["summary"],
					},
				},
				position: { type: "number", description: "差し込む位置（0 から。省くと末尾）" },
			},
			required: ["parent", "items"],
		},
	},
	{
		name: "update_sub_issue",
		description: "サブイシューの項目と本文を検査付きで直す。null で項目を消す。status の変化は statuslog に記録し、closed / canceled ならそのサブのタイマーを止める。親の status は変えない",
		inputSchema: {
			type: "object",
			properties: {
				key: { type: "string", description: "合成キー（例: i-12#k3f9a2）" },
				summary: { type: "string" },
				status: { type: "string", enum: ["open", "in-progress", "waiting", "delegated", "someday", "closed", "canceled"] },
				delegated_to: { type: ["string", "null"], description: "status が delegated のときだけ（m-N）" },
				start: { type: ["string", "null"], description: "ガントチャートの開始日（YYYY-MM-DD）" },
				end: { type: ["string", "null"], description: "ガントチャートの終了日（YYYY-MM-DD）" },
				scheduled: { type: ["array", "null"], items: { type: "string" } },
				soft_deadline: { type: ["string", "null"] },
				deadline: { type: ["string", "null"] },
				estimated: { type: ["number", "null"], description: "分。親の estimated（全体の予算）には足さない" },
				depends_on: { type: ["array", "null"], items: { type: "string" }, description: "同じ親のサブの id（6 文字）" },
				body: { type: "string", description: "サブの本文（Markdown）" },
			},
			required: ["key"],
		},
	},
	{
		name: "move_sub_issue",
		description: "サブイシューを、同じ親の中で position の位置（0 から）へ移す",
		inputSchema: {
			type: "object",
			properties: {
				key: { type: "string", description: "合成キー（例: i-12#k3f9a2）" },
				position: { type: "number" },
			},
			required: ["key", "position"],
		},
	},
	{
		name: "delete_sub_issue",
		description: "サブイシューを本文ごと消す。記録中のタイマーは止める。worklog の行は残り、親の実績に含まれる。ほかのサブの depends_on にあるときは消せない",
		inputSchema: {
			type: "object",
			properties: {
				key: { type: "string", description: "合成キー（例: i-12#k3f9a2）" },
			},
			required: ["key"],
		},
	},
	{
		name: "start_timer",
		description: "指定した issue / routine / サブイシューの作業記録タイマーを開始する。サブは合成キー（i-12#k3f9a2）で指す。open のものは in-progress にする（サブのときは親の status を変えない）",
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
		description: "記録中のタイマーを停止する（task_ids 省略時はすべての記録中タイマーを止める）。サブは合成キーで指す。親の ID では親に直接付けた記録だけを止める",
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

/** MCP の引数（snake_case）を、サブの項目にする。渡された項目だけを持つ。null は項目を消す（リストは空にする） */
function subPatch(args: Record<string, unknown>): SubIssuePatch {
	const out: SubIssuePatch = {};
	const str = (key: string): string | null => {
		const v = args[key];
		if (v === null) return null;
		if (typeof v !== "string") throw new Error(`${key} は文字列にしてください`);
		return v.trim() || null;
	};
	const list = (key: string): string[] => {
		const v = args[key];
		if (v === null) return [];
		if (!Array.isArray(v)) throw new Error(`${key} は配列にしてください`);
		return v.map(String);
	};
	if (args.summary !== undefined) out.summary = String(args.summary);
	if (args.status !== undefined) out.status = String(args.status) as Status;
	if (args.delegated_to !== undefined) out.delegatedTo = str("delegated_to");
	if (args.start !== undefined) out.start = str("start");
	if (args.end !== undefined) out.end = str("end");
	if (args.scheduled !== undefined) out.scheduled = [...new Set(list("scheduled"))].sort();
	if (args.soft_deadline !== undefined) out.softDeadline = str("soft_deadline");
	if (args.deadline !== undefined) out.deadline = str("deadline");
	if (args.estimated !== undefined) {
		if (args.estimated !== null && typeof args.estimated !== "number") throw new Error("estimated は数（分）にしてください");
		out.estimated = args.estimated as number | null;
	}
	if (args.depends_on !== undefined) out.dependsOn = [...new Set(list("depends_on"))];
	if (args.body !== undefined) out.body = String(args.body ?? "");
	return out;
}

export function callMcpTool(ctx: McpContext, name: string, args: Record<string, unknown> = {}): unknown {
	const now = ctx.now ? ctx.now() : new Date();
	const today = localToday(now);
	const { index, problems } = loadIndex(ctx.root);
	// 親子関係は廃止した（ADR-0135）。黙って無視せず、サブイシューの操作を案内する
	if ((name === "create_issue" || name === "update_issue" || name === "list_issues") && args.parent !== undefined) {
		throw new Error("parent は廃止しました（ADR-0135）。分けるときは create_sub_issues でサブイシューを足してください");
	}

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
			const lanes = boardLanes(index, date, board);
			const card = (c: BoardCard) => ({
				key: c.key,
				kind: c.kind,
				...(c.kind === "sub" ? { parent: c.sub.parent, parentSummary: c.parent?.summary ?? null } : {}),
				summary: cardSummary(c),
				status: cardStatus(board, c),
				starred: board.stars.includes(c.key),
				carried: board.carried.includes(c.key),
			});
			return {
				date,
				closed: board.closed,
				lanes: Object.fromEntries(LANES.map((l) => [l, lanes[l].map(card)])),
				unfinished: unfinished(index, date, board),
				carried: board.carried,
				stars: board.stars,
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
					unfinishedSubs: u.subs,
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
			const byKey = index.effortByKey(now.getTime());
			const counts = carryCounts(index.data.boards);
			return {
				...issue,
				body: splitSubIssueText(readMarkdownBody(ctx.root, issue.path)).head,
				subIssues: index.subs(id).map(({ path: _path, parent: _parent, ...s }) => ({ ...s, effortMinutes: Math.round(byKey.get(s.key) ?? 0) })),
				effortMinutes: Math.round(efforts.get(id) ?? 0),
				directEffortMinutes: Math.round(byKey.get(id) ?? 0),
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
		case "order_card": {
			const date = String(args.date ?? "");
			const key = String(args.key ?? "");
			const before = args.before === null || args.before === undefined ? null : String(args.before);
			orderCardOnDisk(ctx.root, index, date, key, before, ctx.device, now);
			return { ok: true, date, key, before };
		}
		case "star_card": {
			const date = String(args.date ?? "");
			const key = String(args.key ?? "");
			starCardOnDisk(ctx.root, index, date, key, args.on as boolean, ctx.device, now);
			return { ok: true, date, key, on: args.on };
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
					scheduled: Array.isArray(args.scheduled) ? args.scheduled.map(String) : [],
					priority: args.priority as Priority | null | undefined,
					labels: Array.isArray(args.labels) ? args.labels.map(String) : undefined,
					estimated: args.estimated as number | null | undefined,
					soft_deadline: args.soft_deadline as LocalDate | null | undefined,
					deadline: args.deadline as LocalDate | null | undefined,
					clarified: args.clarified as boolean | undefined,
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
				...(Array.isArray(args.scheduled) ? { scheduled: args.scheduled.map(String) } : {}),
				...(args.soft_deadline !== undefined ? { soft_deadline: args.soft_deadline as LocalDate | null } : {}),
				...(args.deadline !== undefined ? { deadline: args.deadline as LocalDate | null } : {}),
				...(args.revisit !== undefined ? { revisit: args.revisit as LocalDate | null } : {}),
				...(args.reviewed !== undefined ? { reviewed: args.reviewed as LocalDate | null } : {}),
				...(args.estimated !== undefined ? { estimated: args.estimated as number | null } : {}),
				...(args.clarified !== undefined ? { clarified: args.clarified as boolean | null } : {}),
			}, { device: ctx.device, now });
		}
		case "create_sub_issues": {
			const items = Array.isArray(args.items) ? args.items.map((it) => subPatch(it as Record<string, unknown>)) : [];
			const position = args.position === undefined ? undefined : Number(args.position);
			const created = createSubIssuesOnDisk(ctx.root, index, String(args.parent ?? ""), items as NewSubIssue[], now, position);
			return { ok: true, created };
		}
		case "update_sub_issue": {
			const key = String(args.key ?? "");
			const sub = updateSubIssueOnDisk(ctx.root, index, key, subPatch(args), { device: ctx.device, now, via: "mcp" });
			return { ok: true, key, sub };
		}
		case "move_sub_issue": {
			const key = String(args.key ?? "");
			moveSubIssueOnDisk(ctx.root, index, key, Number(args.position));
			return { ok: true, key, position: Number(args.position) };
		}
		case "delete_sub_issue": {
			const key = String(args.key ?? "");
			deleteSubIssueOnDisk(ctx.root, index, key, now);
			return { ok: true, key, deleted: true };
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
				serverInfo: { name: "pkm-task-mcp", version: "1.0.0" },
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
	// VAULT_TASK_DEVICE は改名前の名前（ADR-0058）
	let device = process.env.PKM_TASK_DEVICE ?? process.env.VAULT_TASK_DEVICE ?? "ai";
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
