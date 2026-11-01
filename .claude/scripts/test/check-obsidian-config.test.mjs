import assert from "node:assert/strict";
import { test } from "node:test";
import { checkObsidianConfig } from "../check-obsidian-config.mjs";
import { tempVault } from "./helpers.mjs";

test("末尾改行のない JSON は通る", () => {
	const dir = tempVault({ "app.json": "{}", "plugins/x/data.json": "{}\n" });
	assert.deepEqual(checkObsidianConfig(dir), []);
});

test("末尾改行のある JSON を見つける。JSON 以外は対象にしない", () => {
	const dir = tempVault({ "app.json": "{}\n", "core-plugins.json": "{}", "snippets/a.css": "a {}\n" });
	assert.deepEqual(checkObsidianConfig(dir), ["app.json: 末尾の改行を取り除く（Obsidian は改行なしで保存するので、差分が出る）"]);
});
