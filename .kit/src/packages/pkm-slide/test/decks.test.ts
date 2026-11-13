import { createHash } from "node:crypto";
import { DOMParser } from "linkedom";
import { describe, expect, it } from "vitest";
import { buildDeck } from "../../slide/src/core/build.ts";
import { childrenOf, classify, deckOfFile, deckTitle, markdownLink, movedDecks, moveTarget, nameError, renameTarget, retargetDeck, slideCount } from "../src/core/decks.ts";

const tree = classify(
	["slide/a/deck.html", "slide/a/index.html", "slide/team/b/deck.html", "slide/team/b/img/x.png", "slide/a/inner/deck.html", "slide/deck.html", "note.md"],
	["slide", "slide/a", "slide/a/inner", "slide/team", "slide/team/b", "slide/team/b/img", "slide/empty", "other"],
);

describe("classify（ADR-0120）", () => {
	it("deck.html のあるフォルダをデッキに、デッキでもその中でもない slide/ の下のフォルダを整理のフォルダにする", () => {
		expect(tree.decks).toEqual([
			{ path: "slide/a", built: true },
			{ path: "slide/team/b", built: false },
		]);
		expect(tree.folders).toEqual(["slide", "slide/empty", "slide/team"]);
	});

	it("slide/ がなくても、slide/ を整理のフォルダの根として持つ", () => {
		expect(classify([], [])).toEqual({ decks: [], folders: ["slide"] });
	});
});

describe("childrenOf（ADR-0124）", () => {
	it("直下の整理のフォルダとデッキだけを返し、孫は返さない", () => {
		const folders = ["slide", "slide/team", "slide/team/sub", "slide/empty"];
		const decks = ["slide/a", "slide/team/b", "slide/team/sub/c"];
		expect(childrenOf(folders, decks, "slide")).toEqual({ folders: ["slide/empty", "slide/team"], decks: ["slide/a"] });
		expect(childrenOf(folders, decks, "slide/team")).toEqual({ folders: ["slide/team/sub"], decks: ["slide/team/b"] });
		expect(childrenOf(folders, decks, "slide/empty")).toEqual({ folders: [], decks: [] });
	});
});

describe("deck.html から読むもの", () => {
	it("題は <title>、なければフォルダ名。枚数は <section> の数（コメントの中は数えない）", () => {
		expect(deckTitle("<title> 2026 年の &amp; 計画 </title><section>", "slide/x")).toBe("2026 年の & 計画");
		expect(deckTitle("<section>", "slide/team/x")).toBe("x");
		expect(slideCount('<section data-pattern="a"></section>\n<!-- <section> -->\n<section>\n</section>')).toBe(2);
	});
});

describe("名前と行き先の規則", () => {
	const exists = (p: string) => ["slide/team/a", "slide/c"].includes(p);
	it("名前は英小文字・数字・ハイフン", () => {
		expect(nameError("2026-roadmap")).toBeNull();
		for (const bad of ["", "Roadmap", "a b", "-a", "a--b", "資料"]) expect(nameError(bad)).not.toBeNull();
	});

	it("行き先は整理のフォルダだけ。自分の下、同じ場所、同じ名前があるところには動かせない", () => {
		expect(moveTarget(tree, "slide/team/b", "slide", exists)).toEqual({ path: "slide/b" });
		expect(moveTarget(tree, "slide/team", "slide/empty", exists)).toEqual({ path: "slide/empty/team" });
		expect(moveTarget(tree, "slide/team/b", "slide/a", exists)).toHaveProperty("error");
		expect(moveTarget(tree, "slide/team", "slide/team", exists)).toHaveProperty("error");
		expect(moveTarget(tree, "slide/team/b", "slide/team", exists)).toHaveProperty("error");
		expect(moveTarget(tree, "slide/a", "slide/team", exists)).toHaveProperty("error");
	});

	it("名前を変える", () => {
		expect(renameTarget("slide/team/b", "c", exists)).toEqual({ path: "slide/team/c" });
		expect(renameTarget("slide/team/b", "a", exists)).toHaveProperty("error");
		expect(renameTarget("slide/team/b", "B", exists)).toHaveProperty("error");
	});

	it("フォルダを動かしたら、その下のデッキがすべて動く", () => {
		expect(movedDecks(["slide/team/b", "slide/team/c/d", "slide/teams/e"], "slide/team", "slide/x/team")).toEqual([
			{ from: "slide/team/b", to: "slide/x/team/b" },
			{ from: "slide/team/c/d", to: "slide/x/team/c/d" },
		]);
	});
});

describe("retargetDeck", () => {
	const assets = { tokensCss: "/*t*/", css: "/*c*/", runtime: "void 0;" };
	const sha256 = (text: string, encoding: "hex" | "base64") => createHash("sha256").update(text).digest(encoding);
	const parse = (html: string) => new DOMParser().parseFromString(html, "text/html") as unknown as Document;
	const build = (deckPath: string) =>
		buildDeck({ source: '<title>題</title>\n<section data-pattern="statement"><h2>見出し data-deck="x"</h2></section>', deckPath, assets, parse, sha256, exists: () => false }).html as string;

	it("書き換えた結果は、新しい場所でビルドし直したものと同じバイト列になる", () => {
		expect(retargetDeck(build("slide/old"), "slide/team/new-1")).toBe(build("slide/team/new-1"));
		expect(retargetDeck(build("slide/old"), 'slide/a&"b')).toBe(build('slide/a&"b'));
	});

	it("<html> に data-deck がなければ null（ビルドしたものではない）", () => {
		expect(retargetDeck("<p>x</p>", "slide/a")).toBeNull();
		expect(retargetDeck("<html><body data-deck=\"x\">", "slide/a")).toBeNull();
	});
});

describe("markdownLink", () => {
	it("Vault のルートからのパスで index.html を指す", () => {
		expect(markdownLink("計画 [案]", "slide/team/plan")).toBe("[計画 \\[案\\]](slide/team/plan/index.html)");
	});
});

describe("deckOfFile（ADR-0132）", () => {
	it("デッキの index.html と deck.html から、デッキのフォルダを返す", () => {
		expect(deckOfFile("slide/a/index.html")).toBe("slide/a");
		expect(deckOfFile("slide/team/b/deck.html")).toBe("slide/team/b");
		expect(deckOfFile("slide/index.html")).toBeNull();
		expect(deckOfFile("slide/a/chart.svg")).toBeNull();
		expect(deckOfFile("notes/a/index.html")).toBeNull();
	});
});
