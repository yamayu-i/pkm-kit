import { describe, expect, it } from "vitest";
import { legacyDataPath, loadDataOrLegacy } from "../src/legacy-data.ts";

function deps(own: unknown, files: Record<string, string>) {
	const saved: unknown[] = [];
	return {
		saved,
		d: {
			loadData: async () => own,
			saveData: async (data: unknown) => void saved.push(data),
			exists: async (path: string) => path in files,
			read: async (path: string) => files[path] ?? "",
		},
	};
}

const OLD = ".obsidian/plugins/vault-git/data.json";

describe("旧 ID の data.json の引き継ぎ（ADR-0058）", () => {
	it("旧 ID の data.json の場所", () => {
		expect(legacyDataPath(".obsidian", "vault-git")).toBe(OLD);
	});

	it("自分の data.json があれば、それを使い、旧 ID のものは読まない", async () => {
		const { d, saved } = deps({ deviceName: "new" }, { [OLD]: '{"deviceName":"old"}' });
		expect(await loadDataOrLegacy(d, OLD)).toEqual({ deviceName: "new" });
		expect(saved).toEqual([]);
	});

	it("自分の data.json がなく旧 ID のものがあれば、それを読んで自分の設定として保存する", async () => {
		const { d, saved } = deps(null, { [OLD]: '{"deviceName":"old","tokenSecretId":"git-token"}' });
		expect(await loadDataOrLegacy(d, OLD)).toEqual({ deviceName: "old", tokenSecretId: "git-token" });
		expect(saved).toEqual([{ deviceName: "old", tokenSecretId: "git-token" }]);
	});

	it("どちらもなければ null を返し、何も保存しない", async () => {
		const { d, saved } = deps(null, {});
		expect(await loadDataOrLegacy(d, OLD)).toBeNull();
		expect(saved).toEqual([]);
	});

	it("旧 ID の data.json が読めない・オブジェクトでなければ、使わない", async () => {
		for (const text of ["{壊れた", "[1,2]", "null"]) {
			const { d, saved } = deps(null, { [OLD]: text });
			expect(await loadDataOrLegacy(d, OLD)).toBeNull();
			expect(saved).toEqual([]);
		}
	});
});
