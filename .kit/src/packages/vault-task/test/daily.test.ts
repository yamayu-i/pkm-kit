import { describe, expect, it } from "vitest";
import { cancelPatch, inboxPatch, reschedulePatch, schedulePatch, somedayPatch } from "../src/core/actions";
import { boardItems, dailyNotePath, emptyBoard, parseBoard, pendingBoards, serializeBoard, unfinished, type DailyBoard } from "../src/core/board";
import { cautionIssues, deadIssues, scheduledOn } from "../src/core/daily";
import { groupKeys, inGroup, parseGroups, serializeGroups } from "../src/core/groups";
import { TaskIndex, emptyVaultData, type VaultData } from "../src/core/index";
import { defaultQuery, queryIssues } from "../src/core/list";
import { describeRepeat, parseRepeat } from "../src/core/repeat";
import { reviewWorklogs } from "../src/core/review";
import { parseIssue, parseRoutine, type Issue } from "../src/core/schema";
import { boardSummary, upsertSummary } from "../src/core/summary";
import { appendWorklogLine, newWorklogId, sanitizeDeviceName, worklogPath, type WorklogEntry } from "../src/core/worklog";

function issue(id: string, fm: Record<string, unknown> = {}): Issue {
	return parseIssue(`issue/${id}.md`, { type: "issue", id, summary: `s${id}`, status: "open", ...fm }).value!;
}
const ids = (list: { id: string }[]) => list.map((i) => i.id);
const data = (p: Partial<VaultData>): VaultData => ({ ...emptyVaultData(), ...p });

function log(id: string, taskId: string, from: string, to: string | null): WorklogEntry {
	return { path: "worklog/pc/2026-10.jsonl", line: 1, id, taskId, from, to, description: "", fromMs: Date.parse(from), toMs: to === null ? null : Date.parse(to) };
}

describe("actions", () => {
	it("Cancel / Inbox / Someday は期限を外す", () => {
		expect(cancelPatch()).toMatchObject({ status: "canceled", mid_due: null, deadline: null });
		expect(inboxPatch()).toMatchObject({ status: "open", scheduled: null, mid_due: null, deadline: null });
		expect(somedayPatch("2026-12-01")).toMatchObject({ status: "someday", scheduled: null, deadline: null, revisit: "2026-12-01" });
	});

	it("リスケ: 期限は置き換え、実行日は from を外して to を足す", () => {
		const i = issue("i-1", { scheduled: ["2026-10-30", "2026-11-02"] });
		expect(reschedulePatch(i, "deadline", "2026-11-10")).toEqual({ deadline: "2026-11-10" });
		expect(reschedulePatch(i, "scheduled", "2026-11-05", "2026-10-30")).toEqual({ scheduled: ["2026-11-02", "2026-11-05"] });
		expect(reschedulePatch(i, "scheduled", "2026-11-01")).toEqual({ scheduled: ["2026-10-30", "2026-11-01", "2026-11-02"] });
	});

	it("予定を入れると estimated も入れられる。someday なら open に戻す", () => {
		expect(schedulePatch(issue("i-1"), ["2026-11-01"], 60)).toEqual({ scheduled: ["2026-11-01"], estimated: 60 });
		expect(schedulePatch(issue("i-1", { status: "someday", revisit: "2026-11-01" }), ["2026-11-01"])).toMatchObject({ status: "open", revisit: null });
	});
});

describe("dead / caution / scheduled", () => {
	const today = "2026-10-31";
	const issues = [
		issue("i-1", { deadline: "2026-10-30" }),
		issue("i-2", { mid_due: "2026-10-29", deadline: "2026-11-02" }),
		issue("i-3", { deadline: "2026-10-31", status: "closed" }),
		issue("i-4", { mid_due: "2026-10-31", scheduled: [today] }),
		issue("i-5", { deadline: "2026-11-04", scheduled: [today] }),
		issue("i-6", { status: "someday", scheduled: [today] }),
	];

	it("期限を過ぎた閉じていない issue。deadline と mid_due は別", () => {
		const d = deadIssues(issues, today);
		expect(ids(d.deadline)).toEqual(["i-1"]);
		expect(ids(d.midDue)).toEqual(["i-2"]);
	});

	it("今日から 3 日以内", () => {
		const c = cautionIssues(issues, today);
		expect(ids(c.deadline)).toEqual(["i-2"]);
		expect(ids(c.midDue)).toEqual(["i-4"]);
	});

	it("今日が実行日（ボードに載せたもの・閉じたものを除く）", () => {
		expect(ids(scheduledOn(issues, today))).toEqual(["i-4", "i-5"]);
		expect(ids(scheduledOn(issues, today, new Set(["i-4"])))).toEqual(["i-5"]);
	});
});

