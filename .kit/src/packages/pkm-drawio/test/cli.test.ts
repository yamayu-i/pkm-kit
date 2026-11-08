import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { main } from "../cli/drawio.ts";
import { svgDataUri } from "../src/core/encoding.ts";
import { toSharingSvg } from "../src/core/svg.ts";

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
const DIAGRAM = fixture("two-pages.drawio.svg");

let root: string;
let out: string[];
let err: string[];
const run = (...argv: string[]) => main(argv, { cwd: root, out: (t) => out.push(t), err: (t) => err.push(t) });

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), "pkm-drawio-cli-"));
	out = [];
	err = [];
	mkdirSync(join(root, "asset"));
	mkdirSync(join(root, "daily"));
	writeFileSync(join(root, "asset", "sys.drawio.svg"), DIAGRAM);
	writeFileSync(join(root, "daily", "note.md"), "# 題\n\n![構成図](asset/sys.drawio.svg)\n");
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("drawio.mjs", () => {
	it("export: tmp/ に書き出し、元のノートと図は変えない。2 回目は別名で同じ中身", async () => {
		expect(await run("export", "daily/note.md")).toBe(0);
		const first = readFileSync(join(root, "tmp", "note.md"), "utf8");
		expect(first).toBe(`# 題\n\n![構成図](${svgDataUri(toSharingSvg(DIAGRAM))})\n`);
		expect(readFileSync(join(root, "daily", "note.md"), "utf8")).toBe("# 題\n\n![構成図](asset/sys.drawio.svg)\n");
		expect(readFileSync(join(root, "asset", "sys.drawio.svg"), "utf8")).toBe(DIAGRAM);
		expect(await run("export", "daily/note.md")).toBe(0);
		expect(readFileSync(join(root, "tmp", "note 2.md"), "utf8")).toBe(first);
		expect(await run("check", "tmp")).toBe(0);
	});

	it("export: 見つからない図があれば何も書かない。--output の既存のファイルは上書きしない", async () => {
		writeFileSync(join(root, "bad.md"), "![](asset/none.drawio.svg)");
		expect(await run("export", "bad.md")).toBe(1);
		expect(err.join("\n")).toContain("見つからない");
		writeFileSync(join(root, "tmp.md"), "x");
		expect(await run("export", "daily/note.md", "--output", "tmp.md")).toBe(1);
		expect(readFileSync(join(root, "tmp.md"), "utf8")).toBe("x");
	});

	it("check: 図への参照と編集用 XML が残ったものを見つける", async () => {
		mkdirSync(join(root, "tmp"));
		writeFileSync(join(root, "tmp", "a.md"), "![](asset/sys.drawio.svg)");
		writeFileSync(join(root, "tmp", "b.html"), `<img src="${svgDataUri(DIAGRAM)}">`);
		expect(await run("check", "tmp")).toBe(1);
		expect(err).toHaveLength(2);
	});

	it("extract と strip", async () => {
		expect(await run("extract", "asset/sys.drawio.svg")).toBe(0);
		expect(out[0]).toBe(fixture("two-pages.drawio"));
		expect(await run("strip", "asset/sys.drawio.svg", "--output", "tmp/s.svg")).toBe(0);
		expect(readFileSync(join(root, "tmp", "s.svg"), "utf8")).toBe(toSharingSvg(DIAGRAM));
	});

	it("知らないコマンドは使い方を出す", async () => {
		expect(await run("render")).toBe(2);
		expect(err[0]).toContain("使い方");
	});
});
