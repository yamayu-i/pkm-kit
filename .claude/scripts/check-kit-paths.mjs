#!/usr/bin/env node
/**
 * 上流（pkm-kit）と子の Vault の所有の境界を検査する（ADR-0009）。上流のパスは .kit/owned-paths.json にある。
 *
 * - 上流（.kit-local/ がない）: 追跡しているすべてのファイルが、上流のパスに当たること。
 *   個人のノートや記録が上流に紛れ込むのを防ぐ（上流は公開リポジトリ）
 * - 子（.kit-local/ がある）: 最後に取り込んだ上流のコミット（.kit-local/upstream.json）から、上流のパスが変わっていないこと。
 *   上流のものを直したくなったら、変えずにエスカレーションする（ADR-0011）。取り込み（vault-upgrade）は upstream.json も更新する
 *
 * パターンの先頭の ! は除外（例: "!.claude/skills/local-*\/**" は子のもの）。後に書いたものが勝つ
 *
 * 使い方: node .claude/scripts/check-kit-paths.mjs [--fetch] [リポジトリのルート]
 *   --fetch  上流のコミットが手元になければ、.kit-local/upstream.json の url から取得する（CI 用）
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
	let hit = false;
	for (const p of patterns) {
		if (p.startsWith("!")) {
			if (globToRegExp(p.slice(1)).test(path)) hit = false;
		} else if (globToRegExp(p).test(path)) hit = true;
	}
	return hit;
}

/** 上流のリポジトリで、上流のパスに当たらないファイルを列挙する */
export function checkUpstreamFiles(files, patterns) {
	return files.filter((f) => !isUpstreamPath(f, patterns)).map((f) => `${f}: 上流のパス（.kit/owned-paths.json）に当たらない。個人のノートや記録なら上流に置かない。仕組みのファイルなら owned-paths.json に足す`);
}

/** 子の Vault で、上流のパスのうち、取り込んだコミットから変わったもの（コミット前・追跡前の変更も含む） */
export function checkChildChanges(changed, patterns, commit) {
	return changed
		.filter((f) => isUpstreamPath(f, patterns))
		.map((f) => `${f}: 上流のもの（.kit/owned-paths.json）が、取り込んだ上流のコミット ${commit.slice(0, 7)} から変わっている。変えずに元に戻し、直したいことは escalate で上流に伝える`);
}

const git = (root, args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const lines = (text) => text.split("\0").filter(Boolean);

function childMode(root, fetch) {
	const record = JSON.parse(readFileSync(join(root, ".kit-local/upstream.json"), "utf8"));
	if (!/^[0-9a-f]{40}$/.test(record.commit ?? "")) throw new Error(".kit-local/upstream.json に上流のコミットがない（node .kit/setup.mjs で作る）");
	const have = () => {
		try {
			git(root, ["cat-file", "-e", `${record.commit}^{commit}`]);
			return true;
		} catch {
			return false;
		}
	};
	if (!have() && fetch) git(root, ["fetch", "--quiet", "--depth=1", record.url, record.commit]);
	if (!have()) throw new Error(`上流のコミット ${record.commit} が手元にない。git fetch upstream を実行する（CI では --fetch を付ける）`);
	// 上流のパスの判定は、取り込んだ上流のコミットの owned-paths.json で行う（子が書き換えても効かないように）
	const patterns = JSON.parse(git(root, ["show", `${record.commit}:.kit/owned-paths.json`])).upstream;
	const changed = [
		...lines(git(root, ["diff", "--name-only", "-z", "--no-renames", record.commit])),
		...lines(git(root, ["ls-files", "--others", "--exclude-standard", "-z"])),
	];
	return { errors: checkChildChanges([...new Set(changed)], patterns, record.commit), commit: record.commit };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const positional = process.argv.slice(2).filter((a) => !a.startsWith("--"));
	const root = positional[0] ?? fileURLToPath(new URL("../..", import.meta.url));
	try {
		if (existsSync(join(root, ".kit-local"))) {
			const { errors, commit } = childMode(root, process.argv.includes("--fetch"));
			for (const e of errors) console.error(e);
			if (errors.length) process.exit(1);
			console.log(`所有の境界: OK（子。上流のコミット ${commit.slice(0, 7)} から上流のものは変わっていない）`);
		} else {
			const files = lines(git(root, ["ls-files", "-z"]));
			const errors = checkUpstreamFiles(files, readOwnedPaths(root));
			for (const e of errors) console.error(e);
			if (errors.length) process.exit(1);
			console.log(`所有の境界: OK（上流。${files.length} ファイル）`);
		}
	} catch (e) {
		console.error(`所有の境界: ${e.message}`);
		process.exit(1);
	}
}
