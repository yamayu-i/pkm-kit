import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { applyRenames, insertTitle, isRenameCandidate, listCandidates, planRenames, rewriteLinks } from "../note-rename.mjs";
import { tempVault } from "./helpers.mjs";

const read = (root, p) => readFileSync(join(root, p), "utf8");

test("対象は、決まった名前のフォルダの外にある、ケバブケースでない md", () => {
	assert.equal(isRenameCandidate("会議メモ.md"), true);
	assert.equal(isRenameCandidate("note/会議メモ.md"), true);
	assert.equal(isRenameCandidate("note/My Note.md"), true);
	assert.equal(isRenameCandidate("note/my_note.md"), true);
	assert.equal(isRenameCandidate("wiki/日本語.md"), true);
	assert.equal(isRenameCandidate("note/meeting-notes.md"), false);
	assert.equal(isRenameCandidate("note/2026-q4-plan.md"), false);
	for (const p of [
		"daily/2026/11/2026-11-08.md",
		"issue/i-1.md",
		"routine/r-1.md",
		"member/m-1.md",
		"asset/図.md",
		"tmp/一時.md",
		"template/file/メモ.md",
		"sources/2026-11-08-元資料.md",
		".claude/メモ.md",
		"note/README.md",
		"README.md",
		"note/画像.png",
	])
		assert.equal(isRenameCandidate(p), false, p);
});

test("対象を一覧にする", () => {
	const root = tempVault({
		"会議メモ.md": "x\n",
		"note/english-name.md": "x\n",
		"note/日本語.md": "x\n",
		"daily/2026/11/2026-11-08.md": "x\n",
		"issue/i-1.md": "x\n",
	});
	assert.deepEqual(listCandidates(root), ["note/日本語.md", "会議メモ.md"]);
});

test("リンク先のパスだけを書き換え、アンカー・表示文字列・コードは変えない", () => {
	const map = new Map([["note/会議 メモ.md", "note/meeting-notes.md"]]);
	const text = [
		"[会議 メモ](note/会議%20メモ.md) と [見出し](note/会議%20メモ.md#議題)",
		"![埋め込み](<note/会議 メモ.md>)",
		"`[コード](note/会議%20メモ.md)` [外部](https://example.com/note/会議%20メモ.md)",
		"```",
		"[フェンス](note/会議%20メモ.md)",
		"```",
		"[ほか](note/other.md)",
	].join("\n");
	assert.equal(
		rewriteLinks(text, map),
		[
			"[会議 メモ](note/meeting-notes.md) と [見出し](note/meeting-notes.md#議題)",
			"![埋め込み](<note/meeting-notes.md>)",
			"`[コード](note/会議%20メモ.md)` [外部](https://example.com/note/会議%20メモ.md)",
			"```",
			"[フェンス](note/会議%20メモ.md)",
			"```",
			"[ほか](note/other.md)",
		].join("\n"),
	);
});

test("title がなければ、もとのファイル名を title に入れる。あれば変えない", () => {
	assert.equal(
		insertTitle("---\ntype: note\ncreated: x\n---\n本文\n", "会議メモ"),
		'---\ntitle: "会議メモ"\ntype: note\ncreated: x\n---\n本文\n',
	);
	assert.equal(insertTitle("---\ntitle: 別の名前\n---\n本文\n", "会議メモ"), "---\ntitle: 別の名前\n---\n本文\n");
	assert.equal(insertTitle("本文だけ\n", '引用"符'), '---\ntitle: "引用\\"符"\n---\n本文だけ\n');
});

test("改名し、title を足し、daily を含むすべてのノートのリンクを書き換える", () => {
	const root = tempVault({
		"note/会議メモ.md": "---\ntype: note\n---\n[自分](note/会議メモ.md)\n",
		"note/ほか.md": "---\ntype: note\n---\n[会議](note/会議メモ.md#議題)\n",
		"daily/2026/11/2026-11-08.md": "- 今日の [会議メモ](note/会議メモ.md)\n",
		"wiki/a.md": "[x](note/ほか.md)\n",
	});
	const mapping = { "note/会議メモ.md": "note/meeting-notes.md", "note/ほか.md": "note/other.md" };
	const plan = planRenames(root, mapping);
	assert.deepEqual(plan.problems, []);
	applyRenames(root, plan);
	assert.equal(existsSync(join(root, "note/会議メモ.md")), false);
	assert.equal(read(root, "note/meeting-notes.md"), '---\ntitle: "会議メモ"\ntype: note\n---\n[自分](note/meeting-notes.md)\n');
	assert.equal(read(root, "note/other.md"), '---\ntitle: "ほか"\ntype: note\n---\n[会議](note/meeting-notes.md#議題)\n');
	assert.equal(read(root, "daily/2026/11/2026-11-08.md"), "- 今日の [会議メモ](note/meeting-notes.md)\n");
	assert.equal(read(root, "wiki/a.md"), "[x](note/other.md)\n");
});

test("--dry-run にあたる計画だけでは、何も変えない", () => {
	const files = { "note/会議メモ.md": "x\n", "a.md": "[m](note/会議メモ.md)\n" };
	const root = tempVault(files);
	const plan = planRenames(root, { "note/会議メモ.md": "note/meeting-notes.md" });
	assert.deepEqual(plan.problems, []);
	assert.deepEqual(
		plan.edits.map((e) => e.path),
		["a.md", "note/会議メモ.md"],
	);
	assert.equal(read(root, "a.md"), files["a.md"]);
	assert.equal(existsSync(join(root, "note/会議メモ.md")), true);
});

test("改名できない対応表は、問題を挙げて何も変えない", () => {
	const root = tempVault({
		"note/会議メモ.md": "x\n",
		"note/メモ2.md": "x\n",
		"note/taken.md": "x\n",
		"daily/2026/11/2026-11-08.md": "x\n",
		"note/元資料から.md": "x\n",
		"sources/2026-11-08-s.md": "[n](note/元資料から.md)\n",
	});
	const plan = planRenames(root, {
		"note/ない.md": "note/missing.md",
		"note/会議メモ.md": "note/taken.md",
		"note/メモ2.md": "other/memo-2.md",
		"daily/2026/11/2026-11-08.md": "daily/2026/11/today.md",
		"note/元資料から.md": "note/Bad_Name.md",
		"../外.md": "../out.md",
	});
	assert.deepEqual(plan.problems.sort(), [
		"../外.md: Vault の外のパスは扱わない",
		"daily/2026/11/2026-11-08.md: 改名の対象ではない（決まった名前のフォルダか、すでにケバブケース）",
		"note/ない.md: もとのファイルがない",
		"note/メモ2.md: フォルダは変えられない（名前だけを変える）: other/memo-2.md",
		"note/会議メモ.md: 改名先がすでにある: note/taken.md",
		"note/元資料から.md: 改名先がケバブケース（英小文字・数字・ハイフン）でない: note/Bad_Name.md",
	]);

	const viaSource = planRenames(root, { "note/元資料から.md": "note/from-source.md" });
	assert.deepEqual(viaSource.problems, [
		"sources/2026-11-08-s.md: 元資料は変えられないので、ここから指されたノートは改名できない: note/元資料から.md",
	]);

	const dup = planRenames(root, { "note/会議メモ.md": "note/same.md", "note/メモ2.md": "note/same.md" });
	assert.deepEqual(dup.problems, ["note/メモ2.md: 改名先が重なっている: note/same.md"]);
});
