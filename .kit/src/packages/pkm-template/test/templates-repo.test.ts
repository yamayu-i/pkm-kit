import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseTemplateConfig } from "../src/core/config";
import { parseSnippet } from "../src/core/snippet";
import { renderTemplate } from "../src/core/template";

// 上流の既定のテンプレート（.kit/templates/）を実際に読んで、規約（vault-conventions.md）とプラグインの記法に合っているか確かめる
const root = join(dirname(fileURLToPath(import.meta.url)), "../../../../templates");
const files = readdirSync(join(root, "file")).filter((f) => f.endsWith(".md"));
const now = new Date(2026, 10, 1, 13, 20, 30);

function render(file: string): string {
	return renderTemplate(readFileSync(join(root, "file", file), "utf8"), {
		now,
		title: "題名",
		path: "x.md",
		folder: "",
		prompts: {},
		takenNames: ["i-4", "r-2", "m-9"],
	}).content;
}

function frontmatter(text: string): Record<string, string> {
	const m = /^---\n([\s\S]*?)\n---/.exec(text);
	expect(m).not.toBeNull();
	const out: Record<string, string> = {};
	for (const line of m![1]!.split("\n")) {
		const kv = /^([A-Za-z-]+):\s*(.*)$/.exec(line);
		if (kv) out[kv[1]!] = kv[2]!.replace(/^"(.*)"$/, "$1");
	}
	return out;
}

describe(".kit/templates/file/*.md", () => {
	it("テンプレートが 1 つ以上ある", () => {
		expect(files.length).toBeGreaterThan(0);
	});

	for (const file of files) {
		it(`${file}: 作成時に created と updated が同じ値で入り、type がファイル名と一致する`, () => {
			const fm = frontmatter(render(file));
			expect(fm.created).toMatch(/^2026-11-01T13:20:30(Z|[+-]\d{2}:\d{2})$/);
			expect(fm.updated).toBe(fm.created);
			expect(fm.type).toBe(file.replace(/\.md$/, ""));
		});

		it(`${file}: 展開後に未解決の {{...}} が残らない`, () => {
			expect(render(file)).not.toMatch(/\{\{/);
		});
	}

	it("note は入力した文字を title に入れる（改名してもタイトルが残る。ハーネスの ADR-0015）", () => {
		expect(frontmatter(render("note.md")).title).toBe("題名");
	});

	it("issue / routine / member は pkm-task が必要とする項目を持つ", () => {
		const issue = frontmatter(render("issue.md"));
		expect(issue).toMatchObject({ schema: "1", id: "i-5", summary: "題名", status: "open" });
		const routine = frontmatter(render("routine.md"));
		expect(routine).toMatchObject({ schema: "1", id: "r-3", summary: "題名", active: "true" });
		expect(routine.repeat).toContain('"every"');
		const member = frontmatter(render("member.md"));
		expect(member).toMatchObject({ schema: "1", id: "m-10", name: "題名" });
		// name と nickname は登録名、alias は ID（ADR-0035）
		expect(member).toMatchObject({ nickname: "題名", alias: "m-10" });
	});
});

describe(".kit/templates/config.json", () => {
	const { templates, problems } = parseTemplateConfig(readFileSync(join(root, "config.json"), "utf8"));

	it("書式に問題がなく、.kit/templates/file/ のすべてのテンプレートが載っている", () => {
		expect(problems).toEqual([]);
		expect(templates.map((t) => t.file).sort()).toEqual([...files].sort());
	});

	it("issue / routine / member は ID をファイル名にする", () => {
		const byFile = Object.fromEntries(templates.map((t) => [t.file, t]));
		expect(byFile["issue.md"]).toMatchObject({ folder: "issue", fileNamePattern: "{{id:i}}" });
		expect(byFile["routine.md"]).toMatchObject({ folder: "routine", fileNamePattern: "{{id:r}}" });
		expect(byFile["member.md"]).toMatchObject({ folder: "member", fileNamePattern: "{{id:m}}" });
	});
});

describe(".kit/templates/snippet/*.md", () => {
	const snippetFiles = readdirSync(join(root, "snippet")).filter((f) => f.endsWith(".md"));

	for (const file of snippetFiles) {
		it(`${file}: スニペットとして読める（ADR-0060）`, () => {
			expect(parseSnippet(file, readFileSync(join(root, "snippet", file), "utf8")).problem).toBeNull();
		});
	}

	it("new-drawio は /drawio で pkm-drawio の図の作成を実行する（ADR-0094）", () => {
		const { snippet } = parseSnippet("new-drawio.md", readFileSync(join(root, "snippet", "new-drawio.md"), "utf8"));
		expect(snippet).toMatchObject({ name: "new-drawio", alias: "drawio", command: "pkm-drawio:create-diagram" });
	});
});
