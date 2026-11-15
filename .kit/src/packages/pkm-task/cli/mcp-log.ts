/**
 * MCP の利用ログ（ADR-0156 の 6）。子で使って MCP の課題を見つけるために、呼び出し・迂回・フィードバックを記録し、集計する。
 *
 * 置き場所: 子（.kit-local/ がある）は .claude/mcp-log/、上流は .kit/harness/mcp-log/。
 * サーバーの起動 1 回 = 1 ファイル（<置き場所>/YYYY-MM/<起動日時>-<乱数>.jsonl）。フックはセッションごとに 1 ファイル。
 * 本文・追記する内容・frontmatter の値は残さない（項目名と長さだけ）。検索語は先頭 100 字まで残す。
 * PKM_MCP_LOG=off で記録しない。
 *
 * このファイルは yaml などの依存を読まない（フックの CLI からも使う。起動を軽くする）
 */
import { randomBytes } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { isAbsolute, join, relative, sep } from "node:path";

export const LOG_KINDS = ["start", "call", "feedback", "bypass"] as const;
export type LogKind = (typeof LOG_KINDS)[number];

export const ERROR_KINDS = ["ownership", "validation", "not_found", "conflict", "unknown_tool", "internal"] as const;
export type ErrorKind = (typeof ERROR_KINDS)[number];

export const FEEDBACK_KINDS = ["missing", "wrong", "large", "slow", "unclear", "rejected", "bypass"] as const;
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

export type LogLine = { ts: string; kind: LogKind } & Record<string, unknown>;

export function logDir(root: string): string {
	return existsSync(join(root, ".kit-local")) ? join(root, ".claude/mcp-log") : join(root, ".kit/harness/mcp-log");
}

export function logEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
	return (env.PKM_MCP_LOG ?? "").toLowerCase() !== "off";
}

const pad = (n: number) => String(n).padStart(2, "0");
function monthDir(d: Date): string {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
function stamp(d: Date): string {
	return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/** 1 つのファイルに追記するロガー。最初の行を書くときにファイルを作る */
export class McpLogger {
	readonly path: string;
	constructor(
		private readonly root: string,
		fileName: string,
		start: Date,
		private readonly now: () => Date = () => new Date(),
	) {
		this.path = join(logDir(root), monthDir(start), fileName);
	}

	/** サーバーの起動 1 回ぶんのロガー */
	static forServer(root: string, now: () => Date = () => new Date()): McpLogger {
		const start = now();
		return new McpLogger(root, `${stamp(start)}-${randomBytes(3).toString("hex")}.jsonl`, start, now);
	}

	write(kind: LogKind, fields: Record<string, unknown>): void {
		const line: LogLine = { ts: this.now().toISOString(), kind, ...fields };
		try {
			mkdirSync(join(this.path, ".."), { recursive: true });
			appendFileSync(this.path, `${JSON.stringify(line)}\n`);
		} catch {
			// ログが書けなくても、ツールの結果は返す
		}
	}
}

/** 値をそのまま残してよい引数（ID・日付・列挙など。個人の内容を含みにくい） */
const KEEP_KEYS = new Set([
	"id",
	"ids",
	"key",
	"issue_id",
	"issue_ids",
	"task_ids",
	"routine_id",
	"parent",
	"before",
	"date",
	"from",
	"to",
	"today",
	"status",
	"statuses",
	"priority",
	"priorities",
	"sort",
	"desc",
	"mode",
	"type",
	"scope",
	"kind",
	"tool",
	"scheduled",
	"result",
	"on",
	"full",
	"limit",
	"cursor",
	"inbox_only",
	"available_minutes",
	"stale_days",
	"caution_days",
	"days",
	"position",
	"estimated",
]);
/** 検索語（0 件の検索を見直すために、先頭 100 字だけ残す） */
const QUERY_KEYS = new Set(["query", "text"]);
/** パス（ファイル名は残さず、区分だけを残す） */
const PATH_KEYS = new Set(["path", "path_prefix"]);

/** 引数を、ログに残してよい形にする */
export function summarizeArgs(args: Record<string, unknown>): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(args)) {
		if (v === undefined) continue;
		if (QUERY_KEYS.has(k) && typeof v === "string") out[k] = v.slice(0, 100);
		else if (PATH_KEYS.has(k) && typeof v === "string") out[k] = { area: pathArea(v) };
		else if (KEEP_KEYS.has(k) && isSmall(v)) out[k] = v;
		else if (typeof v === "string") out[k] = { len: v.length };
		else if (Array.isArray(v)) out[k] = { n: v.length };
		else if (v !== null && typeof v === "object") out[k] = { keys: Object.keys(v) };
		else out[k] = typeof v;
	}
	return out;
}

