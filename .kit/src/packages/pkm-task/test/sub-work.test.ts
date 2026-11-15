import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parse } from "yaml";
import { readVault } from "../cli/read-vault";
import { startTimerOnDisk, stopTimerOnDisk, updateSubIssueOnDisk } from "../cli/vault-ops";
import { TaskIndex, emptyVaultData, type VaultData } from "../src/core/index";
import { lintVault } from "../src/core/lint";
import { runningStatus } from "../src/core/running";
import { parseIssue } from "../src/core/schema";
import { compareStatusLog, closedAtMap, parseStatusLog, statusBefore, statusLogLine } from "../src/core/status-log";
import { parseSubIssues, updateSubIssueText } from "../src/core/sub-issue";
import { parseWorklog, replaceWorklogLine, serializeWorklogEntry, stopWorklogLines, workKey, workTarget, type WorklogEntry } from "../src/core/worklog";

const SUBS = "<!-- sub-issue\nid: aaaaaa\nsummary: 仕様\nstatus: open\n-->\n\n<!-- sub-issue\nid: bbbbbb\nsummary: 実装\nstatus: open\n-->\n";
const PARENT = `---\ntype: issue\nid: i-1\nsummary: 親\nstatus: open\n---\n\n## Note\n\n${SUBS}`;

function log(id: string, taskId: string, sub: string | null, from: string, to: string | null): WorklogEntry {
	return { path: "worklog/pc/2026-11.jsonl", line: 1, id, taskId, sub, from, to, description: "", fromMs: Date.parse(from), toMs: to === null ? null : Date.parse(to) };
}

function vault(extra: Partial<VaultData> = {}): VaultData {
	const issue = parseIssue("issue/i-1.md", { type: "issue", id: "i-1", summary: "親", status: "open" }).value!;
	const { subs } = parseSubIssues("issue/i-1.md", "i-1", PARENT, parse);
	return { ...emptyVaultData(), issues: [issue], subIssues: subs, ...extra };
}

describe("作業キー", () => {
	it("issue・routine はその ID、サブは合成キー", () => {
		expect(workKey({ taskId: "i-1", sub: null })).toBe("i-1");
		expect(workKey({ taskId: "i-1", sub: "aaaaaa" })).toBe("i-1#aaaaaa");
		expect(workTarget("i-1#aaaaaa")).toEqual({ taskId: "i-1", sub: "aaaaaa" });
		expect(workTarget("r-3")).toEqual({ taskId: "r-3", sub: null });
	});
});

describe("worklog の sub", () => {
	it("sub を読み、sub のない行は今と同じ文字列で書く", () => {
		const text = '{"id":"wl_1","task_id":"i-1","sub":"aaaaaa","from":"2026-11-01T10:00:00Z","to":null,"description":""}\n{"id":"wl_2","task_id":"i-1","from":"2026-11-01T10:00:00Z","to":null,"description":""}\n';
		const { entries, problems } = parseWorklog("worklog/pc/2026-11.jsonl", text);
		expect(problems).toEqual([]);
		expect(entries.map((e) => e.sub)).toEqual(["aaaaaa", null]);
		expect(serializeWorklogEntry({ id: "wl_2", taskId: "i-1", sub: null, from: "f", to: null, description: "" })).toBe('{"id":"wl_2","task_id":"i-1","from":"f","to":null,"description":""}');
		expect(serializeWorklogEntry({ id: "wl_1", taskId: "i-1", sub: "aaaaaa", from: "f", to: null, description: "" })).toBe('{"id":"wl_1","task_id":"i-1","sub":"aaaaaa","from":"f","to":null,"description":""}');
	});

	it("sub の書式が違う行は読まずに報告する", () => {
		const { entries, problems } = parseWorklog("w.jsonl", '{"id":"wl_1","task_id":"i-1","sub":"XX","from":"2026-11-01T10:00:00Z","to":null}\n');
		expect(entries).toEqual([]);
		expect(problems.map((p) => p.code)).toEqual(["invalid-worklog"]);
	});

	it("書き換えても止めても sub が残る", () => {
		const line = '{"id":"wl_1","task_id":"i-1","sub":"aaaaaa","from":"2026-11-01T10:00:00Z","to":null,"description":""}';
		const [entry] = parseWorklog("w.jsonl", `${line}\n`).entries;
		expect(replaceWorklogLine(line, entry!, { from: entry!.from, to: "2026-11-01T11:00:00Z", description: "x" })).toContain('"sub":"aaaaaa"');
		expect(stopWorklogLines(line, [entry!], "2026-11-01T11:00:00Z", Date.parse("2026-11-01T11:00:00Z"))).toContain('"sub":"aaaaaa"');
	});
});

