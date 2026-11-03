import { describe, expect, it } from "vitest";
import { renderTemplate } from "../src/core/template";

// frontmatter の引用符の中に展開する値は、YAML として正しくエスケープする（yamayu-i/pkm-kit#10）
const ctx = (title: string, prompts: Record<string, string> = {}) => ({
	now: new Date(2026, 10, 1, 13, 20, 30),
	title,
	path: "x.md",
	folder: "",
	prompts,
	takenNames: [],
});

/** frontmatter の key: "..." の値を、YAML の二重引用符のスカラーとして読む（JSON の文字列のエスケープは、YAML の二重引用符でも同じ意味になる） */
function dq(content: string, key: string): string {
	const m = new RegExp(`^${key}: (".*")$`, "m").exec(content);
	expect(m, key).not.toBeNull();
	return JSON.parse(m![1]!);
}

describe("frontmatter の引用符の中のエスケープ", () => {
	const template = '---\ntype: issue\nsummary: "{{title}}"\ntopic: "{{prompt:トピック}}"\nnote: \'{{title}}\'\n---\n\n# {{title}}\n';

	it('" と \\ と改行を含むタイトルでも、二重引用符の値として元の文字列に戻る', () => {
		for (const title of ['"週次" の見直し', "C:\\work\\a", "1 行目\n2 行目", "タブ\tあり", "ふつうのタイトル"]) {
			const { content } = renderTemplate(template, ctx(title));
			expect(dq(content, "summary"), title).toBe(title);
		}
	});

	it("{{prompt:…}} も同じ扱いにする", () => {
		const { content } = renderTemplate(template, ctx("t", { トピック: '"引用"\\' }));
		expect(dq(content, "topic")).toBe('"引用"\\');
	});

	it("一重引用符の中では ' を '' にする", () => {
		const { content } = renderTemplate(template, ctx("it's"));
		expect(content).toContain("note: 'it''s'");
	});

	it("本文（frontmatter の外）はエスケープしない", () => {
		const { content } = renderTemplate(template, ctx('"週次" の見直し'));
		expect(content.endsWith('# "週次" の見直し\n')).toBe(true);
	});

	it("frontmatter のない テンプレートと、引用符の外は今までどおり", () => {
		expect(renderTemplate('summary: "{{title}}"\n', ctx('"a"')).content).toBe('summary: ""a""\n');
		expect(renderTemplate("---\nid: {{title}}\n---\n", ctx('"a"')).content).toBe('---\nid: "a"\n---\n');
	});

	it("日時などの展開と {{cursor}} の位置は変わらない", () => {
		const { content, cursorOffset } = renderTemplate('---\ncreated: "{{date:YYYY-MM-DD}}"\n---\n{{cursor}}本文', ctx("t"));
		expect(content).toBe('---\ncreated: "2026-11-01"\n---\n本文');
		expect(cursorOffset).toBe('---\ncreated: "2026-11-01"\n---\n'.length);
	});
});
