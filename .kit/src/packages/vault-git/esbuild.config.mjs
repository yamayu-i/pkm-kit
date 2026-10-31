import { copyFile, mkdir } from "node:fs/promises";
import { builtinModules } from "node:module";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

/** ビルド結果は Vault 内のプラグインフォルダへ直接出す（モバイルはビルドできないのでコミットする） */
// VAULT_GIT_OUTDIR はビルド再現性の検証（security-scan）用
const outdir = process.env.VAULT_GIT_OUTDIR ?? fileURLToPath(new URL("../../../.obsidian/plugins/vault-git/", import.meta.url));
const watch = process.argv.includes("--watch");
// buffer はモバイル用にポリフィルを同梱するので external にしない
const nodeBuiltins = builtinModules.filter((m) => m !== "buffer");

const options = {
	entryPoints: ["src/main.ts"],
	outfile: `${outdir}main.js`,
	bundle: true,
	format: "cjs",
	platform: "browser",
	target: "es2022",
	external: ["obsidian", "electron", "@codemirror/*", "@lezer/*", ...nodeBuiltins, ...nodeBuiltins.map((m) => `node:${m}`)],
	inject: ["src/shims/buffer.ts"],
	// 中身をレビューしやすく、ビルドの再現性を確認しやすくするため minify しない
	minify: false,
	sourcemap: false,
	legalComments: "eof",
	logLevel: "info",
};

await mkdir(outdir, { recursive: true });
await copyFile("manifest.json", `${outdir}manifest.json`);
if (watch) {
	await (await esbuild.context(options)).watch();
} else {
	await esbuild.build(options);
}
