import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { migrate, stampStaged } from "../stamp-updated.mjs";
import { commit, git, tempRepo, write } from "./helpers.mjs";

const NOW = new Date("2026-11-01T04:30:00.000Z");
const ISO = "2026-11-01T13:30:00+09:00";
const opts = { now: NOW, offsetMinutes: -540 };

const note = (extra = "", updated = "updated:") => `---\ntype: note\ncreated: "2026-10-01T09:00:00+09:00"\n${updated}\n---\n${extra}`;
const read = (root, p) => readFileSync(join(root, p), "utf8");
const staged = (root, p) => git(root, "show", `:${p}`);

test("新しく追加して stage したノートに updated が入る(index と作業ツリー)", () => {
	const root = tempRepo({ "x.txt": "x" });
	write(root, { "memo.md": note("本文\n") });
	git(root, "add", "memo.md");
	assert.deepEqual(stampStaged(root, opts), ["memo.md"]);
	assert.match(staged(root, "memo.md"), new RegExp(`updated: "${ISO.replace("+", "\\+")}"`));
	assert.equal(read(root, "memo.md"), staged(root, "memo.md"));
});

test("同じコミットのノートには同じ時刻が入る。created と本文は変わらない", () => {
	const root = tempRepo({ "x.txt": "x" });
	write(root, { "a.md": note("A\n"), "wiki/b.md": note("B\n") });
	git(root, "add", "-A");
	stampStaged(root, opts);
	for (const p of ["a.md", "wiki/b.md"]) {
		const text = staged(root, p);
		assert.ok(text.includes(`updated: "${ISO}"`), p);
		assert.ok(text.includes('created: "2026-10-01T09:00:00+09:00"'), p);
	}
	assert.ok(staged(root, "a.md").endsWith("---\nA\n"));
});

test("対象外(README、隠しパス、template、md 以外)と削除、未変更には付与しない", () => {
	const root = tempRepo({ "keep.md": note("k\n", 'updated: "old"'), "gone.md": note("g\n") });
	write(root, {
		"README.md": note("r\n"),
		".claude/docs/a.md": note("h\n"),
		"template/file/n.md": note("t\n"),
		"data.json": "{}",
	});
	git(root, "rm", "-q", "gone.md");
	git(root, "add", "-A");
	assert.deepEqual(stampStaged(root, opts), []);
	assert.equal(staged(root, "README.md"), note("r\n"));
	assert.equal(staged(root, "keep.md"), note("k\n", 'updated: "old"'));
});

test("updated の行だけが違う変更には付与しない(循環させない)", () => {
	const root = tempRepo({ "a.md": note("A\n", 'updated: "old"') });
	write(root, { "a.md": note("A\n", 'updated: "other-device"') });
	git(root, "add", "a.md");
	assert.deepEqual(stampStaged(root, opts), []);
	assert.equal(staged(root, "a.md"), note("A\n", 'updated: "other-device"'));
});

test("本文を変えれば既存の updated を置き換える", () => {
	const root = tempRepo({ "a.md": note("A\n", 'updated: "old"') });
	write(root, { "a.md": note("A2\n", 'updated: "old"') });
	git(root, "add", "a.md");
	assert.deepEqual(stampStaged(root, opts), ["a.md"]);
	assert.ok(staged(root, "a.md").includes(`updated: "${ISO}"`));
});

test("部分 stage: 未 stage の変更を index に巻き込まず、作業ツリーも壊さない", () => {
	const root = tempRepo({ "a.md": note("1\n2\n", 'updated: "old"') });
	write(root, { "a.md": note("1 変更\n2\n", 'updated: "old"') });
	git(root, "add", "a.md");
	const unstagedEdit = note("1 変更\n2 未stage\n", 'updated: "old"');
	write(root, { "a.md": unstagedEdit });
	assert.deepEqual(stampStaged(root, opts), ["a.md"]);
	assert.ok(staged(root, "a.md").includes("1 変更\n2\n"));
	assert.ok(!staged(root, "a.md").includes("未stage"));
	assert.ok(staged(root, "a.md").includes(`updated: "${ISO}"`));
	assert.equal(read(root, "a.md"), unstagedEdit);
});

