import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { formatPromptDate, parseDatePromptInput } from "../src/core/date-prompt";
import { parseSnippet } from "../src/core/snippet";
import { DEFAULT_DATE_PROMPT_LABEL, extractDatePrompts, renderTemplate } from "../src/core/template";

/** 2026-11-08 は日曜 */
const TODAY = "2026-11-08";

describe("parseDatePromptInput（ADR-0065）", () => {
	it.each([
		["+2", { date: "2026-11-10", weekday: false }],
		["+2 -d", { date: "2026-11-10", weekday: true }],
		["-d +2", { date: "2026-11-10", weekday: true }],
		["mon -D", { date: "2026-11-09", weekday: true }],
		["1224", { date: "2026-12-24", weekday: false }],
		["2027-01-05 -d", { date: "2027-01-05", weekday: true }],
		["-2", { date: "2026-11-06", weekday: false }],
		["", { date: TODAY, weekday: false }],
		["   ", { date: TODAY, weekday: false }],
		["-d", { date: TODAY, weekday: true }],
	])("%s", (input, expected) => {
		expect(parseDatePromptInput(input, TODAY)).toEqual(expected);
	});

	it.each(["0231", "abc", "+2-d", "-d -d x", "+2 +3"])("読めない入力はエラー: %s", (input) => {
		expect(parseDatePromptInput(input, TODAY)).toBeNull();
	});
});

describe("formatPromptDate", () => {
	it("YYYY-MM-DD か YYYY-MM-DD DDD", () => {
		expect(formatPromptDate("2026-11-10", false)).toBe("2026-11-10");
		expect(formatPromptDate("2026-11-10", true)).toBe("2026-11-10 TUE");
		expect(formatPromptDate("2026-11-08", true)).toBe("2026-11-08 SUN");
	});
});

describe("{{prompt-date}}（ADR-0065）", () => {
	const now = new Date(2026, 10, 8, 9, 0, 0);
	const ctx = { now, title: "t", path: "t.md", folder: "", prompts: {} };

	it("ラベルを出てくる順に重複なく取り出す。ラベルの省略は「日付」", () => {
		const raw = "{{prompt-date:会議}} {{ prompt-date }} {{prompt-date:会議}} {{prompt-date:締切}} {{prompt:日付}}";
		expect(extractDatePrompts(raw)).toEqual(["会議", DEFAULT_DATE_PROMPT_LABEL, "締切"]);
		expect(DEFAULT_DATE_PROMPT_LABEL).toBe("日付");
	});

	it("同じラベルには同じ値を入れる", () => {
		const out = renderTemplate("# {{prompt-date}}\n{{prompt-date:締切}} / {{prompt-date}}", {
			...ctx,
			dates: { 日付: "2026-11-10 TUE", 締切: "2026-11-20" },
		});
		expect(out.content).toBe("# 2026-11-10 TUE\n2026-11-20 / 2026-11-10 TUE");
	});

	it("値がなければそのまま残す", () => {
		expect(renderTemplate("{{prompt-date}}", ctx).content).toBe("{{prompt-date}}");
	});

	it("frontmatter の引用符の中ではエスケープする", () => {
		const out = renderTemplate('---\ndue: "{{prompt-date}}"\n---\n', { ...ctx, dates: { 日付: '2026"x' } });
		expect(out.content).toBe('---\ndue: "2026\\"x"\n---\n');
	});
});

describe("上流の既定のスニペット d1〜d3", () => {
	it.each([
		["date-h1", "d1", "#"],
		["date-h2", "d2", "##"],
		["date-h3", "d3", "###"],
	])("%s", (name, alias, heading) => {
		const file = `${name}.md`;
		const text = readFileSync(new URL(`../../../../templates/snippet/${file}`, import.meta.url), "utf8");
		const { snippet, problem } = parseSnippet(file, text);
		expect(problem).toBeNull();
		expect(snippet?.name).toBe(name);
		expect(snippet?.alias).toBe(alias);
		expect(snippet?.body).toBe(`${heading} {{prompt-date}}\n\n\n`);
		expect(extractDatePrompts(snippet?.body ?? "")).toEqual([DEFAULT_DATE_PROMPT_LABEL]);
	});
});
