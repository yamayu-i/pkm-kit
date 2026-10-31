import { describe, expect, it } from "vitest";
import { conflictCopyPath, mergeTrees, type TreeEntry } from "../src/merge/tree-merge";

const enc = (s: string) => new TextEncoder().encode(s);
const dec = (b: Uint8Array) => new TextDecoder().decode(b);

function setup(blobs: Record<string, string | Uint8Array>) {
	const entry = (oid: string): TreeEntry => ({ oid, mode: "100644" });
	const map = (files: Record<string, string>) => new Map(Object.entries(files).map(([p, oid]) => [p, entry(oid)]));
	return {
		map,
		run: (base: Record<string, string>, ours: Record<string, string>, theirs: Record<string, string>) =>
			mergeTrees({
				base: map(base),
				ours: map(ours),
				theirs: map(theirs),
				readBlob: async (oid) => {
					const b = blobs[oid];
					if (b === undefined) throw new Error(`no blob ${oid}`);
					return typeof b === "string" ? enc(b) : b;
				},
				labels: { ours: "local", theirs: "remote" },
				copySuffix: "pc 2026-10-31 1200",
			}),
	};
}

describe("mergeTrees", () => {
	it("片側だけの追加・変更・削除はそのまま採用", async () => {
		const { run } = setup({});
		const r = await run({ a: "1", b: "2", c: "3" }, { a: "1x", b: "2", c: "3", n: "9" }, { a: "1", b: "2" });
		expect([...r.entries].map(([p, e]) => [p, "oid" in e ? e.oid : "?"])).toEqual([
			["a", "1x"],
			["b", "2"],
			["n", "9"],
		]);
		expect(r.conflicts).toEqual([]);
	});

	it("バイナリの衝突はリモート優先＋ローカル版を別名保存", async () => {
		const { run } = setup({ o: new Uint8Array([0, 1]), t: new Uint8Array([0, 2]), b: new Uint8Array([0, 0]) });
		const r = await run({ "img/a.png": "b" }, { "img/a.png": "o" }, { "img/a.png": "t" });
		expect(r.entries.get("img/a.png")).toEqual({ oid: "t", mode: "100644" });
		expect(r.entries.get("img/a (conflict pc 2026-10-31 1200).png")).toEqual({ oid: "o", mode: "100644" });
		expect(r.conflicts).toEqual([
			{ path: "img/a.png", kind: "copy", copyPath: "img/a (conflict pc 2026-10-31 1200).png" },
		]);
	});

	it("JSON でも重ならない変更は行マージする", async () => {
		const { run } = setup({
			b: '{\n"a":1,\n"k":0,\n"b":1\n}\n',
			o: '{\n"a":2,\n"k":0,\n"b":1\n}\n',
			t: '{\n"a":1,\n"k":0,\n"b":2\n}\n',
		});
		const r = await run({ "x.json": "b" }, { "x.json": "o" }, { "x.json": "t" });
		const e = r.entries.get("x.json");
		expect(e && "content" in e ? dec(e.content) : null).toBe('{\n"a":2,\n"k":0,\n"b":2\n}\n');
		expect(r.conflicts).toEqual([]);
	});

	it("ファイルとフォルダの衝突はエラーにする", async () => {
		const { run } = setup({ x: "x\n", y: "y\n" });
		await expect(run({}, { a: "x" }, { "a/b.md": "y" })).rejects.toThrow("ファイルとフォルダ");
	});

	it("コンフリクト版の名前が埋まっていたら番号を付ける", () => {
		const taken = new Set(["a (conflict s).md"]);
		expect(conflictCopyPath("a.md", "s", (p) => taken.has(p))).toBe("a (conflict s 2).md");
		expect(conflictCopyPath("dir/Makefile", "s", () => false)).toBe("dir/Makefile (conflict s)");
	});
});
