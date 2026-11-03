import { describe, expect, it } from "vitest";
import { TaskIndex } from "../src/core/index";
import { collectVault, fileKind } from "../src/core/load";
import { reviewWorklogs } from "../src/core/review";
import {
	closedAtMap,
	isDoneStatus,
	nextStatuses,
	boardMenuStatuses,
	parseStatusLog,
	statusBefore,
	statusLogLine,
	statusLogPath,
	type StatusLogEntry,
} from "../src/core/status-log";
import { UndoBatch, undoMessage } from "../src/core/undo";

const line = (at: string, task: string, from: string, to: string, via = "ui") => JSON.stringify({ id: `st_${at}`, at, task, from, to, via });
const issueMd = (id: string, status: string) => ({ path: `issue/${id}.md`, frontmatter: { type: "issue", id, summary: id, status } });

describe("status の記録（ADR-0031）", () => {
	it("端末と変えた時刻の月のファイルに書く", () => {
		const at = new Date(2026, 10, 3, 10, 0);
		expect(statusLogPath("pc", at)).toBe("statuslog/pc/2026-11.jsonl");
		expect(statusLogPath("a/b", at)).toBe("statuslog/a-b/2026-11.jsonl");
		expect(() => statusLogPath("", at)).toThrow(/端末名/);
		expect(fileKind("statuslog/pc/2026-11.jsonl")).toBe("statuslog");
		expect(fileKind("statuslog/pc/2026-11 (conflict).jsonl")).toBeNull();
	});

	it("1 行は id・at・task・from・to・via。変わっていなければ書かない", () => {
		const at = new Date("2026-11-03T01:23:45.678Z");
		const text = statusLogLine("i-6", "open", "in-progress", "ui", at, () => 0)!;
		expect(JSON.parse(text)).toEqual({ id: "st_0000000000", at: "2026-11-03T01:23:45.678Z", task: "i-6", from: "open", to: "in-progress", via: "ui" });
		expect(statusLogLine("i-6", "open", "open", "ui", at)).toBeNull();
		const { entries, problems } = parseStatusLog("statuslog/pc/2026-11.jsonl", `${text}\n`);
		expect(problems).toEqual([]);
		expect(entries[0]).toMatchObject({ task: "i-6", from: "open", to: "in-progress", via: "ui", line: 1 });
	});

	it("読めない行は問題として報告し、その行だけ飛ばす", () => {
		const good = line("2026-11-03T00:00:00.000Z", "i-1", "open", "closed");
		const text = ["broken", line("x", "i-1", "open", "closed"), line("2026-11-03T00:00:00.000Z", "i-1", "open", "done"), line("2026-11-03T00:00:00.000Z", "i-1", "open", "closed", "hand"), good].join("\n");
		const { entries, problems } = parseStatusLog("statuslog/pc/2026-11.jsonl", text);
		expect(entries).toHaveLength(1);
		expect(problems.map((p) => p.message.slice(0, 4))).toEqual(["1 行目", "2 行目", "3 行目", "4 行目"]);
	});

	it("全端末の記録を時刻順に読み、閉じる前の status と閉じた時刻が分かる", () => {
		const { data, problems } = collectVault({
			markdown: [issueMd("i-1", "closed"), issueMd("i-2", "in-progress")],
			worklogs: [],
			labels: null,
			statusLogs: [
				{ path: "statuslog/phone/2026-11.jsonl", text: line("2026-11-03T02:00:00.000Z", "i-1", "waiting", "closed") },
				{ path: "statuslog/pc/2026-11.jsonl", text: [line("2026-11-03T01:00:00.000Z", "i-1", "open", "waiting"), line("2026-11-03T01:30:00.000Z", "i-2", "open", "in-progress")].join("\n") },
			],
		});
		expect(problems).toEqual([]);
		expect(data.statusLogs.map((e) => e.at)).toEqual(["2026-11-03T01:00:00.000Z", "2026-11-03T01:30:00.000Z", "2026-11-03T02:00:00.000Z"]);
		const index = new TaskIndex(data);
		expect(index.statusBefore("i-1")).toBe("waiting");
		expect(index.statusBefore("i-2")).toBe("open");
		expect(index.closedAt()).toEqual(new Map([["i-1", Date.parse("2026-11-03T02:00:00.000Z")]]));
		expect(index.lastStatusLog("i-1")?.to).toBe("closed");
	});

	it("最後の記録が今の status と合わなければ、閉じる前の status は分からない", () => {
		const logs = parseStatusLog("statuslog/pc/2026-11.jsonl", line("2026-11-03T01:00:00.000Z", "i-1", "open", "in-progress")).entries;
		expect(statusBefore(logs, "i-1", "closed")).toBeNull();
		expect(statusBefore(logs, "i-9", "closed")).toBeNull();
	});

	it("閉じた時刻は、今 closed の issue の最後の closed だけ", () => {
		const logs: StatusLogEntry[] = parseStatusLog(
			"statuslog/pc/2026-11.jsonl",
			[line("2026-11-01T00:00:00.000Z", "i-1", "open", "closed"), line("2026-11-02T00:00:00.000Z", "i-1", "closed", "open"), line("2026-11-03T00:00:00.000Z", "i-1", "open", "closed"), line("2026-11-03T00:00:00.000Z", "i-2", "open", "closed")].join("\n"),
		).entries;
		expect(closedAtMap(logs, ["i-1"])).toEqual(new Map([["i-1", Date.parse("2026-11-03T00:00:00.000Z")]]));
	});

	it("worklog の見直しは、記録から閉じた後のログを見つける", () => {
		const { data } = collectVault({
			markdown: [issueMd("i-1", "closed")],
			worklogs: [{ path: "worklog/pc/2026-11.jsonl", text: JSON.stringify({ id: "wl_1", task_id: "i-1", from: "2026-11-03T12:00:00+09:00", to: "2026-11-03T12:30:00+09:00", description: "" }) }],
			labels: null,
			statusLogs: [{ path: "statuslog/pc/2026-11.jsonl", text: line("2026-11-03T02:00:00.000Z", "i-1", "in-progress", "closed") }],
		});
		const findings = reviewWorklogs(new TaskIndex(data), Date.parse("2026-11-03T06:00:00.000Z"));
		expect(findings.map((f) => f.code)).toEqual(["after-close"]);
	});
});

