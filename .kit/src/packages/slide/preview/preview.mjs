/**
 * スライドの閲覧の画面を、ビルド済みの CLI（.kit/bin/slide.mjs）で作った index.html を Chromium で開いて確かめる（ADR-0117）。
 * - 見本: スキルの patterns/*.md のひな形を全部並べたデッキ。ライト / ダーク × 投影用 / 読む用で、はみ出しがないこと
 * - 外部への要求が出ない、実行時のエラーがない
 * - Slide Show: 矢印キーでスライドとステップが前後し、Esc で一覧に戻る
 * - PDF: 印刷した PDF が 1 枚 1 ページで、文字を取り出せる
 * - レビュー: 部品を選んでコメントし、レポートがクリップボードに入る。作り直すと Updated が出る
 * - 発表者ビュー: どちらで送っても同期する
 * - スクリプトなし: 全スライドが読める
 *
 * 使い方: pnpm --filter slide preview:ui  → preview/out/*.png（目で確かめる一覧は sheet-*.png）
 * 初回だけ Chromium を入れる: pnpm --filter slide exec playwright install chromium（入れられない環境では CHROMIUM_PATH）
 * CI では動かない（pkm-task の preview:ui と同じ）
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PATTERN_DOCS, writeGallery } from "./gallery.mjs";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = join(here, "out");
const vault = join(out, "vault");
const cli = fileURLToPath(new URL("../../../../bin/slide.mjs", import.meta.url));
rmSync(out, { recursive: true, force: true });
mkdirSync(vault, { recursive: true });

const ids = [...readFileSync(join(here, "../src/core/patterns.ts"), "utf8").matchAll(/\{ id: "([a-z0-9-]+)"/g)].map((m) => m[1]);
const problems = [];
const check = (ok, message) => {
	if (!ok) problems.push(message);
};
const build = (deck) => {
	const r = spawnSync(process.execPath, [cli, "build", `slide/${deck}`], { cwd: vault, encoding: "utf8" });
	check(r.status === 0, `${deck} をビルドできない: ${r.stdout}${r.stderr}`);
	return r.stdout;
};

const variants = [
	["light-present", ""],
	["dark-present", '<meta name="deck-theme" content="dark">'],
	["light-read", '<meta name="deck-density" content="read">'],
	["brand", '<meta name="deck-primary" content="#0b57d0">'],
];
for (const [name, head] of variants) {
	writeGallery(vault, ids, { name, head });
	const log = build(name);
	if (name === "light-present") check(!log.includes("警告"), `ひな形に規約の警告がある:\n${log}`);
}
const urlOf = (deck) => pathToFileURL(join(vault, "slide", deck, "index.html")).href;

const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

async function open(deck, options = {}) {
	const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, ...options });
	const page = await context.newPage();
	const requests = [];
	await context.route(/^(?!file:|data:|about:|blob:)/, (route) => {
		requests.push(route.request().url());
		return route.abort();
	});
	page.on("pageerror", (e) => problems.push(`${deck}: 実行時のエラー: ${e.message}`));
	page.on("console", (m) => m.type() === "error" && problems.push(`${deck}: コンソールのエラー: ${m.text()}`));
	await page.goto(urlOf(deck));
	return { page, context, requests };
}

/** スライドの枠から中身がはみ出していないか */
const overflowInPage = () =>
	[...document.querySelectorAll(".slide")]
		.map((slide, i) => {
			const r = slide.getBoundingClientRect();
			const bad = new Set();
			for (const el of slide.querySelectorAll(".sl-head *, .sl-body *, .sl-foot *")) {
				if (el.closest("svg") && el.tagName !== "svg") continue;
				const e = el.getBoundingClientRect();
				if (e.width === 0) continue;
				if (e.bottom > r.bottom + 1 || e.right > r.right + 1 || e.top < r.top - 1 || e.left < r.left - 1) bad.add(`${el.tagName.toLowerCase()}.${el.className}`);
			}
			const body = slide.querySelector(".sl-body");
			if (body.scrollHeight > body.clientHeight + 1) bad.add("本文が枠より高い");
			return bad.size > 0 ? `${i + 1} ${slide.dataset.pattern}: ${[...bad].join(", ")}` : null;
		})
		.filter(Boolean);

