import { describe, expect, it } from "vitest";
import { extractPrompts, offsetToPos, renderTemplate, resolveOutputPath } from "../src/core/template";

describe("offsetToPos", () => {
	it("文字オフセットを行・列（0 始まり）に変換する", () => {
		const text = "line0\nline1\nこんにちは";
		expect(offsetToPos(text, 0)).toEqual({ line: 0, ch: 0 });
		expect(offsetToPos(text, 5)).toEqual({ line: 0, ch: 5 });
		expect(offsetToPos(text, 6)).toEqual({ line: 1, ch: 0 });
		expect(offsetToPos(text, 14)).toEqual({ line: 2, ch: 2 });
		expect(offsetToPos(text, 999)).toEqual({ line: 2, ch: 5 });
	});
});

describe("extractPrompts", () => {
	it("テンプレート内の {{prompt:ラベル}} と {{prompt:ラベル:既定値}} を出現順に重複なく抽出する", () => {
		const raw = [
			"---",
			'title: "{{title}}"',
			'origin: "{{prompt:出典URL}}"',
			'author: "{{prompt:著者:不明}}"',
			"---",
			"",
			"出典: {{prompt:出典URL}}",
		].join("\n");

		expect(extractPrompts(raw)).toEqual([
			{ label: "出典URL", defaultValue: "" },
			{ label: "著者", defaultValue: "不明" },
		]);
	});
});

describe("renderTemplate", () => {
	const now = new Date(2026, 10, 1, 13, 20, 30);

	it("既存の template/file/*.md の {{date:...}} と {{title}} を展開する", () => {
		const raw = [
			"---",
			"type: source",
			'created: "{{date:YYYY-MM-DDTHH:mm:ssZ}}"',
			"updated:",
			'title: "{{title}}"',
			"origin:",
			'retrieved: "{{date:YYYY-MM-DD}}"',
			"---",
			"",
		].join("\n");

		const res = renderTemplate(raw, {
			now,
			title: "テスト記事",
			path: "sources/test-article.md",
			folder: "sources",
			prompts: {},
		});

		expect(res.content).toBe(
			[
				"---",
				"type: source",
				'created: "2026-11-01T13:20:30+09:00"',
				"updated:",
				'title: "テスト記事"',
				"origin:",
				'retrieved: "2026-11-01"',
				"---",
				"",
			].join("\n"),
		);
		expect(res.cursorOffset).toBeNull();
	});

	it("{{time}}, {{path}}, {{folder}}, {{prompt:...}} を展開し、{{cursor}} の位置を返して本文から取り除く", () => {
		const raw = [
			"---",
			"type: note",
			'created: "{{date}}T{{time:HH:mm:ss}}"',
			'path: "{{path}}"',
			'folder: "{{folder}}"',
			'category: "{{prompt:カテゴリ:general}}"',
			"---",
			"",
			"# {{title}}",
			"",
			"{{cursor}}本文",
			"追伸: {{cursor}}",
		].join("\n");

		const res = renderTemplate(raw, {
			now,
			title: "メモ",
			path: "notes/memo.md",
			folder: "notes",
			prompts: { カテゴリ: "dev" },
		});

		const expectedBeforeCursor = [
			"---",
			"type: note",
			'created: "2026-11-01T13:20:30"',
			'path: "notes/memo.md"',
			'folder: "notes"',
			'category: "dev"',
			"---",
			"",
			"# メモ",
			"",
			"",
		].join("\n");

		expect(res.content).toBe(`${expectedBeforeCursor}本文\n追伸: `);
		expect(res.cursorOffset).toBe(expectedBeforeCursor.length);
	});

	it("prompt の入力が空なら既定値を使い、未知の {{...}} はそのまま残す", () => {
		const raw = "担当: {{prompt:担当:未定}} / 未知: {{unknown}}";
		const res = renderTemplate(raw, {
			now,
			title: "t",
			path: "t.md",
			folder: "",
			prompts: {},
		});
		expect(res.content).toBe("担当: 未定 / 未知: {{unknown}}");
	});
});

describe("resolveOutputPath", () => {
	const now = new Date(2026, 10, 1, 13, 20, 30);

	it("folder と入力されたタイトルから生成先パスを作る", () => {
		expect(
			resolveOutputPath({
				folder: "wiki",
				fileNamePattern: "",
				titleInput: "llm-wiki",
				now,
				prompts: {},
			}),
		).toEqual({
			path: "wiki/llm-wiki.md",
			folder: "wiki",
			fileName: "llm-wiki.md",
			title: "llm-wiki",
			error: null,
		});
	});

	it("daily のように folder に日時変数、fileNamePattern に {{date:YYYY-MM-DD}} があるとき展開する", () => {
		expect(
			resolveOutputPath({
				folder: "daily/{{date:YYYY}}/{{date:MM}}",
				fileNamePattern: "{{date:YYYY-MM-DD}}",
				titleInput: "",
				now,
				prompts: {},
			}),
		).toEqual({
			path: "daily/2026/11/2026-11-01.md",
			folder: "daily/2026/11",
			fileName: "2026-11-01.md",
			title: "2026-11-01",
			error: null,
		});
	});

	it("titleInput にサブフォルダ（foo/bar）が含まれていれば folder と結合する", () => {
		expect(
			resolveOutputPath({
				folder: "",
				fileNamePattern: "",
				titleInput: "notes/idea.md",
				now,
				prompts: {},
			}),
		).toEqual({
			path: "notes/idea.md",
			folder: "notes",
			fileName: "idea.md",
			title: "idea",
			error: null,
		});
	});

	it("空のファイル名、..、隠しパス（.obsidian / .git）はエラーにする", () => {
		expect(
			resolveOutputPath({
				folder: "",
				fileNamePattern: "",
				titleInput: "   ",
				now,
				prompts: {},
			}).error,
		).toBe("ファイル名を入力してください");

		expect(
			resolveOutputPath({
				folder: "../outside",
				fileNamePattern: "",
				titleInput: "note",
				now,
				prompts: {},
			}).error,
		).toContain("..");

		expect(
			resolveOutputPath({
				folder: ".obsidian",
				fileNamePattern: "",
				titleInput: "note",
				now,
				prompts: {},
			}).error,
		).toContain("隠しフォルダ");
	});
});