describe("次の status（ADR-0031）", () => {
	it("open と waiting は in-progress、in-progress は closed、delegated は両方、someday と完了は出さない", () => {
		expect(nextStatuses("open")).toEqual(["in-progress"]);
		expect(nextStatuses("waiting")).toEqual(["in-progress"]);
		expect(nextStatuses("in-progress")).toEqual(["closed"]);
		expect(nextStatuses("delegated")).toEqual(["in-progress", "closed"]);
		expect(nextStatuses("someday")).toEqual([]);
		expect(nextStatuses("closed")).toEqual([]);
		expect(nextStatuses("canceled")).toEqual([]);
		expect(isDoneStatus("closed") && isDoneStatus("canceled") && !isDoneStatus("someday")).toBe(true);
	});
});

describe("取り消しのトースト（ADR-0031）", () => {
	it("同じものは 1 件に数え、最初の値を残し、新しい順に取り出す", () => {
		const batch = new UndoBatch<string>();
		expect(batch.add("i-1", "open")).toBe(1);
		expect(batch.add("i-2", "waiting")).toBe(2);
		expect(batch.add("i-1", "in-progress")).toBe(2);
		expect(batch.take()).toEqual(["waiting", "open"]);
		expect(batch.size).toBe(0);
		expect(undoMessage(3)).toBe("3件のステータスが変更されました。");
	});
});

describe("ボードの status メニュー（ADR-0032）", () => {
	it("issue は delegated も選べる。someday は出さない", () => {
		expect(boardMenuStatuses("issue")).toEqual(["open", "in-progress", "waiting", "delegated", "closed", "canceled"]);
	});
	it("routine はその日の結果だけ（open / closed / canceled）", () => {
		expect(boardMenuStatuses("routine")).toEqual(["open", "closed", "canceled"]);
	});
});
