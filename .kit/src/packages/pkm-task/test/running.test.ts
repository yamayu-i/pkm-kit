import { describe, expect, it } from "vitest";
import { TaskIndex, emptyVaultData } from "../src/core/index";
import { runningStatus } from "../src/core/running";
import { parseIssue, parseRoutine } from "../src/core/schema";
import type { WorklogEntry } from "../src/core/worklog";

const issue = (id: string, summary: string) => parseIssue(`issue/${id}.md`, { type: "issue", id, summary, status: "open" }).value!;
const routine = (id: string, summary: string) => parseRoutine(`routine/${id}.md`, { type: "routine", id, summary }).value!;

function log(id: string, taskId: string, from: string, to: string | null = null): WorklogEntry {
	return { path: "worklog/pc/2026-11.jsonl", line: 1, id, taskId, from, to, description: "", fromMs: Date.parse(from), toMs: to === null ? null : Date.parse(to) };
}

const NOW = Date.parse("2026-11-08T10:42:00+09:00");

function index(worklogs: WorklogEntry[]) {
	return new TaskIndex({ ...emptyVaultData(), issues: [issue("i-12", "見積もりを直す"), issue("i-13", "とても長い summary の issue で、ステータスバーに収まらないもの")], routines: [routine("r-1", "メールを片付ける")], worklogs });
}

describe("runningStatus（ADR-0075）", () => {
	it("記録中がなければ null", () => {
		expect(runningStatus(index([log("w1", "i-12", "2026-11-08T09:00:00+09:00", "2026-11-08T09:30:00+09:00")]), NOW)).toBeNull();
	});

	it("1 つなら ID・summary・経過時間を出し、押すとそのノートを開く", () => {
		const s = runningStatus(index([log("w1", "i-12", "2026-11-08T10:00:00+09:00")]), NOW);
		expect(s).toEqual({ text: "● i-12 見積もりを直す 42m", tooltip: "i-12 見積もりを直す 42m", path: "issue/i-12.md" });
	});

	it("routine も同じように出す", () => {
		expect(runningStatus(index([log("w1", "r-1", "2026-11-08T09:12:00+09:00")]), NOW)?.text).toBe("● r-1 メールを片付ける 1h30m");
	});

	it("長い summary は 24 文字で切る", () => {
		const s = runningStatus(index([log("w1", "i-13", "2026-11-08T10:41:00+09:00")]), NOW)!;
		expect(s.text).toBe(`● i-13 ${"とても長い summary の issue で、ステータスバーに収まらないもの".slice(0, 24)}… 1m`);
		expect(s.tooltip).toBe("i-13 とても長い summary の issue で、ステータスバーに収まらないもの 1m");
	});

	it("2 つ以上なら件数といちばん長い経過時間を出し、パスは持たない（サイドバーを開く）", () => {
		const s = runningStatus(index([log("w1", "i-12", "2026-11-08T10:00:00+09:00"), log("w2", "r-1", "2026-11-08T09:42:00+09:00")]), NOW);
		expect(s).toEqual({ text: "● 2 running 1h", tooltip: "r-1 メールを片付ける 1h\ni-12 見積もりを直す 42m", path: null });
	});

	it("同じタスクの複数のログは 1 つに数える", () => {
		const s = runningStatus(index([log("w1", "i-12", "2026-11-08T10:00:00+09:00"), log("w2", "i-12", "2026-11-08T10:30:00+09:00")]), NOW);
		expect(s?.text).toBe("● i-12 見積もりを直す 42m");
	});

	it("索引にないタスクは ID だけを出し、パスは持たない", () => {
		expect(runningStatus(index([log("w1", "i-99", "2026-11-08T10:40:00+09:00")]), NOW)).toEqual({ text: "● i-99 2m", tooltip: "i-99 2m", path: null });
	});

	it("開始が未来（時計のずれ）でも 0m にする", () => {
		expect(runningStatus(index([log("w1", "i-12", "2026-11-08T11:00:00+09:00")]), NOW)?.text).toBe("● i-12 見積もりを直す 0m");
	});
});
