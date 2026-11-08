/**
 * 開発環境（Node / pnpm の版、.kit/src の依存）を確かめる。verify.mjs が最初に呼ぶ（#49）。
 *
 * - 版が mise.toml と違えば警告する（止めない。結果が CI と揃わないことを知らせる）
 * - --plugin のときだけ、.kit/src の依存がワークスペース全体で入っているかを見る。足りなければ
 *   pnpm check の前に止める（単一パッケージだけを入れた状態で check すると、ほかのパッケージが
 *   tsc: command not found などで落ち、原因が分かりにくい。yamayu-i/pkm-kit#7）
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** mise.toml の [tools] から node と pnpm の版を読む */
export function readMiseVersions(text) {
	const pick = (name) => text.match(new RegExp(`^${name}\\s*=\\s*"([^"]+)"`, "m"))?.[1] ?? null;
	return { node: pick("node"), pnpm: pick("pnpm") };
}

/** 求める版（mise.toml）と今の版を比べ、違えば警告の文を返す。actual が null なら「見つからない」 */
export function versionWarning(tool, expected, actual) {
	if (!expected) return null;
	const got = actual?.trim().replace(/^v/, "") ?? null;
	if (got === expected) return null;
	if (got === null) return `${tool} が見つからない（mise.toml は ${expected}）。mise install で入れる。mise がなければ .kit/harness/docs/plugin-development.md の「クラウドのセッションでの準備」`;
	return `${tool} の版が ${got}（mise.toml は ${expected}）。検査の結果が CI と揃わないことがある。mise install で揃える。mise がなければ .kit/harness/docs/plugin-development.md の「クラウドのセッションでの準備」`;
}

/** .kit/src の依存がワークスペース全体で入っているか。足りなければ問題の文の配列を返す */
export function dependencyProblems(srcRoot) {
	const install = "cd .kit/src && pnpm install --frozen-lockfile を実行する";
	if (!existsSync(join(srcRoot, "node_modules", ".modules.yaml"))) return [`.kit/src の依存が入っていない。${install}`];
	const packagesDir = join(srcRoot, "packages");
	if (!existsSync(packagesDir)) return [];
	const missing = [];
	for (const id of readdirSync(packagesDir).sort()) {
		const pkgPath = join(packagesDir, id, "package.json");
		if (!existsSync(pkgPath)) continue;
		const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
		const hasDeps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).length > 0;
		if (hasDeps && !existsSync(join(packagesDir, id, "node_modules"))) missing.push(id);
	}
	return missing.length ? [`.kit/src の依存が一部のパッケージにしか入っていない（ない: ${missing.join(", ")}）。${install}`] : [];
}
