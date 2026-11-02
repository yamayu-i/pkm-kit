import { describe, expect, it } from "vitest";
import {
	diffTemplateEntries,
	layerTemplateEntries,
	parseTemplateOverrides,
	serializeTemplateOverrides,
	type TemplateEntry,
} from "../src/core/config";

// 上流（.kit/templates/）の既定と、子（template/）の上書きを重ねる（ハーネスの ADR-0009）
const upstream: TemplateEntry[] = [
	{ file: "note.md", enabled: true, folder: "note", fileNamePattern: "{{title}}" },
	{ file: "daily.md", enabled: false, folder: "daily/{{date:YYYY}}/{{date:MM}}", fileNamePattern: "{{date:YYYY-MM-DD}}" },
	{ file: "issue.md", enabled: false, folder: "issue", fileNamePattern: "{{id:i}}" },
];

describe("parseTemplateOverrides", () => {
	it("書かれた項目だけを持つ。書かれていない項目は上流の値を使うために空けておく", () => {
		const { overrides, problems } = parseTemplateOverrides(JSON.stringify({ templates: [{ file: "note.md", folder: "memo" }, { file: "mine.md" }] }));
		expect(problems).toEqual([]);
		expect(overrides).toEqual([{ file: "note.md", folder: "memo" }, { file: "mine.md" }]);
	});

	it("今までの完全な形の設定も、そのまま上書きとして読める", () => {
		const { overrides } = parseTemplateOverrides(JSON.stringify({ templates: [{ file: "note.md", enabled: false, folder: "", fileNamePattern: "" }] }));
		expect(overrides).toEqual([{ file: "note.md", enabled: false, folder: "", fileNamePattern: "" }]);
	});

	it("型の違う項目、不正なファイル名、重複は problems にする", () => {
		const { overrides, problems } = parseTemplateOverrides(
			JSON.stringify({ templates: [{ file: "note.md", enabled: "yes" }, { file: "../x.md" }, { file: "note.md" }] }),
		);
		expect(overrides).toEqual([{ file: "note.md" }]);
		expect(problems).toHaveLength(3);
	});
});

describe("layerTemplateEntries", () => {
	it("上書きがなければ、上流の設定の順と値になる。上流の設定にないファイルは末尾に既定値で足す", () => {
		const entries = layerTemplateEntries({ upstream, overrides: [], files: ["daily.md", "issue.md", "note.md", "extra.md"] });
		expect(entries.map((e) => e.file)).toEqual(["note.md", "daily.md", "issue.md", "extra.md"]);
		expect(entries[1]).toEqual(upstream[1]);
		expect(entries[3]).toEqual({ file: "extra.md", enabled: true, folder: "", fileNamePattern: "" });
	});

	it("上書きは項目ごとに重なり、上書きに並べた順が先に来る", () => {
		const entries = layerTemplateEntries({
			upstream,
			overrides: [{ file: "issue.md", enabled: true }, { file: "mine.md", folder: "x" }],
			files: ["note.md", "daily.md", "issue.md", "mine.md"],
		});
		expect(entries.map((e) => e.file)).toEqual(["issue.md", "mine.md", "note.md", "daily.md"]);
		expect(entries[0]).toEqual({ file: "issue.md", enabled: true, folder: "issue", fileNamePattern: "{{id:i}}" });
		expect(entries[1]).toEqual({ file: "mine.md", enabled: true, folder: "x", fileNamePattern: "" });
	});

	it("ファイルがないテンプレートの設定は出さない", () => {
		const entries = layerTemplateEntries({ upstream, overrides: [{ file: "gone.md" }], files: ["note.md"] });
		expect(entries.map((e) => e.file)).toEqual(["note.md"]);
	});
});

describe("diffTemplateEntries / serializeTemplateOverrides", () => {
	it("上流と違う項目だけを書く。並び順を保つため、ファイル名はすべて書く", () => {
		const entries = layerTemplateEntries({ upstream, overrides: [], files: ["note.md", "daily.md", "issue.md"] });
		const edited = entries.map((e) => (e.file === "daily.md" ? { ...e, enabled: true } : e));
		const diff = diffTemplateEntries(edited, upstream);
		expect(diff).toEqual([{ file: "note.md" }, { file: "daily.md", enabled: true }, { file: "issue.md" }]);
	});

	it("書いた差分を読み直して重ねると、編集した結果に戻る", () => {
		const files = ["note.md", "daily.md", "issue.md", "mine.md"];
		const entries = layerTemplateEntries({ upstream, overrides: [], files });
		const edited = [entries[2]!, { ...entries[3]!, folder: "mine" }, entries[0]!, { ...entries[1]!, fileNamePattern: "{{date:YYYYMMDD}}" }];
		const text = serializeTemplateOverrides(diffTemplateEntries(edited, upstream));
		const { overrides, problems } = parseTemplateOverrides(text);
		expect(problems).toEqual([]);
		expect(layerTemplateEntries({ upstream, overrides, files })).toEqual(edited);
	});
});
