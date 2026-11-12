#!/usr/bin/env node
/**
 * ハーネスと Vault の検査をまとめて実行する。CI（.github/workflows/vault.yml）も同じものを呼ぶ。
 * 途中で失敗しても最後まで実行し、結果をまとめて出す。
 *
 * 使い方: node .claude/scripts/verify.mjs [--plugin] [--fetch] [--append-only=<範囲>]
 *   --plugin       .kit/src の pnpm check も実行する（プラグインを変えたとき）
 *   --fetch        所有の境界の検査で、手元にない上流のコミットを取得する（CI 用）
 *   --append-only  wiki の操作が追記だけかを見る範囲（check-append-only.mjs の引数。空白で区切る）。
 *                  既定は origin/main..HEAD。CI はイベントから決めた範囲を渡す
 *
 * 最初に開発環境を確かめる（lib/dev-env.mjs）。Node / pnpm の版が mise.toml と違えば警告する。
 * --plugin のときは、.kit/src の依存が揃っていなければ pnpm check を実行せずに失敗にする
 *
 * 検査の一覧はここだけに書く。CI はこのスクリプトを呼ぶ（個別の検査を CI に書かない。テストで確かめる）
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dependencyProblems, readMiseVersions, versionWarning } from "./lib/dev-env.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const scripts = join(root, ".claude/scripts");
const node = process.execPath;

const hasOriginMain = spawnSync("git", ["rev-parse", "--verify", "--quiet", "origin/main"], { cwd: root }).status === 0;
const option = (name) => process.argv.slice(2).find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const appendOnly = option("append-only")?.split(" ").filter(Boolean) ?? (hasOriginMain ? ["origin/main..HEAD"] : null);
const tests = readdirSync(join(scripts, "test"))
	.filter((f) => f.endsWith(".test.mjs"))
	.map((f) => join(scripts, "test", f));

const steps = [
	["スクリプトのテスト", node, ["--test", ...tests]],
	["文書の構造（子向けのハーネス）", node, [join(scripts, "check-docs.mjs")]],
	["文書の構造（上流のハーネス）", node, [join(scripts, "check-docs.mjs"), join(root, ".kit/harness")]],
	["文書のリンク（プラグイン）", node, [join(scripts, "check-docs.mjs"), join(root, ".kit/src/docs"), "--links-only"]],
	["ADR の一覧（ADR と合っているか、番号が重なっていないか）", node, [join(scripts, "adr-index.mjs")]],
	["wiki の lint", node, [join(scripts, "wiki-lint.mjs")]],
	["Obsidian の設定", node, [join(scripts, "check-obsidian-config.mjs")]],
	["所有の境界", node, [join(scripts, "check-kit-paths.mjs"), ...(process.argv.includes("--fetch") ? ["--fetch"] : [])]],
	// スライド（ADR-0117）: index.html が deck.html と今の CLI から作ったものと同じか。slide/ がなければ何もしない
	existsSync(join(root, "slide")) && existsSync(join(root, ".kit/bin/slide.mjs"))
		? ["スライド（index.html が deck.html から作ったものと同じか）", node, [join(root, ".kit/bin/slide.mjs"), "check"]]
		: ["スライド（slide/ がないので省略）", null, []],
	// 基本の色（ADR-0121）: theme.json が規約を満たし、スニペットと appearance.json が合っているか。theme.json もスニペットもなければ何もしない
	existsSync(join(root, ".kit-local/theme.json")) || existsSync(join(root, ".obsidian/snippets/pkm-theme-local.css"))
		? ["基本の色（theme.json が規約を満たし、スニペットが theme.json から作ったものと同じか）", node, [join(root, ".kit/bin/theme.mjs"), "check"]]
		: ["基本の色（.kit-local/theme.json がないので省略）", null, []],
	["移行（子の Vault で未適用のものがないか）", node, [join(root, ".kit/migrate.mjs"), "--status"]],
	appendOnly
		? ["wiki の操作が追記だけか", node, [join(scripts, "check-append-only.mjs"), ...appendOnly]]
		: ["wiki の操作が追記だけか（origin/main がないので省略）", null, []],
];
const plugin = process.argv.includes("--plugin");
if (plugin) steps.push(["プラグイン（pnpm check）", "pnpm", ["check"], join(root, ".kit/src")]);

const results = [];

// 開発環境: 版は警告だけ。pnpm は --plugin のときだけ見る（子の Vault では pnpm を使わない）
const misePath = join(root, "mise.toml");
const wanted = existsSync(misePath) ? readMiseVersions(readFileSync(misePath, "utf8")) : { node: null, pnpm: null };
const pnpmVersion = () => {
	const r = spawnSync("pnpm", ["--version"], { cwd: root, encoding: "utf8" });
	return r.status === 0 ? r.stdout : null;
};
const warnings = [versionWarning("Node", wanted.node, process.version), plugin ? versionWarning("pnpm", wanted.pnpm, pnpmVersion()) : null].filter(Boolean);
for (const w of warnings) console.log(`警告: ${w}`);
if (plugin) {
	const problems = dependencyProblems(join(root, ".kit/src"));
	if (problems.length) {
		for (const p of problems) console.log(`エラー: ${p}`);
		steps.pop();
		results.push(["プラグイン（pnpm check。依存が揃っていないので実行しなかった）", "失敗"]);
	}
}
for (const [name, cmd, args, cwd] of steps) {
	if (!cmd) {
		results.push([name, "省略"]);
		continue;
	}
	console.log(`\n=== ${name}`);
	const r = spawnSync(cmd, args, { cwd: cwd ?? root, stdio: "inherit" });
	results.push([name, r.status === 0 ? "成功" : "失敗"]);
}

console.log("\n=== 結果");
for (const [name, status] of results) console.log(`${status === "成功" ? "✓" : status === "省略" ? "-" : "✗"} ${name}: ${status}`);
if (results.some(([, s]) => s === "失敗")) process.exit(1);
