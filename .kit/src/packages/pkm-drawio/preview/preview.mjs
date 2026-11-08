/**
 * pkm-drawio を、Obsidian なしで Chromium に出して確かめる（ADR-0064）。
 * - 編集画面: https://embed.diagrams.net/ を偽の Draw.io（fake-drawio.html）に差し替えて、
 *   init → load → save → export（xmlsvg）→ 書く、の往復。別の origin からの save は受け取らない。
 *   編集中にファイルが変わったら上書きせず、別名で保存できる。新しい図を作れる
 * - 操作バー: 図の画像に載せると右上に出て、普通の SVG には出ない。タッチで押しても出る。描画した画面の検査（docs/design.md）
 * - PNG: 共有用の SVG（foreignObject を含む）を 2 倍の PNG にできる
 *
 * 使い方: pnpm --filter pkm-drawio preview:ui  → preview/out/toolbar-<light|dark>.png
 * 初回だけ Chromium を入れる: pnpm --filter pkm-drawio exec playwright install chromium（入れられない環境では CHROMIUM_PATH）
 * 本物の Draw.io には繋がない。CI では動かない（pkm-html の preview:ui と同じ）
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
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
const fakeDrawio = await readFile(`${here}fake-drawio.html`, "utf8");

for (const theme of ["light", "dark"]) {
	await writeFile(
		`${out}${theme}.html`,
		`<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../tokens.css"><link rel="stylesheet" href="../../styles.css">
<style>body{margin:0;padding:24px;background:var(--vt-surface);color:var(--vt-on-surface);font-family:sans-serif} #note{width:480px;height:1200px} .modal-container{position:fixed;inset:0} .modal{position:absolute;inset:24px}</style>
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
	await page.route("https://embed.diagrams.net/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: fakeDrawio }));
	await page.route(/^(?!file:|data:|about:|blob:|https:\/\/embed\.diagrams\.net\/)/, (route) => {
		external.push(route.request().url());
		return route.abort();
	});
	page.on("pageerror", (e) => problems.push(`実行時のエラー: ${e.message}`));
	await page.goto(`file://${out}${theme}.html`);
	return { page, external };
}

const drawioFrame = (page) => page.frames().find((f) => f.url().startsWith("https://embed.diagrams.net/"));

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

const XML2 = '<mxfile><diagram id="p1" name="1"><mxGraphModel><root><mxCell id="0"/></root></mxGraphModel></diagram><diagram id="p2" name="2"><mxGraphModel><root/></mxGraphModel></diagram></mxfile>';

// 1. 既にある図の編集と保存の往復
{
	const { page, external } = await open();
	await page.evaluate(() => window.dv.openEditor("asset/sys.drawio.svg"));
	await waitFor("編集: load", async () => (await drawioFrame(page)?.evaluate(() => window.received.length)) > 0);
	const frame = drawioFrame(page);
	const sandbox = await page.locator("iframe.vt-drawio-frame").getAttribute("sandbox");
	if (sandbox !== "allow-scripts allow-same-origin allow-forms") problems.push(`編集: sandbox が違う（${sandbox}）`);
	const load = await frame.evaluate(() => window.received[0]);
	if (load.action !== "load" || !load.xml.startsWith("<mxfile")) problems.push(`編集: 内包の XML を load していない（${JSON.stringify(load).slice(0, 80)}）`);

	// 別の origin の iframe から届いた save は受け取らない
	await page.evaluate((xml) => {
		const f = document.createElement("iframe");
		f.srcdoc = `<script>parent.postMessage(${JSON.stringify(JSON.stringify({ event: "save", xml, exit: false }))}, "*")</script>`;
		document.body.append(f);
	}, XML2);
	await page.waitForTimeout(300);
	if ((await frame.evaluate(() => window.received.length)) !== 1) problems.push("編集: 別の origin からの save で export を頼んだ");

	await frame.evaluate((xml) => window.send({ event: "save", xml, exit: false }), XML2);
	await waitFor("編集: 保存", async () => (await page.evaluate(() => window.dv.files()["asset/sys.drawio.svg"])).includes("&lt;diagram id=&quot;p2&quot;"));
	await waitFor("編集: 保存済みの通知", async () => (await frame.evaluate(() => window.received.length)) >= 5);
	const received = await frame.evaluate(() => window.received.map((m) => m.action));
	if (JSON.stringify(received) !== JSON.stringify(["load", "spinner", "export", "spinner", "status"])) problems.push(`編集: やり取りが違う（${received.join(", ")}）`);
	const exportMsg = await frame.evaluate(() => window.received.find((m) => m.action === "export"));
	if (exportMsg?.format !== "xmlsvg" || exportMsg?.xml !== XML2) problems.push("編集: 保存した XML を指定して xmlsvg を頼んでいない");

	// 編集中にファイルが変わった（同期など）→ 上書きせず、別名で保存
	await page.evaluate(() => window.dv.setFile("asset/sys.drawio.svg", '<svg xmlns="http://www.w3.org/2000/svg" content="&lt;mxfile/&gt;"/>'));
	await frame.evaluate((xml) => window.send({ event: "save", xml, exit: true }), XML2.replace('name="1"', 'name="一"'));
	await waitFor("衝突: 選ぶ画面", async () => (await page.locator("button", { hasText: "自分の版を別名で保存" }).count()) > 0);
	await page.locator("button", { hasText: "自分の版を別名で保存" }).click();
	await waitFor("衝突: 別名で保存", async () => Object.keys(await page.evaluate(() => window.dv.files())).some((p) => p.startsWith("asset/sys (編集 ")));
	const after = await page.evaluate(() => window.dv.files());
	if (after["asset/sys.drawio.svg"] !== '<svg xmlns="http://www.w3.org/2000/svg" content="&lt;mxfile/&gt;"/>') problems.push("衝突: 変わったファイルを上書きした");
	await waitFor("衝突: 保存して閉じる", async () => (await page.locator("iframe.vt-drawio-frame").count()) === 0);
	if (external.length > 0) problems.push(`編集: 外部への要求が出た: ${external.join(", ")}`);
	await page.close();
}

// 2. 新しい図
{
	const { page } = await open();
	await page.evaluate(() => window.dv.openEditor(null));
	await waitFor("新しい図: load", async () => (await drawioFrame(page)?.evaluate(() => window.received.length)) > 0);
	const frame = drawioFrame(page);
	const load = await frame.evaluate(() => window.received[0]);
	if (load.xml !== "") problems.push("新しい図: 空の図を load していない");
	await frame.evaluate((xml) => window.send({ event: "save", xml, exit: true }), XML2);
	await waitFor("新しい図: 作る", async () => (await page.evaluate(() => window.__actions)).includes("created:asset/new.drawio.svg"));
	await waitFor("新しい図: 閉じる", async () => (await page.locator("iframe.vt-drawio-frame").count()) === 0);
	await page.close();
}

// 3. 保存していない変更があるまま閉じると確かめる
{
	const { page } = await open();
	await page.evaluate(() => window.dv.openEditor("asset/sys.drawio.svg"));
	await waitFor("未保存: load", async () => (await drawioFrame(page)?.evaluate(() => window.received.length)) > 0);
	await drawioFrame(page).evaluate((xml) => window.send({ event: "autosave", xml }), XML2);
	await drawioFrame(page).evaluate(() => window.send({ event: "exit", modified: true }));
	await page.waitForTimeout(200);
	// exit は Draw.io の「閉じる」。Draw.io が確かめた後なので閉じる。Esc（Modal の close）は確かめる
	if ((await page.locator("iframe.vt-drawio-frame").count()) !== 0) problems.push("未保存: Draw.io の exit で閉じない");
	await page.evaluate(() => window.dv.openEditor("asset/sys.drawio.svg"));
	await waitFor("未保存: load 2", async () => (await drawioFrame(page)?.evaluate(() => window.received.length)) > 0);
	await drawioFrame(page).evaluate((xml) => window.send({ event: "autosave", xml }), XML2);
	await page.waitForTimeout(100);
	// Esc・× と同じ（Modal の close）
	await page.evaluate(() => window.__modal?.close());
	await waitFor("未保存: 確かめる", async () => (await page.locator("button", { hasText: "変更を捨てて閉じる" }).count()) > 0);
	if ((await page.locator("iframe.vt-drawio-frame").count()) !== 1) problems.push("未保存: 確かめる前に閉じた");
	await page.locator("button", { hasText: "編集に戻る" }).click();
	if ((await page.locator("iframe.vt-drawio-frame").count()) !== 1) problems.push("未保存: 編集に戻れない");
	await page.evaluate(() => window.__modal?.close());
	await page.locator("button", { hasText: "変更を捨てて閉じる" }).click();
	await waitFor("未保存: 捨てて閉じる", async () => (await page.locator("iframe.vt-drawio-frame").count()) === 0);
	if (!(await page.evaluate(() => window.dv.files()["asset/sys.drawio.svg"])).includes("ページ1")) problems.push("未保存: 捨てたのにファイルが変わった");
	await page.close();
}

// 4. 操作バー（スクリーンショットと描画した画面の検査）
for (const theme of ["light", "dark"]) {
	const { page, external } = await open(theme);
	await page.evaluate(() => window.dv.mountToolbar());
	await page.waitForTimeout(200);
	await page.hover("#img-plain");
	await page.waitForTimeout(400);
	if (await page.locator(".vt-drawio-toolbar").isVisible()) problems.push(`操作バー ${theme}: 普通の SVG に出た`);
	await page.hover("#img-drawio");
	const bar = page.locator(".vt-drawio-toolbar");
	if (!(await bar.isVisible())) problems.push(`操作バー ${theme}: 図に載せても出ない`);
	const img = await page.locator("#img-drawio").boundingBox();
	const box = await bar.boundingBox();
	if (!img || !box || box.x < img.x || box.x + box.width > img.x + img.width + 1 || box.y < img.y || box.y > img.y + 16) {
		problems.push(`操作バー ${theme}: 画像の右上にない（画像 ${JSON.stringify(img)}、バー ${JSON.stringify(box)}）`);
	}
	await page.locator(".vt-drawio-tool", { hasText: "コピー" }).hover();
	await page.waitForTimeout(400);
	if (!(await bar.isVisible())) problems.push(`操作バー ${theme}: バーに移ると消える`);
	await page.screenshot({ path: `${out}toolbar-${theme}.png`, clip: { x: 0, y: 0, width: 560, height: 420 } });
	for (const p of await page.evaluate(auditInPage, { rootSelector: ".vt-drawio-toolbar", targetMin })) problems.push(`操作バー ${theme}: [${p.rule}] ${p.where}: ${p.message}`);
	await page.locator(".vt-drawio-tool", { hasText: "コピー" }).click();
	await page.locator(".vt-drawio-tool", { hasText: "編集" }).click();
	const actions = await page.evaluate(() => window.__actions);
	if (JSON.stringify(actions) !== JSON.stringify(["copy:asset/sys.drawio.svg", "edit:asset/sys.drawio.svg"])) problems.push(`操作バー ${theme}: 押した結果が違う（${actions.join(", ")}）`);
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

// 5. PNG
{
	const { page } = await open();
	const png = await page.evaluate(() => window.dv.pngSize());
	if (png.width !== 242 || png.height !== 122 || png.bytes < 100) problems.push(`PNG: 大きさが違う（${JSON.stringify(png)}）`);
	await page.close();
}

await browser.close();

for (const p of [...new Set(problems)]) console.error(p);
if (problems.length > 0) {
	console.error(`pkm-drawio の preview: ${new Set(problems).size} 件の問題`);
	process.exit(1);
}
console.log("pkm-drawio の preview: 問題なし（編集の往復・origin・衝突・新しい図・操作バー・描画した画面の検査・PNG）");
