/**
 * vault-html の表示を、Obsidian なしで Chromium に出して確かめる（ADR-0037）。
 * - 悪い HTML: スクリプトが動かず、外部への要求が 1 つも出ない（取り除く処理を通したものと、通さず sandbox + CSP だけのもの）
 * - リンク: Vault の中・外部・見出しを親が扱い、iframe の中で遷移しない
 * - 画像: Vault の中の画像は出る。Vault の外・上限超え・外部は出ない
 * - 見本: ライト / ダーク × 広い / 狭いのスクリーンショットと、描画した画面の検査（docs/design.md）
 *
 * 使い方: pnpm --filter vault-html preview:ui  → preview/out/sample-<light|dark>(-narrow).png
 * 初回だけ Chromium を入れる: pnpm --filter vault-html exec playwright install chromium（入れられない環境では CHROMIUM_PATH）
 * CI では動かない（vault-task の preview:ui と同じ）
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
	loader: { ".css": "text", ".html": "text" },
	logLevel: "warning",
});

const targetMin = dimensionPx(resolveValue(readTokens(), "size.target-min", "light"));

for (const theme of ["light", "dark"]) {
	await writeFile(
		`${out}${theme}.html`,
		`<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../tokens.css"><link rel="stylesheet" href="../../styles.css">
<style>body{margin:0;padding:12px;display:flex;gap:12px;align-items:flex-start} #wide{width:900px;height:800px} #narrow{width:360px;height:800px}</style>
</head><body class="theme-${theme}"><div id="wide" class="vault-html-view"></div><div id="narrow" class="vault-html-view"></div><script src="fixture.js"></script></body></html>`,
	);
}

const { chromium } = createRequire(import.meta.url)("playwright");
// Playwright の版と違う Chromium しかない環境では、CHROMIUM_PATH でその実行ファイルを渡す
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const problems = [];

/**
 * ページを開き、file: と data: と about: 以外への要求で、ネットワークまで届いたものをすべて記録して止める。
 * CSP で止まった要求も Playwright の request イベントには出る（失敗の理由が csp）ので、route に届いたものだけを数える
 */
async function open(theme = "light") {
	const page = await browser.newPage({ viewport: { width: 1320, height: 840 } });
	const requests = [];
	await page.route(/^(?!file:|data:|about:|blob:)/, (route) => {
		requests.push(route.request().url());
		return route.abort();
	});
	// iframe の中からは、file: も読み込ませない（Vault の中の画像は data: に置き換えてある）
	page.on("request", (r) => {
		const url = r.url();
		if (url.startsWith("file:") && r.frame() !== page.mainFrame()) {
			r.response().then((res) => res && requests.push(url)).catch(() => {});
		}
	});
	page.on("pageerror", (e) => problems.push(`実行時のエラー: ${e.message}`));
	await page.goto(`file://${out}${theme}.html`);
	return { page, requests };
}

const frameOf = (page) => page.frames().find((f) => f !== page.mainFrame());

/** iframe の中の要素を押す。押せない（遷移して消えたなど）なら問題にする */
async function clickIn(where, page, selector) {
	try {
		await frameOf(page).locator(selector).click({ timeout: 2000 });
	} catch {
		problems.push(`${where}: ${selector} を押せない（iframe が遷移した可能性）`);
	}
}

async function expectQuiet(where, page, requests) {
	await page.waitForTimeout(1500);
	if (requests.length > 0) problems.push(`${where}: 外部への要求が出た: ${requests.join(", ")}`);
	const pwned = await page.evaluate(() => window.__pwned);
	if (pwned !== undefined) problems.push(`${where}: iframe の中のスクリプトが動いた（${pwned}）`);
	const url = frameOf(page)?.url();
	if (url !== "about:srcdoc") problems.push(`${where}: iframe が遷移した（${url}）`);
}

// 1. 悪い HTML（取り除く処理を通したもの）
{
	const { page, requests } = await open();
	await page.evaluate(() => window.vh.mount("evil", "light", "#wide"));
	const srcdoc = await page.evaluate(() => window.__srcdoc);
	for (const bad of ["<script", "onerror", "onload", "ontoggle", "javascript:", "http-equiv=\"refresh\"", "<base", "<link", "<iframe", "<object", "<embed", "<noscript"]) {
		if (srcdoc.includes(bad)) problems.push(`evil: srcdoc に ${bad} が残っている`);
	}
	if (!/^<!DOCTYPE html>\n<html><head><meta http-equiv="Content-Security-Policy"/.test(srcdoc)) problems.push("evil: CSP が <head> の最初にない");
	await clickIn("evil", page, "#submit");
	await clickIn("evil", page, "#ext");
	await expectQuiet("evil", page, requests);
	await page.close();
}

