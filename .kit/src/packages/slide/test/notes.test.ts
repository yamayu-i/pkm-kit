import { DOMParser } from "linkedom";
import { describe, expect, it } from "vitest";
import { notesFormatError, notesToText, replaceNotes, sectionSpans, textToNotes } from "../src/core/notes.ts";

const parse = (html: string) => new DOMParser().parseFromString(`<!DOCTYPE html><html><head></head><body>${html}</body></html>`, "text/html") as unknown as Document;
const aside = (inner: string, attrs = 'class="notes"') => parse(`<aside ${attrs}>${inner}</aside>`).querySelector("aside") as Element;
/** 素の文字 → HTML → 素の文字 */
const roundTrip = (text: string) => notesToText(aside(textToNotes(text) ?? ""));

describe("notesFormatError（ADR-0132）", () => {
	it("文字・<p>・<br>・箇条書き（2 段まで）は通す", () => {
		for (const inner of [
			"話すこと",
			"1 行目<br>2 行目",
			"<p>段落</p><p>次の段落<br>改行</p>",
			"<ul><li>a</li><li>b<ul><li>c</li></ul></li></ul>",
			"<p>前置き</p>\n  <ol>\n    <li>一</li>\n  </ol>",
			"",
		]) {
			expect(notesFormatError(aside(inner)), inner).toBeNull();
		}
	});

	it("範囲の外を止める", () => {
		for (const [inner, attrs] of [
			["<strong>強調</strong>", undefined],
			['<a href="x">リンク</a>', undefined],
			["<p>段落</p>はみ出した文字", undefined],
			['<p class="x">属性</p>', undefined],
			["<ul><li>1<ul><li>2<ul><li>3</li></ul></li></ul></li></ul>", undefined],
			["<ul>文字</ul>", undefined],
			["<ul><li>a<ul><li>b</li></ul>後ろの文字</li></ul>", undefined],
			["<ul><li>a<ul><li>b</li></ul><ol><li>c</li></ol></li></ul>", undefined],
			["<!-- コメント -->", undefined],
			["文字", 'class="notes big"'],
			["文字", 'class="notes" id="x"'],
		] as const) {
			expect(notesFormatError(aside(inner, attrs)), inner).not.toBeNull();
		}
	});
});

describe("素の文字と HTML（ADR-0132）", () => {
	it("1 段落は <p> で包まず 1 行にし、行の改行は <br> にする", () => {
		expect(textToNotes("話すこと")).toBe("話すこと");
		expect(textToNotes("1 行目\n2 行目")).toBe("1 行目<br>2 行目");
		expect(textToNotes("  \n\n ")).toBeNull();
	});

	it("< > & をエスケープする", () => {
		expect(textToNotes("a < b && c > d")).toBe("a &lt; b &amp;&amp; c &gt; d");
		expect(roundTrip("a < b && c > d")).toBe("a < b && c > d");
	});

	it("段落・箇条書き・番号付き・2 段の入れ子・項目の中の改行が、往復で変わらない", () => {
		const texts = [
			"話すこと",
			"1 行目\n2 行目",
			"段落 1\n\n段落 2\n続き",
			"- a\n- b\n  - b1\n  - b2\n- c",
			"1. 一\n2. 二\n  - 二の a",
			"前置き\n\n- a\n  続きの行\n- b\n\n1. 一\n\n締め",
		];
		for (const text of texts) expect(roundTrip(text), text).toBe(text);
	});

	it("番号は振り直す。3 段目以降は 2 段目にする", () => {
		expect(roundTrip("3. a\n7. b")).toBe("1. a\n2. b");
		expect(roundTrip("- a\n  - b\n    - c")).toBe("- a\n  - b\n  - c");
	});

	it("書式の範囲の HTML になる", () => {
		for (const text of ["段落 1\n\n- a\n  - b\n\n1. x", "- a\n  1. b\n  - c"]) {
			expect(notesFormatError(aside(textToNotes(text) ?? "")), text).toBeNull();
		}
	});

	it("ソースの字下げや改行の違いは吸収する", () => {
		expect(notesToText(aside("\n    待ちは、\n    朝の会議で生じている。\n  "))).toBe("待ちは、 朝の会議で生じている。");
		expect(notesToText(aside("<ul>\n  <li>\n    a\n  </li>\n</ul>"))).toBe("- a");
	});
});