function isSmall(v: unknown): boolean {
	if (v === null || typeof v === "number" || typeof v === "boolean") return true;
	if (typeof v === "string") return v.length <= 40;
	if (Array.isArray(v)) return v.length <= 20 && v.every((x) => typeof x === "string" && x.length <= 40);
	return false;
}

/** エラーの先頭の種類（`[ownership] …`）を取り出す。付いていなければ文面から推し量る */
export function errorKind(message: string): ErrorKind {
	const m = /^\[([a-z_]+)\]/.exec(message);
	if (m && (ERROR_KINDS as readonly string[]).includes(m[1]!)) return m[1] as ErrorKind;
	if (/^未知のツール/.test(message)) return "unknown_tool";
	if (/がありません|見つかりません|ありません:/.test(message)) return "not_found";
	return "validation";
}

/** エラーの文面の先頭に種類を付ける（付いていなければ） */
export function withErrorKind(message: string, kind = errorKind(message)): string {
	return /^\[[a-z_]+\]/.test(message) ? message : `[${kind}] ${message}`;
}

export type PathArea =
	| "vault"
	| "hidden"
	| "daily"
	| "wiki"
	| "sources"
	| "asset"
	| "task"
	| "tmp"
	| "template"
	| "slide"
	| "note";

const TASK_DIRS = new Set(["issue", "routine", "member", "worklog", "board", "statuslog", "updates"]);

/** Vault のルートからのパスの区分（ファイル名は残さないための粗い分類） */
export function pathArea(rel: string): PathArea {
	const p = rel.replace(/\\/g, "/").replace(/^\.\/+/, "").replace(/\/+$/, "");
	if (p === "" || p === ".") return "vault";
	const segs = p.split("/");
	if (segs.some((s) => s.startsWith(".") || s === "node_modules")) return "hidden";
	const top = segs[0]!;
	if (top === "daily") return "daily";
	if (top === "wiki") return "wiki";
	if (top === "sources") return "sources";
	if (top === "asset") return "asset";
	if (top === "tmp") return "tmp";
	if (top === "template") return "template";
	if (top === "slide") return "slide";
	if (TASK_DIRS.has(top)) return "task";
	return "note";
}

/** Claude Code の PostToolUse フックに渡される JSON（使う項目だけ） */
export interface HookPayload {
	session_id?: string;
	tool_name?: string;
	tool_input?: Record<string, unknown>;
	cwd?: string;
}

const BYPASS_TOOLS = new Set(["Read", "Edit", "Write", "MultiEdit", "NotebookEdit", "Grep", "Glob"]);

/**
 * AI が MCP を通さずに Vault のノートを読み書きしたら、bypass として記録する。
 * 記録したら区分を、しなければ null を返す。隠しパス・tmp/・Vault の外・ノートでないファイルは記録しない
 */
