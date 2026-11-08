import { describe, expect, it } from "vitest";
import { appendViewedLine, isViewedLogPath, latestViewed, serializeViewed, viewedLogPath } from "../src/core/viewed-log";

describe("Viewed の記録（ADR-0070 の 4）", () => {
	it("端末別・月別の jsonl に置く。端末名の使えない文字は置き換える", () => {
		expect(viewedLogPath("my/pc", new Date(2026, 10, 8, 23, 0))).toBe("updates/my-pc/2026-11.jsonl");
		expect(() => viewedLogPath("  ", new Date())).toThrow();
		expect(isViewedLogPath("updates/pc/2026-11.jsonl")).toBe(true);
		expect(isViewedLogPath("updates/2026-11.jsonl")).toBe(false);
		expect(isViewedLogPath("worklog/pc/2026-11.jsonl")).toBe(false);
	});

	it("1 行は viewed_at だけ", () => {
		expect(serializeViewed("2026-11-08T10:00:00+09:00")).toBe('{"viewed_at":"2026-11-08T10:00:00+09:00"}');
	});

	it("追記は末尾の改行を補ってから足す", () => {
		expect(appendViewedLine("", "a")).toBe("a\n");
		expect(appendViewedLine("x", "a")).toBe("x\na\n");
		expect(appendViewedLine("x\n", "a")).toBe("x\na\n");
	});

	it("基準は全端末のログの最大。読めない行は飛ばす。ログがなければ null", () => {
		const pc = ['{"viewed_at":"2026-11-08T10:00:00+09:00"}', "壊れた行", '{"other":1}', ""].join("\n");
		const phone = '{"viewed_at":"2026-11-08T02:30:00Z"}\n';
		expect(latestViewed([pc, phone])).toBe(Date.parse("2026-11-08T02:30:00Z"));
		expect(latestViewed([pc])).toBe(Date.parse("2026-11-08T01:00:00Z"));
		expect(latestViewed([])).toBeNull();
		expect(latestViewed(["壊れた行"])).toBeNull();
	});
});
