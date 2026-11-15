import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { callMcpTool, handleMcpRequest, listMcpTools, logStart, VaultCache, type McpContext } from "../cli/mcp";
import { handleHook } from "../cli/mcp-hook";
import { buildReport, formatReport, logDir, McpLogger, pathArea, readLogLines, recordBypass, summarizeArgs } from "../cli/mcp-log";
import { normalize } from "../cli/notes";

const now = new Date("2026-11-15T10:00:00.000Z");
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");

function write(root: string, path: string, text: string) {
	mkdirSync(dirname(join(root, path)), { recursive: true });
	writeFileSync(join(root, path), text);
}

function note(title: string, body: string, extra = "") {
	return `---\ntype: note\ntitle: ${title}\ncreated: "2026-11-01T00:00:00Z"\nupdated: "2026-11-02T00:00:00Z"\n${extra}---\n\n${body}\n`;
}

describe("PKM の MCP（ADR-0156）", () => {
	let root: string;
	let ctx: McpContext;

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "pkm-mcp-test-"));
		mkdirSync(join(root, ".kit-local"));
		write(root, "issue/i-1.md", "---\ntype: issue\nid: i-1\nsummary: 最初のタスク\nstatus: open\ncreated: 2026-11-01T10:00:00+09:00\n---\n本文\n");
		write(root, "wiki/index.md", note("目次", "- [大規模言語モデル](wiki/llm.md)"));
		write(root, "wiki/log.md", note("記録", "## 2026-11-01 ingest | 古い\n\n- 入力: a\n\n## 2026-11-10 query | 新しい\n\n- メモ: b"));
		write(root, "wiki/llm.md", `---\ntype: concept\ntitle: 大規模言語モデル\naliases: [LLM]\ntags: [ai]\nsources:\n  - sources/2026-11-01-a.md\ncreated: "2026-11-01T00:00:00Z"\nupdated: "2026-11-03T00:00:00Z"\n---\n\nトランスフォーマーで作る。[元](sources/2026-11-01-a.md)\n`);
		write(root, "sources/2026-11-01-a.md", note("記事 A", "本文"));
		write(root, "sources/2026-11-02-b.md", note("記事 B", "まだ取り込んでいない"));
		write(root, "memo.md", note("メモ", "ｌｌｍ の使い方を考えた。ﾄﾗﾝｽﾌｫｰﾏｰ も。\n\n[wiki](wiki/llm.md) と [ない](nothing.md)"));
		write(root, "daily/2026/11/2026-11-15.md", "---\ntype: daily\ncreated: \"2026-11-15T00:00:00Z\"\nupdated: \"2026-11-15T00:00:00Z\"\n---\n\n今日は LLM を調べた\n");
		write(root, "tmp/secret.md", note("一時", "LLM"));
		write(root, "template/file/note.md", note("テンプレート", "LLM"));
		ctx = { root, device: "ai", now: () => now, cache: new VaultCache(root), log: new McpLogger(root, "test.jsonl", now, () => now) };
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	const call = (name: string, args: Record<string, unknown> = {}) => callMcpTool(ctx, name, args) as Record<string, any>;
	const rpc = (name: string, args: Record<string, unknown> = {}) =>
		handleMcpRequest(ctx, { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } })!.result as {
			isError?: boolean;
			content: { text: string }[];
		};
	const logLines = () => readLogLines(root);

	describe("名前と群", () => {
		it("ツールは群の接頭辞を持ち、meta は --toolset に関わらず公開する", () => {
			const all = listMcpTools().map((t) => t.name);
			expect(all).toContain("task_get_overview");
			expect(all).toContain("note_search");
			expect(all).toContain("meta_feedback");
			expect(all.every((n) => /^(task|note|daily|wiki|check|meta)_/.test(n))).toBe(true);
			const some = listMcpTools(["note"]).map((t) => t.name);
			expect(some.some((n) => n.startsWith("task_"))).toBe(false);
			expect(some).toContain("meta_feedback");
		});

		it("公開していない群を呼ぶと unknown_tool になる", () => {
			ctx.toolsets = ["note"];
			const r = rpc("task_get_board", { date: "2026-11-15" });
			expect(r.isError).toBe(true);
			expect(r.content[0]!.text).toMatch(/^\[unknown_tool\]/);
		});

		it("旧名でも呼べ、ログに alias と記録する", () => {
			expect(rpc("get_board", { date: "2026-11-15" }).isError).toBeUndefined();
			expect(rpc("task_get_board", { date: "2026-11-15" }).isError).toBeUndefined();
			const calls = logLines().filter((l) => l.kind === "call");
			expect(calls.map((l) => [l.tool, l.alias ?? false])).toEqual([
				["task_get_board", true],
				["task_get_board", false],
			]);
		});

		it("応答の JSON は整形しない", () => {
			const text = rpc("note_get", { path: "memo.md" }).content[0]!.text;
			expect(text).not.toContain("\n  ");
		});
	});

	describe("task_get_overview の大きさ", () => {
		it("problems と stalled は上位 5 件と件数だけを返す", () => {
			for (let i = 2; i <= 9; i++) write(root, `issue/i-${i}.md`, `---\ntype: issue\nid: i-${i}\nsummary: 停滞 ${i}\nstatus: in-progress\npriority: 最優先\ncreated: 2026-10-01T10:00:00+09:00\n---\n`);
			const o = call("task_get_overview", { date: "2026-11-15" });
			expect(o.problemCount).toBeGreaterThan(5);
			expect(o.problems).toHaveLength(5);
			expect(o.stalledCounts.inProgressStale).toBe(8);
			expect(o.stalled.inProgressStale).toHaveLength(5);
		});
	});

	describe("note_search", () => {
		it("全角・半角、大文字・小文字、カタカナ・ひらがなの違いを無視する", () => {
			expect(normalize("ＬＬＭ ﾄﾗﾝｽﾌｫｰﾏｰ")).toBe("llm とらんすふぉーまー");
			const r = call("note_search", { query: "とらんすふぉーまー" });
			expect(r.items.map((h: { path: string }) => h.path).sort()).toEqual(["memo.md", "wiki/llm.md"]);
		});

		it("title と aliases に当たったものを本文より上に出し、抜粋は元の表記で返す", () => {
			const r = call("note_search", { query: "llm" });
			expect(r.items[0].path).toBe("wiki/llm.md");
			expect(r.items[0].matched).toContain("aliases");
			const memo = r.items.find((h: { path: string }) => h.path === "memo.md");
			expect(memo.snippet).toContain("ｌｌｍ の使い方");
			expect(memo.line).toBe(8);
		});

		it("語の AND で絞り、tmp/・template/ は対象外", () => {
			expect(call("note_search", { query: "llm 使い方" }).items.map((h: { path: string }) => h.path)).toEqual(["memo.md"]);
			const paths = call("note_search", { query: "llm", limit: 100 }).items.map((h: { path: string }) => h.path);
			expect(paths.some((p: string) => p.startsWith("tmp/") || p.startsWith("template/"))).toBe(false);
		});

		it("type・path_prefix で絞れ、limit と cursor で続きを取れる", () => {
			expect(call("note_search", { query: "llm", type: "daily" }).items.map((h: { path: string }) => h.path)).toEqual(["daily/2026/11/2026-11-15.md"]);
			const first = call("note_search", { query: "llm", limit: 1 });
			// wiki/index.md は本文のリンク先（wiki/llm.md）に当たる
			expect(first.total).toBe(4);
			expect(first.truncated).toBe(true);
			const second = call("note_search", { query: "llm", limit: 1, cursor: first.cursor });
			expect(second.items[0].path).not.toBe(first.items[0].path);
		});

		it("結果の件数をログの hits に残し、検索語は 100 字までに切る", () => {
			rpc("note_search", { query: "存在しない語" });
			rpc("note_search", { query: "x".repeat(150) });
			const calls = logLines().filter((l) => l.kind === "call");
			expect(calls[0]!.hits).toBe(0);
			expect(((calls[1]!.args as { query: string }).query).length).toBe(100);
		});
	});

	describe("note_get・note_links・note_list", () => {
		it("本文を既定で 8,000 字に切り、full で全文を返す", () => {
			write(root, "long.md", note("長い", "あ".repeat(9000)));
			const cut = call("note_get", { path: "long.md" });
			expect(cut.truncated).toBe(true);
			expect(cut.body.length).toBe(8000);
			expect(cut.bodyLength).toBeGreaterThan(9000);
			expect(call("note_get", { path: "long.md", full: true }).truncated).toBe(false);
		});

		it("ないノートは not_found、tmp/ などは ownership のエラーにする", () => {
			expect(rpc("note_get", { path: "nothing.md" }).content[0]!.text).toMatch(/^\[not_found\]/);
			expect(rpc("note_get", { path: "tmp/secret.md" }).content[0]!.text).toMatch(/^\[ownership\]/);
			expect(rpc("note_get", { path: ".claude/CLAUDE.md" }).content[0]!.text).toMatch(/^\[ownership\]/);
			const errors = logLines().filter((l) => l.kind === "call").map((l) => l.error);
			expect(errors).toEqual(["not_found", "ownership", "ownership"]);
		});

		it("出るリンクの有無と被リンクを返す", () => {
			const r = call("note_links", { path: "memo.md" });
			expect(r.outgoing).toEqual([
				{ target: "wiki/llm.md", exists: true, title: "大規模言語モデル" },
				{ target: "nothing.md", exists: false, title: null },
			]);
			expect(call("note_links", { path: "wiki/llm.md" }).backlinks.map((b: { path: string }) => b.path).sort()).toEqual(["memo.md", "wiki/index.md"]);
		});

		it("note_list は type で絞り、既定は新しい順", () => {
			const r = call("note_list", { type: "note" });
			expect(r.items.every((n: { type: string }) => n.type === "note")).toBe(true);
			expect(call("note_list", {}).items[0].path).toBe("daily/2026/11/2026-11-15.md");
		});
	});

	describe("daily_ と wiki_", () => {
		it("daily_get は今日のデイリーノートを返し、ない日は not_found", () => {
			expect(call("daily_get", {}).body).toContain("LLM を調べた");
			expect(rpc("daily_get", { date: "2026-11-14" }).content[0]!.text).toMatch(/^\[not_found\]/);
		});

		it("wiki_get_index と wiki_recent_log（新しいものから）", () => {
			expect(call("wiki_get_index").body).toContain("wiki/llm.md");
			expect(call("wiki_recent_log", { limit: 1 }).items).toEqual([{ heading: "2026-11-10 query | 新しい", text: "- メモ: b" }]);
		});

		it("wiki のページから参照されていない元資料だけを返す", () => {
			expect(call("wiki_list_unprocessed_sources").items.map((s: { path: string }) => s.path)).toEqual(["sources/2026-11-02-b.md"]);
		});
	});

	describe("check_（ハーネスのスクリプトを使う）", () => {
		it("daily_list_pending の today は YYYY-MM-DD だけを受け付ける", () => {
			expect(rpc("daily_list_pending", { today: '"); process.exit(1); ("' }).content[0]!.text).toMatch(/^\[validation\]/);
		});

		it("スクリプトがなければ not_found", () => {
			expect(rpc("check_vault", { scope: "notes" }).content[0]!.text).toMatch(/^\[not_found\]/);
		});

		it("wiki-lint と note-rename の判定を返す", () => {
			mkdirSync(join(root, ".claude"));
			symlinkSync(join(repoRoot, ".claude/scripts"), join(root, ".claude/scripts"));
			const r = call("check_vault", { scope: "all" });
			expect(typeof r.notes.errorCount).toBe("number");
			expect(r.tasks.problemCount).toBe(0);
			write(root, "日本語のメモ.md", note("日本語のメモ", "本文"));
			const names = call("check_rename_candidates").items;
			expect(names).toContain("日本語のメモ.md");
			expect(names).not.toContain("memo.md");
		});
	});

	describe("索引のキャッシュ", () => {
		it("ファイルが変わったら次の呼び出しで読み直す", () => {
			expect(call("note_search", { query: "新しい語" }).total).toBe(0);
			write(root, "memo.md", note("メモ", "新しい語を書いた"));
			utimesSync(join(root, "memo.md"), new Date(), new Date(Date.now() + 5000));
			expect(call("note_search", { query: "新しい語" }).total).toBe(1);
			rmSync(join(root, "memo.md"));
			expect(call("note_search", { query: "新しい語" }).total).toBe(0);
		});

		it("task_ の書き込みの後は、タスクの索引を作り直す", () => {
			call("task_create_issue", { summary: "足したタスク" });
			expect(call("task_list_issues", { text: "足した" })).toHaveLength(1);
		});
	});

	describe("利用ログ", () => {
		it("子は .claude/mcp-log/、上流は .kit/harness/mcp-log/ に置く", () => {
			expect(logDir(root)).toBe(join(root, ".claude/mcp-log"));
			rmSync(join(root, ".kit-local"), { recursive: true });
			expect(logDir(root)).toBe(join(root, ".kit/harness/mcp-log"));
		});

		it("引数は本文を残さず、ID・日付・列挙と、パスの区分だけを残す", () => {
			expect(
				summarizeArgs({ id: "i-1", date: "2026-11-15", content: "秘密のメモ", summary: "個人の予定", path: "daily/2026/11/2026-11-15.md", labels: ["a", "b"], query: "検索" }),
			).toEqual({ id: "i-1", date: "2026-11-15", content: { len: 5 }, summary: { len: 5 }, path: { area: "daily" }, labels: { n: 2 }, query: "検索" });
		});

		it("起動の記録にクライアントと索引の時間を残す", () => {
			handleMcpRequest(ctx, { jsonrpc: "2.0", id: 1, method: "initialize", params: { clientInfo: { name: "claude-code", version: "1" } } });
			logStart(ctx);
			const start = logLines().find((l) => l.kind === "start")!;
			expect(start.client).toEqual({ name: "claude-code", version: "1" });
			expect(start.noteCount).toBeGreaterThan(5);
			expect(typeof start.indexMs).toBe("number");
		});

		it("meta_feedback を記録し、集計に出す", () => {
			expect(call("meta_feedback", { kind: "missing", tool: "note_search", summary: "タグの一覧を取るツールがない" })).toEqual({ ok: true, recorded: true });
			expect(rpc("meta_feedback", { kind: "other", summary: "x" }).content[0]!.text).toMatch(/^\[validation\]/);
			rpc("note_search", { query: "存在しない語" });
			const report = buildReport(logLines(), "2026-11-01", "2026-11-30");
			expect(report.feedback).toEqual([{ ts: now.toISOString(), tool: "note_search", kind: "missing", summary: "タグの一覧を取るツールがない" }]);
			const search = report.tools.find((t) => t.tool === "note_search")!;
			expect(search.zeroHits).toBe(1);
			expect(report.zeroHitQueries).toEqual([{ tool: "note_search", query: "存在しない語" }]);
			const meta = report.tools.find((t) => t.tool === "meta_feedback")!;
			expect(meta.errors).toEqual({ validation: 1 });
			expect(formatReport(report)).toContain("| note_search | 1 |");
		});

		it("PKM_MCP_LOG=off ならフックは記録しない", () => {
			handleHook(JSON.stringify({ session_id: "s1", tool_name: "Read", tool_input: { file_path: join(root, "memo.md") } }), { CLAUDE_PROJECT_DIR: root, PKM_MCP_LOG: "off" });
			expect(logLines()).toEqual([]);
		});
	});

	describe("bypass のフック", () => {
		const hook = (tool_name: string, tool_input: Record<string, unknown>) => recordBypass(root, { session_id: "abc-1", tool_name, tool_input, cwd: root }, () => now);

		it("ノートの読み書きを区分だけで記録し、ファイル名は残さない", () => {
			expect(hook("Read", { file_path: join(root, "daily/2026/11/2026-11-15.md") })).toBe("daily");
			expect(hook("Edit", { file_path: "wiki/llm.md" })).toBe("wiki");
			expect(hook("Grep", { pattern: "LLM" })).toBe("vault");
			expect(hook("Glob", { pattern: "*.md", path: join(root, "sources") })).toBe("sources");
			const dir = join(logDir(root), "2026-11");
			expect(readdirSync(dir)).toEqual(["hook-abc-1.jsonl"]);
			const text = readFileSync(join(dir, "hook-abc-1.jsonl"), "utf8");
			expect(text).not.toContain("2026-11-15.md");
			expect(text).not.toContain("llm.md");
		});

		it("隠しパス・tmp/・Vault の外・ノートでないファイル・ほかのツールは記録しない", () => {
			expect(hook("Read", { file_path: join(root, ".claude/CLAUDE.md") })).toBeNull();
			expect(hook("Read", { file_path: join(root, "tmp/secret.md") })).toBeNull();
			expect(hook("Read", { file_path: "/etc/hosts" })).toBeNull();
			expect(hook("Read", { file_path: join(root, "mise.toml") })).toBeNull();
			expect(hook("Bash", { command: "cat memo.md" })).toBeNull();
			expect(logLines()).toEqual([]);
		});

		it("パスの区分", () => {
			expect(pathArea("issue/i-1.md")).toBe("task");
			expect(pathArea("worklog/pc/2026-11.jsonl")).toBe("task");
			expect(pathArea("asset/a.png")).toBe("asset");
			expect(pathArea("topics/foo.md")).toBe("note");
			expect(pathArea("slide/a/deck.html")).toBe("slide");
		});
	});
});
