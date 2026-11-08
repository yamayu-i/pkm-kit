import { describe, expect, it } from "vitest";
import { formatDateTime } from "../src/core/format";

describe("日時の表示", () => {
	it("今年は年を省き、ほかの年は年を付ける（端末のタイムゾーン）", () => {
		const now = new Date("2026-11-08T12:00:00+09:00");
		expect(formatDateTime(Date.parse("2026-11-08T01:05:00Z"), now)).toBe("11/08 10:05");
		expect(formatDateTime(Date.parse("2025-01-02T00:00:00+09:00"), now)).toBe("2025/01/02 00:00");
	});
});
