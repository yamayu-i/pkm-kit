import assert from "node:assert/strict";
import { test } from "node:test";
import { lintVault } from "../wiki-lint.mjs";
import { page, tempVault } from "./helpers.mjs";

const messages = (list) => list.map((p) => `${p.path} ${p.message}`);

test("規約どおりの Vault はエラーも警告もない", () => {
	const root = tempVault({
		"wiki/index.md": "# 目次\n\n- [A](wiki/a.md)\n",
		"wiki/log.md": "# ログ\n",
		"wiki/a.md": page({ sources: ["sources/s.md", "daily/2026/10/2026-10-30.md", "https://example.com"] }) + "![図](asset/x.png)\n[見出し](wiki/a.md#本文)\n",
		"sources/s.md": "---\ntitle: S\norigin: https://example.com\nretrieved: 2026-10-30\n---\n",
		"daily/2026/10/2026-10-30.md": "- [A](wiki/a.md)\n",
		"asset/x.png": "png",
		".claude/ignored.md": "[[hidden]]",
	});
	assert.deepEqual(lintVault(root), { errors: [], warnings: [] });
});

test("人のノートの問題は警告、wiki の問題はエラーになる", () => {
	const root = tempVault({
		"wiki/index.md": "",
		"wiki/b.md": "[[x]]\n",
		"note.md": "[[x]]\n[a](/wiki/b.md)\n[c](wiki/c)\n\t- タブ\n",
		"wiki/c.md": page(),
	});
	const { errors, warnings } = lintVault(root);
	assert.deepEqual(messages(warnings), [
		"note.md wiki リンク（[[...]]）を使わない。Markdown リンクにする",
		"note.md インデントにタブを使わない（スペース 2 つ）",
		"note.md リンク先の先頭に / を付けない: /wiki/b.md",
		"note.md リンク切れ: wiki/c（拡張子 .md まで書く）（リンク先は Vault ルートからのパス）",
	]);
	assert.ok(messages(errors).includes("wiki/b.md frontmatter がない（.claude/docs/llm-wiki.md のページの書式）"));
	assert.ok(messages(errors).includes("wiki/b.md wiki/index.md に載っていない"));
	assert.ok(messages(errors).includes("wiki/c.md wiki/index.md に載っていない"));
});

test("wiki のページの frontmatter を検査する", () => {
	const root = tempVault({
		"wiki/index.md": "[d](wiki/d.md)",
		"wiki/d.md": page({ type: "memo", updated: "10/31", sources: ["sources/none.md"] }),
	});
	assert.deepEqual(messages(lintVault(root).errors), [
		"wiki/d.md type は concept / entity / topic / answer のどれか: memo",
		"wiki/d.md updated は YYYY-MM-DD: 10/31",
		"wiki/d.md sources の参照先がない: sources/none.md",
	]);
});

test("元資料・添付・デイリーノートの置き場所を検査する", () => {
	const root = tempVault({
		"sources/s.md": "---\ntitle: S\n---\n",
		"sources/sub/t.md": "---\ntitle: T\norigin: x\nretrieved: 2026-10-01\n---\n",
		"asset/sub/x.png": "",
		"daily/2026/11/2026-10-30.md": "",
		"memo.md": "![x](img/x.png)\n",
		"img/x.png": "",
	});
	const { errors, warnings } = lintVault(root);
	assert.deepEqual(messages(errors), [
		"asset/sub/x.png asset/ にサブフォルダを作らない（asset/ 直下に置く）",
		"sources/s.md frontmatter に origin がない",
		"sources/s.md frontmatter に retrieved がない",
		"sources/sub/t.md sources/ にサブフォルダを作らない",
	]);
	assert.deepEqual(messages(warnings), [
		"daily/2026/11/2026-10-30.md デイリーノートは daily/YYYY/MM/YYYY-MM-DD.md に置く",
		"memo.md 添付は asset/ 直下に置く: img/x.png",
	]);
});
