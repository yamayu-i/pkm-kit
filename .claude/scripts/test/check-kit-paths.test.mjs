import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { checkUpstreamFiles, globToRegExp, isUpstreamPath, readOwnedPaths } from "../check-kit-paths.mjs";

test("glob: * は 1 階層、** は任意の階層", () => {
	assert.ok(globToRegExp(".obsidian/plugins/*/main.js").test(".obsidian/plugins/vault-git/main.js"));
	assert.ok(!globToRegExp(".obsidian/plugins/*/main.js").test(".obsidian/plugins/a/b/main.js"));
	assert.ok(globToRegExp(".kit/**").test(".kit/src/packages/x/y.ts"));
	assert.ok(globToRegExp(".claude/**/SKILL.md").test(".claude/SKILL.md"));
	assert.ok(globToRegExp(".claude/**/SKILL.md").test(".claude/skills/a/SKILL.md"));
	assert.ok(!globToRegExp("README.md").test("READMEXmd"));
});

test("上流: 上流のパスに当たらないファイル（個人のノートなど）を見つける", () => {
	const patterns = [".kit/**", ".obsidian/plugins/*/main.js", "README.md"];
	assert.ok(isUpstreamPath(".kit/bin/lint.mjs", patterns));
	assert.deepEqual(
		checkUpstreamFiles([".kit/bin/lint.mjs", "README.md", "daily/2026/11/2026-11-02.md", ".obsidian/plugins/vault-git/data.json"], patterns).map((e) => e.split(":")[0]),
		["daily/2026/11/2026-11-02.md", ".obsidian/plugins/vault-git/data.json"],
	);
});

test("! で始まるパターンは除外。後に書いたものが勝つ", () => {
	const patterns = [".claude/skills/**", "!.claude/skills/local-*/**"];
	assert.ok(isUpstreamPath(".claude/skills/wiki-ingest/SKILL.md", patterns));
	assert.ok(!isUpstreamPath(".claude/skills/local-mine/SKILL.md", patterns));
});

test("上流が持つのは上流のプラグインの成果物だけ。子が足した自分のプラグインは子のもの（yamayu-i/pkm-kit#19）", () => {
	const patterns = readOwnedPaths(fileURLToPath(new URL("../../..", import.meta.url)));
	for (const id of ["vault-git", "vault-task", "vault-template", "vault-ribbon"]) {
		assert.ok(isUpstreamPath(`.obsidian/plugins/${id}/main.js`, patterns), id);
		assert.ok(isUpstreamPath(`.obsidian/plugins/${id}/manifest.json`, patterns), id);
	}
	for (const p of [".obsidian/plugins/my-plugin/main.js", ".obsidian/plugins/my-plugin/manifest.json", ".obsidian/plugins/my-plugin/styles.css", ".obsidian/plugins/vault-git/data.json"]) {
		assert.ok(!isUpstreamPath(p, patterns), p);
	}
});
