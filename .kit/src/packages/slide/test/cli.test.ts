import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const cli = fileURLToPath(new URL("../../../../bin/slide.mjs", import.meta.url));
const roots: string[] = [];
function vault(): string {
	const root = mkdtempSync(join(tmpdir(), "slide-cli-"));
	roots.push(root);
	return root;
}
function run(root: string, ...args: string[]) {
	const r = spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: "utf8" });
	return { code: r.status, out: r.stdout, err: r.stderr };
}
afterEach(() => {
	for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe.skipIf(!existsSync(cli))("ビルド済みの .kit/bin/slide.mjs（ADR-0117）", () => {
	it("new でひな形を作ってビルドし、check が通る。もう一度 new しても上書きしない", () => {
		const root = vault();
		const made = run(root, "new", "slide/team/onboarding", "--title", "入社の手引き");
		expect(made.err).toBe("");
		expect(made.code).toBe(0);
		const index = readFileSync(join(root, "slide/team/onboarding/index.html"), "utf8");
		expect(index).toContain("<title>入社の手引き</title>");
		expect(index).toContain('data-deck="slide/team/onboarding"');
		expect(run(root, "check").out).toContain("1 個のデッキを確かめた");
		expect(run(root, "new", "slide/team/onboarding", "--title", "別の題").code).toBe(1);
		expect(run(root, "new", "notes/deck", "--title", "x").code).toBe(1);
		expect(run(root, "new", "slide/日本語", "--title", "x").code).toBe(1);
	});

	it("check は、手で直した index.html・ビルドし忘れ・slide/ の md・デッキの中のデッキを見つける", () => {
		const root = vault();
		run(root, "new", "slide/a", "--title", "A");
		const index = join(root, "slide/a/index.html");
		writeFileSync(index, readFileSync(index, "utf8").replace("</body>", "<p>手で足した</p></body>"));
		let r = run(root, "check");
		expect(r.code).toBe(1);
		expect(r.err).toContain("node .kit/bin/slide.mjs build slide/a");
		expect(run(root, "build", "slide/a").code).toBe(0);
		expect(run(root, "check").code).toBe(0);

		const deck = join(root, "slide/a/deck.html");
		writeFileSync(deck, readFileSync(deck, "utf8").replace("見出しは、言いたいことを文で書く", "見出しを変えた"));
		expect(run(root, "check").code).toBe(1);
		expect(run(root, "build", "--all").out).toContain("slide/a/index.html: 2 枚");
		expect(run(root, "build", "--all").out).toContain("（変更なし）");

		writeFileSync(join(root, "slide/a/memo.md"), "# メモ\n");
		r = run(root, "check");
		expect(r.code).toBe(1);
		expect(r.err).toContain("slide/ に md を置かない");
		rmSync(join(root, "slide/a/memo.md"));

		run(root, "new", "slide/a/inner", "--title", "中");
		expect(run(root, "check").err).toContain("デッキの中にデッキを作らない");
	});

	it("エラーのある deck.html では index.html を書かず、行番号を出す", () => {
		const root = vault();
		mkdirSync(join(root, "slide/b"), { recursive: true });
		writeFileSync(join(root, "slide/b/deck.html"), '<title>B</title>\n<section data-pattern="statement">\n  <h2 style="color:red">見出し</h2>\n</section>\n');
		const r = run(root, "build", "slide/b");
		expect(r.code).toBe(1);
		expect(r.err).toContain("slide/b/deck.html:3 [エラー style-value] スライド 1:");
		expect(existsSync(join(root, "slide/b/index.html"))).toBe(false);
	});

	it("export は添付を埋め込んだ 1 ファイルを tmp/ に書き、同じ名前があれば番号を付ける", () => {
		const root = vault();
		mkdirSync(join(root, "slide/c"), { recursive: true });
		writeFileSync(join(root, "slide/c/fig.svg"), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>');
		writeFileSync(join(root, "slide/c/deck.html"), '<title>C</title>\n<section data-pattern="image">\n  <h2>見出し</h2>\n  <figure><img src="fig.svg" alt="図"></figure>\n</section>\n');
		expect(run(root, "build", "slide/c").code).toBe(0);
		const r = run(root, "export", "slide/c");
		expect(r.out.trim()).toBe("tmp/c.html");
		const html = readFileSync(join(root, "tmp/c.html"), "utf8");
		expect(html).toContain('src="data:image/svg+xml;base64,');
		expect(html).not.toContain('src="fig.svg"');
		expect(run(root, "export", "slide/c").out.trim()).toBe("tmp/c 2.html");
	});

	it("build と check は .kit-local/theme.json の primary を使い、変えたら check が古いと止める（ADR-0125）", () => {
		const root = vault();
		mkdirSync(join(root, ".kit-local"), { recursive: true });
		writeFileSync(join(root, ".kit-local/theme.json"), JSON.stringify({ light: { primary: "#1E5B3A" } }));
		expect(run(root, "new", "slide/a", "--title", "A").code).toBe(0);
		expect(readFileSync(join(root, "slide/a/index.html"), "utf8")).toContain("--sl-primary:#1e5b3a;");
		expect(run(root, "check").code).toBe(0);
		writeFileSync(join(root, ".kit-local/theme.json"), JSON.stringify({ light: { primary: "#0b57d0" } }));
		expect(run(root, "check").code).toBe(1);
		expect(run(root, "build", "--all").code).toBe(0);
		expect(run(root, "check").code).toBe(0);
	});

	it("patterns は逆引きの一覧を出す", () => {
		const r = run(vault(), "patterns");
		expect(r.code).toBe(0);
		expect(r.out).toContain("assertion-evidence");
		expect(r.out).toContain("# データを見せる");
	});
});
