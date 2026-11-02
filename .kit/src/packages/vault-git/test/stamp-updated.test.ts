import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { formatIso, isTargetPath, markUpdated, mergeUpdatedLine, setUpdated, shouldStamp, unmarkUpdated, updatedLine } from "../src/stamp/updated";

// 規則の表。PC の Git CLI(cli/stamp-updated.mjs)も同じ src/stamp/updated.ts を使う
const cases = JSON.parse(readFileSync(fileURLToPath(new URL("./fixtures/updated-cases.json", import.meta.url)), "utf8")) as {
	isTargetPath: [string, boolean][];
	setUpdated: { name: string; input: string; iso: string; output: string }[];
	setUpdatedThrows: { name: string; input: string }[];
	shouldStamp: { name: string; old: string | null; new: string; expected: boolean }[];
	mergeUpdated: { name: string; ours: string; theirs: string; expected: string }[];
	formatIso: { utc: string; offsetMinutes: number; expected: string }[];
};

describe("updated の付与の規則", () => {
	it("setUpdated は 2 回呼んでも同じ(冪等)", () => {
		for (const c of cases.setUpdated) {
			const once = setUpdated(c.input, c.iso);
			expect(setUpdated(once, c.iso), c.name).toBe(once);
		}
	});

	it("isTargetPath", () => {
		for (const [path, expected] of cases.isTargetPath) expect(isTargetPath(path), path).toBe(expected);
	});

	it("setUpdated", () => {
		for (const c of cases.setUpdated) expect(setUpdated(c.input, c.iso), c.name).toBe(c.output);
	});

	it("setUpdated: 曖昧な updated は例外", () => {
		for (const c of cases.setUpdatedThrows) expect(() => setUpdated(c.input, "2026-11-01T13:30:00+09:00"), c.name).toThrow();
	});

	it("shouldStamp", () => {
		for (const c of cases.shouldStamp) expect(shouldStamp(c.old, c.new), c.name).toBe(c.expected);
	});

	it("mergeUpdatedLine", () => {
		for (const c of cases.mergeUpdated) expect(mergeUpdatedLine(c.ours, c.theirs), c.name).toBe(c.expected);
	});

	it("formatIso", () => {
		for (const c of cases.formatIso) expect(formatIso(new Date(c.utc), c.offsetMinutes), c.utc).toBe(c.expected);
	});
});

describe("マージ用の目印", () => {
	const text = '---\ntype: note\nupdated: "2026-11-01T13:00:00+09:00"\n---\n本文\n';

	it("updated の行を位置を保って目印にし、採用する行に戻せる", () => {
		const marked = markUpdated(text);
		expect(marked).toBe("---\ntype: note\nupdated: __vault-git-merge__\n---\n本文\n");
		expect(unmarkUpdated(marked, updatedLine(text))).toBe(text);
	});

	it("updated の行がなければ変えない", () => {
		const t = "---\ntype: note\n---\nx\n";
		expect(markUpdated(t)).toBe(t);
		expect(unmarkUpdated(t, 'updated: "a"')).toBe(t);
	});
});
