/**
 * スライドの CLI（ADR-0117）。PC の Claude Code とスキルが使う。ビルドして .kit/bin/slide.mjs に置く（子の Vault はビルドせずに使う）。
 *
 *   node .kit/bin/slide.mjs new <slide/…のフォルダ> --title <題>     デッキのフォルダと deck.html のひな形を作り、ビルドする
 *   node .kit/bin/slide.mjs build <フォルダ>… | --all [--watch]       deck.html を検査し、index.html を書く
 *   node .kit/bin/slide.mjs check [<フォルダ>…]                        index.html が今の deck.html と CLI から作ったものと同じかを確かめる
 *   node .kit/bin/slide.mjs export <フォルダ>                          添付を埋め込んだ 1 ファイルを tmp/ に書く（外部に渡す用）
 *   node .kit/bin/slide.mjs pdf <フォルダ>                             PC の Chrome 系のブラウザで PDF にして tmp/ に書く
 *   node .kit/bin/slide.mjs patterns                                   パターンの一覧（逆引き）
 *
 * Vault のルートは --vault <パス>（既定は今のフォルダ）。フォルダは今のフォルダからのパスで書く
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, statSync, watch, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { DOMParser } from "linkedom";
import assets from "virtual:slide-assets";
import { freePath, TMP_FOLDER } from "../../pkm-diagram/src/core/names.ts";
import { bytesToBase64, imageType, MAX_IMAGE_BYTES } from "../../pkm-html/src/core/policy.ts";
import { buildDeck, type BuildResult, type Problem } from "../src/core/build.ts";
import { PATTERNS } from "../src/core/patterns.ts";
import { parseVaultPrimary } from "../src/core/vault-primary.ts";
import { THEME_FILE } from "../../design/src/theme.ts";

export interface Io {
	cwd: string;
	out(text: string): void;
	err(text: string): void;
}

export const SLIDE_FOLDER = "slide";
export const SOURCE = "deck.html";
export const OUTPUT = "index.html";

const USAGE = `使い方:
  slide.mjs new <slide/…のフォルダ> --title <題>
  slide.mjs build <フォルダ>… | --all [--watch]
  slide.mjs check [<フォルダ>…]
  slide.mjs export <フォルダ>
  slide.mjs pdf <フォルダ>
  slide.mjs patterns
  （共通: --vault <Vault のルート>。既定は今のフォルダ）`;

const FLAGS = new Set(["all", "watch"]);

function parseArgs(args: string[]): { positional: string[]; options: Map<string, string> } {
	const positional: string[] = [];
	const options = new Map<string, string>();
	for (let i = 0; i < args.length; i++) {
		const a = args[i] as string;
		if (!a.startsWith("--")) positional.push(a);
		else if (FLAGS.has(a.slice(2))) options.set(a.slice(2), "true");
		else {
			const value = args[i + 1];
			if (value === undefined || value.startsWith("--")) throw new Error(`${a} に値がない`);
			options.set(a.slice(2), value);
			i++;
		}
	}
	return { positional, options };
}

const parse = (html: string) => new DOMParser().parseFromString(html, "text/html") as unknown as Document;

/** Vault の中のパス（/ 区切り）。Vault の外なら null */
function vaultPath(root: string, file: string): string | null {
	const rel = relative(root, file);
	if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) return null;
	return rel.split(sep).join("/");
}

/** デッキのフォルダ（Vault から見たパス）。slide/ の下でなければエラー */
function deckOf(root: string, cwd: string, arg: string): string {
	let full = resolve(cwd, arg);
	if (existsSync(full) && statSync(full).isFile()) full = dirname(full);
	const path = vaultPath(root, full);
	if (path === null || !path.startsWith(`${SLIDE_FOLDER}/`)) throw new Error(`${arg}: デッキは Vault の ${SLIDE_FOLDER}/ の下に置く`);
	return path;
}

