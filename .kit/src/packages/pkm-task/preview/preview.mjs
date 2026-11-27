/**
 * issue 画面と各 View の見た目を、Obsidian なしで確認して検査する（docs/design.md「確認のしかた」）。
 * obsidian をモックに差し替えて束ね、Chromium（Playwright）でライト / ダークのスクリーンショットを撮る。
 * 撮ったあと、描画した画面を検査する（run/contrast・run/target-size・run/focus-visible・run/keyboard）。違反があれば失敗する。
 *
 * 使い方: pnpm preview:ui [画面名...]  → preview/out/<画面>-<light|dark>(-narrow).png
 * 初回だけ Chromium を入れる: pnpm --filter pkm-task exec playwright install chromium（入れられない環境では CHROMIUM_PATH）
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

// Obsidian 側は、Vault で固定しているスニペット（.obsidian/snippets/pkm-theme.css）をそのまま読む。
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
<link rel="stylesheet" href="../../styles.css">
<link rel="stylesheet" href="../../../shared/src/month-calendar.css"></head><body class="theme-${name}"><script src="fixture.js"></script></body></html>`,
	);
}

// 撮る画面（引数で絞れる: pnpm preview:ui daily inbox）
const SCREENS = ["header", "header-unpicked", "header-picked", "header-someday", "header-closed", "header-budget", "timeline", "routine", "member", "preset", "daily", "pick", "board", "closing", "issues", "inbox", "organize", "scheduled", "projects", "someday", "routines", "labels", "presets", "members", "sidebar", "forms"];
const wanted = process.argv.slice(2).filter((a) => SCREENS.includes(a));
const screens = wanted.length > 0 ? wanted : SCREENS;

const { chromium } = createRequire(import.meta.url)("playwright");
// Playwright の版と違う Chromium しかない環境では、CHROMIUM_PATH でその実行ファイルを渡す
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
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
			// someday は Next でないので Pick を出さない（ADR-0203）
			const expectedControl = { header: "Stop timer", "header-unpicked": "Pick", "header-picked": "Start timer", "header-someday": null, "header-closed": null };
			if (Object.hasOwn(expectedControl, screen)) {
				const control = page.locator(`${root} .vt-worklog .vt-section-head button[aria-label]`);
				const labels = await control.evaluateAll((buttons) => buttons.map((b) => b.getAttribute("aria-label")));
				const expected = expectedControl[screen] === null ? [] : [expectedControl[screen]];
				if (JSON.stringify(labels) !== JSON.stringify(expected)) problems.push(`${where} ${root}: Issue の操作 ${JSON.stringify(labels)} != ${JSON.stringify(expected)}`);
				// Pick と再生は同じ大きさ。記録中だけ経過時間の分だけ横に伸びる。
				for (const button of await page.locator(`${root} .vt-play:not(.is-running)`).all()) {
					const box = await button.boundingBox();
					if (!box || box.width !== 36 || box.height !== 36) problems.push(`${where} ${root}: Pick / 再生が 36px でない: ${JSON.stringify(box)}`);
				}
			}
			// 期間の外のサブ（i-14 の kkkkkk は end が昨日）には、Pick の代わりに Timeline のボタンを出す（ADR-0203）
			if (screen === "header-unpicked") {
				const sub = await page.locator(`${root} .vt-subissue-list .vt-play`).evaluateAll((buttons) => buttons.map((b) => b.getAttribute("aria-label")));
				if (JSON.stringify(sub) !== JSON.stringify(["Open Timeline"])) problems.push(`${where} ${root}: 期間の外のサブの操作 ${JSON.stringify(sub)} != ["Open Timeline"]`);
			}
			// サブのカード（ADR-0239）: 題は 1 か所だけ。開いたカードの題の横に「Edit title」、押すと題の行が入力欄、Escape で戻る
			if (screen === "forms") {
				const labels = await page.locator(`${root} .vt-sub-card .vt-subissue-form .vt-text-field > span`).allTextContents();
				if (labels.includes("Summary")) problems.push(`${where} ${root}: 開いたサブのカードに Summary の欄が残っている`);
				// 期間は Period の 1 つの欄（ADR-0245）
				if (!labels.includes("Period") || labels.includes("Start") || labels.includes("End")) problems.push(`${where} ${root}: 開いたサブのカードの期間の欄が Period の 1 つでない: ${JSON.stringify(labels)}`);
				const edits = page.locator(`${root} .vt-sub-card .vt-subissue-row button[aria-label="Edit title"]`);
				if ((await edits.count()) !== 2) problems.push(`${where} ${root}: Edit title のボタンが開いたカードの数（2）でない: ${await edits.count()}`);
				if ((await edits.count()) > 0) {
					await edits.first().click();
					// Preact の描き直しと useEffect（フォーカス）は少し後に走るので、待ってから確かめる
					const selector = `${root} .vt-sub-card .vt-subissue-row input.vt-subissue-title-input`;
					const focused = await page
						.waitForFunction((sel) => document.activeElement === document.querySelector(sel), selector, { timeout: 2000 })
						.then(() => true, () => false);
					if (!focused) problems.push(`${where} ${root}: Edit title を押しても題の入力欄にフォーカスが入らない`);
					await page.keyboard.press("Escape");
					const closed = await page.locator(selector).waitFor({ state: "detached", timeout: 2000 }).then(() => true, () => false);
					if (!closed) problems.push(`${where} ${root}: Escape で題の入力欄が閉じない`);
				}
			}
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
