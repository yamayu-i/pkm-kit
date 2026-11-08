import { describe, expect, it } from "vitest";
import * as config from "../src/core/config";
import { resolveTemplateEntries, type TemplateEntry } from "../src/core/config";

// 設定は上流（.kit/templates/config.json）だけが正本。子は上書きしない（ADR-0039）
const upstream: TemplateEntry[] = [
	{ file: "note.md", enabled: true, folder: "note", fileNamePattern: "{{title}}" },
	{ file: "daily.md", enabled: false, folder: "daily/{{date:YYYY}}/{{date:MM}}", fileNamePattern: "{{date:YYYY-MM-DD}}" },
	{ file: "issue.md", enabled: false, folder: "issue", fileNamePattern: "{{id:i}}" },
];

describe("resolveTemplateEntries", () => {
	it("上流の設定の順と値になる。上流の設定にないファイルは末尾にファイル名の順で既定値で足す", () => {
		const entries = resolveTemplateEntries({ upstream, files: ["daily.md", "issue.md", "note.md", "zz.md", "extra.md"] });
		expect(entries.map((e) => e.file)).toEqual(["note.md", "daily.md", "issue.md", "extra.md", "zz.md"]);
		expect(entries.slice(0, 3)).toEqual(upstream);
		expect(entries[3]).toEqual({ file: "extra.md", enabled: true, folder: "", fileNamePattern: "" });
	});

	it("ファイルがないテンプレートの設定は出さない", () => {
		const entries = resolveTemplateEntries({ upstream, files: ["note.md"] });
		expect(entries.map((e) => e.file)).toEqual(["note.md"]);
	});
});

describe("子の上書きの仕組みがない（ADR-0039）", () => {
	it("子の template/config.json を読み書きする API を持たない", () => {
		for (const name of ["TEMPLATE_CONFIG_PATH", "parseTemplateOverrides", "serializeTemplateOverrides", "diffTemplateEntries", "layerTemplateEntries", "moveTemplateEntry"]) {
			expect(config).not.toHaveProperty(name);
		}
	});
});
