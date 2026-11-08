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

	it("md の updated は衝突させず、新しい方を採る(ADR-0028)", async () => {
		const fm = (updated: string, body: string) => `---\ntype: note\nupdated: "${updated}"\n---\n${body}`;
		const { run } = setup({
			b: fm("2026-10-01T09:00:00+09:00", "1\n2\n3\n"),
			o: fm("2026-10-25T09:00:00+09:00", "1\n2\n3 ours\n"),
			t: fm("2026-10-20T09:00:00+09:00", "1 theirs\n2\n3\n"),
		});
		const { entries, conflicts } = await run({ "n.md": "b" }, { "n.md": "o" }, { "n.md": "t" });
		expect(conflicts).toEqual([]);
		const e = entries.get("n.md");
		expect(e && "content" in e ? dec(e.content) : "").toBe(fm("2026-10-25T09:00:00+09:00", "1 theirs\n2\n3 ours\n"));
	});

	it("md 以外の updated: の行や、対象外のパスは従来どおりのマージ", async () => {
		const { run } = setup({ b: "updated: a\n1\n", o: "updated: b\n1\n", t: "updated: c\n1\n" });
		const { conflicts } = await run({ "README.md": "b" }, { "README.md": "o" }, { "README.md": "t" });
		expect(conflicts.map((c) => c.kind)).toEqual(["markers"]);
	});

	it("Draw.io の図は、両側の変更が別の行でも行単位でマージせず、リモート版と別名のローカル版を残す(ADR-0064)", async () => {
		const svg = (label: string, page: string) => `<svg content="&lt;mxfile&gt;${page}&lt;/mxfile&gt;">\n<text>${label}</text>\n</svg>\n`;
		const { run } = setup({ b: svg("a", "p1"), o: svg("a", "p1-ours"), t: svg("b", "p1") });
		for (const path of ["asset/sys.drawio.svg", "asset/sys.drawio", "asset/SYS.DRAWIO.SVG"]) {
			const r = await run({ [path]: "b" }, { [path]: "o" }, { [path]: "t" });
			const dot = path.toLowerCase().lastIndexOf(".drawio");
			const copyPath = `${path.slice(0, dot)} (conflict pc 2026-10-31 1200)${path.slice(dot)}`;
			expect(r.entries.get(path)).toEqual({ oid: "t", mode: "100644" });
			expect(r.entries.get(copyPath)).toEqual({ oid: "o", mode: "100644" });
			expect(r.conflicts).toEqual([{ path, kind: "copy", copyPath }]);
		}
	});

	it("Draw.io の図でも、片側だけの変更・同じ変更はそのまま採る(ADR-0064)", async () => {
		const { run } = setup({});
		const r = await run({ "asset/a.drawio.svg": "b", "asset/c.drawio.svg": "b" }, { "asset/a.drawio.svg": "o", "asset/c.drawio.svg": "x" }, { "asset/a.drawio.svg": "b", "asset/c.drawio.svg": "x" });
		expect(r.entries.get("asset/a.drawio.svg")).toEqual({ oid: "o", mode: "100644" });
		expect(r.entries.get("asset/c.drawio.svg")).toEqual({ oid: "x", mode: "100644" });
		expect(r.conflicts).toEqual([]);
	});

	it("衝突の版の名前は、Draw.io の図の二重の拡張子を保つ(ADR-0064)", () => {
		expect(conflictCopyPath("asset/a.drawio.svg", "s", () => false)).toBe("asset/a (conflict s).drawio.svg");
		expect(conflictCopyPath("asset/a.b.svg", "s", () => false)).toBe("asset/a.b (conflict s).svg");
		expect(conflictCopyPath("asset/.drawio.svg", "s", () => false)).toBe("asset/.drawio (conflict s).svg");
	});
});