// ---- 見本: はみ出し、外部への要求、スクリーンショット
for (const [name] of variants) {
	const { page, context, requests } = await open(name);
	check((await page.locator(".sl-cell").count()) === ids.length, `${name}: スライドの数が違う`);
	const overflow = await page.evaluate(overflowInPage);
	check(overflow.length === 0, `${name}: はみ出し: ${overflow.join(" / ")}`);
	check(requests.length === 0, `${name}: 外部への要求: ${requests.join(", ")}`);
	const images = await page.evaluate(() => [...document.querySelectorAll(".slide img")].filter((i) => !i.complete || i.naturalWidth === 0).length);
	check(images === 0, `${name}: 表示できない画像が ${images} 個ある（CSP か添付のパス）`);
	await page.screenshot({ path: join(out, `overview-${name}.png`) });
	// 1 枚ずつ（ステップをすべて出した状態）
	for (let i = 0; i < ids.length; i++) {
		await page.goto(`${urlOf(name)}#/${i + 1}`);
		await page.reload();
		await page.addStyleTag({ content: ".sl-show .slide [data-step]{opacity:1!important;transform:none!important;transition:none!important}" });
		await page.screenshot({ path: join(out, `${name}-${String(i + 1).padStart(2, "0")}-${ids[i]}.png`) });
	}
	// 目で確かめる一覧（9 枚ずつ）
	for (let k = 0; k * 9 < ids.length; k++) {
		const part = ids.slice(k * 9, k * 9 + 9).map((id, j) => `${name}-${String(k * 9 + j + 1).padStart(2, "0")}-${id}.png`);
		writeFileSync(join(out, "sheet.html"), `<body style="margin:0;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;background:#333">${part.map((f) => `<img src="${f}" style="width:100%">`).join("")}</body>`);
		const sheet = await context.newPage();
		await sheet.setViewportSize({ width: 1920, height: 1090 });
		await sheet.goto(pathToFileURL(join(out, "sheet.html")).href);
		await sheet.screenshot({ path: join(out, `sheet-${name}-${k + 1}.png`) });
		await sheet.close();
	}
	await context.close();
}
check(
	(await (async () => {
		const { page, context } = await open("brand");
		const color = await page.evaluate(() => getComputedStyle(document.querySelector(".slide")).getPropertyValue("--sl-primary").trim());
		await context.close();
		return color;
	})()) === "#0b57d0",
	"brand: deck-primary が効いていない",
);

