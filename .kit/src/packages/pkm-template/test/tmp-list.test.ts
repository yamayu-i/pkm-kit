import { describe, expect, it } from "vitest";
import { collectTmpEntries, filterTmpEntries, formatModified, formatSize, isTmpPath, openableInObsidian, sortTmpEntries } from "../src/core/tmp-list";

const file = (path: string, mtime: number, size: number) => ({ path, extension: path.slice(path.lastIndexOf(".") + 1), stat: { mtime, size } });
const FILES = [file("tmp/b.html", 300, 10), file("tmp/sub/a.MD", 100, 5000), file("notes/x.md", 999, 1), file("tmpx/y.md", 1, 1), file("tmp/c.svg", 200, 10)];

describe("tmp/ の一覧（ADR-0045）", () => {
	it("tmp/ の下のファイルだけを集め、サブフォルダと Markdown 以外も含む", () => {
		const entries = collectTmpEntries(FILES);
		expect(entries.map((e) => e.name)).toEqual(["b.html", "sub/a.MD", "c.svg"]);
		expect(entries[1]?.ext).toBe("md");
		expect(isTmpPath("tmp")).toBe(false);
		expect(isTmpPath("tmpx/a.md")).toBe(false);
	});

	it("既定は更新日時の新しい順。同じ値は名前の順。名前・大きさでも並べ替える", () => {
		const entries = collectTmpEntries(FILES);
		expect(sortTmpEntries(entries, "modified", "desc").map((e) => e.name)).toEqual(["b.html", "c.svg", "sub/a.MD"]);
		expect(sortTmpEntries(entries, "name", "asc").map((e) => e.name)).toEqual(["b.html", "c.svg", "sub/a.MD"]);
		expect(sortTmpEntries(entries, "size", "asc").map((e) => e.name)).toEqual(["b.html", "c.svg", "sub/a.MD"]);
		expect(sortTmpEntries(entries, "size", "desc").map((e) => e.name)).toEqual(["sub/a.MD", "b.html", "c.svg"]);
	});

	it("名前で絞り込む（大文字小文字を区別しない）", () => {
		const entries = collectTmpEntries(FILES);
		expect(filterTmpEntries(entries, " SUB ").map((e) => e.name)).toEqual(["sub/a.MD"]);
		expect(filterTmpEntries(entries, "").length).toBe(3);
	});

	it("大きさと日時の表示", () => {
		expect(formatSize(0)).toBe("0 B");
		expect(formatSize(1023)).toBe("1023 B");
		expect(formatSize(1024)).toBe("1.0 KB");
		expect(formatSize(12 * 1024 + 300)).toBe("12 KB");
		expect(formatSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
		expect(formatModified(new Date(2026, 10, 8, 9, 5).getTime())).toBe("2026-11-08 09:05");
	});

	it("Obsidian が開ける拡張子", () => {
		expect(openableInObsidian("HTML")).toBe(true);
		expect(openableInObsidian("pdf")).toBe(true);
		expect(openableInObsidian("zip")).toBe(false);
	});
});