describe("statuslog の sub", () => {
	it("sub 付きで書き、親の履歴には sub の行を使わない", () => {
		const subLine = statusLogLine("i-1", "open", "closed", "ui", new Date("2026-11-01T10:00:00Z"), () => 0, "aaaaaa")!;
		expect(JSON.parse(subLine)).toMatchObject({ task: "i-1", sub: "aaaaaa", from: "open", to: "closed" });
		expect(JSON.parse(statusLogLine("i-1", "open", "closed", "ui", new Date(), () => 0)!)).not.toHaveProperty("sub");
		const parentLine = statusLogLine("i-1", "in-progress", "closed", "ui", new Date("2026-11-01T09:00:00Z"), () => 0.5)!;
		const { entries, problems } = parseStatusLog("statuslog/pc/2026-11.jsonl", `${parentLine}\n${subLine}\n`);
		expect(problems).toEqual([]);
		const logs = [...entries].sort(compareStatusLog);
		expect(logs.map((e) => e.sub)).toEqual([null, "aaaaaa"]);
		expect(statusBefore(logs, "i-1", "closed")).toBe("in-progress");
		expect(closedAtMap(logs, ["i-1"]).get("i-1")).toBe(Date.parse("2026-11-01T09:00:00Z"));
		const index = new TaskIndex(vault({ statusLogs: logs }));
		expect(index.lastStatusLog("i-1")?.sub).toBeNull();
	});
});

describe("実績と記録中", () => {
	const worklogs = [
		log("w1", "i-1", null, "2026-11-01T10:00:00Z", "2026-11-01T11:00:00Z"),
		log("w2", "i-1", "aaaaaa", "2026-11-01T10:30:00Z", "2026-11-01T11:30:00Z"),
		log("w3", "i-1", "bbbbbb", "2026-11-01T12:00:00Z", null),
	];
	const index = new TaskIndex(vault({ worklogs }));
	const now = Date.parse("2026-11-01T12:30:00Z");

	it("親の実績 = 親に直接 + サブ（1 行 1 回だけ）。サブの実績 = そのサブ", () => {
		// 10:00-10:30 は w1 だけ（30 分）、10:30-11:00 は w1 と w2 で 15 分ずつ、11:00-11:30 は w2 だけ、12:00-12:30 は w3
		expect(index.effortMinutes(now).get("i-1")).toBe(120);
		const byKey = index.effortByKey(now);
		expect(byKey.get("i-1")).toBe(45);
		expect(byKey.get("i-1#aaaaaa")).toBe(45);
		expect(byKey.get("i-1#bbbbbb")).toBe(30);
	});

	it("記録中はキーの完全一致で見る（親は親に直接の記録だけ）", () => {
		expect(index.running("i-1")).toEqual([]);
		expect(index.running("i-1#bbbbbb").map((l) => l.id)).toEqual(["w3"]);
		expect(index.running().map((l) => l.id)).toEqual(["w3"]);
	});

	it("ステータスバーにサブの題を出し、開くのは親の md", () => {
		expect(runningStatus(index, now)).toMatchObject({ text: "● i-1#bbbbbb 実装 30m", path: "issue/i-1.md" });
	});

	it("消えたサブを指す行は警告で、親の実績には含める", () => {
		const gone = new TaskIndex(vault({ worklogs: [log("w9", "i-1", "zzzzzz", "2026-11-01T10:00:00Z", "2026-11-01T11:00:00Z")] }));
		expect(lintVault(gone.data).map((p) => `${p.severity} ${p.code}`)).toEqual(["warning dangling-sub-worklog"]);
		expect(gone.effortMinutes(now).get("i-1")).toBe(60);
	});
});

