import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { App } from "obsidian";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import { callMcpTool, type McpContext } from "../cli/mcp";
import { readVault } from "../cli/read-vault";
import { emptyBoard } from "../src/core/board";
import { allSubsDone, pickCandidates } from "../src/core/daily";
import { localToday } from "../src/core/dates";
import { gtdList, hasPlannedSubs, isInbox, isNext, TaskIndex } from "../src/core/index";
import { lintVault } from "../src/core/lint";
import { collectVault } from "../src/core/load";
import { primaryStepFor } from "../src/core/pick";
import { somedayClears, subPeriodError, ticklerLimit, ticklerWithSubsError } from "../src/core/project-periods";
import type { Issue } from "../src/core/schema";
import { parseSubIssues } from "../src/core/sub-issue";
import type { TaskStore } from "../src/obsidian/store";
import { TaskWriter } from "../src/obsidian/writer";

vi.mock("obsidian", async () => {
	const yaml = await import("yaml");
	return { TFile: class {}, normalizePath: (path: string) => path, parseYaml: yaml.parse };
});

/** ADR-0210: GTD の分類のバッジと、Project のサブの期間・Tickler の規則 */

const today = "2026-11-20";
const sub = (id: string, extra = "", status = "open") => `<!-- sub-issue\nid: ${id}\nsummary: サブ${id}\nstatus: ${status}\n${extra}-->\n\n`;
const period = (start: string | null, end: string | null) => `${start ? `start: ${start}\n` : ""}${end ? `end: ${end}\n` : ""}`;
function issue(id: string, fm: Record<string, unknown>, subs = "") {
	return { path: `issue/${id}.md`, frontmatter: { type: "issue", id, summary: `題${id}`, status: "open", ...fm }, text: `---\n---\n${subs}` };
}
const indexOf = (markdown: ReturnType<typeof issue>[]) => new TaskIndex(collectVault({ markdown, worklogs: [], labels: null, parseYaml: parse }).data);
const base: Issue = indexOf([issue("i-1", {})]).issues.get("i-1")!;
const with_ = (fm: Partial<Issue>): Issue => ({ ...base, ...fm });

describe("GTD の分類", () => {
	it("Inbox・Next Action・Calendar・Tickler。待ち・someday・閉じたものは分類しない", () => {
		expect(gtdList(with_({}), today)).toBe("inbox");
		expect(gtdList(with_({ clarified: true }), today)).toBe("next");
		expect(gtdList(with_({ status: "in-progress" }), today)).toBe("next");
		expect(gtdList(with_({ clarified: true, scheduled: "2026-11-22" }), today)).toBe("calendar");
		expect(gtdList(with_({ clarified: true, tickler: "2026-11-25" }), today)).toBe("tickler");
		expect(gtdList(with_({ clarified: true, tickler: today }), today)).toBe("inbox");
		for (const status of ["waiting", "delegated", "someday", "closed", "canceled"] as const) expect(gtdList(with_({ status, clarified: true }), today)).toBeNull();
	});

	it("Tickler の日を迎えた計画済みの Project は、Inbox ではなく Next Action（整理し直さない）", () => {
		const t = with_({ tickler: today });
		expect(isInbox(t, today, true)).toBe(false);
		expect(isNext(t, today, true)).toBe(true);
		expect(gtdList(t, today, true)).toBe("next");
		// 日付の前は、計画済みでも隠れたまま
		expect(gtdList(with_({ tickler: "2026-11-25" }), today, true)).toBe("tickler");
		// 計画のない Project は、これまでどおり Inbox に戻る
		expect(isInbox(t, today, false)).toBe(true);
	});

	it("計画済み: 閉じていないサブに期間がある", () => {
		expect(hasPlannedSubs([{ status: "open", start: null, end: today }])).toBe(true);
		expect(hasPlannedSubs([{ status: "closed", start: today, end: today }])).toBe(false);
		expect(hasPlannedSubs([{ status: "open", start: null, end: null }])).toBe(false);
	});

	it("索引: サブを 1 つでも持てば（閉じていても）Project", () => {
		const index = indexOf([issue("i-1", {}, sub("aaaaaa", "", "closed")), issue("i-2", {})]);
		expect(index.isProject("i-1")).toBe(true);
		expect(index.isProject("i-2")).toBe(false);
		expect(allSubsDone(index.subs("i-1"))).toBe(true);
		expect(allSubsDone(index.subs("i-2"))).toBe(false);
	});
});

