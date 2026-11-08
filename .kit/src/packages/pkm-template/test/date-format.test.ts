import { describe, expect, it } from "vitest";
import { formatDateTime } from "../src/core/date-format";

describe("formatDateTime", () => {
	// 2026-11-01 09:05:07 JST (+09:00, Sunday)
	const sample = new Date(2026, 10, 1, 9, 5, 7);

	it("template/file/*.md で使っている ISO 8601（YYYY-MM-DDTHH:mm:ssZ）を展開する", () => {
		expect(formatDateTime(sample, "YYYY-MM-DDTHH:mm:ssZ")).toBe("2026-11-01T09:05:07+09:00");
	});

	it("daily ノートの階層パス（YYYY/MM/YYYY-MM-DD）と日付（YYYY-MM-DD）を展開する", () => {
		expect(formatDateTime(sample, "YYYY/MM/YYYY-MM-DD")).toBe("2026/11/2026-11-01");
		expect(formatDateTime(sample, "YYYY-MM-DD")).toBe("2026-11-01");
	});

	it("YY, M, D, ddd, H, m, s の各トークンを展開する", () => {
		expect(formatDateTime(sample, "YY-M-D (ddd) H:m:s")).toBe("26-11-1 (sun) 9:5:7");
	});

	it("[...] で囲まれた文字はトークンとして展開せずそのまま出す", () => {
		expect(formatDateTime(sample, "YYYY-MM-DD [at] HH:mm [YYYY]")).toBe("2026-11-01 at 09:05 YYYY");
	});
});
