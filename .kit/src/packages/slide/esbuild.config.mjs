import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

/**
 * スライドの CLI（ADR-0117）。Obsidian のプラグインではない。
 * .kit/bin/slide.mjs に置き、ビルド済みのものをコミットする（子の Vault はビルドせずに使う）。
 * index.html に入れる共通の CSS とスクリプトも、ここで文字列にして CLI に束ねる
 */
const bindir = process.env.KIT_BINDIR ?? fileURLToPath(new URL("../../../bin/", import.meta.url));

/** CSS の「48u」を calc(48 * var(--u)) にする。--u はキャンバス（幅 1920）の 1 単位 */
export function expandUnits(css) {
	return css.replace(/(?<![\w#.-])(-?\d+(?:\.\d+)?)u\b/g, "calc($1 * var(--u))");
}

/** index.html に入れる共通のスクリプト（ブラウザで動く。1 つの即時関数にまとめる） */
export async function buildRuntime() {
	const result = await esbuild.build({
		entryPoints: [fileURLToPath(new URL("src/runtime/main.ts", import.meta.url))],
		// 出力の中のパスのコメントを、どこから呼んでも同じにする（pkm-slide も同じスクリプトを束ねる。ADR-0132）
		absWorkingDir: fileURLToPath(new URL(".", import.meta.url)),
		bundle: true,
		format: "iife",
		platform: "browser",
		target: "es2020",
		minify: false,
		sourcemap: false,
		legalComments: "none",
		write: false,
		logLevel: "warning",
	});
	return result.outputFiles[0].text;
}

export async function buildAssets() {
	const read = (rel) => readFile(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
	return {
		tokensCss: await read("tokens.css"),
		css: expandUnits(`${await read("src/style/viewer.css")}\n${await read("src/style/slide.css")}\n${await read("src/style/patterns.css")}`),
		runtime: await buildRuntime(),
	};
}

/** import assets from "virtual:slide-assets" を、上の文字列に置き換える */
export const assetsPlugin = {
	name: "slide-assets",
	setup(build) {
		build.onResolve({ filter: /^virtual:slide-assets$/ }, () => ({ path: "slide-assets", namespace: "slide-assets" }));
		build.onLoad({ filter: /.*/, namespace: "slide-assets" }, async () => ({
			contents: `export default ${JSON.stringify(await buildAssets())};`,
			loader: "js",
		}));
	},
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	await esbuild.build({
		entryPoints: ["cli/slide.ts"],
		outdir: bindir,
		outExtension: { ".js": ".mjs" },
		bundle: true,
		format: "esm",
		platform: "node",
		target: "node22",
		plugins: [assetsPlugin],
		minify: false,
		sourcemap: false,
		legalComments: "eof",
		logLevel: "warning",
	});
}
