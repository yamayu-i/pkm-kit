import assert from "node:assert/strict";
import { test } from "node:test";
import { extractLinks, findWikiLinks, parseFrontmatter, splitTarget, stripCode } from "../lib/markdown.mjs";

test("コードの中のリンクは無視する", () => {
	const text = "[a](a.md)\n`[b](b.md)`\n```\n[c](c.md)\n[[d]]\n```\n![e](asset/e.png)";
	assert.deepEqual(
		extractLinks(text).map((l) => [l.embed, l.target, l.line]),
		[
			[false, "a.md", 1],
			[true, "asset/e.png", 7],
		],
	);
	assert.deepEqual(findWikiLinks(text), []);
	assert.equal(stripCode(text).split("\n").length, 7);
});

test("wiki リンクの行を返す", () => {
	assert.deepEqual(findWikiLinks("x\n[[foo]]\n![[bar.png]]"), [2, 3]);
});

test("frontmatter のスカラー、インラインのリスト、ブロックのリストを読む", () => {
	const { data, bodyLine } = parseFrontmatter('---\ntitle: "タイトル"\ntags: [a, b]\nsources:\n  - x.md\n  - https://e.com\n---\n本文');
	assert.deepEqual(data, { title: "タイトル", tags: ["a", "b"], sources: ["x.md", "https://e.com"] });
	assert.equal(bodyLine, 8);
	assert.equal(parseFrontmatter("本文").data, null);
	assert.ok(parseFrontmatter("---\ntitle: x\n").error);
});

test("リンク先のアンカーと %エンコードを分ける", () => {
	assert.deepEqual(splitTarget("wiki/a%20b.md#見出し"), { path: "wiki/a b.md", anchor: "見出し" });
});