/** slide/ の下の、deck.html があるフォルダ */
export function findDecks(root: string): string[] {
	const found: string[] = [];
	const walk = (path: string) => {
		const full = join(root, ...path.split("/"));
		if (!existsSync(full)) return;
		const entries = readdirSync(full, { withFileTypes: true });
		if (entries.some((e) => e.isFile() && e.name === SOURCE)) found.push(path);
		for (const e of entries) if (e.isDirectory() && !e.name.startsWith(".")) walk(`${path}/${e.name}`);
	};
	walk(SLIDE_FOLDER);
	return found.sort();
}

/**
 * 子の Vault の基本の色の primary（ADR-0125）。theme.json がなければ undefined（上流の primary）。
 * 値の形と規約は theme.mjs check が確かめる。ここでは読めた文字列をそのまま渡し、ビルドが色として確かめる
 */
export function readVaultPrimary(root: string): { light?: string; dark?: string } | undefined {
	const path = join(root, THEME_FILE);
	return existsSync(path) ? parseVaultPrimary(readFileSync(path, "utf8")) : undefined;
}

function buildOne(root: string, deck: string): BuildResult {
	const folder = join(root, ...deck.split("/"));
	const realFolder = realpathSync(folder);
	return buildDeck({
		vaultPrimary: readVaultPrimary(root),
		source: readFileSync(join(folder, SOURCE), "utf8"),
		deckPath: deck,
		assets,
		parse,
		sha256: (text, encoding) => createHash("sha256").update(text).digest(encoding),
		exists: (rel) => {
			const full = resolve(folder, ...rel.split("/"));
			// シンボリックリンクでデッキの外を指すものは、ないものとして扱う
			return existsSync(full) && statSync(full).isFile() && vaultPath(realFolder, realpathSync(full)) !== null;
		},
	});
}

function printProblems(deck: string, problems: readonly Problem[], io: Io): void {
	for (const p of problems) {
		const where = `${deck}/${SOURCE}${p.line > 0 ? `:${p.line}` : ""}`;
		const slide = p.slide > 0 ? `スライド ${p.slide}: ` : "";
		(p.level === "error" ? io.err : io.out)(`${where} [${p.level === "error" ? "エラー" : "警告"} ${p.rule}] ${slide}${p.message}`);
	}
}

/** フォルダの置き方の検査（ADR-0117 の 1） */
function layoutProblems(root: string, decks: readonly string[]): string[] {
	const problems: string[] = [];
	for (const deck of decks) {
		for (const part of deck.split("/").slice(1)) {
			if (!/^[a-z0-9][a-z0-9-]*$/.test(part)) problems.push(`${deck}: フォルダ名は英小文字・数字・ハイフンにする（${part}）`);
		}
		if (decks.some((other) => other !== deck && other.startsWith(`${deck}/`))) problems.push(`${deck}: デッキの中にデッキを作らない`);
	}
	const walk = (path: string) => {
		const full = join(root, ...path.split("/"));
		if (!existsSync(full)) return;
		for (const e of readdirSync(full, { withFileTypes: true })) {
			if (e.isDirectory()) walk(`${path}/${e.name}`);
			else if (e.name.toLowerCase().endsWith(".md")) problems.push(`${path}/${e.name}: ${SLIDE_FOLDER}/ に md を置かない（ノートは ${SLIDE_FOLDER}/ の外に置く）`);
		}
	};
	walk(SLIDE_FOLDER);
	return problems;
}

function runBuild(root: string, decks: readonly string[], io: Io): number {
	let failed = 0;
	for (const deck of decks) {
		const folder = join(root, ...deck.split("/"));
		if (!existsSync(join(folder, SOURCE))) {
			io.err(`${deck}: ${SOURCE} がない`);
			failed++;
			continue;
		}
		const result = buildOne(root, deck);
		printProblems(deck, result.problems, io);
		if (result.html === null) {
			io.err(`${deck}: エラーがあるので ${OUTPUT} を書かなかった`);
			failed++;
			continue;
		}
		const out = join(folder, OUTPUT);
		const changed = !existsSync(out) || readFileSync(out, "utf8") !== result.html;
		if (changed) writeFileSync(out, result.html);
		const warnings = result.problems.length;
		io.out(`${deck}/${OUTPUT}: ${result.slides} 枚${changed ? "" : "（変更なし）"}${warnings > 0 ? `、警告 ${warnings} 件` : ""}`);
	}
	return failed > 0 ? 1 : 0;
}