describe("Inbox の Project のサブの期間", () => {
	const inbox = with_({});
	const next = with_({ clarified: true });
	it("新しく入れる・変えるのは止め、消すのはよい", () => {
		expect(subPeriodError(inbox, false, null, { start: today, end: null }, today)).toMatch(/Inbox（未整理）の Project/);
		expect(subPeriodError(inbox, false, { start: today, end: today }, { start: today, end: "2026-11-21" }, today)).toMatch(/Inbox/);
		expect(subPeriodError(inbox, false, { start: today, end: today }, { start: null, end: today }, today)).toBeNull();
		expect(subPeriodError(inbox, false, { start: today, end: today }, { start: null, end: null }, today)).toBeNull();
		expect(subPeriodError(next, false, null, { start: today, end: null }, today)).toBeNull();
	});
});

describe("Tickler と Project のサブの期間", () => {
	const ticklered = with_({ clarified: true, tickler: "2026-11-25" });
	it("Tickler が先の Project のサブは、Tickler の日以降に始まる期間だけ", () => {
		expect(subPeriodError(ticklered, false, null, { start: "2026-11-24", end: "2026-11-26" }, today)).toMatch(/Tickler（11\/25.*より前/);
		expect(subPeriodError(ticklered, false, null, { start: "2026-11-25", end: "2026-11-26" }, today)).toBeNull();
		expect(subPeriodError(ticklered, false, null, { start: null, end: "2026-11-24" }, today)).toMatch(/より前/);
		// Tickler がないものは Inbox だけ（Tickler の Project は Inbox ではない）
		expect(subPeriodError(with_({ tickler: "2026-11-25" }), false, null, { start: "2026-11-26", end: null }, today)).toBeNull();
	});

	it("Project の Tickler は、閉じていないサブの期間の始まりのいちばん早い日以前", () => {
		const subs = [
			{ status: "open" as const, start: "2026-11-27", end: "2026-11-30" },
			{ status: "open" as const, start: null, end: "2026-11-26" },
			{ status: "closed" as const, start: "2026-11-21", end: "2026-11-21" },
		];
		expect(ticklerLimit(subs, today)).toEqual({ latest: "2026-11-26", blocked: false });
		expect(ticklerWithSubsError("i-1", subs, "2026-11-26", today)).toBeNull();
		expect(ticklerWithSubsError("i-1", subs, "2026-11-27", today)).toMatch(/11\/26/);
		expect(ticklerWithSubsError("i-1", subs, null, today)).toBeNull();
		expect(ticklerWithSubsError("i-1", [], "2026-12-31", today)).toBeNull();
	});

	it("期間がすでに始まっていれば Tickler を付けられない", () => {
		const subs = [{ status: "open" as const, start: today, end: "2026-11-30" }];
		expect(ticklerLimit(subs, today).blocked).toBe(true);
		expect(ticklerWithSubsError("i-1", subs, "2026-11-21", today)).toMatch(/期間を後ろにずらして/);
	});

	it("lint が規則に合わないものを警告で知らせる", () => {
		const index = indexOf([
			issue("i-1", {}, sub("aaaaaa", period("2026-11-25", null))),
			issue("i-2", { clarified: true, tickler: "2099-01-10" }, sub("bbbbbb", period("2099-01-05", null))),
			issue("i-3", { clarified: true, tickler: "2099-01-10" }, sub("cccccc", period("2099-01-12", null))),
		]);
		const found = lintVault(index.data).filter((f) => f.code === "period-in-inbox" || f.code === "tickler-after-sub-period");
		expect(found.map((f) => [f.code, f.path])).toEqual([
			["period-in-inbox", "issue/i-1.md"],
			["tickler-after-sub-period", "issue/i-2.md"],
		]);
		expect(found.every((f) => f.severity === "warning")).toBe(true);
	});
});