// ---- Slide Show: 矢印キーでスライドとステップが前後する
{
	const { page, context } = await open("light-present");
	const state = () =>
		page.evaluate(() => ({
			show: document.documentElement.classList.contains("sl-show"),
			n: Number(document.querySelector(".sl-current")?.dataset.n ?? 0),
			on: document.querySelectorAll(".sl-current [data-step].sl-on").length,
			steps: document.querySelectorAll(".sl-current [data-step]").length,
			visible: [...document.querySelectorAll(".sl-cell")].filter((c) => c.offsetParent !== null).length,
		}));
	await page.getByRole("button", { name: "Slide Show" }).click();
	let s = await state();
	check(s.show && s.n === 1 && s.visible === 1, `Slide Show が 1 枚目から始まらない: ${JSON.stringify(s)}`);
	const frame = await page.locator(".sl-current .sl-frame").boundingBox();
	check(Math.abs(frame.width - 1280) < 2 && Math.abs(frame.height - 720) < 2, `Slide Show で画面いっぱいにならない: ${JSON.stringify(frame)}`);
	await page.keyboard.press("ArrowRight");
	check((await state()).n === 2, "→ で次のスライドに進まない");
	await page.keyboard.press("ArrowLeft");
	check((await state()).n === 1, "← で前のスライドに戻らない");
	// ステップのあるスライド（assertion-evidence: 2 ステップ）
	const target = ids.indexOf("assertion-evidence") + 1;
	await page.evaluate((n) => (location.hash = `#/${n}`), target);
	await page.reload();
	s = await state();
	check(s.n === target && s.steps === 2 && s.on === 0, `ステップが最初は隠れていない: ${JSON.stringify(s)}`);
	const hidden = await page.evaluate(() => getComputedStyle(document.querySelector(".sl-current [data-step]")).opacity);
	check(hidden === "0", `隠れているステップの opacity が 0 でない: ${hidden}`);
	await page.keyboard.press("ArrowRight");
	check((await state()).on === 1 && (await state()).n === target, "→ で 1 つ目のステップが出ない");
	await page.keyboard.press("ArrowDown");
	check((await state()).on === 2, "↓ で 2 つ目のステップが出ない");
	await page.keyboard.press("ArrowRight");
	check((await state()).n === target + 1, "ステップを出し切った後の → で次のスライドに進まない");
	await page.keyboard.press("ArrowLeft");
	s = await state();
	check(s.n === target && s.on === 2, `← で戻ると、ステップをすべて出した状態にならない: ${JSON.stringify(s)}`);
	await page.keyboard.press("ArrowUp");
	check((await state()).on === 1, "↑ でステップが 1 つ戻らない");
	await page.keyboard.press("End");
	check((await state()).n === ids.length, "End で最後のスライドに行かない");
	await page.keyboard.press("Home");
	check((await state()).n === 1, "Home で最初のスライドに行かない");
	await page.keyboard.press("Escape");
	s = await state();
	check(!s.show && s.visible === ids.length, `Esc で一覧に戻らない: ${JSON.stringify(s)}`);
	// 一覧のスライドを押すと、そこから始まる
	await page.locator("#s3 .sl-frame").click();
	check((await state()).n === 3 && (await state()).show, "一覧のスライドを押しても、そこから始まらない");
	await context.close();
}

// ---- PDF: 1 枚 1 ページで、文字を取り出せる（Download as PDF はブラウザの印刷を開く。ここでは同じ印刷の結果を PDF にする）
{
	const { page, context } = await open("light-present");
	const pdf = join(out, "deck.pdf");
	await page.pdf({ path: pdf, preferCSSPageSize: true, printBackground: true });
	const info = spawnSync("pdfinfo", [pdf], { encoding: "utf8" });
	const text = spawnSync("pdftotext", [pdf, "-"], { encoding: "utf8" });
	if (info.status !== 0 || text.status !== 0) {
		console.log("注意: pdfinfo / pdftotext がないので、PDF の中身を確かめなかった");
	} else {
		const pages = Number(/Pages:\s+(\d+)/.exec(info.stdout)?.[1] ?? 0);
		check(pages === ids.length, `PDF のページ数がスライドの数と違う: ${pages} / ${ids.length}`);
		check(/Page size:\s+960 x 540 pts/.test(info.stdout), `PDF の用紙がスライドの大きさでない: ${/Page size:.*/.exec(info.stdout)?.[0]}`);
		const flat = text.stdout.replace(/\s+/g, "");
		for (const phrase of ["担当が決まるまでの待ちが、応答時間の7割を占める", "受付から担当の決定まで2時間50分", "導入した週に50分へ"]) {
			check(flat.includes(phrase), `PDF から文字を取り出せない: ${phrase}`);
		}
		check(!flat.includes("SlideShow") && !flat.includes("DownloadasPDF"), "PDF にボタンが入っている");
	}
	await context.close();
}

