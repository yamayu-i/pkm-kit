/**
 * MCP の note_ / daily_ / wiki_ / check_ / meta_ の群（ADR-0156 の段階 1。読み取りとフィードバックだけ）。
 * task_ の群は mcp.ts にある。
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { Problem } from "../src/core/problem";
import { FEEDBACK_KINDS, logEnabled, pathArea, type McpLogger } from "./mcp-log";
import {
	backlinksOf,
	bodyOf,
	DAILY_RE,
	matchesFilter,
	pageOf,
	recentLogEntries,
	searchNotes,
	summaryOf,
	unprocessedSources,
	type Note,
	type NoteFilter,
	type NoteStore,
} from "./notes";

export const TOOLSETS = ["task", "note", "daily", "wiki", "check", "meta"] as const;
export type Toolset = (typeof TOOLSETS)[number];

export interface ToolDef {
	name: string;
	description: string;
	inputSchema: { type: "object"; properties: Record<string, unknown>; required?: string[] };
}

export interface PkmContext {
	root: string;
	today: string;
	notes: NoteStore;
	/** タスク管理のデータの検査の結果（check_vault が使う） */
	taskProblems: () => Problem[];
	log?: McpLogger | null;
}

const LIMIT = { type: "number", description: "件数（既定 20、上限 100）" };
const CURSOR = { type: "string", description: "続きを取るときに、前の応答の cursor を渡す" };
const FILTERS = {
	type: { type: "string", description: "frontmatter の type（note / daily / concept など）" },
	tags: { type: "array", items: { type: "string" }, description: "すべてを持つものだけ" },
	path_prefix: { type: "string", description: "パスの先頭（例: wiki/）" },
	from: { type: "string", description: "YYYY-MM-DD 以降（daily はファイル名の日付、ほかは updated か created）" },
	to: { type: "string", description: "YYYY-MM-DD 以前" },
};
const FULL = { type: "boolean", description: "true なら本文を切らずに返す（既定は 8,000 字で切る）" };

export const PKM_TOOLS: Record<Exclude<Toolset, "task">, ToolDef[]> = {
	note: [
		{
			name: "note_search",
			description:
				"ノートを単純一致で検索する。空白で区切った語の AND。全角・半角、大文字・小文字、カタカナ・ひらがなの違いは無視する。title → aliases → tags → 本文の順に当たったものを上にし、同じなら新しい順。意味の近い語は当たらないので、見つからなければ言い換えて検索し直す。tmp/・template/・slide/・隠しパスは対象外",
			inputSchema: { type: "object", properties: { query: { type: "string", description: "検索語" }, ...FILTERS, limit: LIMIT, cursor: CURSOR }, required: ["query"] },
		},
		{
			name: "note_get",
			description: "ノート 1 件の frontmatter・本文・出るリンクと被リンクの件数を取得する",
			inputSchema: { type: "object", properties: { path: { type: "string", description: "Vault ルートからのパス（.md まで）" }, full: FULL }, required: ["path"] },
		},
		{
			name: "note_list",
			description: "ノートを条件で絞って一覧にする（本文は返さない）",
			inputSchema: {
				type: "object",
				properties: {
					...FILTERS,
					sort: { type: "string", enum: ["date", "title", "path"], description: "既定は date（新しい順）" },
					desc: { type: "boolean", description: "降順（date の既定は true、ほかは false）" },
					limit: LIMIT,
					cursor: CURSOR,
				},
			},
		},
		{
			name: "note_links",
			description: "ノートの出るリンク（リンク先があるか）と被リンクを取得する",
			inputSchema: { type: "object", properties: { path: { type: "string" }, limit: LIMIT }, required: ["path"] },
		},
	],
	daily: [
		{
			name: "daily_get",
			description: "その日のデイリーノートの frontmatter と本文を取得する",
			inputSchema: { type: "object", properties: { date: { type: "string", description: "YYYY-MM-DD（省略時は今日）" }, full: FULL } },
		},
		{
			name: "daily_list_pending",
			description: "wiki-daily で次に処理するデイリーノート（前回の daily の記録の後に追加・変更されたもの。今日より前）を一覧にする",
			inputSchema: { type: "object", properties: { today: { type: "string", description: "YYYY-MM-DD（省略時は今日）" }, limit: LIMIT, cursor: CURSOR } },
		},
	],
	wiki: [
		{
			name: "wiki_get_index",
			description: "wiki の目次（wiki/index.md）を取得する。wiki から答えるときは、まずここから辿る",
			inputSchema: { type: "object", properties: { full: FULL } },
		},
		{
			name: "wiki_recent_log",
			description: "wiki の操作の記録（wiki/log.md）を新しいものから取得する",
			inputSchema: { type: "object", properties: { limit: { type: "number", description: "件数（既定 10、上限 100）" } } },
		},
		{
			name: "wiki_list_unprocessed_sources",
			description: "wiki のページ（frontmatter の sources か本文のリンク）から参照されていない元資料（sources/）を一覧にする",
			inputSchema: { type: "object", properties: { limit: LIMIT, cursor: CURSOR } },
		},
	],
	check: [
		{
			name: "check_vault",
			description:
				"Vault を検査する。notes はノートの書式・リンク切れ・wiki の index への掲載など（wiki-lint と同じ判定。errors は直す、warnings は人のノートなのでユーザーに伝える）、tasks はタスク管理のデータの整合性（lint と同じ判定）",
			inputSchema: { type: "object", properties: { scope: { type: "string", enum: ["all", "notes", "tasks"], description: "既定は all" }, limit: LIMIT } },
		},
		{
			name: "check_rename_candidates",
			description: "ファイル名が英語のケバブケースになっていないノート（note-rename の候補）を一覧にする",
			inputSchema: { type: "object", properties: { limit: LIMIT, cursor: CURSOR } },
		},
	],
	meta: [
		{
			name: "meta_feedback",
			description:
				"MCP のツールで足りなかったこと・困ったことを記録する（上流の改善に使う）。次のときに呼ぶ: 必要なツールがない（missing）、結果が誤っている（wrong）、応答が大きすぎる（large）、遅い（slow）、使い方が分からない（unclear）、拒否が不当（rejected）、MCP を使わずにファイルを直接読み書きした（bypass）。summary にノートの中身や個人の情報を書かない",
			inputSchema: {
				type: "object",
				properties: {
					kind: { type: "string", enum: [...FEEDBACK_KINDS] },
					tool: { type: "string", description: "対象のツール名（あれば）" },
					summary: { type: "string", description: "200 字以内。何をしようとして、何が足りなかったか" },
				},
				required: ["kind", "summary"],
			},
		},
	],
};