export function recordBypass(root: string, payload: HookPayload, now: () => Date = () => new Date()): PathArea | null {
	const tool = payload.tool_name ?? "";
	if (!BYPASS_TOOLS.has(tool)) return null;
	const input = payload.tool_input ?? {};
	const raw = [input.file_path, input.notebook_path, input.path].find((v) => typeof v === "string") as string | undefined;
	const isSearch = tool === "Grep" || tool === "Glob";
	if (raw === undefined && !isSearch) return null;
	const abs = raw === undefined ? root : isAbsolute(raw) ? raw : join(payload.cwd ?? root, raw);
	const rel = relative(root, abs).split(sep).join("/");
	if (rel.startsWith("..") || isAbsolute(rel)) return null;
	const area = pathArea(rel);
	if (area === "hidden" || area === "tmp") return null;
	if (!isSearch && area !== "asset" && !rel.endsWith(".md")) return null;
	if (isSearch && area !== "vault" && existsSync(abs) && !statSync(abs).isDirectory() && !rel.endsWith(".md")) return null;
	const session = (payload.session_id ?? "unknown").replace(/[^A-Za-z0-9-]/g, "").slice(0, 64) || "unknown";
	const start = now();
	new McpLogger(root, `hook-${session}.jsonl`, start, now).write("bypass", { op: tool, area });
	return area;
}

// ---- 集計 ----

export interface ToolStats {
	tool: string;
	calls: number;
	alias: number;
	errors: Partial<Record<ErrorKind, number>>;
	p50Ms: number;
	p95Ms: number;
	p95Bytes: number;
	truncated: number;
	zeroHits: number;
}

export interface McpReport {
	since: string;
	until: string;
	starts: number;
	clients: Record<string, number>;
	tools: ToolStats[];
	bypass: Record<string, number>;
	bypassByOp: Record<string, number>;
	feedback: { ts: string; tool: string | null; kind: string; summary: string }[];
	zeroHitQueries: { tool: string; query: string }[];
}

function localDateOf(ts: string): string {
	const d = new Date(ts);
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function percentile(values: number[], p: number): number {
	if (values.length === 0) return 0;
	const s = [...values].sort((a, b) => a - b);
	return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)]!;
}

export function readLogLines(root: string): LogLine[] {
	const dir = logDir(root);
	if (!existsSync(dir)) return [];
	const out: LogLine[] = [];
	for (const month of readdirSync(dir).sort()) {
		const mdir = join(dir, month);
		if (!statSync(mdir).isDirectory()) continue;
		for (const name of readdirSync(mdir).sort()) {
			if (!name.endsWith(".jsonl")) continue;
			for (const line of readFileSync(join(mdir, name), "utf8").split("\n")) {
				if (!line.trim()) continue;
				try {
					const v = JSON.parse(line) as LogLine;
					if (typeof v.ts === "string" && typeof v.kind === "string") out.push(v);
				} catch {
					// 壊れた行は飛ばす
				}
			}
		}
	}
	return out;
}

