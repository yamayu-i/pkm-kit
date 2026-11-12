/**
 * deck.html（ソース）から index.html（共通の CSS とスクリプトを入れた、ブラウザで開くもの）を作る（ADR-0117）。
 * 同じ入力からは同じバイト列になる（日時を入れない）。ファイルの読み書きとハッシュの計算（Node の API）は呼ぶ側（cli/slide.ts）が渡す
 */
import { stripDangerous } from "../../../pkm-html/src/core/sanitize.ts";
import { derivePrimary, isColorValue, lightenForDark, type Mode, type PrimaryColors } from "./color.ts";
import { findPattern, PATTERN_IDS, type Pattern } from "./patterns.ts";

/** index.html に入れる共通のもの（esbuild.config.mjs が作る） */
export interface Assets {
	tokensCss: string;
	css: string;
	runtime: string;
}

export interface Problem {
	level: "error" | "warning";
	rule: string;
	/** deck.html の行（1 始まり。分からなければ 0） */
	line: number;
	/** スライドの番号（1 始まり。デッキ全体のことなら 0） */
	slide: number;
	message: string;
}

export interface BuildInput {
	source: string;
	/** Vault のルートから見たデッキのフォルダ（slide/foo。レビューのレポートに出す） */
	deckPath: string;
	assets: Assets;
	/** デッキのフォルダから見たパスに、ファイルがあるか */
	exists: (relativePath: string) => boolean;
	parse: (html: string) => Document;
	/** SHA-256（スライドのハッシュは hex、CSP は base64） */
	sha256: Sha256;
}

export type Sha256 = (text: string, encoding: "hex" | "base64") => string;

export interface BuildResult {
	/** エラーがあれば null */
	html: string | null;
	problems: Problem[];
	title: string;
	slides: number;
}

export const DENSITIES = ["present", "read"] as const;
export type Density = (typeof DENSITIES)[number];

/** 文字の量の目安（全角 1 文字 = 1、半角 = 0.5）。値の出どころは design.md「スライド」とスキルの conventions.md */
export const LIMITS: Readonly<Record<Density, { headline: number; item: number; slide: number }>> = {
	present: { headline: 52, item: 44, slide: 140 },
	read: { headline: 80, item: 90, slide: 500 },
};
/** 1 つのリストの項目と、階層の深さの上限（conventions.md の C4） */
export const MAX_ITEMS = 4;
export const MAX_LIST_DEPTH = 2;

const LINE_ATTR = "data-l";
/** インラインの style に書いてよいのは、部品のつまみ（--v、--x、--y）だけ */
const STYLE_OK = /^(?:\s*--[a-z][a-z0-9-]*\s*:\s*-?[0-9.]+%?\s*;?)*\s*$/;
const SELECTABLE_METAS = ["deck-density", "deck-theme", "deck-primary", "deck-primary-dark", "deck-author", "deck-date", "deck-lang"];

/** 開始タグに deck.html の行番号を付ける（レビューのレポートで、直す場所を指すため） */
export function stampLines(source: string): string {
	let line = 1;
	let last = 0;
	let out = "";
	const re = /<!--[\s\S]*?-->|<([a-zA-Z][a-zA-Z0-9-]*)(?=[\s>/])/g;
	for (let m = re.exec(source); m !== null; m = re.exec(source)) {
		const before = source.slice(last, m.index);
		line += count(before, "\n");
		out += before + m[0];
		if (m[1] !== undefined) out += ` ${LINE_ATTR}="${line}"`;
		line += count(m[0], "\n");
		last = m.index + m[0].length;
	}
	return out + source.slice(last);
}

function count(text: string, ch: string): number {
	let n = 0;
	for (let i = text.indexOf(ch); i !== -1; i = text.indexOf(ch, i + 1)) n++;
	return n;
}