test("コミット済みの元資料(sources/)の変更・削除は拒否する。新しい元資料は付与する", () => {
	const root = tempRepo({ "sources/a.md": note("原文\n", 'updated: "old"') });
	write(root, { "sources/a.md": note("改ざん\n", 'updated: "old"') });
	git(root, "add", "-A");
	assert.throws(() => stampStaged(root, opts), /sources\/a\.md/);
	git(root, "reset", "-q", "--hard");
	git(root, "rm", "-q", "sources/a.md");
	assert.throws(() => stampStaged(root, opts), /sources\/a\.md/);
	git(root, "reset", "-q", "--hard");
	write(root, { "sources/b.md": note("新しい\n") });
	git(root, "add", "-A");
	assert.deepEqual(stampStaged(root, opts), ["sources/b.md"]);
});

test("曖昧な updated(重複)はコミットを止める", () => {
	const root = tempRepo({ "x.txt": "x" });
	write(root, { "a.md": "---\ntype: note\nupdated: a\nupdated: b\n---\nx\n" });
	git(root, "add", "a.md");
	assert.throws(() => stampStaged(root, opts), /a\.md/);
});

test("取り消し(REVERT_HEAD)の途中では付与しない", () => {
	const root = tempRepo({ "a.md": note("1\n") });
	write(root, { "a.md": note("2\n") });
	git(root, "add", "a.md");
	writeFileSync(join(root, ".git", "REVERT_HEAD"), `${git(root, "rev-parse", "HEAD").trim()}\n`);
	assert.deepEqual(stampStaged(root, opts), []);
});

test("マージの途中(MERGE_HEAD)では付与しない", () => {
	const root = tempRepo({ "a.md": note("1\n") });
	write(root, { "a.md": note("2\n") });
	git(root, "add", "a.md");
	writeFileSync(join(root, ".git", "MERGE_HEAD"), `${git(root, "rev-parse", "HEAD").trim()}\n`);
	assert.deepEqual(stampStaged(root, opts), []);
});

test("migrate: 空または欠けた updated に、最後に変えたコミットの日時を入れる", () => {
	const root = tempRepo({ "a.md": note("A\n"), "b.md": note("B\n", 'updated: "keep"'), "README.md": note("r\n"), "plain.md": "# 見出し\n" });
	const done = migrate(root, opts);
	assert.deepEqual(done, ["a.md"]);
	assert.match(read(root, "a.md"), /updated: "\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-Z]/);
	assert.ok(read(root, "b.md").includes('updated: "keep"'));
	assert.equal(read(root, "README.md"), note("r\n"));
	assert.equal(read(root, "plain.md"), "# 見出し\n");
});

test("pre-commit hook: git commit で updated が付く", () => {
	const root = tempRepo({ "x.txt": "x" });
	const here = fileURLToPath(new URL("../../..", import.meta.url));
	mkdirSync(join(root, ".githooks"), { recursive: true });
	mkdirSync(join(root, ".claude/scripts/lib"), { recursive: true });
	cpSync(join(here, ".githooks/pre-commit"), join(root, ".githooks/pre-commit"));
	cpSync(join(here, ".claude/scripts/stamp-updated.mjs"), join(root, ".claude/scripts/stamp-updated.mjs"));
	cpSync(join(here, ".claude/scripts/lib/updated.mjs"), join(root, ".claude/scripts/lib/updated.mjs"));
	git(root, "config", "core.hooksPath", ".githooks");
	write(root, { "memo.md": note("本文\n") });
	git(root, "add", "memo.md");
	git(root, "commit", "-q", "-m", "docs: メモ");
	const committed = git(root, "show", "HEAD:memo.md");
	assert.match(committed, /updated: "\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-Z]/);
	assert.equal(read(root, "memo.md"), committed);
	assert.ok(existsSync(join(root, ".githooks/pre-commit")));
});