describe("board", () => {
	it("frontmatter との読み書き。壊れた値は捨てる", () => {
		const b = parseBoard({ issues: ["i-1", "i-1", 3], groups: { "i-1": "午前", "r-1": 5 }, routines: { "r-1": "closed", "r-2": "done" }, closed: true });
		expect(b).toEqual({ issues: ["i-1"], groups: { "i-1": "午前" }, routines: { "r-1": "closed" }, carried: [], closed: true });
		expect(serializeBoard(emptyBoard())).toEqual({});
		expect(parseBoard(serializeBoard(b))).toEqual(b);
		expect(dailyNotePath("2026-10-31")).toBe("daily/2026/10/2026-10-31.md");
	});

	it("未完了と、締めていない過去のボード", () => {
		const routine = parseRoutine("routine/r-1.md", { type: "routine", id: "r-1", summary: "r", repeat: { every: "day" }, start: "2026-10-01" }).value!;
		const index = new TaskIndex(
			data({ issues: [issue("i-1"), issue("i-2", { status: "closed" }), issue("i-3", { status: "someday" })], routines: [routine] }),
		);
		const board = { ...emptyBoard(), issues: ["i-1", "i-2", "i-3", "i-9"] };
		expect(ids(boardItems(index, "2026-10-30", board).issues)).toEqual(["i-1", "i-2", "i-3"]);
		const u = unfinished(index, "2026-10-30", board);
		expect(ids(u.issues)).toEqual(["i-1"]);
		expect(ids(u.routines)).toEqual(["r-1"]);
		expect(ids(unfinished(index, "2026-10-30", { ...board, carried: ["i-1"] }).issues)).toEqual([]);

		const boards: DailyBoard[] = [
			{ date: "2026-10-29", path: "a", board: { ...board, routines: { "r-1": "closed" } } },
			{ date: "2026-10-28", path: "b", board: { ...emptyBoard(), issues: ["i-2"], routines: { "r-1": "canceled" } } },
			{ date: "2026-10-27", path: "c", board: { ...board, closed: true } },
			{ date: "2026-10-31", path: "d", board },
		];
		expect(pendingBoards(index, boards, "2026-10-31").map((b) => b.date)).toEqual(["2026-10-29"]);
	});
});

describe("groups", () => {
	it("2 階層まで。span は 1〜4 に収める", () => {
		const { groups, problems } = parseGroups(
			JSON.stringify([
				{ name: "午前", span: 2, children: [{ name: "集中" }, { name: "雑務", children: [{ name: "深い" }] }] },
				{ name: "午後", span: 9 },
				{ name: "a/b" },
			]),
		);
		expect(groups.map((g) => [g.name, g.span])).toEqual([
			["午前", 2],
			["午後", 4],
		]);
		expect(groupKeys(groups)).toEqual(["午前", "午前/集中", "午前/雑務", "午後"]);
		expect(problems.map((p) => p.message)).toEqual(["グループは 2 階層までです: 雑務", expect.stringContaining("/ を含んでいます")]);
		expect(parseGroups(serializeGroups(groups)).groups).toEqual(groups);
	});

	it("inGroup は子のグループも含む", () => {
		expect(inGroup("午前/集中", "午前")).toBe(true);
		expect(inGroup("午前", "午前")).toBe(true);
		expect(inGroup("午前中", "午前")).toBe(false);
	});
});

describe("queryIssues", () => {
	const issues = [
		issue("i-1", { summary: "請求書を送る", priority: "high", label: ["仕事"] }),
		issue("i-2", { summary: "牛乳", status: "closed" }),
		issue("i-3", { summary: "請求の確認", scheduled: ["2026-11-01"], deadline: "2026-11-03" }),
		issue("i-10", { summary: "x", status: "someday" }),
	];
	const today = "2026-10-31";

	it("既定は閉じていないもの、ID の降順", () => {
		expect(ids(queryIssues(issues, defaultQuery(), today))).toEqual(["i-3", "i-1"]);
	});

	it("文字・status・label・scheduled で絞り込む", () => {
		const q = defaultQuery();
		expect(ids(queryIssues(issues, { ...q, text: "請求 送" }, today))).toEqual(["i-1"]);
		expect(ids(queryIssues(issues, { ...q, statuses: ["closed", "someday"] }, today))).toEqual(["i-10", "i-2"]);
		expect(ids(queryIssues(issues, { ...q, labels: ["仕事"] }, today))).toEqual(["i-1"]);
		expect(ids(queryIssues(issues, { ...q, scheduled: "yes" }, today))).toEqual(["i-3"]);
	});

	it("値のないものは並び順にかかわらず後ろ", () => {
		const q = { ...defaultQuery(), sort: "deadline" as const, desc: false };
		expect(ids(queryIssues(issues, q, today))).toEqual(["i-3", "i-1"]);
		expect(ids(queryIssues(issues, { ...q, desc: true }, today))).toEqual(["i-3", "i-1"]);
		expect(ids(queryIssues(issues, { ...defaultQuery(), sort: "priority", desc: false }, today))).toEqual(["i-1", "i-3"]);
	});
});

