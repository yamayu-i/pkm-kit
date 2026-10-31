/**
 * issue 画面と各 View の見た目を、Obsidian なしで確認する（docs/design.md「確認のしかた」）。
 * obsidian をモックに差し替えて束ね、Chromium（Playwright）でライト / ダークのスクリーンショットを撮る。
 *
 * 使い方: pnpm preview:ui [画面名...]  → preview/out/<画面>-<light|dark>(-narrow).png
 * Playwright と Chromium は開発環境に入っているものを使う（このリポジトリの依存にはしない）
 */
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = `${here}out/`;
await mkdir(out, { recursive: true });

await esbuild.build({
	entryPoints: [`${here}fixture.tsx`],
	outfile: `${out}fixture.js`,
	bundle: true,
	format: "iife",
	jsx: "automatic",
	jsxImportSource: "preact",
	alias: { obsidian: `${here}obsidian-mock.ts` },
	logLevel: "warning",
});

// Obsidian の CSS 変数のうち、styles.css が使うものだけを近い値で置く
const themes = {
	light: "--background-primary:#fff;--text-normal:#222;--text-muted:#5c5c5c;--text-faint:#999;--text-accent:#7c3aed;--interactive-accent:#7c3aed;--text-on-accent:#fff;--text-error:#c00",
	dark: "--background-primary:#1e1e1e;--text-normal:#dadada;--text-muted:#a3a3a3;--text-faint:#666;--text-accent:#a78bfa;--interactive-accent:#8b6cef;--text-on-accent:#fff;--text-error:#f66",
};
for (const [name, vars] of Object.entries(themes)) {
	await writeFile(
		`${out}${name}.html`,
		`<!doctype html><html><head><meta charset="utf-8"><style>
body{--font-ui-medium:15px;--font-ui-small:13px;--font-ui-smaller:12px;--font-monospace:ui-monospace,monospace;--font-text:sans-serif;font-family:Inter,"Noto Sans JP",sans-serif;margin:0;padding:12px;background:var(--background-primary);color:var(--text-normal)}
body.theme-${name}{${vars}}
button{font:inherit;color:inherit;background:#f0f0f0;border:none;border-radius:4px;cursor:pointer}
</style><link rel="stylesheet" href="../../styles.css"></head><body class="theme-${name}"><script src="fixture.js"></script></body></html>`,
	);
}

// 撮る画面（引数で絞れる: pnpm preview:ui daily inbox）
const SCREENS = ["header", "daily", "board", "issues", "inbox", "organize", "scheduled", "someday", "routines", "groups"];
const wanted = process.argv.slice(2).filter((a) => SCREENS.includes(a));
const screens = wanted.length > 0 ? wanted : SCREENS;

const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch();
let failed = false;
for (const theme of Object.keys(themes)) {
	for (const screen of screens) {
		const page = await browser.newPage({ viewport: { width: 1100, height: 1500 } });
		page.on("pageerror", (e) => {
			failed = true;
			console.error(`${theme}/${screen}: ${e.message}`);
		});
		await page.goto(`file://${out}${theme}.html#${screen}`);
		await page.waitForTimeout(300);
		await page.locator("#wide").screenshot({ path: `${out}${screen}-${theme}.png` });
		await page.locator("#narrow").screenshot({ path: `${out}${screen}-${theme}-narrow.png` });
		await page.close();
	}
	console.log(`${out}<画面>-${theme}(-narrow).png`);
}
await browser.close();
process.exit(failed ? 1 : 0);
