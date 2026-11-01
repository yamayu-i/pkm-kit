import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { formatIso, isTargetPath, mergeUpdatedLine, setUpdated, shouldStamp } from "../lib/updated.mjs";

const cases = JSON.parse(readFileSync(new URL("./fixtures/updated-cases.json", import.meta.url), "utf8"));

test("isTargetPath: 対象は frontmatter を持ちうる PKM の md だけ", () => {
	for (const [path, expected] of cases.isTargetPath) assert.equal(isTargetPath(path), expected, path);
});

test("setUpdated: updated の 1 行だけを書き換える", () => {
	for (const c of cases.setUpdated) assert.equal(setUpdated(c.input, c.iso), c.output, c.name);
});

test("setUpdated: 曖昧な updated(重複・リスト・複数の値)は書き換えず、エラーにする", () => {
	for (const c of cases.setUpdatedThrows) assert.throws(() => setUpdated(c.input, "2026-11-01T13:30:00+09:00"), undefined, c.name);
});

test("shouldStamp: updated の行だけの差では付与しない", () => {
	for (const c of cases.shouldStamp) assert.equal(shouldStamp(c.old, c.new), c.expected, c.name);
});

test("mergeUpdatedLine: 両側で変えた updated は新しい方を採る", () => {
	for (const c of cases.mergeUpdated) assert.equal(mergeUpdatedLine(c.ours, c.theirs), c.expected, c.name);
});

test("formatIso: ローカルのオフセット付き、UTC は Z", () => {
	for (const c of cases.formatIso) assert.equal(formatIso(new Date(c.utc), c.offsetMinutes), c.expected, `${c.utc} ${c.offsetMinutes}`);
});

test("setUpdated は 2 回呼んでも同じ(冪等)", () => {
	for (const c of cases.setUpdated) {
		const once = setUpdated(c.input, c.iso);
		assert.equal(setUpdated(once, c.iso), once, c.name);
	}
});
