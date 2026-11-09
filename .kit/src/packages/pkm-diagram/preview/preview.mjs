/**
 * pkm-diagram を、Obsidian なしで Chromium に出して確かめる（ADR-0102）。
 * - 操作バー: 図（SVG の図・以前の Draw.io の図・Mermaid の図）に載せると右上に出る。「編集」はない。タッチで押しても出る。描画した画面の検査（docs/design.md）
 * - 拡大表示: 全体を表示・拡大・100%・ドラッグ。描画した画面の検査
 * - Mermaid の PNG: foreignObject を <text> にし、ライトの色で作る
 * - 印: 縮めすぎて読めない図だけに「Expand to read」が出て、読める幅になると消える
 * - PNG: 共有用の SVG（foreignObject を含む）を 2 倍の PNG にできる
 *
 * 使い方: pnpm --filter pkm-diagram preview:ui  → preview/out/toolbar-<light|dark>.png
 * 初回だけ Chromium を入れる: pnpm --filter pkm-diagram exec playwright install chromium（入れられない環境では CHROMIUM_PATH）
 * 外部には繋がない。CI では動かない（pkm-html の preview:ui と同じ）
 */
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";
import { auditInPage } from "../../design/src/audit.ts";
import { readTokens } from "../../design/node/build.ts";
import { dimensionPx, resolveValue } from "../../design/src/tokens.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = `${here}out/`;
await mkdir(out, { recursive: true });

await esbuild.build({
	entryPoints: [`${here}fixture.ts`],
	outfile: `${out}fixture.js`,
	bundle: true,
	format: "iife",
	alias: { obsidian: `${here}obsidian-mock.ts` },
	loader: { ".svg": "text" },
	logLevel: "warning",
});

const targetMin = dimensionPx(resolveValue(readTokens(), "size.target-min", "light"));

for (const theme of ["light", "dark"]) {
	await writeFile(
		`${out}${theme}.html`,
		`<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../tokens.css"><link rel="stylesheet" href="../../styles.css"><link rel="stylesheet" href="../../../../../../.obsidian/snippets/pkm-theme.css">
<style>body{margin:0;padding:24px;background:var(--vt-surface);color:var(--vt-on-surface);font-family:sans-serif} #note{width:480px;height:1200px} .image-embed{display:block} .modal-container{position:fixed;inset:0} .modal{position:absolute;inset:24px} .modal.vt-diagram-zoom{width:auto;height:auto}</style>
</head><body class="theme-${theme}"><div id="note" class="markdown-preview-view"></div><script src="fixture.js"></script></body></html>`,
	);
}

const { chromium } = createRequire(import.meta.url)("playwright");
// Playwright の版と違う Chromium しかない環境では、CHROMIUM_PATH でその実行ファイルを渡す
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const problems = [];

async function open(theme = "light") {
	const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
	const external = [];
	await page.route(/^(?!file:|data:|about:|blob:)/, (route) => {
		external.push(route.request().url());
		return route.abort();
	});
	page.on("pageerror", (e) => problems.push(`実行時のエラー: ${e.message}`));
	await page.goto(`file://${out}${theme}.html`);
	return { page, external };
}

async function waitFor(where, fn, timeout = 3000) {
	const start = Date.now();
	for (;;) {
		if (await fn()) return true;
		if (Date.now() - start > timeout) {
			problems.push(`${where}: 待っても起きない`);
			return false;
		}
		await new Promise((r) => setTimeout(r, 50));
	}
}