function runCheck(root: string, decks: readonly string[], io: Io): number {
	let failed = 0;
	for (const message of layoutProblems(root, findDecks(root))) {
		io.err(message);
		failed++;
	}
	for (const deck of decks) {
		const result = buildOne(root, deck);
		printProblems(deck, result.problems.filter((p) => p.level === "error"), io);
		const out = join(root, ...deck.split("/"), OUTPUT);
		if (result.html === null) failed++;
		else if (!existsSync(out) || readFileSync(out, "utf8") !== result.html) {
			io.err(`${deck}/${OUTPUT}: ${SOURCE} と今の CLI から作ったものと違う（手で編集しない。node .kit/bin/slide.mjs build ${deck} を実行する）`);
			failed++;
		}
	}
	if (failed === 0) io.out(`slide: ${decks.length} 個のデッキを確かめた`);
	return failed > 0 ? 1 : 0;
}

const TEMPLATE = (title: string) => `<title>${title}</title>
<meta name="deck-density" content="present">

<section data-pattern="cover">
  <h1>${title}</h1>
  <p class="lead">この話で持ち帰ってほしいことを 1 文で書く</p>
  <p class="meta">名前 · 日付</p>
</section>

<section data-pattern="statement">
  <h2>見出しは、言いたいことを文で書く</h2>
  <p class="lead">パターンの一覧は node .kit/bin/slide.mjs patterns</p>
  <aside class="notes">話すことは、スライドではなくここに書く。</aside>
</section>
`;

function runNew(root: string, positional: string[], options: Map<string, string>, io: Io): number {
	const [arg] = positional;
	const title = options.get("title");
	if (!arg || !title) {
		io.err(USAGE);
		return 2;
	}
	const deck = deckOf(root, io.cwd, arg);
	const folder = join(root, ...deck.split("/"));
	if (existsSync(join(folder, SOURCE))) {
		io.err(`${deck}/${SOURCE} は既にある（上書きしない）`);
		return 1;
	}
	const names = layoutProblems(root, [...findDecks(root), deck]).filter((m) => m.startsWith(`${deck}:`));
	if (names.length > 0) {
		for (const m of names) io.err(m);
		return 1;
	}
	mkdirSync(folder, { recursive: true });
	writeFileSync(join(folder, SOURCE), TEMPLATE(title.replace(/&/g, "&amp;").replace(/</g, "&lt;")));
	return runBuild(root, [deck], io);
}

