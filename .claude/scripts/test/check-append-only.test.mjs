import assert from "node:assert/strict";
import { test } from "node:test";
import { checkCommits, removedLines } from "../check-append-only.mjs";
import { commit, tempRepo } from "./helpers.mjs";

const base = {
	"daily/2026/10/2026-10-30.md": "- メモ\n",
	"memo.md": "最後の行に改行がない",
	"sources/s.md": "原文\n",
	"wiki/a.md": "A\n",
};

function check(root, from) {
	return checkCommits(root, [`${from}..HEAD`]).map((p) => `${p.path}: ${p.message.split("。")[0]}`);
}

test("人のノートへの追記、wiki/ の自由な編集、元資料の追加は通る", () => {
	const root = tempRepo(base);
	const from = commit(root, "init2");
	commit(root, "wiki(daily): 10/30 を反映", {
		"daily/2026/10/2026-10-30.md": "- メモ\n\n→ [A](wiki/a.md)\n",
		"memo.md": "最後の行に改行がない\n追記\n",
		"wiki/a.md": "書き換え\n",
		"wiki/b.md": "新規\n",
		"sources/t.md": "新しい元資料\n",
	});
	assert.deepEqual(check(root, from), []);
});

test("人のノートの書き換え・削除・新規作成、元資料の変更、隠しパスの変更は違反になる", () => {
	const root = tempRepo({ ...base, ".obsidian/app.json": "{}" });
	const from = commit(root, "init2");
	commit(
		root,
		"wiki(lint): 整理",
		{
			"daily/2026/10/2026-10-30.md": "- メモ（直した）\n",
			"new-note.md": "LLM が作った\n",
			"sources/s.md": "原文を変えた\n",
			".obsidian/app.json": "{\"x\":1}",
		},
		["memo.md"],
	);
	assert.deepEqual(check(root, from).sort(), [
		".obsidian/app.json: wiki の操作で隠しパス（.claude、.obsidian など）を変えない",
		"daily/2026/10/2026-10-30.md: 人のノートは追記だけ",
		"memo.md: 人のノートを消さない",
		"new-note.md: 人のノートの場所に新しいファイルを作らない（LLM のページは wiki/ に作る）",
		"sources/s.md: sources/ は追加だけ（既存のファイルを変えない）",
	]);
});

test("wiki の操作でないコミット（snapshot、開発）は検査しない", () => {
	const root = tempRepo(base);
	const from = commit(root, "init2");
	commit(root, "vault: snapshot (iphone)", { "memo.md": "全部書き換え\n" });
	commit(root, "docs(harness): 手順を直す", { "daily/2026/10/2026-10-30.md": "" });
	assert.deepEqual(check(root, from), []);
});

test("wiki/ の外への改名は違反になる", () => {
	const root = tempRepo(base);
	const from = commit(root, "init2");
	commit(root, "wiki(lint): 改名", { "wiki/memo.md": "最後の行に改行がない" }, ["memo.md"]);
	assert.deepEqual(check(root, from), ["memo.md → wiki/memo.md: wiki/ の外のファイルを移動・改名しない"]);
});

test("removedLines は末尾に改行を足しただけの行を除く", () => {
	const onlyNewline = "@@ -1 +1,2 @@\n-a\n\\ No newline at end of file\n+a\n+b\n";
	assert.deepEqual(removedLines(onlyNewline), []);
	const changed = "@@ -1 +1 @@\n-a\n\\ No newline at end of file\n+b\n";
	assert.deepEqual(removedLines(changed), ["a"]);
	assert.deepEqual(removedLines("@@ -2,0 +3 @@\n+c\n"), []);
});
