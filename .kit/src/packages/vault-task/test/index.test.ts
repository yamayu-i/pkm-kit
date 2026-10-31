import { describe, expect, it } from "vitest";
import { TaskIndex, emptyVaultData, isInbox, organizeQueue, type VaultData } from "../src/core/index";
import { lintVault } from "../src/core/lint";
import { parseIssue, parseMember, parseRoutine, type Issue, type Member, type Routine } from "../src/core/schema";
import type { WorklogEntry } from "../src/core/worklog";

function issue(id: string, fm: Record<string, unknown> = {}, path = `issue/${id}.md`): Issue {
	const { value } = parseIssue(path, { type: "issue", id, summary: id, status: "open", ...fm });
	if (!value) throw new Error("parse failed");
	return value;
}

function routine(id: string, fm: Record<string, unknown>): Routine {
	const { value } = parseRoutine(`routine/${id}.md`, { type: "routine", id, summary: id, ...fm });
	if (!value) throw new Error("parse failed");
	return value;
}

function member(id: string): Member {
	return parseMember(`member/${id}.md`, { type: "member", id, name: id }).value!;
}

function log(id: string, taskId: string, from: string, to: string | null, path = "worklog/pc/2026-10.jsonl"): WorklogEntry {
	return { path, line: 1, id, taskId, from, to, description: "", fromMs: Date.parse(from), toMs: to === null ? null : Date.parse(to) };
}

function data(partial: Partial<VaultData>): VaultData {
	return { ...emptyVaultData(), ...partial };
}

describe("TaskIndex", () => {
	const issues = [issue("i-1"), issue("i-2", { parent: "i-1" }), issue("i-3", { parent: "i-2" }), issue("i-4", { parent: "i-1" })];
	const index = new TaskIndex(data({ issues }));

	it("children を parent から逆引きする", () => {
		expect(index.children("i-1").map((i) => i.id)).toEqual(["i-2", "i-4"]);
		expect(index.children("i-3")).toEqual([]);
	});

	it("自分自身と子孫は親に選べない", () => {
		expect(index.canSetParent("i-1", "i-3")).toBe(false);
		expect(index.canSetParent("i-1", "i-1")).toBe(false);
		expect(index.canSetParent("i-3", "i-4")).toBe(true);
		expect(index.canSetParent("i-3", "i-99")).toBe(false);
	});

	it("実績は按分後の分", () => {
		const idx = new TaskIndex(
			data({
				worklogs: [
					log("w1", "i-1", "2026-10-31T10:00:00+09:00", "2026-10-31T11:00:00+09:00"),
					log("w2", "i-2", "2026-10-31T10:30:00+09:00", "2026-10-31T11:00:00+09:00", "worklog/phone/2026-10.jsonl"),
				],
			}),
		);
		expect(Object.fromEntries(idx.effortMinutes(0))).toEqual({ "i-1": 45, "i-2": 15 });
	});

	it("その日の routine", () => {
		const idx = new TaskIndex(
			data({
				routines: [
					routine("r-1", { repeat: { every: "week", on: ["mon"] }, start: "2026-11-01" }),
					routine("r-2", { repeat: { every: "day" }, start: "2026-11-01", active: false }),
					routine("r-3", { repeat: { every: "day" }, start: "2026-11-01", end: "2026-11-01" }),
					routine("r-4", { repeat: { every: "day" }, created: "2026-11-02T08:00:00+09:00" }),
				],
			}),
		);
		expect(idx.routinesOn("2026-11-02").map((r) => r.id)).toEqual(["r-1", "r-4"]);
		expect(idx.routinesOn("2026-11-01").map((r) => r.id)).toEqual(["r-3"]);
	});
});