// 2. 悪い HTML（取り除く処理を通さず、sandbox + CSP だけ）
{
	const { page, requests } = await open();
	await page.evaluate(() => window.vh.mountRaw("evil", "#wide"));
	await page.waitForTimeout(300);
	for (const id of ["#submit", "#js", "#ext"]) await clickIn("evil（sandbox + CSP だけ）", page, id);
	await expectQuiet("evil（sandbox + CSP だけ）", page, requests);
	await page.close();
}

// 3. リンク
{
	const { page, requests } = await open();
	await page.evaluate(() => window.vh.mount("links", "light", "#wide"));
	await page.waitForTimeout(300);
	const frame = frameOf(page);
	for (const id of ["l-md", "l-root", "l-html", "l-ext", "l-mail", "l-js", "l-file", "l-outside", "l-blank"]) await clickIn("links", page, `#${id}`);
	const opened = await page.evaluate(() => window.__opened);
	const expected = [
		{ kind: "vault", candidates: ["topics/foo.md"], subpath: "#見出し" },
		{ kind: "vault", candidates: ["docs/topics/foo.md", "topics/foo.md"], subpath: "" },
		{ kind: "vault", candidates: ["docs/other.html", "other.html"], subpath: "" },
		{ external: "https://example.com/page" },
		{ external: "mailto:someone@example.com" },
		{ external: "https://example.com/blank" },
	];
	if (JSON.stringify(opened) !== JSON.stringify(expected)) problems.push(`links: 開いたものが違う: ${JSON.stringify(opened)}`);
	await clickIn("links", page, "#l-anchor");
	await page.waitForTimeout(200);
	const scrolled = await frame.evaluate(() => window.scrollY);
	if (!(scrolled > 0)) problems.push("links: 見出しへのリンクでスクロールしない");
	if (page.context().pages().length !== 1) problems.push("links: 新しいウィンドウが開いた");
	await expectQuiet("links", page, requests);
	await page.close();
}

// 4. 画像
{
	const { page, requests } = await open();
	await page.evaluate(() => window.vh.mount("images", "light", "#wide"));
	await page.waitForTimeout(500);
	const frame = frameOf(page);
	const state = await frame.evaluate(() =>
		Object.fromEntries(
			[...document.querySelectorAll("img")].map((img) => [img.id, { shown: img.naturalWidth > 0, data: (img.currentSrc || img.src).startsWith("data:") }]),
		),
	);
	for (const id of ["root", "rel", "svg", "srcset", "picture"]) {
		if (!state[id]?.shown || !state[id]?.data) problems.push(`images: ${id} が出ない（${JSON.stringify(state[id])}）`);
	}
	for (const id of ["outside", "big", "missing", "notimage", "ext"]) {
		if (state[id]?.shown || state[id]?.data) problems.push(`images: ${id} が出ている（${JSON.stringify(state[id])}）`);
	}
	await expectQuiet("images", page, requests);
	await page.close();
}

// 5. 見本: スクリーンショットと描画した画面の検査、テーマの付け直し
for (const theme of ["light", "dark"]) {
	const { page, requests } = await open(theme);
	await page.evaluate((t) => window.vh.mount("sample", t, "#wide"), theme);
	await page.waitForTimeout(300);
	await page.locator("#wide").screenshot({ path: `${out}sample-${theme}.png` });
	for (const p of await frameOf(page).evaluate(auditInPage, { rootSelector: "body", targetMin })) {
		problems.push(`sample ${theme} 広い: [${p.rule}] ${p.where}: ${p.message}`);
	}
	await page.evaluate((t) => window.vh.mount("sample", t, "#narrow"), theme);
	await page.waitForTimeout(300);
	await page.locator("#narrow").screenshot({ path: `${out}sample-${theme}-narrow.png` });
	for (const p of await frameOf(page).evaluate(auditInPage, { rootSelector: "body", targetMin })) {
		problems.push(`sample ${theme} 狭い: [${p.rule}] ${p.where}: ${p.message}`);
	}
	// Obsidian のテーマを切り替えたとき（css-change）と同じく付け直す
	const other = theme === "light" ? "dark" : "light";
	await page.evaluate((t) => window.vh.setTheme(t), other);
	const after = await frameOf(page).evaluate(() => ({ cls: document.body.className, scheme: getComputedStyle(document.documentElement).colorScheme }));
	if (after.cls !== `theme-${other}` || after.scheme !== other) problems.push(`sample: テーマを付け直せない（${JSON.stringify(after)}）`);
	await expectQuiet(`sample ${theme}`, page, requests);
	await page.close();
	console.log(`${out}sample-${theme}(-narrow).png`);
}

await browser.close();

for (const p of [...new Set(problems)]) console.error(p);
if (problems.length > 0) {
	console.error(`vault-html の preview: ${new Set(problems).size} 件の問題`);
	process.exit(1);
}
console.log("vault-html の preview: 問題なし（スクリプト・外部への要求・遷移・リンク・画像・描画した画面の検査）");