describe("サブの項目を書き換える", () => {
	it("そのサブだけを書き換え、前の値を返す。ないサブは例外", () => {
		const r = updateSubIssueText("issue/i-1.md", "i-1", PARENT, "bbbbbb", { status: "in-progress" }, parse);
		expect(r.before.status).toBe("open");
		expect(r.after.status).toBe("in-progress");
		const again = parseSubIssues("issue/i-1.md", "i-1", r.text, parse).subs;
		expect(again.map((s) => [s.id, s.status])).toEqual([
			["aaaaaa", "open"],
			["bbbbbb", "in-progress"],
		]);
		expect(r.text.startsWith(PARENT.slice(0, PARENT.indexOf("<!--")))).toBe(true);
		expect(() => updateSubIssueText("issue/i-1.md", "i-1", PARENT, "zzzzzz", { status: "closed" }, parse)).toThrow();
	});
});

describe("CLI のタイマーとサブ", () => {
	let root: string;
	const now = new Date("2026-11-01T10:00:00.000Z");

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "vault-sub-work-"));
		mkdirSync(join(root, "issue"));
		writeFileSync(join(root, "issue/i-1.md"), PARENT);
	});

	afterEach(() => rmSync(root, { recursive: true, force: true }));

	it("サブで始めると sub 付きの行になり、open のサブは in-progress にして statuslog に書く。親は変えない", () => {
		const index = new TaskIndex(readVault(root).data);
		expect(startTimerOnDisk(root, index, ["i-1#bbbbbb"], "ai", now)).toEqual(["i-1#bbbbbb"]);
		const after = readVault(root);
		expect(after.problems).toEqual([]);
		expect(after.data.worklogs.map((l) => [l.taskId, l.sub, l.toMs])).toEqual([["i-1", "bbbbbb", null]]);
		const idx = new TaskIndex(after.data);
		expect(idx.sub("i-1#bbbbbb")?.status).toBe("in-progress");
		expect(idx.issues.get("i-1")?.status).toBe("open");
		expect(after.data.statusLogs.map((e) => [e.task, e.sub, e.from, e.to, e.via])).toEqual([["i-1", "bbbbbb", "open", "in-progress", "timer"]]);
		// 記録中なら、もう一度始めても足さない。親で始めるのは別の記録
		expect(startTimerOnDisk(root, idx, ["i-1#bbbbbb", "i-1"], "ai", now)).toEqual(["i-1"]);
	});

	it("ないサブでは始めない。止めるのもキーで選ぶ", () => {
		const index = new TaskIndex(readVault(root).data);
		expect(() => startTimerOnDisk(root, index, ["i-1#zzzzzz"], "ai", now)).toThrow();
		startTimerOnDisk(root, index, ["i-1#aaaaaa", "i-1#bbbbbb"], "ai", now);
		const later = new Date("2026-11-01T10:30:00.000Z");
		expect(stopTimerOnDisk(root, new TaskIndex(readVault(root).data), ["i-1#aaaaaa"], later)).toEqual(["i-1#aaaaaa"]);
		const logs = readVault(root).data.worklogs;
		expect(logs.map((l) => [l.sub, l.toMs !== null])).toEqual([
			["aaaaaa", true],
			["bbbbbb", false],
		]);
	});

	it("サブの status を変えると statuslog に task と sub で書き、閉じたらそのサブの記録だけ止める", () => {
		startTimerOnDisk(root, new TaskIndex(readVault(root).data), ["i-1", "i-1#aaaaaa"], "ai", now);
		const later = new Date("2026-11-01T10:30:00.000Z");
		const sub = updateSubIssueOnDisk(root, new TaskIndex(readVault(root).data), "i-1#aaaaaa", { status: "closed" }, { device: "ai", now: later, via: "mcp" });
		expect(sub.status).toBe("closed");
		const { data } = readVault(root);
		expect(data.worklogs.map((l) => [l.sub, l.toMs !== null])).toEqual([
			[null, false],
			["aaaaaa", true],
		]);
		expect(readFileSync(join(root, "statuslog/ai/2026-11.jsonl"), "utf8")).toContain('"sub":"aaaaaa","from":"in-progress","to":"closed","via":"mcp"');
	});
});
