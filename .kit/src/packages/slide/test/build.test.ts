import { createHash } from "node:crypto";
import { DOMParser } from "linkedom";
import { describe, expect, it } from "vitest";
import { toHex } from "../../design/src/color.ts";
import { applyTheme, parseTheme } from "../../design/src/theme.ts";
import { resolveColor } from "../../design/src/tokens.ts";
import { buildDeck, longestWordEm, stampLines, textWidth, type Assets, type BuildResult } from "../src/core/build.ts";
import { TOKENS } from "../src/core/color.ts";

const assets: Assets = { tokensCss: "/*tokens*/", css: "/*css*/", runtime: "console.log('runtime');" };
const sha256 = (text: string, encoding: "hex" | "base64") => createHash("sha256").update(text).digest(encoding);
const parse = (html: string) => new DOMParser().parseFromString(html, "text/html") as unknown as Document;

function build(source: string, files: string[] = [], vaultPrimary?: { light?: string; dark?: string }): BuildResult {
	return buildDeck({ source, deckPath: "slide/demo", assets, parse, sha256, exists: (p) => files.includes(p), vaultPrimary });
}
const deck = (body: string, head = "") => `<title>題</title>\n${head}\n${body}`;
const slide = (inner: string, pattern = "statement") => `<section data-pattern="${pattern}">\n${inner}\n</section>`;
const rules = (r: BuildResult, level: "error" | "warning") => r.problems.filter((p) => p.level === level).map((p) => p.rule);

