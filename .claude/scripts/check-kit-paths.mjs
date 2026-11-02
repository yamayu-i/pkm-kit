#!/usr/bin/env node
/**
 * 上流（pkm-kit）と子の Vault の所有の境界を検査する（ADR-0009）。上流のパスは .kit/owned-paths.json にある。
 *
 * - 上流（.kit-local/ がない）: 追跡しているすべてのファイルが、上流のパスに当たること。
 *   個人のノートや記録が上流に紛れ込むのを防ぐ（上流は公開リポジトリ）
 * - 子（.kit-local/ がある）: 上流から取り込んだ後に、上流のパスが merge 以外で変わっていないこと（段階 2 の後続で足す）
 *
 * 使い方: node .claude/scripts/check-kit-paths.mjs [リポジトリのルート]
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** glob を正規表現にする。* は / をまたがない、** は任意の階層（0 階層を含む） */
export function globToRegExp(glob) {
	let re = "";
	for (let i = 0; i < glob.length; i++) {
		const c = glob[i];
		if (c === "*" && glob[i + 1] === "*") {
			i++;
			if (glob[i + 1] === "/") {
				i++;
				re += "(?:.*/)?";
			} else re += ".*";
		} else if (c === "*") re += "[^/]*";
		else re += c.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
	}
	return new RegExp(`^${re}$`);
}

export function readOwnedPaths(root) {
	const json = JSON.parse(readFileSync(join(root, ".kit/owned-paths.json"), "utf8"));
	if (!Array.isArray(json.upstream) || json.upstream.some((p) => typeof p !== "string")) {
		throw new Error(".kit/owned-paths.json の upstream は文字列の配列にする");
	}
	return json.upstream;
}

export function isUpstreamPath(path, patterns) {
	return patterns.some((p) => globToRegExp(p).test(path));
}

/** 上流のリポジトリで、上流のパスに当たらないファイルを列挙する */
export function checkUpstreamFiles(files, patterns) {
	return files.filter((f) => !isUpstreamPath(f, patterns)).map((f) => `${f}: 上流のパス（.kit/owned-paths.json）に当たらない。個人のノートや記録なら上流に置かない。仕組みのファイルなら owned-paths.json に足す`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const root = process.argv[2] ?? fileURLToPath(new URL("../..", import.meta.url));
	if (existsSync(join(root, ".kit-local"))) {
		console.log("所有の境界: 子の Vault の検査はまだない（ADR-0009。段階 2 の後続で足す）");
		process.exit(0);
	}
	const files = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean);
	const errors = checkUpstreamFiles(files, readOwnedPaths(root));
	for (const e of errors) console.error(e);
	if (errors.length) process.exit(1);
	console.log(`所有の境界: OK（上流。${files.length} ファイル）`);
}
