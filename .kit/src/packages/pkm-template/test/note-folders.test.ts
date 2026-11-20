import { describe, expect, it } from "vitest";
import {
	childrenOf,
	countIn,
	folderNameError,
	isDeletable,
	locationOf,
	moveTarget,
	NOTE_ROOT,
	noteFolders,
	outsideNotes,
	renameTarget,
} from "../src/core/note-folders";

describe("noteFolders", () => {
	it("note/ とその下のフォルダを名前の順に返す。隠しフォルダと外のフォルダは除く", () => {
		const folders = ["note/b", "note/a", "note/a/x", "wiki", "note/.trash", "note/a/.git/obj", "notes"];
		expect(noteFolders(folders)).toEqual(["note", "note/a", "note/a/x", "note/b"]);
	});

	it("note/ がなくても note を含む", () => {
		expect(noteFolders([])).toEqual([NOTE_ROOT]);
	});
});

describe("childrenOf", () => {
	const folders = ["note", "note/a", "note/a/x", "note/b"];
	const notes = ["note/top.md", "note/a/one.md", "note/a/x/deep.md", "root.md"];

	it("直下のフォルダとノートだけを返す", () => {
		expect(childrenOf(folders, notes, "note")).toEqual({ folders: ["note/a", "note/b"], notes: ["note/top.md"] });
		expect(childrenOf(folders, notes, "note/a")).toEqual({ folders: ["note/a/x"], notes: ["note/a/one.md"] });
		expect(childrenOf(folders, notes, "note/b")).toEqual({ folders: [], notes: [] });
	});
});

describe("countIn", () => {
	it("下の段も含めたノートの数", () => {
		const notes = ["note/a/one.md", "note/a/x/deep.md", "note/ab.md", "note/top.md"];
		expect(countIn(notes, "note/a")).toBe(2);
		expect(countIn(notes, "note")).toBe(4);
	});
});

describe("outsideNotes", () => {
	it("note/ の外のノートだけを返す", () => {
		expect(outsideNotes(["note/a.md", "memo.md", "x/b.md", "notes/c.md"])).toEqual(["memo.md", "x/b.md", "notes/c.md"]);
	});
});

describe("locationOf", () => {
	it("note/ の中は note/ からのフォルダの位置、直下は空", () => {
		expect(locationOf("note/a.md")).toBe("");
		expect(locationOf("note/a/x/b.md")).toBe("a/x");
	});

	it("note/ の外は Vault ルートからのフォルダの位置、ルートは /", () => {
		expect(locationOf("memo.md")).toBe("/");
		expect(locationOf("x/y/b.md")).toBe("x/y");
	});
});

describe("folderNameError", () => {
	it("日本語やスペースは使える", () => {
		expect(folderNameError("仕事 2026")).toBeNull();
		expect(folderNameError("research")).toBeNull();
	});

	it("空、使えない文字、. で始まるものは理由を返す", () => {
		expect(folderNameError("")).not.toBeNull();
		for (const bad of ["a/b", "a\\b", "a:b", "a*b", "a?b", 'a"b', "a<b", "a>b", "a|b", "a#b", "a^b", "a[b", "a]b", ".hidden"]) {
			expect(folderNameError(bad), bad).not.toBeNull();
		}
	});
});

describe("moveTarget", () => {
	const folders = ["note", "note/a", "note/a/x", "note/b"];
	const none = () => false;

	it("ノートをフォルダの直下に、同じファイル名で動かす", () => {
		expect(moveTarget(folders, "note/top.md", "note/a", none)).toEqual({ path: "note/a/top.md" });
		expect(moveTarget(folders, "memo.md", "note", none)).toEqual({ path: "note/memo.md" });
	});

	it("フォルダを動かす", () => {
		expect(moveTarget(folders, "note/b", "note/a", none)).toEqual({ path: "note/a/b" });
	});

	it("note/ の外には動かさない", () => {
		expect(moveTarget(folders, "note/top.md", "wiki", none)).toHaveProperty("error");
	});

	it("フォルダを自分自身やその下には動かさない", () => {
		expect(moveTarget(folders, "note/a", "note/a", none)).toHaveProperty("error");
		expect(moveTarget(folders, "note/a", "note/a/x", none)).toHaveProperty("error");
	});

	it("すでにそこにあるもの、note/ そのもの、同じ名前があるものは動かさない", () => {
		expect(moveTarget(folders, "note/a/one.md", "note/a", none)).toHaveProperty("error");
		expect(moveTarget(folders, "note", "note/a", none)).toHaveProperty("error");
		expect(moveTarget(folders, "note/top.md", "note/a", (p) => p === "note/a/top.md")).toHaveProperty("error");
	});
});

describe("renameTarget", () => {
	it("同じ親のまま名前を変える", () => {
		expect(renameTarget("note/a/x", "仕事", () => false)).toEqual({ path: "note/a/仕事" });
	});

	it("使えない名前、同じ名前、すでにある名前は理由を返す", () => {
		expect(renameTarget("note/a", "a/b", () => false)).toHaveProperty("error");
		expect(renameTarget("note/a", "a", () => false)).toHaveProperty("error");
		expect(renameTarget("note/a", "b", (p) => p === "note/b")).toHaveProperty("error");
	});

	it("note/ そのものは変えない", () => {
		expect(renameTarget("note", "memo", () => false)).toHaveProperty("error");
	});
});

describe("isDeletable", () => {
	it(".gitkeep だけなら消せる", () => {
		expect(isDeletable(["note/a/.gitkeep", "note/b/x.md"], "note/a")).toBe(true);
		expect(isDeletable([], "note/a")).toBe(true);
	});

	it("ほかのファイルがあれば消せない（下の段も見る）", () => {
		expect(isDeletable(["note/a/x/img.png"], "note/a")).toBe(false);
		expect(isDeletable(["note/a/one.md"], "note/a")).toBe(false);
	});

	it("note/ そのものは消さない", () => {
		expect(isDeletable([], "note")).toBe(false);
	});
});
