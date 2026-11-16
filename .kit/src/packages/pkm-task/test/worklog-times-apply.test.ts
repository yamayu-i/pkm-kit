import { describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import { TaskIndex } from "../src/core/index";
import { collectVault } from "../src/core/load";
import { serializeWorklogEntry } from "../src/core/worklog";
import type { TaskContext } from "../src/obsidian/context";

/** ADR-0193: ダイアログの決めたことを worklog に書く */

vi.mock("obsidian", () => {
	class Base {
		constructor(..._args: unknown[]) {}
		open() {}
	}
	return { Modal: Base, SuggestModal: Base, FuzzySuggestModal: Base, Notice: Base, setIcon: () => {}, prepareFuzzySearch: () => () => null, normalizePath: (p: string) => p, parseYaml: parse };
});

const { applyWorklogTimes } = await import("../src/obsidian/worklog-times");

const at = (s: string) => new Date(`${s}:00+09:00`).getTime();
const log = (id: string, taskId: string, from: string, to: string | null, sub?: string) =>
	serializeWorklogEntry({ id, taskId, sub: sub ?? null, from: `${from}:00+09:00`, to: to === null ? null : `${to}:00+09:00`, description: "memo" });

function setup(lines: string[]) {
	const fm = { type: "issue", id: "i-1", summary: "s", status: "in-progress" };
	const markdown = [{ path: "issue/i-1.md", frontmatter: fm, text: `---\n${JSON.stringify(fm)}\n---\n` }];
	const index = new TaskIndex(
		collectVault({ markdown, worklogs: [{ path: "worklog/pc/2026-11.jsonl", text: lines.join("\n") }], labels: null, parseYaml: parse, boardLogs: [] }).data,
	);
	const writer = { startTimer: vi.fn(async () => {}), addWorklog: vi.fn(async () => {}), updateWorklog: vi.fn(async () => {}), stopTimer: vi.fn(async () => {}) };
	const ctx = { store: { index }, settings: { deviceName: "pc" }, writer, report: vi.fn() } as unknown as TaskContext;
	return { ctx, writer };
}

describe("applyWorklogTimes", () => {
	it("記録中の再生: いちばん新しい記録中の行の from だけを直す（説明は残す）", async () => {
		const { ctx, writer } = setup([log("wl_a", "i-1", "2026-11-16T20:00", null), log("wl_b", "i-1", "2026-11-16T21:00", null), log("wl_c", "i-1", "2026-11-16T10:00", "2026-11-16T11:00")]);
		await applyWorklogTimes(ctx, "i-1", { kind: "continue", fromMs: at("2026-11-16T20:30") });
		expect(writer.updateWorklog).toHaveBeenCalledTimes(1);
		const [entry, next] = writer.updateWorklog.mock.calls[0] as unknown as [{ id: string }, unknown];
		expect(entry.id).toBe("wl_b");
		expect(next).toEqual({ from: "2026-11-16T20:30:00+09:00", to: null, description: "memo" });
		expect(writer.stopTimer).not.toHaveBeenCalled();
	});

	it("記録中の停止: from と to を書き、同じ鍵のほかの記録中の行も止める", async () => {
		const { ctx, writer } = setup([log("wl_a", "i-1", "2026-11-16T20:00", null), log("wl_b", "i-1", "2026-11-16T21:00", null)]);
		await applyWorklogTimes(ctx, "i-1", { kind: "stop", fromMs: at("2026-11-16T20:30"), toMs: at("2026-11-16T22:00") });
		expect((writer.updateWorklog.mock.calls[0] as unknown as [unknown, unknown])[1]).toEqual({ from: "2026-11-16T20:30:00+09:00", to: "2026-11-16T22:00:00+09:00", description: "memo" });
		expect((writer.stopTimer.mock.calls[0] as unknown as [{ id: string }[]])[0].map((e) => e.id)).toEqual(["wl_a"]);
	});

	it("サブの記録中の行は、サブの鍵で探す", async () => {
		const { ctx, writer } = setup([log("wl_a", "i-1", "2026-11-16T20:00", null, "aaaaaa"), log("wl_b", "i-1", "2026-11-16T21:00", null)]);
		await applyWorklogTimes(ctx, "i-1#aaaaaa", { kind: "continue", fromMs: at("2026-11-16T19:00") });
		expect((writer.updateWorklog.mock.calls[0] as unknown as [{ id: string }])[0].id).toBe("wl_a");
	});

	it("記録なしの再生: その時刻から始める", async () => {
		const { ctx, writer } = setup([]);
		await applyWorklogTimes(ctx, "i-1", { kind: "start", fromMs: at("2026-11-16T20:30") });
		expect(writer.startTimer).toHaveBeenCalledWith(["i-1"], "pc", at("2026-11-16T20:30"));
	});

	it("記録なしの停止: 終わった記録を 1 件足す（開始日の月のファイル）", async () => {
		const { ctx, writer } = setup([]);
		await applyWorklogTimes(ctx, "i-1#aaaaaa", { kind: "add", fromMs: at("2026-10-31T23:30"), toMs: at("2026-11-01T00:30") });
		expect(writer.addWorklog).toHaveBeenCalledWith("i-1#aaaaaa", "pc", { from: "2026-10-31T23:30:00+09:00", to: "2026-11-01T00:30:00+09:00", description: "" }, new Date(at("2026-10-31T23:30")));
	});

	it("記録中のはずの行がなければ、書かずに例外にする", async () => {
		const { ctx, writer } = setup([]);
		await expect(applyWorklogTimes(ctx, "i-1", { kind: "continue", fromMs: at("2026-11-16T20:30") })).rejects.toThrow("記録中の worklog が見つかりません");
		expect(writer.updateWorklog).not.toHaveBeenCalled();
	});
});
