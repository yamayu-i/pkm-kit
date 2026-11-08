import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

/** ビルド結果は Vault 内のプラグインフォルダへ直接出す（モバイルはビルドできないのでコミットする） */
// PKM_DRAWIO_OUTDIR はビルド再現性の検証（security-scan）用
const outdir = process.env.PKM_DRAWIO_OUTDIR ?? fileURLToPath(new URL("../../../../.obsidian/plugins/pkm-drawio/", import.meta.url));
const watch = process.argv.includes("--watch");

const plugin = {
	entryPoints: ["src/main.ts"],
	outfile: `${outdir}main.js`,
	bundle: true,
	format: "cjs",
	platform: "browser",
	target: "es2022",
	external: ["obsidian", "electron"],
	// 中身をレビューしやすく、ビルドの再現性を確認しやすくするため minify しない
	minify: false,
	sourcemap: false,
	legalComments: "eof",
	logLevel: "info",
};

/**
 * CLI（プラグインには同梱しない。PC の Claude Code とスキルから使う）。
 * .kit/bin/ に置き、ビルド済みのものをコミットする（ADR-0009）。子の Vault はビルドせずに使う
 */
const bindir = process.env.KIT_BINDIR ?? fileURLToPath(new URL("../../../bin/", import.meta.url));
const cli = {
	entryPoints: ["cli/drawio.ts"],
	outdir: bindir,
	outExtension: { ".js": ".mjs" },
	bundle: true,
	format: "esm",
	platform: "node",
	target: "node22",
	minify: false,
	sourcemap: false,
	legalComments: "eof",
	logLevel: "warning",
};

await mkdir(outdir, { recursive: true });
await copyFile("manifest.json", `${outdir}manifest.json`);
// トークン（packages/design の生成物）の後ろにプラグインの CSS を続ける（docs/design.md）
await writeFile(`${outdir}styles.css`, `${await readFile("tokens.css", "utf8")}\n${await readFile("styles.css", "utf8")}`);
if (watch) {
	await (await esbuild.context(plugin)).watch();
} else {
	await Promise.all([esbuild.build(plugin), esbuild.build(cli)]);
}