describe("reviewWorklogs", () => {
	it("止め忘れ・長すぎる・日またぎ・重なり・閉じた後・ないタスク", () => {
		const now = Date.parse("2026-10-31T20:00:00+09:00");
		const index = new TaskIndex(
			data({
				issues: [issue("i-1"), issue("i-2"), issue("i-3")],
				worklogs: [
					log("run", "i-1", "2026-10-31T09:00:00+09:00", null),
					log("long", "i-2", "2026-10-30T09:00:00+09:00", "2026-10-30T17:00:00+09:00"),
					log("night", "i-3", "2026-10-29T23:00:00+09:00", "2026-10-30T01:00:00+09:00"),
					log("a", "i-1", "2026-10-28T10:00:00+09:00", "2026-10-28T11:00:00+09:00"),
					log("b", "i-2", "2026-10-28T10:00:00+09:00", "2026-10-28T11:00:00+09:00"),
					log("c", "i-3", "2026-10-28T10:30:00+09:00", "2026-10-28T11:00:00+09:00"),
					log("x", "i-9", "2026-10-27T10:00:00+09:00", "2026-10-27T11:00:00+09:00"),
				],
			}),
		);
		const closedAt = new Map([["i-3", Date.parse("2026-10-29T12:00:00+09:00")]]);
		const found = reviewWorklogs(index, now, {}, closedAt).map((f) => `${f.entry.id} ${f.code}`);
		expect(found).toEqual(
			expect.arrayContaining([
				"run still-running",
				"long too-long",
				"night crosses-midnight",
				"night after-close",
				"a many-overlaps",
				"c many-overlaps",
				"x unknown-task",
			]),
		);
		expect(found).not.toContain("long crosses-midnight");
	});
});

describe("summary", () => {
	it("完了・持ち越し・worklog をリンク付きで書く", () => {
		const index = new TaskIndex(
			data({
				issues: [issue("i-1", { status: "closed", summary: "送る" }), issue("i-2", { summary: "確認" })],
				worklogs: [log("w", "i-1", "2026-10-31T10:00:00+09:00", "2026-10-31T10:45:00+09:00")],
			}),
		);
		const text = boardSummary(index, "2026-10-31", { ...emptyBoard(), issues: ["i-1", "i-2"] });
		expect(text).toContain("- [i-1 送る](issue/i-1.md)");
		expect(text).toContain("- [i-2 確認](issue/i-2.md)（open）");
		expect(text).toMatch(/- \d\d:\d\d–\d\d:\d\d（45m） \[i-1 送る\]\(issue\/i-1\.md\)/);
	});

	it("節を置き換える。なければ末尾に足す。frontmatter は触らない", () => {
		const s = "## Task board\n\n- new\n";
		expect(upsertSummary("---\na: 1\n---\nメモ\n", s)).toBe("---\na: 1\n---\nメモ\n\n## Task board\n\n- new\n");
		expect(upsertSummary("---\na: 1\n---\n", s)).toBe("---\na: 1\n---\n## Task board\n\n- new\n");
		expect(upsertSummary("前\n\n## Task board\n\n- old\n\n## 次\n本文\n", s)).toBe("前\n\n## Task board\n\n- new\n\n## 次\n本文\n");
		expect(upsertSummary("## Task board\n- old\n", s)).toBe("## Task board\n\n- new\n");
	});
});

describe("小物", () => {
	it("describeRepeat", () => {
		const d = (v: unknown) => {
			const r = parseRepeat(v);
			if (!r.ok) throw new Error(r.error);
			return describeRepeat(r.value);
		};
		expect(d({ every: "day" })).toBe("毎日");
		expect(d({ every: "week", interval: 2, on: ["mon", "thu"] })).toBe("隔週 mon, thu");
		expect(d({ every: "month", on: ["2th-tue", "last", 15] })).toBe("毎月 第 2 tue, 月末, 15 日");
		expect(d({ every: "day", interval: 3 })).toBe("3 日ごと");
	});

	it("worklog の ID と追記", () => {
		expect(newWorklogId(() => 0)).toBe("wl_0000000000");
		expect(newWorklogId()).toMatch(/^wl_[0-9a-z]{10}$/);
		expect(appendWorklogLine("", "a")).toBe("a\n");
		expect(appendWorklogLine("x", "a")).toBe("x\na\n");
		expect(appendWorklogLine("x\n", "a")).toBe("x\na\n");
	});

	it("端末名は Vault の外や別のフォルダを指せない", () => {
		expect(sanitizeDeviceName(" iphone ")).toBe("iphone");
		expect(sanitizeDeviceName("../../etc")).toBe("-..-etc");
		expect(sanitizeDeviceName("a/b\\c")).toBe("a-b-c");
		expect(sanitizeDeviceName("..")).toBe("");
		expect(worklogPath("../x", new Date(2026, 9, 31))).toBe("worklog/-x/2026-10.jsonl");
		expect(() => worklogPath("..", new Date())).toThrow();
	});
});