describe("次の行動のない Project と status のボタン", () => {
	it("Tickler の日を迎えた計画済みの Project のサブは、期間に入れば Pick に出る", () => {
		const index = indexOf([issue("i-1", { tickler: today }, sub("aaaaaa", period(today, today)))]);
		expect(pickCandidates(index, today, emptyBoard()).groups.map((g) => g.parent.id)).toEqual(["i-1"]);
	});

	it("Project には Start を出さず、サブがすべて閉じたら Close（open・in-progress）", () => {
		expect(primaryStepFor("open", true, "open")).toBeNull();
		expect(primaryStepFor("open", false, "done")).toEqual({ kind: "status", to: "closed", label: "Close" });
		expect(primaryStepFor("in-progress", false, "done")).toEqual({ kind: "status", to: "closed", label: "Close" });
		expect(primaryStepFor("in-progress", false, "open")).toEqual({ kind: "status", to: "closed", label: "Close" });
		expect(primaryStepFor("waiting", false, "done")).toEqual({ kind: "status", to: "in-progress", label: "Resume" });
		expect(primaryStepFor("open", true)).toEqual({ kind: "status", to: "in-progress", label: "Start" });
		expect(primaryStepFor("open", false)).toBeNull();
	});
});

describe("Project を someday にするとき", () => {
	it("消すのは閉じていないサブの期間と Calendar の日", () => {
		const index = indexOf([
			issue("i-1", { clarified: true }, sub("aaaaaa", period(today, null)) + sub("bbbbbb", `scheduled: ${today}\n`) + sub("cccccc") + sub("dddddd", period(today, today), "closed")),
		]);
		expect(somedayClears(index.subs("i-1")).map((s) => s.id)).toEqual(["aaaaaa", "bbbbbb"]);
	});
});

describe("MCP（ADR-0210）", () => {
	let root: string;
	let ctx: McpContext;
	const now = new Date("2026-11-20T03:00:00.000Z");
	const read = () => readFileSync(join(root, "issue/i-1.md"), "utf8");
	const subs = () => new TaskIndex(readVault(root).data).subs("i-1");
	const write = (fm: string, body = "") => writeFileSync(join(root, "issue/i-1.md"), `---\ntype: issue\nid: i-1\nsummary: 親\nstatus: open\n${fm}---\n\n${body}`);

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "vault-project-rules-"));
		mkdirSync(join(root, "issue"));
		ctx = { root, device: "ai", now: () => now };
	});
	afterEach(() => rmSync(root, { recursive: true, force: true }));

	it("Inbox の Project のサブには期間を入れられない（足すときも直すときも）", () => {
		write("");
		expect(() => callMcpTool(ctx, "create_sub_issues", { parent: "i-1", items: [{ summary: "x", start: "2026-12-01" }] })).toThrow(/Inbox（未整理）/);
		const { created } = callMcpTool(ctx, "create_sub_issues", { parent: "i-1", items: [{ summary: "x" }] }) as { created: string[] };
		const before = read();
		expect(() => callMcpTool(ctx, "update_sub_issue", { key: created[0], end: "2026-12-01" })).toThrow(/Inbox/);
		expect(read()).toBe(before);
	});

	it("Project の Tickler は、サブの期間の始まり以前だけ", () => {
		write("clarified: true\n", sub("aaaaaa", period("2026-12-05", "2026-12-10")));
		expect(() => callMcpTool(ctx, "update_issue", { id: "i-1", tickler: "2026-12-06" })).toThrow(/12\/05/);
		callMcpTool(ctx, "update_issue", { id: "i-1", tickler: "2026-12-05" });
		expect(read()).toContain("tickler: 2026-12-05");
		expect(() => callMcpTool(ctx, "update_sub_issue", { key: "i-1#aaaaaa", start: "2026-12-04" })).toThrow(/Tickler/);
	});

	it("Project を someday にするとき、消すものがあれば clear_sub_periods: true を求める", () => {
		write("clarified: true\n", sub("aaaaaa", period("2026-12-05", "2026-12-10")) + sub("bbbbbb", period("2026-11-01", "2026-11-02"), "closed"));
		const before = read();
		expect(() => callMcpTool(ctx, "update_issue", { id: "i-1", status: "someday" })).toThrow(/clear_sub_periods/);
		expect(read()).toBe(before);
		callMcpTool(ctx, "update_issue", { id: "i-1", status: "someday", clear_sub_periods: true });
		const after = subs();
		expect(after.find((s) => s.id === "aaaaaa")).toMatchObject({ start: null, end: null, status: "open" });
		expect(after.find((s) => s.id === "bbbbbb")).toMatchObject({ start: "2026-11-01", end: "2026-11-02" });
		expect(read()).toContain("status: someday");
	});

	it("list_issues と get_issue が分類と project を返す", () => {
		write("clarified: true\n", sub("aaaaaa"));
		const [listed] = callMcpTool(ctx, "list_issues", {}) as { id: string; list: string | null; project: boolean }[];
		expect(listed).toMatchObject({ id: "i-1", list: "next", project: true });
		expect(callMcpTool(ctx, "get_issue", { id: "i-1" })).toMatchObject({ list: "next", project: true });
	});
});

