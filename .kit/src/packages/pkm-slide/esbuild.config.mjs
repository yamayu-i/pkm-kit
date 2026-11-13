import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";
// 閲覧の画面の CSS とスクリプトを、CLI（slide.mjs）と同じ作り方で束ねる。index.html を CLI と同じバイト列にするため（ADR-0132）
import { assetsPlugin } from "../slide/esbuild.config.mjs";

/** ビルド結果は Vault 内のプラグインフォルダへ直接出す（モバイルはビルドできないのでコミットする） */
// PKM_SLIDE_OUTDIR はビルド再現性の検証（security-scan）用
const outdir = process.env.PKM_SLIDE_OUTDIR ?? fileURLToPath(new URL("../../../../.obsidian/plugins/pkm-slide/", import.meta.url));
const watch = process.argv.includes("--watch");

/**
 * linkedom は canvas のパッケージを require して、なければ代わりの実装を使う。
 * プラグインでは Vault の外のモジュールを探させないよう、require("canvas") を必ず失敗するモジュールにする
 */
const noCanvas = {
	name: "no-canvas",
	setup(build) {
		build.onResolve({ filter: /^canvas$/ }, () => ({ path: "canvas", namespace: "no-canvas" }));
		build.onLoad({ filter: /.*/, namespace: "no-canvas" }, () => ({ contents: 'throw new Error("canvas is not available");', loader: "js" }));
	},
};

const plugin = {
	entryPoints: ["src/main.ts"],
	outfile: `${outdir}main.js`,
	bundle: true,
	format: "cjs",
	platform: "browser",
	target: "es2022",
	external: ["obsidian", "electron"],
	plugins: [assetsPlugin, noCanvas],
	jsx: "automatic",
	jsxImportSource: "preact",
	// 中身をレビューしやすく、ビルドの再現性を確認しやすくするため minify しない
	minify: false,
	sourcemap: false,
	legalComments: "eof",
	logLevel: "info",
};

await mkdir(outdir, { recursive: true });
await copyFile("manifest.json", `${outdir}manifest.json`);
// トークン（packages/design の生成物）の後ろにプラグインの CSS を続ける（docs/design.md）
await writeFile(`${outdir}styles.css`, `${await readFile("tokens.css", "utf8")}\n${await readFile("styles.css", "utf8")}`);
if (watch) {
	await (await esbuild.context(plugin)).watch();
} else {
	await esbuild.build(plugin);
}
