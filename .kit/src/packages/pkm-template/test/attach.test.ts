import { describe, expect, it } from "vitest";
import { MAX_ATTACH_BYTES, assetFileName, attachmentMarkdown, isEmbeddable, joinAttachments } from "../src/core/attach";

describe("assetFileName（ADR-0249）", () => {
	it("空白をハイフンにし、続くハイフンを 1 つにする", () => {
		expect(assetFileName("my  report final.PDF", [])).toBe("my-report-final.pdf");
	});

	it("ファイル名やリンクを壊す文字をハイフンにし、日本語は残す", () => {
		expect(assetFileName("会議 (2026)[v2]#1.png", [])).toBe("会議-2026-v2-1.png");
		expect(assetFileName('a:b*c?"d<e>|f^g%h\\i.txt', [])).toBe("a-b-c-d-e-f-g-h-i.txt");
	});

	it("先頭・末尾と拡張子の前のハイフンを除く", () => {
		expect(assetFileName(" -x- .png", [])).toBe("x.png");
	});

	it("同じ名前があれば -1、-2 を付ける（大文字小文字は区別しない）", () => {
		expect(assetFileName("a b.png", ["a-b.png"])).toBe("a-b-1.png");
		expect(assetFileName("a b.png", ["A-B.png", "a-b-1.png"])).toBe("a-b-2.png");
	});

	it("点だけの名前や先頭の点は残さない（asset/ の外や隠しファイルにしない）", () => {
		expect(assetFileName("..", [])).toBe("file");
		expect(assetFileName("...", [])).toBe("file");
		expect(assetFileName(".env", [])).toBe("env");
		expect(assetFileName("../x.png", [])).toBe("x.png");
	});

	it("拡張子がないもの・名前が空になるもの", () => {
		expect(assetFileName("README", [])).toBe("README");
		expect(assetFileName("###.png", [])).toBe("file.png");
	});
});

describe("isEmbeddable", () => {
	it("画像・PDF・音声・動画は埋め込める", () => {
		for (const n of ["a.png", "a.JPG", "a.svg", "a.pdf", "a.mp3", "a.mp4", "a.webm"]) expect(isEmbeddable(n)).toBe(true);
	});
	it("それ以外は埋め込めない", () => {
		for (const n of ["a.zip", "a.docx", "a.md", "README"]) expect(isEmbeddable(n)).toBe(false);
	});
});

describe("attachmentMarkdown", () => {
	it("link はいつもリンク（表示は拡張子まで）", () => {
		expect(attachmentMarkdown("asset/a-b.png", "link")).toBe("[a-b.png](asset/a-b.png)");
	});
	it("embed はプレビューできるものを埋め込み、ほかはリンクにする", () => {
		expect(attachmentMarkdown("asset/a-b.png", "embed")).toBe("![a-b](asset/a-b.png)");
		expect(attachmentMarkdown("asset/a.zip", "embed")).toBe("[a.zip](asset/a.zip)");
	});
	it("日本語の名前はエンコードせずにそのまま入れる", () => {
		expect(attachmentMarkdown("asset/会議-資料.pdf", "embed")).toBe("![会議-資料](asset/会議-資料.pdf)");
	});
});

describe("joinAttachments", () => {
	it("embed は改行、link は空白で区切る", () => {
		expect(joinAttachments(["a", "b"], "embed")).toBe("a\nb");
		expect(joinAttachments(["a", "b"], "link")).toBe("a b");
	});
});

it("上限は 20MB", () => {
	expect(MAX_ATTACH_BYTES).toBe(20 * 1024 * 1024);
});
