import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

/**
 * 子の Vault の基本の色の CLI（ADR-0121）。Obsidian のプラグインではない。
 * .kit/bin/theme.mjs に置き、ビルド済みのものをコミットする（子の Vault はビルドせずに使う）
 */
const bindir = process.env.KIT_BINDIR ?? fileURLToPath(new URL("../../../bin/", import.meta.url));

await esbuild.build({
	entryPoints: [fileURLToPath(new URL("cli/theme.ts", import.meta.url))],
	outdir: bindir,
	outExtension: { ".js": ".mjs" },
	bundle: true,
	format: "esm",
	platform: "node",
	target: "node22",
	minify: false,
	sourcemap: false,
	legalComments: "eof",
	banner: { js: "#!/usr/bin/env node\n// 生成物。手で編集しない。正本は .kit/src/packages/design（pnpm --filter design build で作り直す）" },
	logLevel: "warning",
});
