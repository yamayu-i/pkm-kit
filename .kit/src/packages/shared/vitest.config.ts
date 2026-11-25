import { defineConfig } from "vitest/config";

// 日時の解釈は端末のタイムゾーンで行うので、テストは日本時間に固定する
process.env.TZ = "Asia/Tokyo";

export default defineConfig({
	test: {
		include: ["test/**/*.test.ts"],
		testTimeout: 5_000,
	},
});
