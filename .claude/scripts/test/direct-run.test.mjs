import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, readdirSync, readFileSync, symlinkSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { tempVault } from "./helpers.mjs";

// CLI の「直接実行されたか」の判定は、process.argv[1] を realpath してから import.meta.url と比べる。
// import.meta.url は実体のパスになるので、シンボリックリンクを通ったパス（macOS の os.tmpdir() など）で
// 実行すると一致せず、CLI の本体が何もせずに終わる（yamayu-i/pkm-kit#136）
const here = fileURLToPath(new URL("../../..", import.meta.url));

test("シンボリックリンクを通ったパスで実行しても、移行の CLI の本体が走る", () => {
	const real = tempVault();
	cpSync(join(here, ".kit/migrate.mjs"), join(real, ".kit/migrate.mjs"));
	const link = join(tempVault(), "link");
	symlinkSync(real, link, "dir");
	const r = spawnSync(process.execPath, [join(link, ".kit/migrate.mjs"), "--status", link], { encoding: "utf8" });
	assert.equal(r.status, 0, r.stderr);
	assert.match(r.stdout, /上流なので対象外/);
});

/** 手で書く CLI（ビルドの成果物と node_modules を除く） */
function sources(dir, out = []) {
	for (const e of readdirSync(dir, { withFileTypes: true })) {
		if (["node_modules", ".git", "dist"].includes(e.name)) continue;
		const p = join(dir, e.name);
		if (e.isDirectory()) sources(p, out);
		else if (/\.(mjs|ts)$/.test(e.name) && !p.includes(join(".kit", "bin")) && p !== fileURLToPath(import.meta.url)) out.push(p);
	}
	return out;
}

test("直接実行の判定は process.argv[1] を realpath してから比べる", () => {
	const bad = sources(here).filter((p) =>
		readFileSync(p, "utf8")
			.split("\n")
			.some((l) => /import\.meta\.url/.test(l) && /process\.argv\[1\]/.test(l) && !/realpathSync\(process\.argv\[1\]\)/.test(l)),
	);
	assert.deepEqual(bad.map((p) => relative(here, p)), []);
});