export function escapeHtml(text: string): string {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** 全角 1 文字 = 1、半角 = 0.5 で数えた文字の幅 */
export function textWidth(text: string): number {
	let w = 0;
	for (const ch of text.replace(/\s+/g, " ").trim()) w += (ch.codePointAt(0) as number) < 0x2000 ? 0.5 : 1;
	return w;
}

function lineOf(el: Element | null): number {
	return Number(el?.getAttribute(LINE_ATTR) ?? 0) || 0;
}

function closestClass(el: Element, name: string, stop: Element): boolean {
	for (let cur: Element | null = el; cur !== null && cur !== stop; cur = cur.parentElement) if (hasClass(cur, name)) return true;
	return false;
}

function hasClass(el: Element, name: string): boolean {
	return (el.getAttribute("class") ?? "").split(/\s+/).includes(name);
}

/** デッキのフォルダの外に出ないか（.. で上がらない、絶対パスでない） */
function insideDeck(ref: string): boolean {
	if (ref.startsWith("/") || ref.startsWith("\\") || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(ref)) return false;
	let depth = 0;
	for (const part of ref.split(/[\\/]/)) {
		if (part === "..") depth--;
		else if (part !== "." && part !== "") depth++;
		if (depth < 0) return false;
	}
	return true;
}

interface Slide {
	n: number;
	pattern: string;
	line: number;
	title: string;
	html: string;
	notes: string;
	hash: string;
}

export function buildDeck(input: BuildInput): BuildResult {
	const problems: Problem[] = [];
	const report = (level: Problem["level"], rule: string, el: Element | null, slide: number, message: string) => {
		problems.push({ level, rule, line: lineOf(el), slide, message });
	};
	const doc = input.parse(`<!DOCTYPE html><html><head></head><body>${stampLines(input.source)}</body></html>`);
	const body = doc.body;

	// ---- デッキの設定（<title> と <meta name="deck-…">）
	const titleEl = body.querySelector("title");
	const title = (titleEl?.textContent ?? "").trim();
	if (title === "") report("error", "no-title", titleEl, 0, "<title> がない。デッキの題を書く");
	titleEl?.remove();
	const meta = new Map<string, string>();
	for (const el of [...body.querySelectorAll("meta[name]")]) {
		const name = el.getAttribute("name") ?? "";
		if (SELECTABLE_METAS.includes(name)) meta.set(name, (el.getAttribute("content") ?? "").trim());
		else report("warning", "unknown-meta", el, 0, `知らない <meta name="${name}">（使えるのは ${SELECTABLE_METAS.join("、")}）`);
		el.remove();
	}
	const density = (meta.get("deck-density") ?? "present") as Density;
	if (!DENSITIES.includes(density)) report("error", "bad-meta", null, 0, `deck-density は ${DENSITIES.join(" か ")}: ${density}`);
	const theme = (meta.get("deck-theme") ?? "light") as Mode;
	if (theme !== "light" && theme !== "dark") report("error", "bad-meta", null, 0, `deck-theme は light か dark: ${theme}`);
	const lang = meta.get("deck-lang") ?? "ja";
	const primaryCss = primaryOverride(meta, (message) => report("error", "primary-contrast", null, 0, message));
	const limits = LIMITS[DENSITIES.includes(density) ? density : "present"];

	// ---- 書いてはいけないもの。スクリプトなどは取り除く（pkm-html と同じ処理）
	for (const el of [...body.querySelectorAll("script")]) report("warning", "script-removed", el, 0, "<script> は取り除く（動くのは共通のスクリプトだけ）");
	for (const el of [...body.querySelectorAll("style")]) {
		report("error", "style-element", el, 0, "<style> を書かない。部品のクラスと色の名前のクラスだけで書く");
		el.remove();
	}
	for (const el of [...body.querySelectorAll("link, iframe, object, embed, video, audio")]) {
		report("error", "external-resource", el, 0, `<${el.tagName.toLowerCase()}> は使えない（外部の読み込みと埋め込みをしない）`);
	}
	stripDangerous(doc);

	// ---- スライド
	const slides: Slide[] = [];
	for (const el of [...body.childNodes]) {
		if (el.nodeType === 3) {
			if ((el.textContent ?? "").trim() !== "") report("error", "outside-section", null, 0, `<section> の外に文字がある: ${(el.textContent ?? "").trim().slice(0, 30)}`);
			continue;
		}
		if (el.nodeType !== 1) continue;
		const section = el as Element;
		if (section.tagName.toLowerCase() !== "section") {
			report("error", "outside-section", section, 0, `<section> の外に <${section.tagName.toLowerCase()}> がある。スライドは <section data-pattern="…"> で書く`);
			continue;
		}
		slides.push(buildSlide(section, slides.length + 1, limits, input, report));
	}
	if (slides.length === 0) report("error", "no-slides", null, 0, "スライド（<section data-pattern=\"…\">）が 1 枚もない");

	if (problems.some((p) => p.level === "error")) return { html: null, problems, title, slides: slides.length };

	const html = page({ title, lang, theme, density, deckPath: input.deckPath, author: meta.get("deck-author") ?? "", date: meta.get("deck-date") ?? "", primaryCss, slides, assets: input.assets, sha256: input.sha256 });
	return { html, problems, title, slides: slides.length };
}

function primaryOverride(meta: ReadonlyMap<string, string>, fail: (message: string) => void): string {
	const light = meta.get("deck-primary");
	const darkGiven = meta.get("deck-primary-dark");
	if (light === undefined) {
		if (darkGiven !== undefined) fail("deck-primary-dark は deck-primary と一緒に書く");
		return "";
	}
	for (const [name, value] of [["deck-primary", light], ["deck-primary-dark", darkGiven]] as const) {
		if (value !== undefined && !isColorValue(value)) {
			fail(`${name} は #RRGGBB で書く: ${value}`);
			return "";
		}
	}
	const rule = (selector: string, c: PrimaryColors) =>
		`${selector}{--sl-primary:${c.primary};--sl-on-primary:${c.onPrimary};--sl-primary-container:${c.container};--sl-on-primary-container:${c.onContainer}}`;
	const l = derivePrimary(light, "light");
	const d = derivePrimary(darkGiven ?? lightenForDark(light), "dark");
	if ("error" in l) fail(`deck-primary: ${l.error}`);
	if ("error" in d) fail(`deck-primary-dark: ${d.error}`);
	if ("error" in l || "error" in d) return "";
	return `${rule(".slide", l)}\n${rule(':root[data-theme="dark"] .slide', d)}\n`;
}

type Report = (level: Problem["level"], rule: string, el: Element | null, slide: number, message: string) => void;

function buildSlide(section: Element, n: number, limits: (typeof LIMITS)[Density], input: BuildInput, report: Report): Slide {
	const id = section.getAttribute("data-pattern") ?? "";
	let pattern: Pattern | undefined;
	if (id === "") report("error", "no-pattern", section, n, "data-pattern がない。パターンの id を書く（node .kit/bin/slide.mjs patterns で一覧）");
	else if (!PATTERN_IDS.has(id)) report("error", "unknown-pattern", section, n, `知らないパターン: ${id}（node .kit/bin/slide.mjs patterns で一覧）`);
	else pattern = findPattern(id);
	for (const nested of [...section.querySelectorAll("section")]) report("error", "nested-section", nested, n, "<section> の中に <section> を書かない");

	// 発表者ノートは外に出す
	const notes: string[] = [];
	for (const el of [...section.querySelectorAll("aside")].filter((a) => hasClass(a, "notes"))) {
		notes.push(el.innerHTML.trim());
		el.remove();
	}

	// 値の直書き、デッキの外の添付
	for (const el of [...section.querySelectorAll("[style]")]) {
		if (!STYLE_OK.test(el.getAttribute("style") ?? "")) {
			report("error", "style-value", el, n, `style に書いてよいのは部品のつまみ（--v、--x、--y）だけ: ${el.getAttribute("style")}`);
		}
	}
	for (const el of [...section.querySelectorAll("font, center, [color], [bgcolor], [face]")]) report("error", "style-value", el, n, "色や書体を属性で指定しない。色の名前のクラスを使う");
	for (const el of [...section.querySelectorAll("img, image, source, use")]) {
		const attr = ["src", "href", "xlink:href", "srcset"].find((a) => el.hasAttribute(a));
		if (attr === undefined) continue;
		const ref = el.getAttribute(attr) ?? "";
		if (ref.startsWith("#") || /^data:image\//i.test(ref)) continue;
		const path = decodeURI(ref.split(/[?#]/)[0] as string);
		if (attr === "srcset" || !insideDeck(ref)) report("error", "asset-outside", el, n, `添付はデッキのフォルダに置き、相対パスで書く: ${ref}`);
		else if (!input.exists(path)) report("error", "asset-missing", el, n, `添付がない: ${ref}`);
		if (el.tagName.toLowerCase() === "img" && (el.getAttribute("alt") ?? "").trim() === "") report("warning", "no-alt", el, n, "<img> に alt（何の画像か）を書く");
	}
	for (const a of [...section.querySelectorAll("a[href]")]) {
		if (/^https?:/i.test(a.getAttribute("href") ?? "")) {
			a.setAttribute("target", "_blank");
			a.setAttribute("rel", "noopener noreferrer");
		}
	}

	// 見出しのまとまり・本文・出典に分ける
	const children = [...section.children];
	const heading = children.find((c) => /^h[12]$/i.test(c.tagName)) ?? null;
	const headTitle = (heading?.textContent ?? "").replace(/\s+/g, " ").trim();
	if (heading === null || headTitle === "") report("error", "no-heading", section, n, "見出し（<h2>。表紙は <h1>）がない。見出しは主張の文にする");
	const head: Element[] = [];
	const main: Element[] = [];
	const foot: Element[] = [];
	// .kicker は見出しの前、.lead は見出しのすぐ後にあるときだけ、見出しのまとまりに入れる（本文の中の .lead はその場に残す）
	let afterHeading = false;
	for (const c of children) {
		const inHead =
			c === heading ||
			pattern?.headOnly === true ||
			(hasClass(c, "kicker") && !afterHeading && main.length === 0) ||
			(hasClass(c, "lead") && afterHeading && main.length === 0);
		if (hasClass(c, "source")) foot.push(c);
		else if (inHead) head.push(c);
		else main.push(c);
		if (c === heading) afterHeading = true;
	}
	if (pattern?.headOnly === true) {
		const extra = head.find((c) => c !== heading && !["kicker", "lead", "meta"].some((k) => hasClass(c, k)));
		if (extra !== undefined) report("error", "pattern-structure", extra, n, `${id} は見出し・.kicker・.lead・.meta だけで作る。ほかの中身を置くなら別のパターンにする`);
	}
	if (pattern?.requires !== undefined && section.querySelector(pattern.requires) === null) {
		report("error", "pattern-structure", section, n, `${id} には ${pattern.requires} が要る（スキルの patterns/${id}.md のひな形）`);
	}

	lintSlide(section, n, heading, pattern, limits, report);
	normalizeSteps(section);
	stampFit(section);

	const outer = (els: Element[]) => els.map((e) => e.outerHTML).join("\n");
	const inner = [
		`<header class="sl-head">${outer(head)}</header>`,
		`<div class="sl-body">${outer(main)}</div>`,
		`<footer class="sl-foot">${outer(foot)}<span class="sl-page">${n}</span></footer>`,
	].join("\n");
	const line = lineOf(section);
	const html = `<section class="slide" data-pattern="${escapeHtml(id)}" ${LINE_ATTR}="${line}">\n${inner}\n</section>`;
	// 変わったスライドを見分けるハッシュ。行がずれただけでは変えない
	const hash = input.sha256(`${id}\n${inner.replace(new RegExp(` ${LINE_ATTR}="\\d+"`, "g"), "")}\n${notes.join("\n")}`, "hex").slice(0, 10);
	return { n, pattern: id, line, title: headTitle, html, notes: notes.join("\n"), hash };
}

/** 語の途中で折り返さない（ここで切らない）ひとまとまり: 漢字・カタカナ・英数字の続き */
const WORD = /[\p{Script=Han}\p{Script=Katakana}ー・々〆A-Za-z0-9.,:%&+\-/'’]+/gu;
/** 太字の幅と、測り違いの余裕 */
const FIT_SLACK = 1.06;

/** 1 文字の幅（em）。全角 1、半角は平均 0.6 */
function charEm(ch: string): number {
	return (ch.codePointAt(0) as number) < 0x2000 ? 0.6 : 1;
}

/** いちばん長い語の幅（em） */
export function longestWordEm(text: string): number {
	let max = 0;
	for (const m of text.matchAll(WORD)) {
		let w = 0;
		for (const ch of m[0]) w += charEm(ch);
		max = Math.max(max, w);
	}
	return max;
}

/**
 * 狭い箱の見出し（h3）と指標の数字（.kpi .big）に、いちばん長い語の幅（--fit）を入れる。
 * CSS が「箱の幅 ÷ --fit」を文字の大きさの上限にするので、カードが細くても「アイリッ / シュ」のように語の途中で折り返さない
 */
function stampFit(section: Element): void {
	const targets: [Element, number][] = [];
	for (const h of [...section.querySelectorAll("h3")]) targets.push([h, longestWordEm(h.textContent ?? "")]);
	for (const big of [...section.querySelectorAll(".kpi .big")]) {
		// 数字と単位は 1 つのまとまり。単位は 0.4em で小さく出る
		let w = 0;
		const walk = (node: Node, scale: number) => {
			if (node.nodeType === 3) for (const ch of (node.textContent ?? "").replace(/\s+/g, "")) w += charEm(ch) * scale;
			else if (node.nodeType === 1) for (const c of [...node.childNodes]) walk(c, hasClass(node as Element, "unit") ? 0.4 : scale);
		};
		walk(big, 1);
		targets.push([big, w]);
	}
	for (const [el, em] of targets) {
		if (em <= 0) continue;
		const fit = `--fit:${(Math.ceil(em * FIT_SLACK * 10) / 10).toString()}`;
		const style = (el.getAttribute("style") ?? "").trim();
		el.setAttribute("style", style === "" ? fit : `${style.replace(/;?$/, ";")}${fit}`);
	}
}

/** 機械的に分かる規約の検査（スキルの conventions.md の ID を添える） */
function lintSlide(section: Element, n: number, heading: Element | null, pattern: Pattern | undefined, limits: (typeof LIMITS)[Density], report: Report): void {
	const dense = pattern?.dense === true;
	if (heading !== null) {
		const text = (heading.textContent ?? "").trim();
		if (textWidth(text) > limits.headline) report("warning", "headline-long", heading, n, `見出しが長い（全角 ${limits.headline} 字相当まで。2 行に収める。C2）: ${text.slice(0, 24)}…`);
		if (/[A-Za-z]/.test(text) && text.replace(/[^A-Za-z]/g, "").length >= 8 && text === text.toUpperCase()) report("warning", "all-caps", heading, n, "見出しをすべて大文字にしない（C7）");
	}
	for (const list of [...section.querySelectorAll("ul, ol")]) {
		// 木は、入れ子そのものが図になる
		if (closestClass(list, "tree", section)) continue;
		const items = [...list.children].filter((c) => c.tagName.toLowerCase() === "li");
		if (!dense && items.length > MAX_ITEMS) report("warning", "too-many-items", list, n, `1 つのリストに ${items.length} 項目ある（${MAX_ITEMS} 項目まで。分けるか、まとめる。C4）`);
		let depth = 1;
		for (let p = list.parentElement; p !== null && p !== section; p = p.parentElement) if (/^(ul|ol)$/i.test(p.tagName)) depth++;
		if (depth > MAX_LIST_DEPTH) report("warning", "list-deep", list, n, `リストの入れ子が ${depth} 段ある（${MAX_LIST_DEPTH} 段まで。C4）`);
		if (dense) continue;
		for (const li of items) {
			const own = [...li.childNodes].filter((c) => !(c.nodeType === 1 && /^(ul|ol)$/i.test((c as Element).tagName))).map((c) => c.textContent ?? "").join("");
			if (textWidth(own) > limits.item) report("warning", "item-long", li, n, `項目が長い（全角 ${limits.item} 字相当まで。2 行に収める。C4）: ${own.trim().slice(0, 20)}…`);
		}
	}
	for (const p of [...section.querySelectorAll("p, li")]) {
		const strong = p.querySelector("strong, b");
		const text = (p.textContent ?? "").trim();
		if (strong !== null && text.length >= 12 && (strong.textContent ?? "").trim() === text) report("warning", "bold-all", p, n, "文をまるごと太字にしない（強調は語句だけ。C7）");
	}
	for (const el of [...section.querySelectorAll("i, em")]) report("warning", "italic", el, n, "斜体を使わない（日本語の書体では読みにくい。強調は <strong> か <mark>。C7）");
	const marks = section.querySelectorAll("mark").length;
	if (marks > 1 && pattern?.id !== "code") report("warning", "too-many-marks", section, n, `<mark> が ${marks} か所ある（強調は 1 枚に 1 か所。C6）`);
	if (!dense) {
		const clone = section.cloneNode(true) as Element;
		for (const el of [...clone.querySelectorAll("svg, pre, table")]) el.remove();
		for (const el of [...clone.querySelectorAll("*")].filter((e) => hasClass(e, "source"))) el.remove();
		const width = textWidth(clone.textContent ?? "");
		if (width > limits.slide) report("warning", "too-much-text", section, n, `文字が多い（全角 ${Math.round(width)} 字相当。目安は ${limits.slide}。話すことは発表者ノートに移すか、2 枚に分ける。C3）`);
	}
}

/** data-step を 1 からの番号にそろえる。数のないものは文書の順に、前の番号の次を振る */
function normalizeSteps(section: Element): void {
	let current = 0;
	for (const el of [...section.querySelectorAll("[data-step]")]) {
		const given = Number.parseInt(el.getAttribute("data-step") ?? "", 10);
		current = Number.isFinite(given) && given > 0 ? given : current + 1;
		el.setAttribute("data-step", String(current));
	}
}

interface PageInput {
	title: string;
	lang: string;
	theme: Mode;
	density: Density;
	deckPath: string;
	author: string;
	date: string;
	primaryCss: string;
	slides: Slide[];
	assets: Assets;
	sha256: Sha256;
}

/** 共通のスクリプトだけをハッシュで許し、外部への通信を止める */
export function contentSecurityPolicy(runtime: string, sha256: Sha256): string {
	const hash = sha256(runtime, "base64");
	return `default-src 'none'; img-src 'self' data: blob:; style-src 'unsafe-inline'; script-src 'sha256-${hash}'; font-src data:; form-action 'none'; base-uri 'none'`;
}

function page(p: PageInput): string {
	const style = `${p.assets.tokensCss}\n${p.assets.css}\n${p.primaryCss}`;
	const cells = p.slides
		.map((s) =>
			[
				`<div class="sl-cell" id="s${s.n}" data-n="${s.n}" data-h="${s.hash}" data-title="${escapeHtml(s.title)}">`,
				`<div class="sl-frame">`,
				s.html,
				`</div>`,
				`<p class="sl-caption"><span class="sl-no">${s.n}</span><span class="sl-pattern">${escapeHtml(s.pattern)}</span></p>`,
				s.notes === "" ? "" : `<div class="sl-notes">${s.notes}</div>`,
				`</div>`,
			]
				.filter((l) => l !== "")
				.join("\n"),
		)
		.join("\n");
	const info = [p.author, p.date, `${p.slides.length} slides`].filter((t) => t !== "").map(escapeHtml).join(" · ");
	const build = p.sha256(`${style}\n${cells}\n${p.assets.runtime}`, "hex").slice(0, 12);
	return `<!DOCTYPE html>
<html lang="${escapeHtml(p.lang)}" data-theme="${p.theme}" data-density="${p.density}" data-deck="${escapeHtml(p.deckPath)}" data-build="${build}">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy(p.assets.runtime, p.sha256)}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="pkm-kit slide">
<!-- 生成物。手で編集しない。ソースは同じフォルダの deck.html（node .kit/bin/slide.mjs build で作り直す） -->
<title>${escapeHtml(p.title)}</title>
<style>
${style}</style>
</head>
<body>
<span id="thumb" hidden></span>
<header class="sl-bar">
<h1>${escapeHtml(p.title)}</h1>
<p class="sl-info">${info}</p>
</header>
<div class="sl-layout">
<main class="sl-deck">
${cells}
</main>
</div>
<script>${p.assets.runtime}</script>
</body>
</html>
`;
}