export function isPkmTool(name: string): boolean {
	return Object.values(PKM_TOOLS).some((defs) => defs.some((d) => d.name === name));
}

function filterOf(args: Record<string, unknown>): NoteFilter {
	const f: NoteFilter = {};
	if (typeof args.type === "string") f.type = args.type;
	if (Array.isArray(args.tags)) f.tags = args.tags.map(String);
	if (typeof args.path_prefix === "string") f.pathPrefix = args.path_prefix;
	for (const k of ["from", "to"] as const) {
		const v = args[k];
		if (v === undefined) continue;
		if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error(`[validation] ${k} は YYYY-MM-DD にしてください`);
		f[k] = v;
	}
	return f;
}

function requireNote(ctx: PkmContext, path: unknown): Note {
	if (typeof path !== "string" || !path) throw new Error("[validation] path を指定してください");
	const p = path.replace(/^\.?\//, "");
	const n = ctx.notes.get(p);
	if (n) return n;
	const area = pathArea(p);
	if (["hidden", "tmp", "template", "slide"].includes(area)) throw new Error(`[ownership] ${area} の場所は MCP では読みません: ${p}`);
	if (!p.endsWith(".md")) throw new Error(`[validation] ノートのパスは .md まで書いてください: ${p}`);
	throw new Error(`[not_found] ノートがありません: ${p}`);
}

function noteDetail(ctx: PkmContext, n: Note, full: unknown) {
	const { body, length, truncated } = bodyOf(n, full);
	return {
		path: n.path,
		title: n.title,
		type: n.type,
		frontmatter: n.frontmatter,
		body,
		bodyLength: length,
		truncated,
		linkCount: n.links.length,
		backlinkCount: backlinksOf(ctx.notes.notes.values(), n.path).length,
	};
}

/** Vault のハーネスのスクリプト（.claude/scripts/）を別のプロセスで呼ぶ。判定を MCP と CLI でずらさないため */
export function runHarness<T>(root: string, script: string, expr: string): T {
	const file = join(root, ".claude/scripts", script);
	if (!existsSync(file)) throw new Error(`[not_found] ハーネスのスクリプトがありません: .claude/scripts/${script}`);
	const code = `import * as m from ${JSON.stringify(pathToFileURL(file).href)};\nconst root = process.argv[1];\nconst out = await (${expr});\nprocess.stdout.write(JSON.stringify(out));`;
	const r = spawnSync(process.execPath, ["--input-type=module", "-e", code, root], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
	if (r.status !== 0) throw new Error(`[internal] .claude/scripts/${script} が失敗しました: ${(r.stderr || "").trim().split("\n").slice(-3).join(" / ")}`);
	return JSON.parse(r.stdout) as T;
}

interface Located {
	path: string;
	line?: number;
	message: string;
}

export function callPkmTool(ctx: PkmContext, name: string, args: Record<string, unknown>): unknown {
	switch (name) {
		case "note_search": {
			if (typeof args.query !== "string" || !args.query.trim()) throw new Error("[validation] query を指定してください");
			return pageOf(searchNotes(ctx.notes.notes.values(), args.query, filterOf(args)), args.limit, args.cursor);
		}
		case "note_get":
			return noteDetail(ctx, requireNote(ctx, args.path), args.full);
		case "note_list": {
			const f = filterOf(args);
			const sort = args.sort === "title" || args.sort === "path" ? args.sort : "date";
			const desc = typeof args.desc === "boolean" ? args.desc : sort === "date";
			const all = [...ctx.notes.notes.values()].filter((n) => matchesFilter(n, f));
			const key = (n: Note) => (sort === "title" ? n.title : sort === "path" ? n.path : (n.date ?? ""));
			all.sort((a, b) => key(a).localeCompare(key(b)) * (desc ? -1 : 1) || a.path.localeCompare(b.path));
			return pageOf(all.map(summaryOf), args.limit, args.cursor);
		}
		case "note_links": {
			const n = requireNote(ctx, args.path);
			const outgoing = n.links.map((target) => ({ target, exists: ctx.notes.exists(target), title: ctx.notes.get(target)?.title ?? null }));
			const back = backlinksOf(ctx.notes.notes.values(), n.path).map((b) => ({ path: b.path, title: b.title }));
			const o = pageOf(outgoing, args.limit, undefined);
			const b = pageOf(back, args.limit, undefined);
			return { path: n.path, outgoing: o.items, outgoingTotal: o.total, backlinks: b.items, backlinkTotal: b.total, truncated: o.truncated || b.truncated };
		}
		case "daily_get": {
			const date = typeof args.date === "string" ? args.date : ctx.today;
			if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("[validation] date は YYYY-MM-DD にしてください");
			const path = `daily/${date.slice(0, 4)}/${date.slice(5, 7)}/${date}.md`;
			const n = ctx.notes.get(path);
			if (!n || !DAILY_RE.test(path)) throw new Error(`[not_found] デイリーノートがありません: ${path}`);
			return noteDetail(ctx, n, args.full);
		}
		case "daily_list_pending": {
			const today = typeof args.today === "string" ? args.today : ctx.today;
			if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new Error("[validation] today は YYYY-MM-DD にしてください");
			const r = runHarness<{ last: unknown; head: string; pending: unknown[] }>(ctx.root, "daily-pending.mjs", `m.pendingDaily(root, ${JSON.stringify(today)})`);
			return { last: r.last, head: r.head, ...pageOf(r.pending, args.limit, args.cursor) };
		}
		case "wiki_get_index": {
			const n = ctx.notes.get("wiki/index.md");
			if (!n) throw new Error("[not_found] wiki/index.md がありません");
			return noteDetail(ctx, n, args.full);
		}
		case "wiki_recent_log": {
			const n = ctx.notes.get("wiki/log.md");
			if (!n) throw new Error("[not_found] wiki/log.md がありません");
			const limit = typeof args.limit === "number" && args.limit > 0 ? Math.min(Math.trunc(args.limit), 100) : 10;
			const entries = recentLogEntries(n.body, limit);
			return { total: entries.length, items: entries };
		}
		case "wiki_list_unprocessed_sources":
			return pageOf(
				unprocessedSources(ctx.notes.notes.values()).map((n) => ({ path: n.path, title: n.title, created: n.created })),
				args.limit,
				args.cursor,
			);
		case "check_vault": {
			const scope = args.scope === "notes" || args.scope === "tasks" ? args.scope : "all";
			const out: Record<string, unknown> = { scope };
			let truncated = false;
			if (scope !== "tasks") {
				const r = runHarness<{ errors: Located[]; warnings: Located[] }>(ctx.root, "wiki-lint.mjs", "m.lintVault(root)");
				const e = pageOf(r.errors, args.limit, undefined);
				const w = pageOf(r.warnings, args.limit, undefined);
				truncated ||= e.truncated || w.truncated;
				out.notes = { errorCount: e.total, errors: e.items, warningCount: w.total, warnings: w.items };
			}
			if (scope !== "notes") {
				const p = pageOf(ctx.taskProblems(), args.limit, undefined);
				truncated ||= p.truncated;
				out.tasks = { problemCount: p.total, problems: p.items };
			}
			out.truncated = truncated;
			return out;
		}
		case "check_rename_candidates": {
			const paths = runHarness<string[]>(ctx.root, "note-rename.mjs", "m.listCandidates(root)");
			return pageOf(paths, args.limit, args.cursor);
		}
		case "meta_feedback": {
			const kind = String(args.kind ?? "");
			if (!(FEEDBACK_KINDS as readonly string[]).includes(kind)) throw new Error(`[validation] kind は ${FEEDBACK_KINDS.join(" / ")} のどれかにしてください`);
			const summary = String(args.summary ?? "").trim();
			if (!summary) throw new Error("[validation] summary を書いてください");
			if (summary.length > 200) throw new Error("[validation] summary は 200 字以内にしてください");
			const tool = typeof args.tool === "string" && args.tool ? args.tool.slice(0, 64) : null;
			const recorded = !!ctx.log && logEnabled();
			ctx.log?.write("feedback", { tool, type: kind, summary });
			return { ok: true, recorded };
		}
		default:
			throw new Error(`[unknown_tool] 未知のツールです: ${name}`);
	}
}
