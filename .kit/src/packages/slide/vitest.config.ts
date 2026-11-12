import { defineConfig } from "vitest/config";

process.env.TZ = "Asia/Tokyo";

export default defineConfig({
	test: {
		include: ["test/**/*.test.ts"],
		testTimeout: 20_000,
	},
});