// ---- CLI の pdf（Chrome 系のブラウザを直接動かす）
{
	const r = spawnSync(process.execPath, [cli, "pdf", "slide/light-present"], { cwd: vault, encoding: "utf8", env: { ...process.env, CHROME_PATH: process.env.CHROMIUM_PATH ?? chromium.executablePath() } });
	check(r.status === 0 && r.stdout.trim() === "tmp/light-present.pdf", `slide.mjs pdf が失敗した: ${r.stdout}${r.stderr}`);
	if (r.status === 0) {
		const info = spawnSync("pdfinfo", [join(vault, "tmp/light-present.pdf")], { encoding: "utf8" });
		if (info.status === 0) check(Number(/Pages:\s+(\d+)/.exec(info.stdout)?.[1] ?? 0) === ids.length, `slide.mjs pdf のページ数が違う: ${info.stdout}`);
	}
}

// ---- レビュー: 部品を選んでコメントし、レポートをコピーする。作り直すと、変わったところが分かる
{
	const { page, context } = await open("light-present", { permissions: ["clipboard-read", "clipboard-write"] });
	await page.getByRole("button", { name: "Review" }).click();
	check(await page.locator(".sl-panel").isVisible(), "Review を押してもコメントの欄が出ない");
	const target = ids.indexOf("assertion-evidence") + 1;
	await page.locator(`#s${target} h2`).click();
	check(!(await page.evaluate(() => document.documentElement.classList.contains("sl-show"))), "レビュー中にスライドを押すと Slide Show が始まる");
	await page.locator(".sl-note-input").fill("「7 割」ではなく、時間（2 時間 50 分）で言いたい");
	await page.getByRole("button", { name: "Add" }).click();
	await page.locator(`#s${target} li`).first().click();
	await page.locator(".sl-note-input").fill("この項目は要らない");
	await page.keyboard.press("Control+Enter");
	await page.getByRole("button", { name: "Whole deck" }).click();
	await page.locator(".sl-note-input").fill("全体に、数字の出典をそろえたい");
	await page.getByRole("button", { name: "Add" }).click();
	check((await page.locator(".sl-comment").count()) === 3, "コメントが 3 件にならない");
	check((await page.locator(".sl-pin").count()) === 2, "スライドの上の番号の印が 2 つにならない");
	await page.screenshot({ path: join(out, "review.png") });
	await page.getByRole("button", { name: "Copy review" }).click();
	const report = await page.evaluate(() => navigator.clipboard.readText());
	writeFileSync(join(out, "review.md"), report);
	const line = readFileSync(join(vault, "slide/light-present/deck.html"), "utf8").split("\n").findIndex((l) => l.includes("<h2>担当が決まるまでの待ちが")) + 1;
	for (const expected of [
		"# スライドのレビュー: slide/light-present/deck.html",
		"コメント: 3 件",
		"## デッキ全体",
		`## スライド ${target}「担当が決まるまでの待ちが、応答時間の 7 割を占める」`,
		`\`h2\`「担当が決まるまでの待ちが、応答時間の 7 割を占める」（deck.html:${line}）`,
		"「7 割」ではなく、時間（2 時間 50 分）で言いたい",
		"`li`「受付から担当の決定まで 2 時間 50 分」",
		"node .kit/bin/slide.mjs build slide/light-present",
	]) {
		check(report.includes(expected), `レポートに「${expected}」がない:\n${report}`);
	}

	// 見出しを直してビルドし直す → 再読み込みで、レビューの画面のまま、変わったスライドとコメントが分かる
	const deck = join(vault, "slide/light-present/deck.html");
	writeFileSync(deck, readFileSync(deck, "utf8").replace("担当が決まるまでの待ちが、応答時間の 7 割を占める", "担当が決まるまでに、2 時間 50 分待っている"));
	build("light-present");
	await page.reload();
	check(await page.locator(".sl-panel").isVisible(), "再読み込みでレビューの画面に戻らない");
	check((await page.locator(".sl-comment").count()) === 3, "再読み込みでコメントが残らない");
	check((await page.locator(".sl-badge").count()) === 1 && (await page.locator(`#s${target} .sl-badge`).count()) === 1, "変わったスライドに Updated が付かない");
	check(await page.locator(".sl-updated").isVisible(), "前回から変わったことの知らせが出ない");
	check((await page.locator(".sl-comment .sl-tag").count()) === 1, "変わった部品のコメントに Updated が付かない");
	await page.screenshot({ path: join(out, "review-updated.png") });
	await page.locator(".sl-comment").filter({ hasText: "この項目は要らない" }).getByRole("button", { name: "Done" }).click();
	check((await page.locator(".sl-comment").count()) === 2, "Done でコメントが消えない");
	await page.getByRole("button", { name: "Mark as seen" }).click();
	await page.reload();
	check((await page.locator(".sl-badge").count()) === 0, "Mark as seen の後も Updated が出る");
	await context.close();
}

