import { describe, expect, it } from "vitest";
import { parseIssue, parseRoutine } from "../src/core/schema";
import { parseWorklog } from "../src/core/worklog";

describe("parseIssue", () => {
	it("frontmatter を読む", () => {
		const { value, problems } = parseIssue("issue/i-12.md", {
			schema: 1,
			type: "issue",
			id: "i-12",
			summary: "表題",
			status: "delegated",
			"status-detail": "返事待ち",
			delegated_to: "m-3",
			priority: "mid",
			label: ["仕事", "調査", "仕事"],
			parent: "i-3",
			related: ["i-5", "topics/foo.md"],
			estimated: 120,
			scheduled: ["2026-11-04", new Date("2026-11-02T00:00:00Z"), "2026-11-04"],
			mid_due: "2026-11-05",
			deadline: "2026-11-10",
			created: "2026-10-31T10:00:00+09:00",
		});
		expect(problems).toEqual([]);
		expect(value).toMatchObject({
			id: "i-12",
			status: "delegated",
			statusDetail: "返事待ち",
			delegatedTo: "m-3",
			labels: ["仕事", "調査"],
			scheduled: ["2026-11-02", "2026-11-04"],
			midDue: "2026-11-05",
			revisit: null,
		});
	});

	it("読めない欄は問題として報告し、ほかは読む", () => {
		const { value, problems } = parseIssue("issue/i-2.md", {
			type: "issue",
			id: "i-3",
			summary: "x",
			status: "doing",
			priority: "urgent",
			parent: "3",
			deadline: "2026-02-30",
			estimated: -5,
		});
		expect(value?.id).toBe("i-3");
		expect(value?.status).toBe("open");
		expect(problems.map((p) => p.code).sort()).toEqual([
			"id-path-mismatch",
			"invalid-date",
			"invalid-field",
			"invalid-field",
			"invalid-field",
			"invalid-ref",
		]);
	});

	it("ID が読めなければ索引に入れない", () => {
		const { value, problems } = parseIssue("issue/foo.md", { type: "issue", status: "open" });
		expect(value).toBeNull();
		expect(problems.some((p) => p.code === "invalid-id")).toBe(true);
	});
});

describe("parseRoutine", () => {
	it("repeat を読む。active の既定は true", () => {
		const { value, problems } = parseRoutine("routine/r-1.md", {
			type: "routine",
			id: "r-1",
			summary: "定例",
			repeat: { every: "month", on: ["2th-tue"] },
		});
		expect(problems).toEqual([]);
		expect(value?.active).toBe(true);
		expect(value?.repeat).toEqual({ every: "month", interval: 1, days: [{ kind: "nth", n: 2, weekday: 2 }] });
	});

	it("repeat が不正なら報告する", () => {
		const { value, problems } = parseRoutine("routine/r-2.md", { type: "routine", id: "r-2", repeat: { every: "week" } });
		expect(value?.repeat).toBeNull();
		expect(problems.map((p) => p.code)).toEqual(["invalid-repeat"]);
	});
});

describe("parseWorklog", () => {
	it("行ごとに読み、壊れた行は報告する", () => {
		const text = [
			'{"id":"w1","task_id":"i-1","from":"2026-10-31T10:00:00+09:00","to":"2026-10-31T10:30:00+09:00","description":"調査"}',
			"",
			'{"id":"w2","task_id":"r-1","from":"2026-10-31T11:00:00+09:00","to":null}',
			"{broken",
			'{"id":"w3","task_id":"i-1","from":"later"}',
		].join("\n");
		const { entries, problems } = parseWorklog("worklog/pc/2026-10.jsonl", text);
		expect(entries.map((e) => [e.id, e.line, e.toMs === null])).toEqual([
			["w1", 1, false],
			["w2", 3, true],
		]);
		expect(entries[0]!.toMs! - entries[0]!.fromMs).toBe(30 * 60_000);
		expect(problems.map((p) => p.message)).toEqual(["4 行目: JSON として読めません", "5 行目: from が日時ではありません"]);
	});
});
