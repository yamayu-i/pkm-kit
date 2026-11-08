/** 0005 の migrate.mjs と check.mjs が共有するもの。依存なしの Node */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

/** git が追跡している tmp/ のファイル（Vault ルートからの相対パス）。git のリポジトリでなければ空 */
export function trackedTmpFiles(root) {
	if (!existsSync(join(root, ".git"))) return [];
	const out = execFileSync("git", ["-C", root, "ls-files", "-z", "--", "tmp/"], { encoding: "utf8" });
	return out.split("\0").filter(Boolean).sort();
}
