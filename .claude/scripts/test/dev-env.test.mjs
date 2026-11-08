import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { dependencyProblems, readMiseVersions, versionWarning } from "../lib/dev-env.mjs";
import { tempVault } from "./helpers.mjs";

test("mise.toml から node と pnpm の版を読む", () => {
	assert.deepEqual(readMiseVersions('[tools]\nnode = "26.13.0"\npnpm = "12.16.1"\n'), { node: "26.13.0", pnpm: "12.16.1" });
	assert.deepEqual(readMiseVersions("[tools]\n"), { node: null, pnpm: null });
	const repo = readMiseVersions(readFileSync(new URL("../../../mise.toml", import.meta.url), "utf8"));
	assert.ok(repo.node && repo.pnpm);
});

test("版が mise.toml と同じなら警告しない。違う・ないなら警告する（#49）", () => {
	assert.equal(versionWarning("Node", "26.13.0", "v26.13.0"), null);
	assert.equal(versionWarning("pnpm", "12.16.1", "12.16.1\n"), null);
	assert.match(versionWarning("Node", "26.13.0", "v22.23.4"), /Node の版が 22\.23\.4（mise\.toml は 26\.13\.0）/);
	assert.match(versionWarning("pnpm", "12.16.1", null), /pnpm が見つからない/);
	assert.equal(versionWarning("pnpm", null, "10.0.0"), null);
});

test("依存がワークスペース全体で入っていなければ、足りないパッケージを挙げる（#7）", () => {
	const pkg = (deps) => JSON.stringify({ name: "x", devDependencies: deps });
	const files = {
		"packages/a/package.json": pkg({ typescript: "6.0.0" }),
		"packages/b/package.json": pkg({ typescript: "6.0.0" }),
		"packages/c/package.json": pkg({}),
		"packages/a/node_modules/.keep": "",
	};
	assert.match(dependencyProblems(tempVault(files))[0], /依存が入っていない/);
	const partial = tempVault({ ...files, "node_modules/.modules.yaml": "{}" });
	assert.deepEqual(dependencyProblems(partial), [
		".kit/src の依存が一部のパッケージにしか入っていない（ない: b）。cd .kit/src && pnpm install --frozen-lockfile を実行する",
	]);
	const full = tempVault({ ...files, "node_modules/.modules.yaml": "{}", "packages/b/node_modules/.keep": "" });
	assert.deepEqual(dependencyProblems(full), []);
});
