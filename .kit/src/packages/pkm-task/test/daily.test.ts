import { describe, expect, it } from "vitest";
import { cancelPatch, inboxPatch, nextPatch, reschedulePatch, scheduledPatch, somedayPatch } from "../src/core/actions";
import { boardItems, dailyNotePath, emptyBoard, parseBoard, pendingBoards, unfinished, type DailyBoard } from "../src/core/board";
import { cautionIssues, deadIssues, scheduledOn } from "../src/core/daily";
import { TaskIndex, emptyVaultData, type VaultData } from "../src/core/index";
import { defaultQuery, queryIssues } from "../src/core/list";
import { describeRepeat, parseRepeat } from "../src/core/repeat";
import { reviewWorklogs } from "../src/core/review";
import { parseIssue, parseRoutine, type Issue } from "../src/core/schema";
import { boardSummary, upsertSummary } from "../src/core/summary";
import { appendWorklogLine, newWorklogId, parseWorklog, sanitizeDeviceName, stopWorklogLines, worklogPath, type WorklogEntry } from "../src/core/worklog";
import { frontmatterRange, newIssueContent } from "../src/core/issue-file";
import { monthGridDays } from "../src/core/dates";

function issue(id: string, fm: Record<string, unknown> = {}): Issue {
	return parseIssue(`issue/${id}.md`, { type: "issue", id, summary: `s${id}`, status: "open", ...fm }).value!;
}
const ids = (list: { id: string }[]) => list.map((i) => i.id);
const data = (p: Partial<VaultData>): VaultData => ({ ...emptyVaultData(), ...p });

function log(id: string, taskId: string, from: string, to: string | null): WorklogEntry {
	return { path: "worklog/pc/2026-10.jsonl", line: 1, id, taskId, from, to, description: "", fromMs: Date.parse(from), toMs: to === null ? null : Date.parse(to) };
}

describe("actions", () => {
	it("Cancel / Someday は期限を外す", () => {
		expect(cancelPatch()).toMatchObject({ status: "canceled", soft_deadline: null, deadline: null });
		expect(somedayPatch("2026-12-01")).toMatchObject({ status: "someday", scheduled: null, deadline: null, revisit: "2026-12-01" });
	});

	it("Inbox に戻すと clarified を外すだけで、予定と期限は残す（ADR-0148）", () => {
		const patch = inboxPatch();
		expect(patch).toMatchObject({ status: "open", clarified: null });
		expect(patch).not.toHaveProperty("scheduled");
		expect(patch).not.toHaveProperty("soft_deadline");
		expect(patch).not.toHaveProperty("deadline");
	});

	it("Next にすると clarified を付け、Tickler を消す。someday なら open に戻す（ADR-0148, 0152）", () => {
		expect(nextPatch(issue("i-1"))).toEqual({ clarified: true, tickler: null });
		expect(nextPatch(issue("i-1", { status: "someday", revisit: "2026-12-01" }))).toEqual({ clarified: true, tickler: null, status: "open", revisit: null });
	});

	it("リスケ: 期限も Calendar の日も、その日に置き換える（ADR-0152。Calendar は日付 1 つ）", () => {
		expect(reschedulePatch("deadline", "2026-11-10")).toEqual({ deadline: "2026-11-10" });
		expect(reschedulePatch("scheduled", "2026-11-05")).toEqual({ scheduled: "2026-11-05" });
	});

	it("Calendar の日を入れる・消す。someday に入れるときは open に戻す（ADR-0018, 0152）", () => {
		expect(scheduledPatch(issue("i-1"), "2026-11-01")).toEqual({ scheduled: "2026-11-01" });
		expect(scheduledPatch(issue("i-1", { status: "someday", revisit: "2026-11-01" }), "2026-11-01")).toMatchObject({ status: "open", revisit: null });
		expect(scheduledPatch(issue("i-1", { scheduled: "2026-11-01" }), null)).toEqual({ scheduled: null });
	});
});

describe("dead / caution / scheduled", () => {
	const today = "2026-10-31";
	const issues = [
		issue("i-1", { deadline: "2026-10-30" }),
		issue("i-2", { soft_deadline: "2026-10-29", deadline: "2026-11-02" }),
		issue("i-3", { deadline: "2026-10-31", status: "closed" }),
		issue("i-4", { soft_deadline: "2026-10-31", scheduled: today }),
		issue("i-5", { deadline: "2026-11-04", scheduled: today }),
		issue("i-6", { status: "someday", scheduled: today }),
	];

	it("期限を過ぎた閉じていない issue。deadline と soft_deadline は別", () => {
		const d = deadIssues(issues, today);
		expect(ids(d.deadline)).toEqual(["i-1"]);
		expect(ids(d.softDeadline)).toEqual(["i-2"]);
	});

	it("今日から 3 日以内", () => {
		const c = cautionIssues(issues, today);
		expect(ids(c.deadline)).toEqual(["i-2"]);
		expect(ids(c.softDeadline)).toEqual(["i-4"]);
	});

	it("今日が実行日（ボードに載せたもの・閉じたものを除く）", () => {
		expect(ids(scheduledOn(issues, today))).toEqual(["i-4", "i-5"]);
		expect(ids(scheduledOn(issues, today, new Set(["i-4"])))).toEqual(["i-5"]);
	});
});

