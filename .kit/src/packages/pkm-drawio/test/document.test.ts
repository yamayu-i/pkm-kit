import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkExported, documentKind, embedDiagrams, findImageReferences } from "../src/core/document.ts";
import { svgDataUri } from "../src/core/encoding.ts";
import { toSharingSvg } from "../src/core/svg.ts";

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
const DIAGRAM = fixture("two-pages.drawio.svg");
const URI = svgDataUri(toSharingSvg(DIAGRAM));

function vault(files: Record<string, string>) {
	const reads: string[] = [];
	return {
		reads,
		readText: async (path: string) => {
			reads.push(path);
			return files[path] ?? null;
		},
	};
}

describe("documentKind", () => {
	it("拡張子で決める", () => {
		expect(documentKind("a/b.md")).toBe("markdown");
		expect(documentKind("a/b.HTML")).toBe("html");
		expect(documentKind("a/b.txt")).toBeNull();
	});
});

describe("findImageReferences（md）", () => {
	const urls = (text: string) => findImageReferences(text, "markdown").map((r) => r.url);

	it("本文の画像、タイトル付き、<> で囲んだもの、<img> を拾う", () => {
		expect(urls('![a](asset/a.drawio.svg) ![b](asset/b.drawio.svg "題") ![c](<asset/c d.drawio.svg>) <img src="asset/e.drawio.svg">')).toEqual([
			"asset/a.drawio.svg",
			"asset/b.drawio.svg",
			"asset/c d.drawio.svg",
			"asset/e.drawio.svg",
		]);
	});

	it("コードブロック・インラインのコード・コメント・エスケープ・普通のリンクは拾わない", () => {
		const text = [
			"```md",
			"![x](asset/x.drawio.svg)",
			"```",
			"~~~~",
			"![y](asset/y.drawio.svg)",
			"~~~~",
			"`![z](asset/z.drawio.svg)` ``![w](asset/w.drawio.svg)``",
			"<!-- ![c](asset/c.drawio.svg) -->",
			"\\![e](asset/e.drawio.svg) [link](asset/l.drawio.svg)",
			"- ```",
			"  ![li](asset/li.drawio.svg)",
			"  ```",
			"![ok](asset/ok.drawio.svg)",
		].join("\n");
		expect(urls(text)).toEqual(["asset/ok.drawio.svg"]);
	});

	it("閉じていないフェンスの後ろは拾わない。閉じていないバッククォートは文字として扱う", () => {
		expect(urls("`a ![ok](asset/a.drawio.svg)\n```\n![x](asset/x.drawio.svg)")).toEqual(["asset/a.drawio.svg"]);
	});

	it("説明の中のかっこと、URL の中のかっこ", () => {
		expect(urls("![図 [1]](asset/a(1).drawio.svg)")).toEqual(["asset/a(1).drawio.svg"]);
	});
});