describe("buildDeck（ADR-0117）", () => {
	it("同じ deck.html からは同じバイト列になり、日時を含まない", () => {
		const source = deck(slide("<h2>見出しは主張の文にする</h2>"));
		const a = build(source);
		expect(a.problems).toEqual([]);
		expect(a.html).toBe(build(source).html);
		expect(a.html).not.toMatch(/20\d\d-\d\d-\d\dT/);
		expect(a.html).toContain('data-deck="slide/demo"');
		expect(a.html).toContain("<title>題</title>");
	});

	it("CSP は共通のスクリプトだけをハッシュで許し、外部の読み込みを許さない", () => {
		const html = build(deck(slide("<h2>見出し</h2>"))).html as string;
		const hash = createHash("sha256").update(assets.runtime).digest("base64");
		const csp = /Content-Security-Policy" content="([^"]+)"/.exec(html)?.[1] ?? "";
		expect(csp).toContain(`script-src 'sha256-${hash}'`);
		expect(csp).toContain("default-src 'none'");
		expect(csp).not.toMatch(/https?:|\*|unsafe-eval|script-src[^;]*unsafe-inline/);
		expect(html.indexOf("Content-Security-Policy")).toBeLessThan(html.indexOf("<style>"));
		expect(html.split("<script>").length).toBe(2);
	});

	it("デッキに書いたスクリプトとイベントの属性を取り除く", () => {
		const r = build(deck(slide('<h2 onclick="alert(1)">見出し</h2><script>alert(2)</script><p><a href="javascript:alert(3)">x</a></p>', "appendix")));
		expect(rules(r, "warning")).toContain("script-removed");
		expect(r.html).not.toContain("alert(");
		expect(r.html).not.toContain("onclick");
	});

	it("値の直書き・<style>・外部の読み込みはエラーにし、index.html を作らない", () => {
		for (const [inner, rule] of [
			['<h2>見出し</h2><p style="color:#f00">x</p>', "style-value"],
			['<h2>見出し</h2><p style="font-size:12px">x</p>', "style-value"],
			["<h2>見出し</h2><style>p{color:red}</style>", "style-element"],
			['<h2>見出し</h2><iframe src="https://example.com"></iframe>', "external-resource"],
			['<h2>見出し</h2><figure><img src="https://example.com/a.png" alt="a"></figure>', "asset-outside"],
			['<h2>見出し</h2><figure><img src="../other/a.png" alt="a"></figure>', "asset-outside"],
			['<h2>見出し</h2><figure><img src="/etc/a.png" alt="a"></figure>', "asset-outside"],
			['<h2>見出し</h2><figure><img src="missing.png" alt="a"></figure>', "asset-missing"],
			["<p>見出しがない</p>", "no-heading"],
		] as const) {
			const r = build(deck(slide(inner, "appendix")));
			expect(rules(r, "error"), inner).toContain(rule);
			expect(r.html, inner).toBeNull();
		}
	});

	it("部品のつまみ（--v、--x、--y）と、デッキのフォルダの中の添付は通す", () => {
		const r = build(deck(slide('<h2>見出し</h2><figure><img src="img/a.png" alt="図"><aside class="callout" style="--x:40;--y:12.5">ここ</aside></figure>', "screenshot")), ["img/a.png"]);
		expect(r.problems).toEqual([]);
		expect(r.html).toContain('src="img/a.png"');
	});

	it("知らないパターン、パターンに要る部品がない、<section> の外の中身はエラー", () => {
		expect(rules(build(deck(slide("<h2>見出し</h2>", "nope"))), "error")).toEqual(["unknown-pattern"]);
		expect(rules(build(deck('<section><h2>見出し</h2></section>')), "error")).toEqual(["no-pattern"]);
		expect(rules(build(deck(slide("<h2>見出し</h2><p>棒がない</p>", "chart-bar"))), "error")).toEqual(["pattern-structure"]);
		expect(rules(build(deck(slide("<h2>見出し</h2><ul><li>中身</li></ul>", "statement"))), "error")).toEqual(["pattern-structure"]);
		expect(rules(build(deck(`<p>外</p>${slide("<h2>見出し</h2>")}`)), "error")).toEqual(["outside-section"]);
		expect(rules(build("<section data-pattern=\"statement\"><h2>見出し</h2></section>"), "error")).toEqual(["no-title"]);
		expect(rules(build(deck("")), "error")).toEqual(["no-slides"]);
	});

	it("規約の警告: 項目が多い、見出しが長い、全文の太字、斜体、強調が多い", () => {
		const many = `<h2>見出し</h2><div class="cols"><ul>${"<li>項目</li>".repeat(5)}</ul></div>`;
		expect(rules(build(deck(slide(many, "cards"))), "warning")).toEqual(["too-many-items"]);
		expect(rules(build(deck(slide(`<h2>${"長".repeat(53)}</h2>`))), "warning")).toEqual(["headline-long"]);
		expect(rules(build(deck(slide(`<h2>${"長".repeat(53)}</h2>`), '<meta name="deck-density" content="read">')), "warning")).toEqual([]);
		expect(rules(build(deck(slide("<h2>見出し</h2><div class=\"cols\"><p><strong>この文はまるごと太字になっている</strong></p></div>", "cards"))), "warning")).toEqual(["bold-all"]);
		expect(rules(build(deck(slide("<h2>見出し<em>斜体</em></h2>"))), "warning")).toEqual(["italic"]);
		expect(rules(build(deck(slide("<h2><mark>一</mark>と<mark>二</mark></h2>"))), "warning")).toEqual(["too-many-marks"]);
		// 警告だけなら index.html は作る
		expect(build(deck(slide(many, "cards"))).html).not.toBeNull();
	});

	it("data-step を 1 からの番号にそろえる（数のないものは文書の順）", () => {
		const html = build(deck(slide('<h2>見出し</h2><div class="cols"><p data-step>a</p><p data-step>b</p><p data-step="2">c</p><p data-step="5">d</p><p data-step>e</p></div>', "cards"))).html as string;
		expect([...html.matchAll(/data-step="(\d+)"/g)].map((m) => m[1])).toEqual(["1", "2", "2", "5", "6"]);
	});

	it("見出しのまとまり・本文・出典に分け、発表者ノートを外に出す", () => {
		const html = build(deck(slide('<p class="kicker">章</p><h2>見出し</h2><p class="big">50</p><p class="lead">数字の説明</p><p class="source">出典</p><aside class="notes">話すこと</aside>', "big-number"))).html as string;
		const head = /<header class="sl-head">([\s\S]*?)<\/header>/.exec(html)?.[1] ?? "";
		const body = /<div class="sl-body">([\s\S]*?)<\/div>\n<footer/.exec(html)?.[1] ?? "";
		expect(head).toContain("kicker");
		expect(head).toContain("<h2");
		expect(head).not.toContain("数字の説明");
		expect(body).toContain("数字の説明");
		expect(/<footer class="sl-foot">([\s\S]*?)<\/footer>/.exec(html)?.[1]).toContain("出典");
		expect(/<section[\s\S]*<\/section>/.exec(html)?.[0]).not.toContain("話すこと");
		expect(html).toContain('<div class="sl-notes">話すこと</div>');
	});

	it("発表者ノートは段落と箇条書きまで。範囲の外・2 つ以上・<section> の直下でないものは notes-format で止める（ADR-0132）", () => {
		const ok = build(deck(slide('<h2>見出し</h2>\n<aside class="notes">\n  <p>段落</p>\n  <ul><li>a<ul><li>b</li></ul></li></ul>\n</aside>')));
		expect(rules(ok, "error")).toEqual([]);
		for (const inner of [
			'<h2>見出し</h2><aside class="notes"><strong>強調</strong></aside>',
			'<h2>見出し</h2><aside class="notes">1</aside><aside class="notes">2</aside>',
			'<h2>見出し</h2><div class="card"><aside class="notes">中</aside></div>',
		]) {
			const r = build(deck(slide(inner)));
			expect(r.html, inner).toBeNull();
			expect(rules(r, "error"), inner).toContain("notes-format");
		}
	});

	it("行番号を付ける。行がずれただけでは、スライドのハッシュは変わらない", () => {
		const a = build(deck(slide("<h2>見出し</h2>")));
		const b = build(deck(`\n\n<!-- <p>コメントの中のタグには付けない</p> -->\n${slide("<h2>見出し</h2>")}`));
		const c = build(deck(slide("<h2>見出しを変えた</h2>")));
		const hash = (r: BuildResult) => /data-h="([0-9a-f]+)"/.exec(r.html as string)?.[1];
		expect(/<h2 data-l="(\d+)"/.exec(a.html as string)?.[1]).toBe("4");
		expect(/<h2 data-l="(\d+)"/.exec(b.html as string)?.[1]).toBe("7");
		expect(hash(a)).toBe(hash(b));
		expect(hash(a)).not.toBe(hash(c));
		expect(stampLines("<!-- <p> -->\n<p class=\"a\">x</p>")).toBe('<!-- <p> -->\n<p data-l="2" class="a">x</p>');
	});

	it("deck-primary: 面との比が足りる色だけを通し、ダークの色を作る", () => {
		const ok = build(deck(slide("<h2>見出し</h2>"), '<meta name="deck-primary" content="#0b57d0">'));
		expect(ok.problems).toEqual([]);
		expect(ok.html).toContain(".slide{--sl-primary:#0b57d0;--sl-on-primary:#ffffff;");
		expect(ok.html).toMatch(/:root\[data-theme="dark"\] \.slide\{--sl-primary:#[0-9a-f]{6};/);
		expect(rules(build(deck(slide("<h2>見出し</h2>"), '<meta name="deck-primary" content="#ffe082">')), "error")).toEqual(["primary-contrast"]);
		expect(rules(build(deck(slide("<h2>見出し</h2>"), '<meta name="deck-primary" content="blue">')), "error")).toEqual(["primary-contrast"]);
		expect(rules(build(deck(slide("<h2>見出し</h2>"), '<meta name="deck-density" content="dense">')), "error")).toEqual(["bad-meta"]);
	});

	it("子の基本の色の primary を、deck-primary のないデッキの既定にし、閲覧の画面にも効かせる（ADR-0125）", () => {
		const green = build(deck(slide("<h2>見出し</h2>")), [], { light: "#1e5b3a" });
		expect(green.problems).toEqual([]);
		expect(green.html).toContain(":root{--vt-primary:#1e5b3a;--vt-on-primary:#ffffff;--vt-primary-state-hover:#1e5b3a14;");
		expect(green.html).toContain(".slide{--sl-primary:#1e5b3a;--sl-on-primary:#ffffff;");
		// ダークを書かなければ、ライトから作る
		expect(green.html).toMatch(/:root\[data-theme="dark"\] \.slide\{--sl-primary:#[0-9a-f]{6};/);
		// デッキの deck-primary が先
		const own = build(deck(slide("<h2>見出し</h2>"), '<meta name="deck-primary" content="#0b57d0">'), [], { light: "#1e5b3a" });
		expect(own.html).toContain(".slide{--sl-primary:#0b57d0;");
		expect(own.html).not.toContain("#1e5b3a");
		// 上流の面との比が足りなければ止める
		expect(rules(build(deck(slide("<h2>見出し</h2>")), [], { light: "#ffe082" }), "error")).toEqual(["vault-primary"]);
		// theme.json がなければ何も足さない
		expect(build(deck(slide("<h2>見出し</h2>"))).html).not.toContain("--sl-primary:");
	});

	it("子の基本の色の primary から、閲覧の画面の選んだものの面と primary の上の文字も作る。値は theme.mjs と同じ（ADR-0129）", () => {
		const themed = applyTheme(TOKENS, parseTheme({ light: { primary: "#1e5b3a" } }, TOKENS).theme);
		const v = (name: string, mode: "light" | "dark") => toHex(resolveColor(themed, `color.${name}`, mode));
		const html = build(deck(slide("<h2>見出し</h2>")), [], { light: "#1e5b3a" }).html as string;
		for (const [root, mode] of [[":root{", "light"], [':root[data-theme="dark"]{', "dark"]] as const) {
			const rule = html.split("\n").find((l) => l.startsWith(root) && l.includes("--vt-primary:")) ?? "";
			expect(rule).toContain(`--vt-primary:${v("primary", mode)};`);
			expect(rule).toContain(`--vt-on-primary:${v("on-primary", mode)};`);
			expect(rule).toContain(`--vt-secondary-container:${v("secondary-container", mode)};`);
			expect(rule).toContain(`--vt-on-secondary-container:${v("on-secondary-container", mode)}`);
		}
		// ダークの primary も theme.mjs と同じ（スライドの面と Obsidian の色がそろう）
		expect(html).toContain(`:root[data-theme="dark"] .slide{--sl-primary:${v("primary", "dark")};`);
	});

	it("textWidth は全角を 1、半角を 0.5 で数える", () => {
		expect(textWidth("あい")).toBe(2);
		expect(textWidth("ab 12")).toBe(2.5);
	});

	it("longestWordEm は、漢字・カタカナ・英数字の続きを 1 語として、いちばん長い語の幅を返す", () => {
		expect(longestWordEm("アイリッシュ")).toBe(6);
		expect(longestWordEm("問い合わせの種類")).toBe(2);
		expect(longestWordEm("ab cd")).toBeCloseTo(1.2);
		expect(longestWordEm("")).toBe(0);
	});

	it("狭い箱の見出しと指標の数字に --fit を入れ、部品のつまみは残す（カードで語の途中から折り返さない）", () => {
		const html = build(deck(slide('<h2>見出し</h2><div class="cols"><div class="card"><h3 style="--v:3">アイリッシュ</h3></div><div class="card kpi"><p class="big">50<span class="unit">分</span></p></div></div>', "cards"))).html as string;
		expect(html).toMatch(/<h3[^>]*style="--v:3;--fit:6\.4"/);
		expect(html).toMatch(/<p (?=[^>]*class="big")[^>]*style="--fit:1\.7"/);
	});
});