describe("Obsidian の書き込み（ADR-0210）", () => {
	const subsOf = (text: string) => parseSubIssues("issue/i-1.md", "i-1", text, parse).subs;
	function fixture(text: string) {
		const texts = new Map<string, string>([["issue/i-1.md", text]]);
		const fmOf = (t: string) => parse(/^---\n([\s\S]*?)\n---/.exec(t)![1]!) as Record<string, unknown>;
		const store = {
			get index() {
				const markdown = [...texts].filter(([p]) => p.startsWith("issue/")).map(([path, t]) => ({ path, text: t, frontmatter: fmOf(t) }));
				return new TaskIndex(collectVault({ markdown, worklogs: [], labels: null, parseYaml: parse }).data);
			},
			refreshSoon: vi.fn(),
		} as unknown as TaskStore;
		const vault = {
			getFileByPath: (path: string) => (texts.has(path) ? { path } : null),
			getFolderByPath: () => ({}),
			createFolder: vi.fn(),
			create: vi.fn(async (path: string, t: string) => {
				texts.set(path, t);
				return { path };
			}),
			process: vi.fn(async (file: { path: string }, edit: (t: string) => string) => {
				texts.set(file.path, edit(texts.get(file.path) ?? ""));
			}),
		};
		const fileManager = {
			processFrontMatter: vi.fn(async (file: { path: string }, edit: (fm: Record<string, unknown>) => void) => {
				const t = texts.get(file.path)!;
				const fm = fmOf(t);
				edit(fm);
				const yaml = Object.entries(fm)
					.map(([k, v]) => `${k}: ${String(v)}`)
					.join("\n");
				texts.set(file.path, t.replace(/^---\n[\s\S]*?\n---/, `---\n${yaml}\n---`));
			}),
		};
		const app = { vault, fileManager } as unknown as App;
		return { writer: new TaskWriter(app, store, () => ""), text: () => texts.get("issue/i-1.md")! };
	}
	const head = (fm: string) => `---\ntype: issue\nid: i-1\nsummary: 親\nstatus: open\n${fm}---\n\n`;

	it("Inbox の Project のサブの期間は書かない（ファイルに書く経路）。消すのはよい", async () => {
		const f = fixture(head("") + sub("aaaaaa", period(today, today)));
		await expect(f.writer.updateSub("i-1#aaaaaa", { end: "2026-12-31" })).rejects.toThrow(/Inbox/);
		await f.writer.updateSub("i-1#aaaaaa", { start: null, end: null });
		expect(subsOf(f.text())[0]).toMatchObject({ start: null, end: null });
	});

	it("Project の Tickler は、サブの期間の始まりより後にできない", async () => {
		const start = "2099-01-05";
		const f = fixture(head("clarified: true\n") + sub("aaaaaa", period(start, null)));
		await expect(f.writer.update("issue/i-1.md", { tickler: "2099-01-06" })).rejects.toThrow(/01\/05/);
		await f.writer.update("issue/i-1.md", { tickler: start });
		expect(f.text()).toContain(`tickler: ${start}`);
	});

	it("someday にすると、閉じていないサブの期間と Calendar の日を消す", async () => {
		const d = localToday();
		const f = fixture(head("clarified: true\n") + sub("aaaaaa", period(d, d)) + sub("bbbbbb", period(d, d), "closed"));
		await f.writer.update("issue/i-1.md", { status: "someday" });
		const after = subsOf(f.text());
		expect(after.find((s) => s.id === "aaaaaa")).toMatchObject({ start: null, end: null });
		expect(after.find((s) => s.id === "bbbbbb")).toMatchObject({ start: d, end: d });
	});
});
