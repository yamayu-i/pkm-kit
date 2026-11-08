import { describe, expect, it } from "vitest";
import { parseTemplateConfig } from "../src/core/config";

describe("parseTemplateConfig（上流の既定の設定）", () => {
	it("正しい JSON を読み込める", () => {
		const raw = JSON.stringify(
			{
				templates: [
					{ file: "note.md", enabled: true, folder: "", fileNamePattern: "" },
					{ file: "daily.md", enabled: true, folder: "daily/{{date:YYYY}}/{{date:MM}}", fileNamePattern: "{{date:YYYY-MM-DD}}" },
				],
			},
			null,
			2,
		);
		const parsed = parseTemplateConfig(raw);
		expect(parsed.problems).toEqual([]);
		expect(parsed.templates).toEqual(JSON.parse(raw).templates);
	});

	it("壊れた JSON や不正な項目は problems に記録する", () => {
		expect(parseTemplateConfig("{bad").problems).toHaveLength(1);
		const res = parseTemplateConfig(JSON.stringify({ templates: [{ file: "" }, { file: "../evil.md" }] }));
		expect(res.templates).toEqual([]);
		expect(res.problems.length).toBeGreaterThanOrEqual(2);
	});
});
