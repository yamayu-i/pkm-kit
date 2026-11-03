import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { apply, checkObsidianRequired, missing } from "../../../.kit/lib/obsidian-required.mjs";
import { escalationConfig } from "../../../.kit/setup.mjs";
import { commit, git, tempRepo, write } from "./helpers.mjs";

const here = fileURLToPath(new URL("../../..", import.meta.url));
// 上流から子の Vault に届くもののうち、セットアップと検査に要るもの
const KIT_FILES = [
	".kit/kit.json",
	".kit/owned-paths.json",
	".kit/obsidian-required.json",
	".kit/setup.mjs",
	".kit/migrate.mjs",
	".kit/migrations",
	".kit/lib/obsidian-required.mjs",
	".claude/scripts/check-kit-paths.mjs",
	".claude/scripts/check-obsidian-config.mjs",
];

/** 上流を clone した直後の子の Vault を模した一時リポジトリ */
function childVault(extra = {}) {
	const root = tempRepo();
	for (const f of KIT_FILES) {
		mkdirSync(dirname(join(root, f)), { recursive: true });
		cpSync(join(here, f), join(root, f), { recursive: true });
	}
	commit(root, "上流", extra);
	return root;
}

const node = (root, ...args) => spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const json = (root, p) => JSON.parse(readFileSync(join(root, p), "utf8"));

test("必要なキー: 配列は要素を含めばよく、オブジェクトはキーごとに合わせて、ほかのキーは残す", () => {
	assert.deepEqual(missing(["a", "x"], ["a", "b"]), [{ item: "b" }]);
	assert.deepEqual(apply(["x"], ["a", "x"]), ["x", "a"]);
	assert.deepEqual(missing({ a: 1, b: 2 }, { a: 1, c: 3 }), [{ key: "c", from: undefined, to: 3 }]);
	assert.deepEqual(apply({ a: 0, keep: true }, { a: 1 }), { a: 1, keep: true });
});

test("エスカレーションの方法: issue はリポジトリが要る。知らない方法は失敗する", () => {
	assert.deepEqual(escalationConfig("issue", "yamayu-i/pkm-kit"), { method: "issue", repo: "yamayu-i/pkm-kit", label: "escalation" });
	assert.deepEqual(escalationConfig("file"), { method: "file" });
	assert.throws(() => escalationConfig("issue", "not a repo"));
	assert.throws(() => escalationConfig("mail"));
});

test("セットアップ: 新しい Vault に設定・記録・初期値を置き、2 回目は何も変えない", () => {
	const root = childVault();
	write(root, { ".obsidian/app.json": JSON.stringify({ useMarkdownLinks: false, vimMode: true }) });

	const first = node(root, ".kit/setup.mjs", "--escalation=issue", "--escalation-repo=yamayu-i/pkm-kit");
	assert.equal(first.status, 0, first.stderr);
	assert.deepEqual(json(root, ".kit-local/config.json"), { escalation: { method: "issue", repo: "yamayu-i/pkm-kit", label: "escalation" } });
	const record = json(root, ".kit-local/upstream.json");
	assert.equal(record.commit, git(root, "rev-parse", "HEAD").trim());
	// 移行は実行して適用済みにする（新しい Vault では何も変えない）
	assert.deepEqual(record.migrations, ["0001-template-overrides"]);
	assert.match(first.stdout, /移行 0001-template-overrides: 適用済みにする/);

	// 必要なキーだけを合わせ、ユーザーの設定（vimMode）は残す。Obsidian と同じく末尾に改行を付けない
	const app = json(root, ".obsidian/app.json");
	assert.equal(app.useMarkdownLinks, true);
	assert.equal(app.showInlineTitle, false);
	assert.equal(app.vimMode, true);
	assert.ok(!readFileSync(join(root, ".obsidian/app.json"), "utf8").endsWith("\n"));
	assert.deepEqual(json(root, ".obsidian/community-plugins.json"), ["vault-git", "vault-task", "vault-template"]);
	assert.ok(existsSync(join(root, "issue/labels.json")));
	assert.ok(existsSync(join(root, ".claude/local/CLAUDE.md")));
	assert.equal(git(root, "config", "--get", "core.hooksPath").trim(), ".githooks");

	const second = node(root, ".kit/setup.mjs");
	assert.equal(second.status, 0, second.stderr);
	assert.match(second.stdout, /変えるものはない/);

	// セットアップの直後は、子の検査が通る
	const paths = node(root, ".claude/scripts/check-kit-paths.mjs");
	assert.equal(paths.status, 0, paths.stderr);
	const obsidian = node(root, ".claude/scripts/check-obsidian-config.mjs");
	assert.equal(obsidian.status, 0, obsidian.stderr);
});

test("セットアップ: 既存の初期値やユーザーのファイルは上書きしない。--dry-run は何も書かない", () => {
	const root = childVault({ "issue/labels.json": "[]\n" });
	const dry = node(root, ".kit/setup.mjs", "--escalation=none", "--dry-run");
	assert.equal(dry.status, 0, dry.stderr);
	assert.match(dry.stdout, /（予定）/);
	assert.ok(!existsSync(join(root, ".kit-local")));
	assert.ok(!existsSync(join(root, ".obsidian")));

	assert.equal(node(root, ".kit/setup.mjs", "--escalation=none").status, 0);
	assert.equal(readFileSync(join(root, "issue/labels.json"), "utf8"), "[]\n");
	assert.deepEqual(json(root, ".kit-local/config.json"), { escalation: { method: "none" } });
});

test("セットアップ: 端末でなく、エスカレーションの方法も決まっていなければ失敗する", () => {
	const root = childVault();
	const r = node(root, ".kit/setup.mjs");
	assert.equal(r.status, 1);
	assert.match(r.stderr, /--escalation/);
});

test("子の検査: 上流のものを変える・足すと失敗し、子のものは自由に変えられる", () => {
	const root = childVault();
	assert.equal(node(root, ".kit/setup.mjs", "--escalation=file").status, 0);
	commit(root, "子の変更", { "daily/2026/11/2026-11-02.md": "メモ\n", "template/file/note.md": "---\ntype: note\n---\n" });
	assert.equal(node(root, ".claude/scripts/check-kit-paths.mjs").status, 0);

	write(root, { ".kit/kit.json": "{}\n", ".claude/scripts/new-check.mjs": "// 追跡前\n" });
	const r = node(root, ".claude/scripts/check-kit-paths.mjs");
	assert.equal(r.status, 1);
	assert.match(r.stderr, /\.kit\/kit\.json: 上流のもの/);
	assert.match(r.stderr, /\.claude\/scripts\/new-check\.mjs: 上流のもの/);
});

test("子の検査: Obsidian の必要なキーが外れていたら失敗する", () => {
	const root = childVault();
	assert.equal(node(root, ".kit/setup.mjs", "--escalation=file").status, 0);
	write(root, { ".obsidian/app.json": JSON.stringify({ useMarkdownLinks: false }) });
	const r = node(root, ".claude/scripts/check-obsidian-config.mjs");
	assert.equal(r.status, 1);
	assert.match(r.stderr, /app\.json: useMarkdownLinks/);
	assert.deepEqual(checkObsidianRequired(join(root, ".obsidian"), { "app.json": { useMarkdownLinks: true } }).length, 1);
});
