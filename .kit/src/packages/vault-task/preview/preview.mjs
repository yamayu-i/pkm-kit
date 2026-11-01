/**
 * issue 画面と各 View の見た目を、Obsidian なしで確認して検査する（docs/design.md「確認のしかた」）。
 * obsidian をモックに差し替えて束ね、Chromium（Playwright）でライト / ダークのスクリーンショットを撮る。
 * 撮ったあと、描画した画面を検査する（run/contrast・run/target-size・run/focus-visible・run/keyboard）。違反があれば失敗する。
 *
 * 使い方: pnpm preview:ui [画面名...]  → preview/out/<画面>-<light|dark>(-narrow).png
 * 初回だけ Chromium を入れる: pnpm --filter vault-task exec playwright install chromium
 */
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { auditInPage, focusRingInPage } from "../../design/src/audit.ts";
import { readTokens } from "../../design/node/build.ts";
import { dimensionPx, resolveValue } from "../../design/src/tokens.ts";
import { OUTPUTS } from "../../design/node/paths.ts";
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

const tokens = readTokens();
const targetMin = dimensionPx(resolveValue(tokens, "size.target-min", "light"));
const ringWidth = dimensionPx(resolveValue(tokens, "border-width.thick", "light"));

// Obsidian 側は、Vault で固定しているスニペット（.obsidian/snippets/vault-theme.css）をそのまま読む。
// フォントとボタンの素の見た目だけはここで Obsidian に近づける（色はスニペットの変数を使う）
for (const name of ["light", "dark"]) {
	await writeFile(
		`${out}${name}.html`,
		`<!doctype html><html><head><meta charset="utf-8"><style>
body{--font-interface:Inter,"Noto Sans JP",sans-serif;--font-monospace:ui-monospace,monospace;--font-text:sans-serif;font-family:var(--font-interface);margin:0;padding:12px;background:var(--background-primary);color:var(--text-normal)}
button{font:inherit;color:inherit;background:transparent;border:none;border-radius:4px;cursor:pointer}
</style>
<link rel="stylesheet" href="${OUTPUTS.obsidianSnippet}">
<link rel="stylesheet" href="../../tokens.css">
<link rel="stylesheet" href="../../styles.css"></head><body class="theme-${name}"><script src="fixture.js"></script></body></html>`,
	);
}

// 撮る画面（引数で絞れる: pnpm preview:ui daily inbox）
const SCREENS = ["header", "routine", "daily", "board", "issues", "inbox", "organize", "scheduled", "someday", "routines", "groups", "forms"];
const wanted = process.argv.slice(2).filter((a) => SCREENS.includes(a));
const screens = wanted.length > 0 ? wanted : SCREENS;

const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch();
const problems = [];
for (const theme of ["light", "dark"]) {
	for (const screen of screens) {
		const where = `${theme}/${screen}`;
		const page = await browser.newPage({ viewport: { width: 1100, height: 1500 } });
		page.on("pageerror", (e) => problems.push(`${where}: 実行時のエラー: ${e.message}`));
		await page.goto(`file://${out}${theme}.html#${screen}`);
		await page.waitForTimeout(300);
		await page.locator("#wide").screenshot({ path: `${out}${screen}-${theme}.png` });
		await page.locator("#narrow").screenshot({ path: `${out}${screen}-${theme}-narrow.png` });

		for (const root of ["#wide", "#narrow"]) {
			for (const p of await page.evaluate(auditInPage, { rootSelector: root, targetMin })) {
				problems.push(`${where} ${root}: [${p.rule}] ${p.where}: ${p.message}`);
			}
		}
		// Tab で順に選び、どれにも枠が出るかを見る
		const seen = new Set();
		for (let i = 0; i < 300; i++) {
			await page.keyboard.press("Tab");
			const r = await page.evaluate(focusRingInPage, ringWidth);
			if (r === null) break;
			// 一周したら終わり
			if (seen.has(r.where) && r.where === [...seen][0]) break;
			seen.add(r.where);
			if (!r.ok) problems.push(`${where}: [run/focus-visible] ${r.where}: 枠が出ません`);
		}
		await page.close();
	}
	console.log(`${out}<画面>-${theme}(-narrow).png`);
}
await browser.close();

for (const p of [...new Set(problems)]) console.error(p);
if (problems.length > 0) {
	console.error(`検査で ${new Set(problems).size} 件の問題（docs/design.md「検査の一覧」）`);
	process.exit(1);
}
console.log("検査: 問題なし（run/contrast・run/target-size・run/focus-visible・run/keyboard）");