describe("board", () => {
	it("既存の frontmatter を読む。壊れた値は捨てる", () => {
		const b = parseBoard({ issues: ["i-1", "i-1", 3], groups: { "i-1": "午前", "r-1": 5 }, routines: { "r-1": "closed", "r-2": "done" }, closed: true });
		// 以前の groups は読まない（ADR-0137）
		expect(b).toEqual({ issues: ["i-1"], stars: [], routines: { "r-1": "closed" }, carried: [], closed: true });
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

describe("queryIssues", () => {
	const issues = [
		issue("i-1", { summary: "請求書を送る", priority: "high", label: ["仕事"] }),
		issue("i-2", { summary: "牛乳", status: "closed" }),
		issue("i-3", { summary: "請求の確認", scheduled: "2026-11-01", deadline: "2026-11-03" }),
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
		expect(reviewWorklogs(index, now, { runningHours: undefined, longHours: undefined, overlapCount: undefined }, closedAt).map((f) => `${f.entry.id} ${f.code}`)).toEqual(found);
		expect(reviewWorklogs(index, now, { runningHours: 12, longHours: 9, overlapCount: 4 }, closedAt).map((f) => f.code)).not.toEqual(expect.arrayContaining(["still-running", "too-long", "many-overlaps"]));
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
		expect(d({ every: "day" })).toBe("Daily");
		expect(d({ every: "week", interval: 2, on: ["mon", "thu"] })).toBe("Every 2 weeks mon, thu");
		expect(d({ every: "month", on: ["2th-tue", "last", 15] })).toBe("Monthly 2nd tue, last day, day 15");
		expect(d({ every: "day", interval: 3 })).toBe("Every 3 days");
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

describe("stopWorklogLines", () => {
	const line = (id: string, from: string, to: string | null = null) => JSON.stringify({ id, task_id: "i-1", from, to, description: "" });
	const parse = (text: string) => parseWorklog("worklog/pc/2026-10.jsonl", text).entries;
	const stop = "2026-10-31T10:10:00+09:00";

	it("1 分以上なら to を入れ、1 分未満なら行を消す", () => {
		const text = `${line("long", "2026-10-31T10:00:00+09:00")}\n${line("short", "2026-10-31T10:09:01+09:00")}\n`;
		const result = parse(stopWorklogLines(text, parse(text), stop, Date.parse(stop)));
		expect(result.map((e) => [e.id, e.to])).toEqual([["long", stop]]);
	});

	it("ちょうど 1 分は残す", () => {
		const text = `${line("edge", "2026-10-31T10:09:00+09:00")}\n`;
		expect(parse(stopWorklogLines(text, parse(text), stop, Date.parse(stop))).map((e) => e.id)).toEqual(["edge"]);
	});

	it("前の行を消しても後ろの行を書き換えられる。止めない行は変えない", () => {
		const other = line("other", "2026-10-31T08:00:00+09:00", "2026-10-31T09:00:00+09:00");
		const text = `${line("short", "2026-10-31T10:09:30+09:00")}\n${other}\n${line("long", "2026-10-31T10:00:00+09:00")}\n`;
		const targets = parse(text).filter((e) => e.id !== "other");
		const result = parse(stopWorklogLines(text, targets, stop, Date.parse(stop)));
		expect(result.map((e) => [e.id, e.to])).toEqual([
			["other", "2026-10-31T09:00:00+09:00"],
			["long", stop],
		]);
	});
});

describe("frontmatterRange", () => {
	it("frontmatter の始まりから閉じる行の終わりまで", () => {
		const text = "---\nid: i-1\n---\n\n## ToDo\n";
		expect(frontmatterRange(text)).toEqual({ from: 0, to: "---\nid: i-1\n---".length });
	});

	it("空の frontmatter と CRLF を読む", () => {
		expect(frontmatterRange("---\n---\nbody")).toEqual({ from: 0, to: 7 });
		expect(frontmatterRange("---\r\nid: i-1\r\n---\r\nbody")).toEqual({ from: 0, to: 17 });
	});

	it("ファイルの終わりで閉じていてもよい", () => {
		expect(frontmatterRange("---\nid: i-1\n---")).toEqual({ from: 0, to: 15 });
	});

	it("frontmatter がない、閉じていないときは null", () => {
		expect(frontmatterRange("# title\n---\n")).toBeNull();
		expect(frontmatterRange("---\nid: i-1\n")).toBeNull();
		expect(frontmatterRange("---\nid: i-1\n----\n")).toBeNull();
		expect(frontmatterRange("")).toBeNull();
	});
});

describe("monthGridDays", () => {
	it("日曜から始まる 42 日を返す", () => {
		const days = monthGridDays("2026-11");
		expect(days).toHaveLength(42);
		expect(days[0]).toBe("2026-11-01");
		expect(days[41]).toBe("2026-12-12");
		expect(monthGridDays("2026-12")[0]).toBe("2026-11-29");
	});
});

describe("newIssueContent", () => {
	it("scheduled（Calendar の日 1 つ）と clarified を渡すと、その欄を書く（ADR-0152）", () => {
		const yaml = /^---\n([\s\S]*?)\n---/.exec(newIssueContent("i-1", "題", "2026-11-01T09:00:00+09:00", { scheduled: "2026-11-01", clarified: true }))![1]!;
		const lines = yaml.split("\n");
		expect(lines).toContain("scheduled: 2026-11-01");
		expect(lines).toContain("clarified: true");
		expect(issue("i-1", { scheduled: "2026-11-01" }).scheduled).toBe("2026-11-01");
	});

	it("渡さなければ scheduled も clarified も書かない（Inbox に入る）", () => {
		expect(newIssueContent("i-1", "題", "2026-11-01T09:00:00+09:00")).not.toContain("scheduled");
		expect(newIssueContent("i-1", "題", "2026-11-01T09:00:00+09:00")).not.toContain("clarified");
	});
});
