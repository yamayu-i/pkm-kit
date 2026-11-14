import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { applyNotes, buildDeckSource, readDeckNotes, resolveInDeck } from "../src/core/rebuild.ts";
// @ts-expect-error 型のない mjs（CLI のビルドと共用。閲覧の画面の CSS とスクリプト）
import { buildAssets } from "../../slide/esbuild.config.mjs";
// @ts-expect-error 型のない mjs（プレビューと共用）
import { writeGallery } from "../../slide/preview/gallery.mjs";

const cli = fileURLToPath(new URL("../../../../bin/slide.mjs", import.meta.url));
const ids = [...readFileSync(fileURLToPath(new URL("../../slide/src/core/patterns.ts", import.meta.url)), "utf8").matchAll(/\{ id: "([a-z0-9-]+)"/g)].map((m) => m[1]);
const vault = mkdtempSync(join(tmpdir(), "pkm-slide-rebuild-"));
afterAll(() => rmSync(vault, { recursive: true, force: true }));

function cliBuild(deck: string): string {
	const r = spawnSync(process.execPath, [cli, "build", deck], { cwd: vault, encoding: "utf8" });
	expect(r.status, `${r.stdout}${r.stderr}`).toBe(0);
	return readFileSync(join(vault, deck, "index.html"), "utf8");
}
function pluginBuild(deck: string, assets: unknown): string | null {
	const theme = join(vault, ".kit-local/theme.json");
	return buildDeckSource({
		source: readFileSync(join(vault, deck, "deck.html"), "utf8"),
		deckPath: deck,
		assets: assets as never,
		fileExists: (p) => existsSync(join(vault, p)),
		themeJson: existsSync(theme) ? readFileSync(theme, "utf8") : null,
	}).html;
}

describe("プラグインの中のビルド（ADR-0132）", () => {
	it("見本のデッキ・ノートを書き換えたデッキ・子の基本の色で、CLI の build と同じバイト列になる", async () => {
		const assets = await buildAssets();
		writeGallery(vault, ids, { name: "gallery" });
		const deck = "slide/gallery";
		expect(pluginBuild(deck, assets)).toBe(cliBuild(deck));

		const path = join(vault, deck, "deck.html");
		const notes = readDeckNotes(readFileSync(path, "utf8"));
		if ("error" in notes) throw new Error(notes.error);
		const changes = new Map([
			[1, "段落\n\n- a\n  - b\n\n1. 一 < 二 & 三"],
			[2, ""],
			[notes.slides.length, "最後のスライドのノート"],
		]);
		const next = applyNotes(readFileSync(path, "utf8"), changes) as string;
		writeFileSync(path, next);
		expect(pluginBuild(deck, assets)).toBe(cliBuild(deck));
		const after = readDeckNotes(next);
		if ("error" in after) throw new Error(after.error);
		expect(after.slides[0]?.text).toBe("段落\n\n- a\n  - b\n\n1. 一 < 二 & 三");
		expect(after.slides[1]?.text).toBe("");

		mkdirSync(join(vault, ".kit-local"), { recursive: true });
		writeFileSync(join(vault, ".kit-local/theme.json"), JSON.stringify({ light: { primary: "#0b57d0" }, dark: {} }));
		expect(pluginBuild(deck, assets)).toBe(cliBuild(deck));
	});
});

describe("readDeckNotes（ADR-0132）", () => {
	it("スライドごとの見出しとノートを読む", () => {
		const r = readDeckNotes('<title>t</title>\n<section data-pattern="statement">\n  <h2>一 枚目</h2>\n  <aside class="notes">話す</aside>\n</section>\n<section data-pattern="statement"><h2>二</h2></section>');
		expect(r).toEqual({ title: "t", slides: [{ n: 1, title: "一 枚目", text: "話す" }, { n: 2, title: "二", text: "" }] });
	});

	it("書式の外のノート、2 つのノート、<section> の直下でないノートは編集させない", () => {
		for (const inner of ['<aside class="notes"><b>x</b></aside>', '<aside class="notes">1</aside><aside class="notes">2</aside>', '<div class="card"><aside class="notes">x</aside></div>']) {
			expect("error" in readDeckNotes(`<section data-pattern="statement"><h2>a</h2>${inner}</section>`), inner).toBe(true);
		}
	});
});

describe("resolveInDeck", () => {
	it("デッキの中のパスにし、外を指すものは null", () => {
		expect(resolveInDeck("slide/a", "img/x.png")).toBe("slide/a/img/x.png");
		expect(resolveInDeck("slide/a", "./img/../x.png")).toBe("slide/a/x.png");
		expect(resolveInDeck("slide/a", "../b/x.png")).toBeNull();
		expect(resolveInDeck("slide/a", "/x.png")).toBeNull();
		expect(resolveInDeck("slide/a", "https://example.com/x.png")).toBeNull();
	});
});