// ---- 発表者ビュー: 本体と同期する
{
	const { page, context } = await open("light-present");
	const popup = context.waitForEvent("page");
	await page.getByRole("button", { name: "Presenter" }).click();
	const presenter = await popup;
	await presenter.waitForSelector(".sl-clock");
	await page.getByRole("button", { name: "Slide Show" }).click();
	await page.keyboard.press("ArrowRight");
	await presenter.waitForFunction(() => document.querySelector(".sl-current")?.dataset.n === "2");
	check((await presenter.locator(".sl-next").getAttribute("data-n")) === "3", "発表者ビューに次のスライドが出ない");
	check(await presenter.locator(".sl-current .sl-notes").isVisible(), "発表者ビューにノートが出ない");
	await presenter.keyboard.press("ArrowRight");
	await page.waitForFunction(() => document.querySelector(".sl-current")?.dataset.n === "3");
	await presenter.screenshot({ path: join(out, "presenter.png") });
	await context.close();
}

// ---- スクリプトなし（Obsidian の中の pkm-html と同じ）: 全スライドとノートが読める
{
	const { page, context } = await open("light-present", { javaScriptEnabled: false });
	check((await page.locator(".sl-cell:visible").count()) === ids.length, "スクリプトなしで全スライドが見えない");
	check((await page.locator("button").count()) === 0, "スクリプトなしで、押せないボタンが出ている");
	check(await page.locator(".sl-notes").first().isVisible(), "スクリプトなしで発表者ノートが見えない");
	const stepOpacity = await page.evaluate(() => getComputedStyle(document.querySelector("[data-step]")).opacity);
	check(stepOpacity === "1", "スクリプトなしでステップが隠れている");
	await page.screenshot({ path: join(out, "no-script.png") });
	await context.close();
}

// ---- 書き出し（外部に渡す 1 ファイル）: 添付が埋め込まれ、デッキのフォルダの外でも画像が出る
{
	const r = spawnSync(process.execPath, [cli, "export", "slide/dark-present"], { cwd: vault, encoding: "utf8" });
	check(r.status === 0 && r.stdout.trim() === "tmp/dark-present.html", `slide.mjs export が失敗した: ${r.stdout}${r.stderr}`);
	const context = await browser.newContext();
	const page = await context.newPage();
	await page.goto(pathToFileURL(join(vault, "tmp/dark-present.html")).href);
	const broken = await page.evaluate(() => [...document.querySelectorAll(".slide img")].filter((i) => !i.src.startsWith("data:") || i.naturalWidth === 0).length);
	check(broken === 0, `書き出したファイルで、埋め込まれていない画像が ${broken} 個ある`);
	await context.close();
}

await browser.close();
check(execFileSync(process.execPath, [cli, "check"], { cwd: vault, encoding: "utf8" }).includes("4 個のデッキを確かめた"), "slide.mjs check が通らない");
console.log(`ひな形: ${PATTERN_DOCS}\n出力: ${out}`);
if (problems.length > 0) {
	console.error(`\n問題 ${problems.length} 件:\n- ${problems.join("\n- ")}`);
	process.exit(1);
}
console.log("slide preview: すべて確かめた");