export function buildReport(lines: LogLine[], since: string, until: string): McpReport {
	const inRange = lines.filter((l) => {
		const d = localDateOf(l.ts);
		return d >= since && d <= until;
	});
	const clients: Record<string, number> = {};
	const byTool = new Map<string, { ms: number[]; bytes: number[]; s: ToolStats }>();
	const bypass: Record<string, number> = {};
	const bypassByOp: Record<string, number> = {};
	const feedback: McpReport["feedback"] = [];
	const zeroHitQueries: McpReport["zeroHitQueries"] = [];
	let starts = 0;
	for (const l of inRange) {
		if (l.kind === "start") {
			starts++;
			const c = l.client as { name?: string } | undefined;
			const name = c?.name ?? "unknown";
			clients[name] = (clients[name] ?? 0) + 1;
		} else if (l.kind === "call") {
			const tool = String(l.tool ?? "?");
			let e = byTool.get(tool);
			if (!e) {
				e = { ms: [], bytes: [], s: { tool, calls: 0, alias: 0, errors: {}, p50Ms: 0, p95Ms: 0, p95Bytes: 0, truncated: 0, zeroHits: 0 } };
				byTool.set(tool, e);
			}
			e.s.calls++;
			if (l.alias) e.s.alias++;
			if (typeof l.error === "string") e.s.errors[l.error as ErrorKind] = (e.s.errors[l.error as ErrorKind] ?? 0) + 1;
			if (typeof l.ms === "number") e.ms.push(l.ms);
			if (typeof l.bytes === "number") e.bytes.push(l.bytes);
			if (l.truncated) e.s.truncated++;
			if (l.hits === 0) {
				e.s.zeroHits++;
				const q = (l.args as Record<string, unknown> | undefined)?.query ?? (l.args as Record<string, unknown> | undefined)?.text;
				if (typeof q === "string") zeroHitQueries.push({ tool, query: q });
			}
		} else if (l.kind === "bypass") {
			const area = String(l.area ?? "?");
			const op = String(l.op ?? "?");
			bypass[area] = (bypass[area] ?? 0) + 1;
			bypassByOp[op] = (bypassByOp[op] ?? 0) + 1;
		} else if (l.kind === "feedback") {
			feedback.push({ ts: l.ts, tool: typeof l.tool === "string" ? l.tool : null, kind: String(l.type ?? "?"), summary: String(l.summary ?? "") });
		}
	}
	const tools = [...byTool.values()]
		.map(({ ms, bytes, s }) => ({ ...s, p50Ms: percentile(ms, 50), p95Ms: percentile(ms, 95), p95Bytes: percentile(bytes, 95) }))
		.sort((a, b) => b.calls - a.calls || a.tool.localeCompare(b.tool));
	return { since, until, starts, clients, tools, bypass, bypassByOp, feedback, zeroHitQueries };
}

/** usage-report と harness-review が読む Markdown */
export function formatReport(r: McpReport): string {
	const out: string[] = [];
	const totalCalls = r.tools.reduce((n, t) => n + t.calls, 0);
	const totalBypass = Object.values(r.bypass).reduce((n, v) => n + v, 0);
	out.push(`- 起動 ${r.starts} 回、ツールの呼び出し ${totalCalls} 回、MCP を通さない読み書き（bypass）${totalBypass} 回、フィードバック ${r.feedback.length} 件`);
	if (Object.keys(r.clients).length) {
		out.push(`- クライアント: ${Object.entries(r.clients).map(([k, v]) => `${k} ${v}`).join("、")}`);
	}
	if (r.tools.length) {
		out.push("", "| ツール | 回数 | エラー | p50 ms | p95 ms | p95 bytes | 切り詰め | 0 件 | 旧名 |", "|---|---|---|---|---|---|---|---|---|");
		for (const t of r.tools) {
			const errs = Object.entries(t.errors).map(([k, v]) => `${k} ${v}`).join("、") || "0";
			out.push(`| ${t.tool} | ${t.calls} | ${errs} | ${t.p50Ms} | ${t.p95Ms} | ${t.p95Bytes} | ${t.truncated} | ${t.zeroHits} | ${t.alias} |`);
		}
	}
	if (totalBypass) {
		out.push("", `- bypass の区分: ${Object.entries(r.bypass).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join("、")}`);
		out.push(`- bypass の操作: ${Object.entries(r.bypassByOp).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join("、")}`);
	}
	if (r.feedback.length) {
		out.push("", "フィードバック（要約は個人の内容を含みうる。上流には種類と件数だけを伝える）:");
		for (const f of r.feedback) out.push(`- ${f.ts.slice(0, 10)} ${f.kind}${f.tool ? `（${f.tool}）` : ""}: ${f.summary}`);
	}
	if (r.zeroHitQueries.length) {
		out.push("", "結果が 0 件だった検索（上流には件数だけを伝える）:");
		for (const q of r.zeroHitQueries.slice(-20)) out.push(`- ${q.tool}: ${q.query}`);
	}
	return out.join("\n");
}