describe("embedDiagrams", () => {
	it("md の図の参照だけを data URI に置き換え、ほかの本文は変えない", async () => {
		const v = vault({ "asset/sys.drawio.svg": DIAGRAM, "asset/p.png": "png" });
		const text = "# 題\n\n![構成図](asset/sys.drawio.svg \"題\")\n\n![写真](asset/p.png)\n\n`![例](asset/sys.drawio.svg)`\n\n[元の図](asset/sys.drawio.svg)\n";
		const r = await embedDiagrams(text, { sourcePath: "daily/2026/11/2026-11-08.md", kind: "markdown", readText: v.readText });
		expect(r.errors).toEqual([]);
		expect(r.warnings).toEqual([]);
		expect(r.diagrams).toEqual(["asset/sys.drawio.svg"]);
		expect(r.text).toBe(text.replace('![構成図](asset/sys.drawio.svg "題")', `![構成図](${URI} "題")`));
		expect(checkExported(r.text, "markdown")).toEqual([]);
	});

	it("同じ図を何度使っても 1 回だけ読む。空白を %20 で書いた参照も読む", async () => {
		const v = vault({ "asset/a b.drawio.svg": DIAGRAM });
		const r = await embedDiagrams("![1](asset/a%20b.drawio.svg)\n![2](<asset/a b.drawio.svg>)", { sourcePath: "n.md", kind: "markdown", readText: v.readText });
		expect(r.text).toBe(`![1](${URI})\n![2](<${URI}>)`);
		expect(v.reads).toEqual(["asset/a b.drawio.svg"]);
	});

	it("md の参照はノートの場所によらず Vault ルートから解決する", async () => {
		const v = vault({ "asset/a.drawio.svg": DIAGRAM, "daily/asset/a.drawio.svg": "<svg/>" });
		const r = await embedDiagrams("![a](asset/a.drawio.svg)", { sourcePath: "daily/n.md", kind: "markdown", readText: v.readText });
		expect(r.text).toBe(`![a](${URI})`);
	});

	it("html は pkm-html と同じく、ファイルからの相対、なければルート", async () => {
		const v = vault({ "docs/asset/a.drawio.svg": DIAGRAM, "asset/b.drawio.svg": DIAGRAM });
		const html = '<p><img alt="a" src="asset/a.drawio.svg"> <img src=\'/asset/b.drawio.svg\'></p><!-- <img src="asset/a.drawio.svg"> --><script>var s = \'<img src="asset/a.drawio.svg">\'</script>';
		const r = await embedDiagrams(html, { sourcePath: "docs/report.html", kind: "html", readText: v.readText });
		expect(r.errors).toEqual([]);
		expect(r.text).toBe(html.replace('src="asset/a.drawio.svg">', `src="${URI}">`).replace("src='/asset/b.drawio.svg'", `src='${URI}'`));
		expect(checkExported(r.text, "html", "docs/report.html")).toEqual([]);
	});

	it("見つからない図・壊れた図・スクリプトのある図はエラー（書き出さない）", async () => {
		const v = vault({ "asset/bad.drawio.svg": "<html/>", "asset/evil.drawio.svg": '<svg onload="x()"></svg>' });
		const r = await embedDiagrams("![](asset/none.drawio.svg) ![](asset/bad.drawio.svg) ![](asset/evil.drawio.svg)", { sourcePath: "n.md", kind: "markdown", readText: v.readText });
		expect(r.errors).toHaveLength(3);
		expect(r.errors[0]).toContain("asset/none.drawio.svg");
		expect(r.errors[1]).toContain("asset/bad.drawio.svg");
		expect(r.errors[2]).toContain("イベント属性");
	});

	it("編集用 XML のない SVG と外部の読み込みは警告", async () => {
		const v = vault({ "asset/p.drawio.svg": '<svg><image href="https://example.com/a.png"/></svg>' });
		const r = await embedDiagrams("![](asset/p.drawio.svg)", { sourcePath: "n.md", kind: "markdown", readText: v.readText });
		expect(r.errors).toEqual([]);
		expect(r.warnings).toHaveLength(2);
	});

	it("Vault の外を指す参照・外部の URL は対象外", async () => {
		const v = vault({});
		const r = await embedDiagrams("![](../asset/a.drawio.svg) ![](https://example.com/a.drawio.svg)", { sourcePath: "n.md", kind: "markdown", readText: v.readText });
		expect(r.errors).toEqual([]);
		expect(v.reads).toEqual([]);
	});
});

describe("checkExported", () => {
	it("図のファイルへの参照と、編集用 XML の残った data URI を見つける", () => {
		const text = `![](asset/a.drawio.svg) ![](${svgDataUri(DIAGRAM)}) ![](${URI})`;
		expect(checkExported(text, "markdown")).toEqual(["図のファイルへの参照が残っている: asset/a.drawio.svg", "埋め込んだ SVG に編集用 XML が残っている"]);
	});
});