// 4. 操作バー（スクリーンショットと描画した画面の検査）
for (const theme of ["light", "dark"]) {
	const { page, external } = await open(theme);
	await page.evaluate(() => window.dv.mountToolbar());
	await page.waitForTimeout(200);
	const bar = page.locator(".vt-diagram-toolbar");
	const tools = async () => (await page.locator(".vt-diagram-tool").allTextContents()).join(",");
	// 普通の SVG の図
	await page.hover("#img-plain");
	await page.waitForTimeout(200);
	if (!(await bar.isVisible())) problems.push(`操作バー ${theme}: 普通の SVG の図に出ない`);
	if ((await tools()) !== "Copy,Save PNG,Expand") problems.push(`操作バー ${theme}: ボタンが違う（${await tools()}）`);
	// Mermaid の図: 中の要素に載せても出る
	const mermaidBox = await page.locator("#mermaid svg").boundingBox();
	await page.mouse.move(mermaidBox.x + 70, mermaidBox.y + 60);
	await page.waitForTimeout(200);
	if (!(await bar.isVisible())) problems.push(`操作バー ${theme}: Mermaid の図に出ない`);
	await page.locator(".vt-diagram-tool", { hasText: "Save PNG" }).click();
	await page.hover("#img-drawio");
	if (!(await bar.isVisible())) problems.push(`操作バー ${theme}: 以前の Draw.io の図に出ない`);
	const img = await page.locator("#img-drawio").boundingBox();
	const box = await bar.boundingBox();
	if (!img || !box || box.x < img.x || box.x + box.width > img.x + img.width + 1 || box.y < img.y || box.y > img.y + 16) {
		problems.push(`操作バー ${theme}: 画像の右上にない（画像 ${JSON.stringify(img)}、バー ${JSON.stringify(box)}）`);
	}
	await page.locator(".vt-diagram-tool", { hasText: "Copy" }).hover();
	await page.waitForTimeout(400);
	if (!(await bar.isVisible())) problems.push(`操作バー ${theme}: バーに移ると消える`);
	await page.screenshot({ path: `${out}toolbar-${theme}.png`, clip: { x: 0, y: 0, width: 560, height: 420 } });
	for (const p of await page.evaluate(auditInPage, { rootSelector: ".vt-diagram-toolbar", targetMin })) problems.push(`操作バー ${theme}: [${p.rule}] ${p.where}: ${p.message}`);
	await page.locator(".vt-diagram-tool", { hasText: "Copy" }).click();
	await page.locator(".vt-diagram-tool", { hasText: "Save PNG" }).click();
	await page.hover("#img-drawio");
	await page.locator(".vt-diagram-tool", { hasText: "Expand" }).click();
	const actions = await page.evaluate(() => window.__actions);
	const expected = ["save:mermaid", "copy:asset/sys.drawio.svg", "save:asset/sys.drawio.svg", "expand:asset/sys.drawio.svg"];
	if (JSON.stringify(actions) !== JSON.stringify(expected)) problems.push(`操作バー ${theme}: 押した結果が違う（${actions.join(", ")}）`);
	// 離れると消える
	await page.mouse.move(900, 700);
	await page.waitForTimeout(500);
	if (await bar.isVisible()) problems.push(`操作バー ${theme}: 離れても消えない`);
	// タッチ: 押すと出て、ほかを押すと消える
	await page.locator("#img-drawio").dispatchEvent("pointerdown", { pointerType: "touch", bubbles: true });
	if (!(await bar.isVisible())) problems.push(`操作バー ${theme}: タッチで押しても出ない`);
	await page.locator("p").first().dispatchEvent("pointerdown", { pointerType: "touch", bubbles: true });
	if (await bar.isVisible()) problems.push(`操作バー ${theme}: ほかを押しても消えない`);
	if (external.length > 0) problems.push(`操作バー: 外部への要求が出た: ${external.join(", ")}`);
	await page.close();
	console.log(`${out}toolbar-${theme}.png`);
}

// 4b. 縮めすぎて読めない図の印（横に長い図だけに出て、幅を広げると消える）
for (const theme of ["light", "dark"]) {
	const { page } = await open(theme);
	await page.evaluate(() => window.dv.mountToolbar());
	await page.waitForTimeout(700);
	const marked = await page.evaluate(() => [...document.querySelectorAll(".vt-diagram-shrunk")].map((e) => e.getAttribute("src") ?? e.id));
	if (JSON.stringify(marked) !== JSON.stringify(["asset/wide.svg"])) problems.push(`印 ${theme}: 横に長い図だけに出ていない（${marked.join(", ")}）`);
	const badge = await page.evaluate(() => {
		const el = document.querySelector(".vt-diagram-shrunk");
		return el ? getComputedStyle(el, "::after").content : "";
	});
	if (badge !== '"Expand to read"') problems.push(`印 ${theme}: 文言が違う（${badge}）`);
	await page.locator(".vt-diagram-shrunk").screenshot({ path: `${out}shrunk-${theme}.png` });
	// 幅を広げて読める大きさになれば消える
	await page.evaluate(() => {
		const note = document.getElementById("note");
		if (note) note.style.width = "2400px";
		const img = document.getElementById("img-wide");
		if (img) img.style.width = "2000px";
	});
	await page.waitForTimeout(400);
	if (await page.locator(".vt-diagram-shrunk").count()) problems.push(`印 ${theme}: 読める大きさにしても消えない`);
	await page.close();
	console.log(`${out}shrunk-${theme}.png`);
}