const source = [
	"<title>題</title>",
	"<!-- <section> はコメントの中では数えない -->",
	'<section data-pattern="statement">',
	"  <h2>1 枚目</h2>",
	'  <aside class="notes">前のノート</aside>',
	"</section>",
	"",
	'<section data-pattern="statement">',
	"  <h2>2 枚目</h2>",
	"  <aside>ノートではない aside</aside>",
	"</section>",
	'<section data-pattern="statement"><h2>3 枚目</h2></section>',
	"",
].join("\n");

describe("replaceNotes（ADR-0132）", () => {
	it("スライドとノートの位置を数える", () => {
		const spans = sectionSpans(source);
		expect(spans).toHaveLength(3);
		expect(spans.map((s) => s.notes.length)).toEqual([1, 0, 0]);
		const n = spans[0]?.notes[0];
		expect(source.slice(n?.innerStart, n?.innerEnd)).toBe("前のノート");
	});

	it("ノートの中だけを書き換える", () => {
		const out = replaceNotes(source, 1, "新しいノート") as string;
		expect(out).toBe(source.replace("前のノート", "新しいノート"));
	});

	it("複数の段落は、aside の字下げから 1 段ずつ下げて書く", () => {
		const out = replaceNotes(source, 1, "段落\n\n- a\n  - b") as string;
		expect(out).toContain(['  <aside class="notes">', "    <p>段落</p>", "    <ul>", "      <li>a", "        <ul>", "          <li>b</li>", "        </ul>", "      </li>", "    </ul>", "  </aside>"].join("\n"));
		expect(out.replace(/ {2}<aside class="notes">[\s\S]*?<\/aside>/, "")).toBe(source.replace(/ {2}<aside class="notes">[\s\S]*?<\/aside>/, ""));
	});

	it("ノートのないスライドには、</section> の前に中の字下げで足す", () => {
		const out = replaceNotes(source, 2, "足したノート") as string;
		expect(out).toBe(source.replace("  <aside>ノートではない aside</aside>\n</section>", '  <aside>ノートではない aside</aside>\n  <aside class="notes">足したノート</aside>\n</section>'));
	});

	it("1 行で書いたスライドには、1 行のまま足す", () => {
		const out = replaceNotes(source, 3, "a\n\n- b") as string;
		expect(out).toBe(source.replace("<h2>3 枚目</h2></section>", '<h2>3 枚目</h2><aside class="notes"><p>a</p><ul><li>b</li></ul></aside></section>'));
	});

	it("空にしたら、aside を行ごと取り除く", () => {
		const out = replaceNotes(source, 1, "") as string;
		expect(out).toBe(source.replace('\n  <aside class="notes">前のノート</aside>', ""));
	});

	it("ないスライド・ノートが 2 つあるスライドは書き換えない", () => {
		expect(replaceNotes(source, 4, "x")).toBeNull();
		const two = '<section data-pattern="statement"><h2>a</h2><aside class="notes">1</aside><aside class="notes">2</aside></section>';
		expect(replaceNotes(two, 1, "x")).toBeNull();
	});

	it("タブで字下げしたデッキでは、タブで下げる", () => {
		const tabbed = '<section data-pattern="statement">\n\t<h2>a</h2>\n\t<aside class="notes">x</aside>\n</section>';
		expect(replaceNotes(tabbed, 1, "p\n\nq")).toBe('<section data-pattern="statement">\n\t<h2>a</h2>\n\t<aside class="notes">\n\t\t<p>p</p>\n\t\t<p>q</p>\n\t</aside>\n</section>');
	});
});
