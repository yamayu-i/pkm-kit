import { describe, expect, it } from "vitest";
import { bytesToBase64, candidatePaths, classifyLink, CSP, firstSrcsetUrl, imageType, isScriptUrl } from "../src/core/policy.ts";

describe("candidatePaths（ADR-0037: HTML からの相対パス → Vault ルートからのパス）", () => {
	it("相対パスを先に、Vault ルートからのパスを後に返す", () => {
		expect(candidatePaths("docs/a.html", "asset/x.png")).toEqual(["docs/asset/x.png", "asset/x.png"]);
		expect(candidatePaths("a.html", "asset/x.png")).toEqual(["asset/x.png"]);
	});
	it(". と .. を畳み、? と # を捨て、%エンコードを戻す", () => {
		expect(candidatePaths("docs/sub/a.html", "../img/./x%20y.png?v=1#top")).toEqual(["docs/img/x y.png"]);
	});
	it("先頭が / なら Vault ルートからだけ", () => {
		expect(candidatePaths("docs/a.html", "/asset/x.png")).toEqual(["asset/x.png"]);
	});
	it("Vault の外に出るもの、スキームのあるもの、// で始まるものは返さない", () => {
		expect(candidatePaths("a.html", "../x.png")).toEqual([]);
		expect(candidatePaths("docs/a.html", "../../x.png")).toEqual([]);
		expect(candidatePaths("a.html", "https://example.com/x.png")).toEqual([]);
		expect(candidatePaths("a.html", "data:image/png;base64,AAAA")).toEqual([]);
		expect(candidatePaths("a.html", "file:///etc/passwd")).toEqual([]);
		expect(candidatePaths("a.html", "//example.com/x.png")).toEqual([]);
		expect(candidatePaths("a.html", "a\\b.png")).toEqual([]);
		expect(candidatePaths("a.html", "%E0%A4%A")).toEqual([]);
		expect(candidatePaths("a.html", "")).toEqual([]);
	});
});

describe("classifyLink", () => {
	it("見出し、外部、Vault の中、それ以外に分ける", () => {
		expect(classifyLink("a.html", "#%E8%A6%8B%E5%87%BA%E3%81%97")).toEqual({ kind: "anchor", id: "見出し" });
		expect(classifyLink("a.html", "https://example.com/a?b=1")).toEqual({ kind: "external", url: "https://example.com/a?b=1" });
		expect(classifyLink("a.html", "mailto:someone@example.com")).toEqual({ kind: "external", url: "mailto:someone@example.com" });
		expect(classifyLink("docs/a.html", "topics/foo.md#見出し")).toEqual({ kind: "vault", candidates: ["docs/topics/foo.md", "topics/foo.md"], subpath: "#見出し" });
		expect(classifyLink("a.html", "b.html")).toEqual({ kind: "vault", candidates: ["b.html"], subpath: "" });
	});
	it("スクリプト、ローカルのファイル、アプリの URL は何もしない", () => {
		for (const href of ["javascript:alert(1)", " JAVASCRIPT:alert(1)", "file:///etc/passwd", "app://local/etc", "data:text/html,x", "obsidian://open?vault=x", "", "#", "../x.md"]) {
			expect(classifyLink("a.html", href), href).toEqual({ kind: "none" });
		}
	});
});

describe("そのほか", () => {
	it("isScriptUrl は空白・制御文字・大文字を無視する", () => {
		expect(isScriptUrl("java\tscript:alert(1)")).toBe(true);
		expect(isScriptUrl("  VBScript:x")).toBe(true);
		expect(isScriptUrl("\u0001javascript:x")).toBe(true);
		expect(isScriptUrl("https://example.com/javascript:")).toBe(false);
	});
	it("imageType は対象の拡張子だけ", () => {
		expect(imageType("asset/a.PNG")).toBe("image/png");
		expect(imageType("asset/a.svg")).toBe("image/svg+xml");
		expect(imageType("asset/a.html")).toBeNull();
		expect(imageType("asset.png/a")).toBeNull();
	});
	it("bytesToBase64 は大きなバイト列も変換できる", () => {
		expect(bytesToBase64(new Uint8Array([0, 1, 2, 255]))).toBe("AAEC/w==");
		const big = new Uint8Array(200_000).fill(65);
		expect(atob(bytesToBase64(big)).length).toBe(200_000);
	});
	it("firstSrcsetUrl は最初の URL だけ", () => {
		expect(firstSrcsetUrl("a.png 1x, b.png 2x")).toBe("a.png");
		expect(firstSrcsetUrl("a.png, b.png")).toBe("a.png");
		expect(firstSrcsetUrl("  ")).toBeNull();
	});
	it("CSP は外部を許さない", () => {
		expect(CSP).toContain("default-src 'none'");
		expect(CSP).not.toMatch(/https?:|\*|'unsafe-eval'|script-src/);
	});
});
