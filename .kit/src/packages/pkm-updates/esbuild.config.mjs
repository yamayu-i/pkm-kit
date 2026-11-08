import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

/** ビルド結果は Vault 内のプラグインフォルダへ直接出す（モバイルはビルドできないのでコミットする） */
// PKM_UPDATES_OUTDIR はビルド再現性の検証（security-scan）用
const outdir = process.env.PKM_UPDATES_OUTDIR ?? fileURLToPath(new URL("../../../../.obsidian/plugins/pkm-updates/", import.meta.url));
const watch = process.argv.includes("--watch");

const plugin = {
	entryPoints: ["src/main.ts"],
	outfile: `${outdir}main.js`,
	bundle: true,
	format: "cjs",
	platform: "browser",
	target: "es2022",
	external: ["obsidian", "electron"],
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
