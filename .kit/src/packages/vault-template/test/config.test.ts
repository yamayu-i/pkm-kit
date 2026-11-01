import { describe, expect, it } from "vitest";
import {
	mergeTemplateEntries,
	moveTemplateEntry,
	parseTemplateConfig,
	serializeTemplateConfig,
} from "../src/core/config";

describe("parseTemplateConfig / serializeTemplateConfig", () => {
	it("正しい JSON を読み込み、整形して書き出せる", () => {
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
		expect(parsed.templates).toHaveLength(2);
		expect(serializeTemplateConfig(parsed.templates)).toBe(`${raw}\n`);
	});

	it("壊れた JSON や不正な項目は problems に記録する", () => {
		expect(parseTemplateConfig("{bad").problems).toHaveLength(1);
		const res = parseTemplateConfig(JSON.stringify({ templates: [{ file: "" }, { file: "../evil.md" }] }));
		expect(res.templates).toEqual([]);
		expect(res.problems.length).toBeGreaterThanOrEqual(2);
	});
});

describe("mergeTemplateEntries / moveTemplateEntry", () => {
	it("設定の順序を保ちつつ、template/file/ に新しく増えた .md を末尾に補完する", () => {
		const configured = [
			{ file: "daily.md", enabled: true, folder: "daily/{{date:YYYY}}/{{date:MM}}", fileNamePattern: "{{date:YYYY-MM-DD}}" },
			{ file: "issue.md", enabled: false, folder: "issue", fileNamePattern: "" },
		];
		const actualFiles = ["note.md", "daily.md", "issue.md", "concept.md"];

		const merged = mergeTemplateEntries(configured, actualFiles);
		expect(merged.map((t) => t.file)).toEqual(["daily.md", "issue.md", "concept.md", "note.md"]);
		expect(merged[0]?.folder).toBe("daily/{{date:YYYY}}/{{date:MM}}");
		expect(merged[1]?.enabled).toBe(false);
		expect(merged[2]).toEqual({ file: "concept.md", enabled: true, folder: "", fileNamePattern: "" });
	});

	it("moveTemplateEntry で表示順を前後に移動できる", () => {
		const items = [
			{ file: "a.md", enabled: true, folder: "", fileNamePattern: "" },
			{ file: "b.md", enabled: true, folder: "", fileNamePattern: "" },
			{ file: "c.md", enabled: true, folder: "", fileNamePattern: "" },
		];
		expect(moveTemplateEntry(items, "b.md", -1).map((x) => x.file)).toEqual(["b.md", "a.md", "c.md"]);
		expect(moveTemplateEntry(items, "b.md", 1).map((x) => x.file)).toEqual(["a.md", "c.md", "b.md"]);
		expect(moveTemplateEntry(items, "a.md", -1).map((x) => x.file)).toEqual(["a.md", "b.md", "c.md"]);
	});
});
