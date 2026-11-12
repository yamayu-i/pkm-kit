import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { DOMParser } from "linkedom";
import { describe, expect, it } from "vitest";
import { buildDeck } from "../src/core/build.ts";
import { PATTERNS } from "../src/core/patterns.ts";
// @ts-expect-error 型のない mjs（プレビューと共用）
import { assetsOf, PATTERN_DOCS, templateOf } from "../preview/gallery.mjs";

const skill = join(PATTERN_DOCS, "..");
const parse = (html: string) => new DOMParser().parseFromString(html, "text/html") as unknown as Document;
const css = readFileSync(fileURLToPath(new URL("../src/style/patterns.css", import.meta.url)), "utf8");

describe("パターン（ADR-0117 の 7）", () => {
	it("パターンの一覧と、スキルの patterns/*.md が 1 対 1 で揃っている", () => {
		const docs = readdirSync(PATTERN_DOCS).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3)).sort();
		expect(docs).toEqual(PATTERNS.map((p) => p.id).sort());
	});

	it("親のスキルの逆引きに、すべてのパターンが載っている", () => {
		const text = readFileSync(join(skill, "SKILL.md"), "utf8");
		const missing = PATTERNS.filter((p) => !text.includes(`(patterns/${p.id}.md)`)).map((p) => p.id);
		expect(missing).toEqual([]);
	});

	for (const p of PATTERNS) {
		it(`${p.id}: ひな形がエラーも警告もなくビルドでき、文書に決まった節がある`, () => {
			const template = templateOf(p.id) as string;
			expect(template).toContain(`data-pattern="${p.id}"`);
			const files = assetsOf(template) as string[];
			const r = buildDeck({ source: `<title>t</title>\n${template}`, deckPath: "slide/t", assets: { tokensCss: "", css: "", runtime: "" }, parse, sha256: (t, e) => createHash("sha256").update(t).digest(e), exists: (f) => files.includes(f) });
			expect(r.problems).toEqual([]);
			const doc = readFileSync(join(PATTERN_DOCS, `${p.id}.md`), "utf8");
			for (const heading of ["## 使う場面", "## 使わない場面", "## ひな形", "## 書くときの指示", "## よくある失敗", "## 根拠"]) expect(doc).toContain(heading);
			expect(doc.startsWith(`# ${p.id}: ${p.name}\n`)).toBe(true);
		});
	}

	it("CSS が指すパターンの id は、一覧にあるものだけ", () => {
		const ids = new Set(PATTERNS.map((p) => p.id));
		const used = [...css.matchAll(/data-pattern="([a-z0-9-]+)"/g)].map((m) => m[1] as string);
		expect(used.filter((id) => !ids.has(id))).toEqual([]);
	});

	it("スキルの文書がそろっている", () => {
		for (const f of ["SKILL.md", "conventions.md", "authoring.md", "review.md", "evidence.md", "maintaining.md"]) expect(existsSync(join(skill, f)), f).toBe(true);
	});
});
