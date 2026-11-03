import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// 検査の一覧は verify.mjs にだけ書く。CI が個別の検査を呼ぶと、片方に足したものがもう片方に入らない（yamayu-i/pkm-kit#17）
const workflow = readFileSync(new URL("../../../.github/workflows/vault.yml", import.meta.url), "utf8");

test("vault.yml は verify.mjs を呼ぶ", () => {
	assert.match(workflow, /node \.claude\/scripts\/verify\.mjs/);
});

test("vault.yml は個別の検査のスクリプトを直接呼ばない", () => {
	const direct = [...workflow.matchAll(/node\s+(?:--test\s+)?(\S+\.mjs)/g)].map((m) => m[1]).filter((p) => !p.endsWith("verify.mjs"));
	assert.deepEqual(direct, []);
});
