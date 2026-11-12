import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readTokens } from "../node/build.ts";
import { runTheme } from "../node/theme-cli.ts";

const tokens = readTokens();
let root: string;

const write = (rel: string, text: string) => {
	mkdirSync(join(root, rel, ".."), { recursive: true });
	writeFileSync(join(root, rel), text);
};
const read = (rel: string) => readFileSync(join(root, rel), "utf8");
const run = (...args: string[]) => runTheme(args, root, tokens);
const appearance = { cssTheme: "", accentColor: "#6750a4", translucency: false, enabledCssSnippets: ["pkm-theme"], theme: "system" };

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), "theme-cli-"));
	write(".obsidian/appearance.json", JSON.stringify(appearance, null, 2));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("theme.mjs", () => {
	it("theme.json がなければ、check は何もせずに通る", () => {
		expect(run("check")).toMatchObject({ code: 0 });
	});

	it("build はスニペットを作り、appearance.json の 2 つのキーだけを合わせる。その後の check は通る", () => {
		write(".kit-local/theme.json", JSON.stringify({ light: { primary: "#00639b" } }));
		expect(run("build").code).toBe(0);
		expect(read(".obsidian/snippets/pkm-theme-local.css")).toContain("--vt-primary: #00639b;");
		const raw = read(".obsidian/appearance.json");
		expect(raw.endsWith("\n")).toBe(false);
		expect(JSON.parse(raw)).toEqual({ ...appearance, accentColor: "#00639b", enabledCssSnippets: ["pkm-theme", "pkm-theme-local"] });
		expect(run("check")).toMatchObject({ code: 0 });
	});

	it("規約に合わなければ、build は何も書かずに止まる", () => {
		write(".kit-local/theme.json", JSON.stringify({ light: { primary: "#d0bcff" } }));
		const r = run("build");
		expect(r.code).toBe(1);
		expect(r.err.join("\n")).toMatch(/何も書きませんでした[\s\S]*primary（ライト）/);
		expect(existsSync(join(root, ".obsidian/snippets/pkm-theme-local.css"))).toBe(false);
		expect(JSON.parse(read(".obsidian/appearance.json"))).toEqual(appearance);
	});

	it("上書きできない色を書いたら、build は止まる", () => {
		write(".kit-local/theme.json", JSON.stringify({ light: { green: "#00ff00" } }));
		expect(run("build").err.join("\n")).toMatch(/green は上書きできません/);
	});

	it("check は、手で直したスニペット・規約に合わない theme.json・合っていない appearance.json を見つける", () => {
		write(".kit-local/theme.json", JSON.stringify({ light: { primary: "#00639b" } }));
		run("build");
		write(".obsidian/snippets/pkm-theme-local.css", `${read(".obsidian/snippets/pkm-theme-local.css")}\n/* 手で足した */\n`);
		expect(run("check").err.join("\n")).toMatch(/作ったものと違います/);

		run("build");
		write(".obsidian/appearance.json", JSON.stringify(appearance, null, 2));
		const e = run("check").err.join("\n");
		expect(e).toMatch(/accentColor/);
		expect(e).toMatch(/pkm-theme-local/);

		write(".kit-local/theme.json", JSON.stringify({ light: { primary: "#d0bcff" } }));
		expect(run("check").err.join("\n")).toMatch(/コントラスト不足/);
	});

	it("theme.json がないのにスニペットだけ残っていれば、check は止まる", () => {
		write(".obsidian/snippets/pkm-theme-local.css", "/* */\n");
		expect(run("check").code).toBe(1);
	});

	it("list は上書きできる色を出す", () => {
		const r = run("list");
		expect(r.code).toBe(0);
		expect(r.out.join("\n")).toMatch(/primary: #6750a4 \/ #d0bcff/);
		expect(r.out.join("\n")).not.toMatch(/green/);
	});
});
