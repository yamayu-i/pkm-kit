/**
 * HTML の CLI（ADR-0044）。PC の Claude Code とスキルが使う。プラグインと同じ src/core/ の処理を使い、DOM の解析は linkedom で行う。
 * ビルドして .kit/bin/html.mjs に置く（子の Vault はビルドせずに使う）。
 *
 *   node .kit/bin/html.mjs export <ファイル.html> [--output <パス>] [--vault <ルート>]
 *       トークン（prefers-color-scheme 版）と Vault の中の画像を埋め込み、スクリプトと外部の読み込みを除いて書き出す
 *       （既定 tmp/<ファイル名>。あれば番号を付ける。--output の先が既にあれば書かない）
 */
import { existsSync, mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { DOMParser } from "linkedom";
import { exportPath } from "../../pkm-drawio/src/core/names.ts";
import { HTML_EXTENSIONS, MAX_IMAGE_BYTES } from "../src/core/policy.ts";
import { buildStandalone } from "../src/core/standalone.ts";
import standaloneCss from "../tokens-standalone.css";

export interface Io {
	cwd: string;
	out(text: string): void;
	err(text: string): void;
}

const USAGE = `使い方:
  html.mjs export <ファイル.html> [--output <パス>] [--vault <ルート>]`;

function parseArgs(args: string[]): { positional: string[]; options: Map<string, string> } {
	const positional: string[] = [];
	const options = new Map<string, string>();
	for (let i = 0; i < args.length; i++) {
		const a = args[i] as string;
		if (a.startsWith("--")) {
			const value = args[i + 1];
			if (value === undefined || value.startsWith("--")) throw new Error(`${a} に値がない`);
			options.set(a.slice(2), value);
			i++;
		} else {
			positional.push(a);
		}
	}
	return { positional, options };
}

/** Vault の中のパス（/ 区切り）。Vault の外なら null */
function vaultPath(root: string, file: string): string | null {
	const rel = relative(root, file);
	if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) return null;
	return rel.split(sep).join("/");
}

/** 画像を読む。Vault の中のファイルだけ（candidatePaths が Vault の外を返さないうえで、念のため確かめる） */
function readImage(root: string, candidates: readonly string[]): Uint8Array | null {
	for (const path of candidates) {
		const full = resolve(root, ...path.split("/"));
		// シンボリックリンクで Vault の外を指すものは読まない
		if (vaultPath(root, full) === null || !existsSync(full) || vaultPath(realpathSync(root), realpathSync(full)) === null) continue;
		const stat = statSync(full);
		if (!stat.isFile()) continue;
		if (stat.size > MAX_IMAGE_BYTES) return null;
		return new Uint8Array(readFileSync(full));
	}
	return null;
}

async function runExport(positional: string[], options: Map<string, string>, io: Io): Promise<number> {
	const [input] = positional;
	if (!input || positional.length > 1) {
		io.err(USAGE);
		return 2;
	}
	const root = resolve(io.cwd, options.get("vault") ?? ".");
	const inputFull = resolve(io.cwd, input);
	const source = vaultPath(root, inputFull);
	const ext = inputFull.slice(inputFull.lastIndexOf(".") + 1).toLowerCase();
	if (!source || !(HTML_EXTENSIONS as readonly string[]).includes(ext) || !existsSync(inputFull)) {
		io.err(`${input}: Vault（${root}）の中の html を指定してください`);
		return 2;
	}
	const text = await buildStandalone(readFileSync(inputFull, "utf8"), {
		path: source,
		standaloneCss,
		parse: (html) => new DOMParser().parseFromString(html, "text/html") as unknown as Document,
		readImage: async (candidates) => readImage(root, candidates),
	});
	const output = options.has("output")
		? resolve(io.cwd, options.get("output") as string)
		: join(root, ...exportPath(source, (p) => existsSync(join(root, ...p.split("/")))).split("/"));
	if (existsSync(output)) {
		io.err(`${output} は既にあります（上書きしません）`);
		return 1;
	}
	mkdirSync(dirname(output), { recursive: true });
	writeFileSync(output, text);
	io.out(relative(io.cwd, output) || output);
	return 0;
}

export async function main(args: string[], io: Io): Promise<number> {
	const [command, ...rest] = args;
	let parsed: ReturnType<typeof parseArgs>;
	try {
		parsed = parseArgs(rest);
	} catch (e) {
		io.err(e instanceof Error ? e.message : String(e));
		return 2;
	}
	if (command !== "export") {
		io.err(USAGE);
		return 2;
	}
	try {
		return await runExport(parsed.positional, parsed.options, io);
	} catch (e) {
		io.err(`エラー: ${e instanceof Error ? e.message : String(e)}`);
		return 1;
	}
}

// テストから import したときは動かさない
const invoked = process.argv[1] ?? "";
if (/html\.(mjs|ts)$/.test(invoked)) {
	process.exitCode = await main(process.argv.slice(2), {
		cwd: process.cwd(),
		out: (t) => process.stdout.write(`${t}\n`),
		err: (t) => process.stderr.write(`${t}\n`),
	});
}