/** img と SVG の image を data: にする（デッキのフォルダの中のものだけ。build が検査済み） */
function embedAssets(html: string, folder: string): string {
	return html.replace(/(<(?:img|image)\b[^>]*?\s(?:src|href|xlink:href)=")([^"]+)(")/g, (all, before: string, ref: string, after: string) => {
		if (/^(data:|#)/i.test(ref)) return all;
		const full = resolve(folder, ...decodeURI(ref.split(/[?#]/)[0] as string).split("/"));
		const type = imageType(full);
		if (type === null || !existsSync(full) || statSync(full).size > MAX_IMAGE_BYTES) return all;
		return `${before}data:${type};base64,${bytesToBase64(new Uint8Array(readFileSync(full)))}${after}`;
	});
}

function tmpPath(root: string, deck: string, ext: string): string {
	const stem = deck.split("/").slice(1).join("-");
	return join(root, ...freePath(TMP_FOLDER, stem, ext, (p) => existsSync(join(root, ...p.split("/")))).split("/"));
}

function runExport(root: string, deck: string, io: Io): number {
	const result = buildOne(root, deck);
	printProblems(deck, result.problems.filter((p) => p.level === "error"), io);
	if (result.html === null) return 1;
	const output = tmpPath(root, deck, ".html");
	mkdirSync(dirname(output), { recursive: true });
	writeFileSync(output, embedAssets(result.html, join(root, ...deck.split("/"))));
	io.out(relative(io.cwd, output) || output);
	return 0;
}

/** PC に入っている Chrome 系のブラウザ。なければ null */
export function findBrowser(env: NodeJS.ProcessEnv = process.env): string | null {
	const candidates = [
		env.CHROME_PATH,
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
		"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
		"/Applications/Chromium.app/Contents/MacOS/Chromium",
		"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
		"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
		"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
		"/usr/bin/google-chrome",
		"/usr/bin/google-chrome-stable",
		"/usr/bin/chromium",
		"/usr/bin/chromium-browser",
		"/snap/bin/chromium",
		"/usr/bin/microsoft-edge",
	];
	return candidates.find((p): p is string => typeof p === "string" && p !== "" && existsSync(p)) ?? null;
}

function runPdf(root: string, deck: string, io: Io): number {
	const built = runCheck(root, [deck], { ...io, out: () => {} });
	if (built !== 0) return built;
	const browser = findBrowser();
	if (browser === null) {
		io.err(
			`Chrome 系のブラウザが見つからない（CHROME_PATH で場所を指定できる）。画面で作るには、${deck}/${OUTPUT} をブラウザで開き「Download as PDF」を押して「PDF に保存」を選ぶ`,
		);
		return 1;
	}
	const output = tmpPath(root, deck, ".pdf");
	mkdirSync(dirname(output), { recursive: true });
	const url = pathToFileURL(join(root, ...deck.split("/"), OUTPUT)).href;
	const args = ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${output}`];
	// root で動かすコンテナでは、サンドボックスなしでないと起動しない
	if (process.getuid?.() === 0) args.push("--no-sandbox");
	const r = spawnSync(browser, [...args, url], { encoding: "utf8", timeout: 120_000 });
	if (r.status !== 0 || !existsSync(output)) {
		io.err(`PDF を作れなかった（${browser}）: ${(r.stderr ?? "").trim().split("\n").slice(-3).join(" / ")}`);
		return 1;
	}
	io.out(relative(io.cwd, output) || output);
	return 0;
}

function runPatterns(io: Io): number {
	let group = "";
	for (const p of PATTERNS) {
		if (p.group !== group) {
			group = p.group;
			io.out(`\n# ${group}`);
		}
		io.out(`${p.id.padEnd(20)}${p.name} — ${p.use}`);
	}
	return 0;
}

export async function main(args: string[], io: Io): Promise<number> {
	const [command, ...rest] = args;
	try {
		const { positional, options } = parseArgs(rest);
		const root = resolve(io.cwd, options.get("vault") ?? ".");
		const decks = () => positional.map((p) => deckOf(root, io.cwd, p));
		switch (command) {
			case "new":
				return runNew(root, positional, options, io);
			case "build": {
				const targets = options.has("all") ? findDecks(root) : decks();
				if (targets.length === 0 && !options.has("all")) break;
				const code = runBuild(root, targets, io);
				if (!options.has("watch")) return code;
				io.out("deck.html の変更を待っている（Ctrl+C で止める）");
				for (const deck of targets) {
					let timer: NodeJS.Timeout | undefined;
					watch(join(root, ...deck.split("/")), (_event, name) => {
						if (name === OUTPUT) return;
						clearTimeout(timer);
						timer = setTimeout(() => runBuild(root, [deck], io), 150);
					});
				}
				return await new Promise<number>(() => {});
			}
			case "check":
				return runCheck(root, positional.length > 0 ? decks() : findDecks(root), io);
			case "export":
				if (positional.length !== 1) break;
				return runExport(root, deckOf(root, io.cwd, positional[0] as string), io);
			case "pdf":
				if (positional.length !== 1) break;
				return runPdf(root, deckOf(root, io.cwd, positional[0] as string), io);
			case "patterns":
				return runPatterns(io);
		}
		io.err(USAGE);
		return 2;
	} catch (e) {
		io.err(`エラー: ${e instanceof Error ? e.message : String(e)}`);
		return 1;
	}
}

// テストから import したときは動かさない
const invoked = process.argv[1] ?? "";
if (/slide\.(mjs|ts)$/.test(invoked)) {
	process.exitCode = await main(process.argv.slice(2), {
		cwd: process.cwd(),
		out: (t) => process.stdout.write(`${t}\n`),
		err: (t) => process.stderr.write(`${t}\n`),
	});
}