describe("Inbox と Organize", () => {
	it("open で予定も期限もないものが Inbox", () => {
		expect(isInbox(issue("i-1"))).toBe(true);
		expect(isInbox(issue("i-1", { scheduled: ["2026-11-01"] }))).toBe(false);
		expect(isInbox(issue("i-1", { deadline: "2026-11-01" }))).toBe(false);
		expect(isInbox(issue("i-1", { status: "someday" }))).toBe(false);
	});

	it("Inbox の古い順 → revisit を過ぎた someday → reviewed が古い someday", () => {
		const queue = organizeQueue(
			[
				issue("i-1", { created: "2026-10-30T09:00:00+09:00" }),
				issue("i-2", { created: "2026-10-29T09:00:00+09:00" }),
				issue("i-3", { status: "someday", reviewed: "2026-10-01" }),
				issue("i-4", { status: "someday" }),
				issue("i-5", { status: "someday", revisit: "2026-10-31" }),
				issue("i-6", { status: "someday", revisit: "2026-11-30" }),
				issue("i-7", { status: "closed" }),
			],
			"2026-10-31",
		);
		expect(queue.map((i) => i.id)).toEqual(["i-2", "i-1", "i-5", "i-4", "i-6", "i-3"]);
	});
});

describe("lintVault", () => {
	const codes = (d: VaultData, paths?: Set<string>) => lintVault(d, { paths }).map((p) => `${p.path} ${p.code}`);

	it("問題がなければ空", () => {
		expect(codes(data({ issues: [issue("i-1"), issue("i-2", { parent: "i-1" })] }))).toEqual([]);
	});

	it("ID の重複", () => {
		expect(codes(data({ issues: [issue("i-1"), issue("i-1", {}, "issue/i-1 (conflict).md")] }))).toEqual([
			"issue/i-1 (conflict).md duplicate-id",
		]);
	});

	it("親子関係: ない親・自分自身・循環", () => {
		expect(
			codes(
				data({
					issues: [issue("i-1", { parent: "i-9" }), issue("i-2", { parent: "i-2" }), issue("i-3", { parent: "i-4" }), issue("i-4", { parent: "i-3" })],
				}),
			),
		).toEqual(["issue/i-1.md dangling-parent", "issue/i-2.md self-parent", "issue/i-3.md parent-cycle", "issue/i-4.md parent-cycle"]);
	});

	it("related の参照先", () => {
		const d = data({ issues: [issue("i-1", { related: ["i-2", "topics/foo.md", "topics/%E3%81%82.md", "topics/none.md"] })] });
		expect(codes(d, new Set(["topics/foo.md", "topics/あ.md"]))).toEqual(["issue/i-1.md dangling-related", "issue/i-1.md dangling-related"]);
	});

	it("delegated と member", () => {
		const d = data({
			members: [member("m-1")],
			issues: [
				issue("i-1", { status: "delegated" }),
				issue("i-2", { status: "delegated", delegated_to: "m-2" }),
				issue("i-3", { status: "open", delegated_to: "m-1" }),
				issue("i-4", { status: "delegated", delegated_to: "m-1" }),
			],
		});
		expect(codes(d)).toEqual(["issue/i-1.md missing-delegated-to", "issue/i-2.md dangling-member", "issue/i-3.md stale-delegated-to"]);
	});

	it("someday・revisit・label・status-detail", () => {
		const d = data({
			labels: [{ name: "仕事", color: "#d0d0d0" }],
			issues: [
				issue("i-1", { status: "someday", deadline: "2026-11-01", revisit: "2026-12-01" }),
				issue("i-2", { revisit: "2026-12-01", label: ["仕事", "私用"], "status-detail": "あ".repeat(21) }),
			],
		});
		expect(codes(d)).toEqual([
			"issue/i-1.md someday-with-dates",
			"issue/i-2.md long-status-detail",
			"issue/i-2.md stale-revisit",
			"issue/i-2.md unknown-label",
		]);
	});

	it("worklog: ID の重複・ないタスク・長さが 0 以下", () => {
		const d = data({
			issues: [issue("i-1")],
			routines: [routine("r-1", { repeat: { every: "day" } })],
			worklogs: [
				log("w1", "i-1", "2026-10-31T10:00:00Z", "2026-10-31T11:00:00Z"),
				log("w1", "r-1", "2026-10-31T12:00:00Z", null),
				log("w2", "i-9", "2026-10-31T12:00:00Z", "2026-10-31T11:00:00Z"),
			],
		});
		expect(codes(d)).toEqual([
			"worklog/pc/2026-10.jsonl duplicate-worklog-id",
			"worklog/pc/2026-10.jsonl dangling-task",
			"worklog/pc/2026-10.jsonl non-positive-worklog",
		]);
	});
});
