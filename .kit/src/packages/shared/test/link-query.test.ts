import { describe, expect, it } from "vitest";
import { findMarkdownLinks, markdownLink, pageOf, parseLinkQuery, searchItems, splitLinkTarget } from "../src/link-query";

describe("parseLinkQuery（ADR-0194）", () => {
	it("キー:値 は絞り込み、ほかは検索語", () => {
		expect(parseLinkQuery("仕様 s:closed 決める", ["s"])).toEqual({ words: ["仕様", "決める"], number: null, filters: { s: ["closed"] } });
	});
	it("カンマで複数の値", () => {
		expect(parseLinkQuery("s:open,Waiting", ["s"]).filters).toEqual({ s: ["open", "waiting"] });
	});
	it("知らないキーは検索語", () => {
		expect(parseLinkQuery("x:y", ["s"]).words).toEqual(["x:y"]);
	});
	it("数字だけなら ID で探す。接頭辞付きでもよい", () => {
		expect(parseLinkQuery("12", ["s"], "i").number).toBe("12");
		expect(parseLinkQuery("i-12 s:all", ["s"], "i")).toEqual({ words: [], number: "12", filters: { s: ["all"] } });
		expect(parseLinkQuery("12 仕様", [], "i").number).toBeNull();
	});
});

describe("searchItems", () => {
	const items = [
		{ id: "i-1", t: "設計を見直す", r: 1 },
		{ id: "i-12", t: "仕様を決める", r: 3 },
		{ id: "i-120", t: "仕様書の設計", r: 5 },
		{ id: "i-2", t: "掃除", r: 9 },
	];
	const opts = { haystacks: (i: (typeof items)[number]) => [i.t], id: (i: (typeof items)[number]) => i.id, recency: (i: (typeof items)[number]) => i.r };
	it("語がなければ新しい順", () => {
		expect(searchItems(items, parseLinkQuery(""), opts).map((i) => i.id)).toEqual(["i-2", "i-120", "i-12", "i-1"]);
	});
	it("すべての語を含むもの。先頭から一致するものを先に", () => {
		expect(searchItems(items, parseLinkQuery("設計"), opts).map((i) => i.id)).toEqual(["i-1", "i-120"]);
		expect(searchItems(items, parseLinkQuery("仕様 設計"), opts).map((i) => i.id)).toEqual(["i-120"]);
	});
	it("数字は ID の前方一致。同じ数を先に", () => {
		expect(searchItems(items, parseLinkQuery("12", [], "i"), opts).map((i) => i.id)).toEqual(["i-12", "i-120"]);
	});
});

describe("pageOf", () => {
	it("先頭の件数と残り", () => {
		expect(pageOf([1, 2, 3], 2)).toEqual({ items: [1, 2], rest: 1 });
		expect(pageOf([1], 50)).toEqual({ items: [1], rest: 0 });
	});
});

describe("Markdown リンク", () => {
	it("文字を退避し、パスの空白をエンコードする", () => {
		expect(markdownLink("a [b]", "wiki/x y.md", "見出し 1")).toBe("[a \\[b\\]](wiki/x%20y.md#見出し%201)");
	});
	it("リンク先を分けてデコードする。外部とアンカーだけは null", () => {
		expect(splitLinkTarget("wiki/x%20y.md#a%20b")).toEqual({ path: "wiki/x y.md", anchor: "a b" });
		expect(splitLinkTarget("https://example.com")).toBeNull();
		expect(splitLinkTarget("#top")).toBeNull();
	});
	it("本文のリンクを見つける。埋め込み・コード・frontmatter は除く", () => {
		const doc = [
			"---",
			"x: [a](issue/i-0.md)",
			"---",
			"See [i-1 \\[x\\]](issue/i-1.md) and ![img](asset/a.png)",
			"`[c](issue/i-2.md)` [d](issue/i-3.md#k3f9a2)",
			"```",
			"[e](issue/i-4.md)",
			"```",
			"[f](https://example.com) [g](member/m-1.md)",
		].join("\n");
		const links = findMarkdownLinks(doc);
		expect(links.map((l) => [l.text, l.path, l.anchor])).toEqual([
			["i-1 [x]", "issue/i-1.md", ""],
			["d", "issue/i-3.md", "k3f9a2"],
			["g", "member/m-1.md", ""],
		]);
		const first = links[0]!;
		expect(doc.slice(first.from, first.to)).toBe("[i-1 \\[x\\]](issue/i-1.md)");
	});
	it("範囲を絞ると、その行だけ", () => {
		const doc = "[a](a.md)\n[b](b.md)\n[c](c.md)";
		expect(findMarkdownLinks(doc, { from: 10, to: 12 }).map((l) => l.text)).toEqual(["b"]);
	});
});