// 5. 拡大表示（全体を表示・拡大・100%、スクリーンショットと描画した画面の検査）
for (const theme of ["light", "dark"]) {
	const { page } = await open(theme);
	await page.evaluate(() => window.dv.openZoom("asset/sys.drawio.svg"));
	const image = page.locator(".vt-diagram-zoom-image");
	await waitFor(`拡大 ${theme}: 表示`, async () => ((await image.getAttribute("style")) ?? "").includes("scale("));
	const percent = page.locator(".vt-diagram-zoom-percent");
	const fitText = await percent.textContent();
	const stage = await page.locator(".vt-diagram-zoom-stage").boundingBox();
	const shown = await image.boundingBox();
	if (!stage || !shown || shown.x < stage.x - 1 || shown.x + shown.width > stage.x + stage.width + 1 || Math.abs(shown.x + shown.width / 2 - (stage.x + stage.width / 2)) > 2) {
		problems.push(`拡大 ${theme}: 全体を表示で、真ん中に収まっていない（${JSON.stringify(stage)} / ${JSON.stringify(shown)}）`);
	}
	await page.locator(".vt-diagram-zoom-button[aria-label='Zoom in']").click();
	if ((await percent.textContent()) === fitText) problems.push(`拡大 ${theme}: 拡大のボタンで変わらない`);
	await page.locator(".vt-diagram-zoom-button[aria-label='100%']").click();
	if ((await percent.textContent()) !== "100%") problems.push(`拡大 ${theme}: 100% にならない（${await percent.textContent()}）`);
	// ドラッグで動かす
	const before = await image.boundingBox();
	await page.mouse.move(400, 400);
	await page.mouse.down();
	await page.mouse.move(460, 430, { steps: 4 });
	await page.mouse.up();
	const moved = await image.boundingBox();
	if (!before || !moved || Math.abs(moved.x - before.x - 60) > 2 || Math.abs(moved.y - before.y - 30) > 2) problems.push(`拡大 ${theme}: ドラッグで動かない`);
	await page.locator(".vt-diagram-zoom-button[aria-label='Fit']").click();
	await page.screenshot({ path: `${out}zoom-${theme}.png` });
	for (const p of await page.evaluate(auditInPage, { rootSelector: ".vt-diagram-zoom-bar", targetMin })) problems.push(`拡大 ${theme}: [${p.rule}] ${p.where}: ${p.message}`);
	await page.close();
	console.log(`${out}zoom-${theme}.png`);
}

// 6. Mermaid の PNG（foreignObject を <text> にし、ダークで描いていてもライトの色で作る）
for (const theme of ["light", "dark"]) {
	const { page } = await open(theme);
	await page.evaluate(() => window.dv.mountToolbar());
	const png = await page.evaluate(() => window.dv.mermaidPng());
	if (png.width !== 600 || png.height !== 240 || png.bytes < 100) problems.push(`Mermaid の PNG ${theme}: 大きさが違う（${JSON.stringify(png)}）`);
	if (png.foreignObjects !== 0 || !png.hasText) problems.push(`Mermaid の PNG ${theme}: ラベルを <text> にしていない`);
	await page.close();
}

// 7. PNG
{
	const { page } = await open();
	const png = await page.evaluate(() => window.dv.pngSize());
	if (png.width !== 242 || png.height !== 122 || png.bytes < 100) problems.push(`PNG: 大きさが違う（${JSON.stringify(png)}）`);
	await page.close();
}

await browser.close();

for (const p of [...new Set(problems)]) console.error(p);
if (problems.length > 0) {
	console.error(`pkm-diagram の preview: ${new Set(problems).size} 件の問題`);
	process.exit(1);
}
console.log("pkm-diagram の preview: 問題なし（操作バー・印・拡大表示・描画した画面の検査・PNG・Mermaid の PNG）");
