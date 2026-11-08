import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { DOMParser } from "linkedom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildStandalone, type StandaloneOptions } from "../src/core/standalone.ts";
import { CSP } from "../src/core/policy.ts";

const CSS = ":root { --vt-primary: #6750a4; }\n@media (prefers-color-scheme: dark) { :root { --vt-primary: #d0bcff; } }";
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
const DIAGRAM = '<svg xmlns="http://www.w3.org/2000/svg" content="&lt;mxfile&gt;secret&lt;/mxfile&gt;" width="10"><rect/></svg>';

const parse = (html: string) => new DOMParser().parseFromString(html, "text/html") as unknown as Document;

function options(files: Record<string, Uint8Array | string> = {}): StandaloneOptions {
	return {
		path: "docs/page.html",
		standaloneCss: CSS,
		parse,
		readImage: async (candidates) => {
			for (const c of candidates) {
				const f = files[c];
				if (f !== undefined) return typeof f === "string" ? new TextEncoder().encode(f) : f;
			}
			return null;
		},
	};
}

const EVIL = `<!DOCTYPE html><html><head><meta charset="shift_jis"><title>T</title>
<meta http-equiv="refresh" content="0;url=https://example.com"><link rel="stylesheet" href="https://example.com/a.css">
<script>alert(1)</script><style>@import url(https://example.com/b.css); h1 { color: var(--vt-primary); }</style></head>
<body class="theme-dark"><h1 onclick="x()">Hi</h1><a href="javascript:alert(1)">bad</a><a href="other.md">ok</a>
<img src="pic.png"><img src="/asset/d.drawio.svg"><img src="../../outside.png"><img src="https://example.com/x.png">
<iframe src="https://example.com"></iframe><object data="x"></object></body></html>`;

describe("buildStandalone（ADR-0044）", () => {
	it("スクリプトと外部の読み込みを除き、CSP・charset・トークンを <head> の最初に入れる", async () => {
		const out = await buildStandalone(EVIL, options());
		expect(out.startsWith("<!DOCTYPE html>\n<html><head><meta charset=\"utf-8\">")).toBe(true);
		const doc = parse(out);
		const head = [...doc.head.children];
		expect(head[1]?.getAttribute("http-equiv")).toBe("Content-Security-Policy");
		expect(head[1]?.getAttribute("content")).toBe(CSP);
		expect(head[2]?.getAttribute("name")).toBe("viewport");
		expect(head[3]?.tagName.toLowerCase()).toBe("style");
		expect(head[3]?.textContent).toBe(CSS);
		expect(doc.querySelectorAll("meta[charset]").length).toBe(1);
		for (const sel of ["script", "link", "iframe", "object", "meta[http-equiv=refresh]"]) expect(doc.querySelectorAll(sel).length, sel).toBe(0);
		expect(out).not.toContain("onclick");
		expect(out).not.toContain("javascript:");
		expect(out).not.toContain("theme-dark");
		expect(out).toContain('<a href="other.md">ok</a>');
		expect(out).toContain("<title>T</title>");
	});

	it("Vault の中の画像を data: に、図は編集用 XML を除いて埋め込む。Vault の外・外部の画像は埋め込まない", async () => {
		const out = await buildStandalone(EVIL, options({ "docs/pic.png": PNG, "asset/d.drawio.svg": DIAGRAM, "outside.png": PNG }));
		const srcs = [...parse(out).querySelectorAll("img")].map((i) => i.getAttribute("src"));
		expect(srcs[0]).toBe("data:image/png;base64,iVBORw==");
		const svg = Buffer.from((srcs[1] as string).replace("data:image/svg+xml;base64,", ""), "base64").toString("utf8");
		expect(svg).toBe('<svg xmlns="http://www.w3.org/2000/svg" width="10"><rect/></svg>');
		expect(srcs[2]).toBe("../../outside.png");
		expect(srcs[3]).toBe("https://example.com/x.png");
	});

	it("同じ入力からは同じバイト列になる", async () => {
		const files = { "docs/pic.png": PNG, "asset/d.drawio.svg": DIAGRAM };
		expect(await buildStandalone(EVIL, options(files))).toBe(await buildStandalone(EVIL, options(files)));
	});

	it("<html> のない断片や、<head> / <body> を省いた HTML も文書の形に整える", async () => {
		const frag = parse(await buildStandalone("<p>hi</p>", options()));
		expect(frag.body.innerHTML).toBe("<p>hi</p>");
		const loose = parse(await buildStandalone("<html><title>t</title><p>x</p></html>", options()));
		expect(loose.head.querySelector("title")?.textContent).toBe("t");
		expect(loose.body.innerHTML).toBe("<p>x</p>");
		expect([...loose.documentElement.children].map((e) => e.tagName.toLowerCase())).toEqual(["head", "body"]);
	});

	it("元の viewport は残し、重ねて入れない", async () => {
		const out = await buildStandalone('<html><head><meta name="viewport" content="width=500"></head><body></body></html>', options());
		const vps = [...parse(out).querySelectorAll('meta[name="viewport"]')];
		expect(vps.map((m) => m.getAttribute("content"))).toEqual(["width=500"]);
	});
});

const bin = fileURLToPath(new URL("../../../../bin/html.mjs", import.meta.url));

describe.skipIf(!existsSync(bin))("CLI .kit/bin/html.mjs（ADR-0044）", () => {
	let root: string;
	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "pkm-html-cli-"));
		mkdirSync(join(root, "docs"));
		mkdirSync(join(root, "asset"));
		writeFileSync(join(root, "docs", "page.html"), EVIL);
		writeFileSync(join(root, "docs", "pic.png"), PNG);
		writeFileSync(join(root, "asset", "d.drawio.svg"), DIAGRAM);
	});
	afterEach(() => rmSync(root, { recursive: true, force: true }));
	const run = (...args: string[]) => execFileSync(process.execPath, [bin, ...args], { cwd: root, encoding: "utf8", stdio: "pipe" });

	it("tmp/ に書き出し、あれば番号を付ける。トークンの値と画像が入り、スクリプトがない", () => {
		expect(run("export", "docs/page.html").trim()).toBe(join("tmp", "page.html"));
		expect(run("export", "docs/page.html").trim()).toBe(join("tmp", "page 2.html"));
		const a = readFileSync(join(root, "tmp", "page.html"), "utf8");
		expect(readFileSync(join(root, "tmp", "page 2.html"), "utf8")).toBe(a);
		expect(a).toContain("@media (prefers-color-scheme: dark)");
		expect(a).toContain("--vt-primary:");
		expect(a).toContain("data:image/png;base64,");
		expect(a).not.toContain("<script");
		expect(a).not.toContain("secret");
	});

	it("--output の先があれば書かない。Vault の外や html でないものは断る", () => {
		writeFileSync(join(root, "taken.html"), "x");
		expect(() => run("export", "docs/page.html", "--output", "taken.html")).toThrow();
		expect(() => run("export", "docs/pic.png")).toThrow();
		expect(() => run("export", "../x.html")).toThrow();
		expect(() => run("nope")).toThrow();
	});
});
