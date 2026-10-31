import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

/** ビルド結果は Vault 内のプラグインフォルダへ直接出す（モバイルはビルドできないのでコミットする） */
// VAULT_TASK_OUTDIR はビルド再現性の検証（security-scan）用
const outdir = process.env.VAULT_TASK_OUTDIR ?? fileURLToPath(new URL("../../../.obsidian/plugins/vault-task/", import.meta.url));
const watch = process.argv.includes("--watch");

const plugin = {
	entryPoints: ["src/main.ts"],
	outfile: `${outdir}main.js`,
	bundle: true,
	format: "cjs",
	platform: "browser",
	target: "es2022",
	// CodeMirror は Obsidian が持っているものを使う
	external: ["obsidian", "electron", "@codemirror/*", "@lezer/*"],
	jsx: "automatic",
	jsxImportSource: "preact",
	// 中身をレビューしやすく、ビルドの再現性を確認しやすくするため minify しない
	minify: false,
	sourcemap: false,
	legalComments: "eof",
	logLevel: "info",
};

/** lint の CLI（プラグインには同梱しない。Claude Code から使う） */
const cli = {
	entryPoints: ["cli/lint.ts"],
	outfile: "dist/cli.mjs",
	bundle: true,
	format: "esm",
	platform: "node",
	target: "node22",
	// yaml は node_modules から読む（CJS を ESM に同梱すると require が壊れる）
	packages: "external",
	logLevel: "warning",
};

await mkdir(outdir, { recursive: true });
await copyFile("manifest.json", `${outdir}manifest.json`);
await copyFile("styles.css", `${outdir}styles.css`);
if (watch) {
	await (await esbuild.context(plugin)).watch();
} else {
	await Promise.all([esbuild.build(plugin), esbuild.build(cli)]);
}
