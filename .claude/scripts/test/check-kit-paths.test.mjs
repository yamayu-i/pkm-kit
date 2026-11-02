import assert from "node:assert/strict";
import { test } from "node:test";
import { checkUpstreamFiles, globToRegExp, isUpstreamPath } from "../check-kit-paths.mjs";

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
