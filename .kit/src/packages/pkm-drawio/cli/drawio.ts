/**
 * Draw.io の図の CLI（ADR-0064）。PC の Claude Code とスキルが使う。プラグインと同じ src/core/ の処理を使う。
 * ビルドして .kit/bin/drawio.mjs に置く（子の Vault はビルドせずに使う）。
 *
 *   node .kit/bin/drawio.mjs export <ノート.md|.html> [--output <tmp/…>] [--vault <ルート>]
 *       図の参照を、編集用 XML を除いた SVG の data URI に置き換えて書き出す（既定 tmp/<ファイル名>。あれば番号を付ける）
 *   node .kit/bin/drawio.mjs check <ファイルかフォルダ…> [--vault <ルート>]
 *       書き出したものに、図のファイルへの参照・編集用 XML が残っていないかを見る
 *   node .kit/bin/drawio.mjs extract <図.drawio.svg>     編集用 XML（全ページ）を標準出力に出す
 *   node .kit/bin/drawio.mjs strip <図.drawio.svg> [--output <…>]   共有用の SVG（編集用 XML を除く）
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { checkExported, documentKind, embedDiagrams } from "../src/core/document.ts";
import { exportPath } from "../src/core/names.ts";
import { DrawioFormatError, extractDiagramXml, toSharingSvg } from "../src/core/svg.ts";

export interface Io {
	cwd: string;
	out(text: string): void;
	err(text: string): void;
}

const USAGE = `使い方:
  drawio.mjs export <ノート.md|.html> [--output <パス>] [--vault <ルート>]
  drawio.mjs check <ファイルかフォルダ…> [--vault <ルート>]
  drawio.mjs extract <図.drawio.svg>
  drawio.mjs strip <図.drawio.svg> [--output <パス>]`;

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

function readInVault(root: string, path: string): string | null {
	const full = join(root, ...path.split("/"));
	if (!existsSync(full) || !statSync(full).isFile()) return null;
	return readFileSync(full, "utf8");
}

function walk(path: string): string[] {
	if (!statSync(path).isDirectory()) return [path];
	return readdirSync(path)
		.sort()
		.flatMap((name) => walk(join(path, name)))
		.filter((p) => documentKind(p) !== null);
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
	const kind = documentKind(inputFull);
	if (!source || !kind) {
		io.err(`${input}: Vault（${root}）の中の md か html を指定してください`);
		return 2;
	}
	const text = readFileSync(inputFull, "utf8");
	const result = await embedDiagrams(text, { sourcePath: source, kind, readText: async (p) => readInVault(root, p) });
	for (const w of result.warnings) io.err(`警告: ${w}`);
	if (result.errors.length > 0) {
		for (const e of result.errors) io.err(`エラー: ${e}`);
		io.err("書き出していません");
		return 1;
	}
	const output = options.has("output")
		? resolve(io.cwd, options.get("output") as string)
		: join(root, ...exportPath(source, (p) => existsSync(join(root, ...p.split("/")))).split("/"));
	if (existsSync(output)) {
		io.err(`${output} は既にあります（上書きしません）`);
		return 1;
	}
	const problems = checkExported(result.text, kind, vaultPath(root, output) ?? source);
	if (problems.length > 0) {
		for (const p of problems) io.err(`エラー: ${p}`);
		io.err("書き出していません");
		return 1;
	}
	mkdirSync(dirname(output), { recursive: true });
	writeFileSync(output, result.text);
	io.out(`${relative(io.cwd, output) || output}（図 ${result.diagrams.length} 件）`);
	return 0;
}

function runCheck(positional: string[], options: Map<string, string>, io: Io): number {
	if (positional.length === 0) {
		io.err(USAGE);
		return 2;
	}
	const root = resolve(io.cwd, options.get("vault") ?? ".");
	let failed = 0;
	for (const target of positional) {
		const full = resolve(io.cwd, target);
		if (!existsSync(full)) {
			io.err(`${target}: ない`);
			failed++;
			continue;
		}
		for (const file of walk(full)) {
			const kind = documentKind(file);
			if (!kind) continue;
			const problems = checkExported(readFileSync(file, "utf8"), kind, vaultPath(root, file) ?? "");
			for (const p of problems) io.err(`${relative(io.cwd, file)}: ${p}`);
			if (problems.length > 0) failed++;
		}
	}
	if (failed > 0) return 1;
	io.out("問題なし");
	return 0;
}

function runSvg(command: "extract" | "strip", positional: string[], options: Map<string, string>, io: Io): number {
	const [input] = positional;
	if (!input || positional.length > 1) {
		io.err(USAGE);
		return 2;
	}
	const svg = readFileSync(resolve(io.cwd, input), "utf8");
	if (command === "extract") {
		const r = extractDiagramXml(svg);
		if (r.kind !== "diagram") {
			io.err(`${input}: 編集用 XML がない（普通の SVG）`);
			return 1;
		}
		io.out(r.xml);
		return 0;
	}
	const sharing = toSharingSvg(svg);
	const output = options.get("output");
	if (output === undefined) {
		io.out(sharing);
		return 0;
	}
	const full = resolve(io.cwd, output);
	if (existsSync(full)) {
		io.err(`${output} は既にあります（上書きしません）`);
		return 1;
	}
	mkdirSync(dirname(full), { recursive: true });
	writeFileSync(full, sharing);
	return 0;
}

export async function main(argv: string[], io: Io): Promise<number> {
	const [command, ...rest] = argv;
	try {
		const { positional, options } = parseArgs(rest);
		switch (command) {
			case "export":
				return await runExport(positional, options, io);
			case "check":
				return runCheck(positional, options, io);
			case "extract":
			case "strip":
				return runSvg(command, positional, options, io);
			default:
				io.err(USAGE);
				return 2;
		}
	} catch (e) {
		io.err(`エラー: ${e instanceof DrawioFormatError ? e.message : e instanceof Error ? e.message : String(e)}`);
		return 1;
	}
}

// テストから import したときは動かさない
const invoked = process.argv[1] ?? "";
if (/drawio\.(mjs|ts)$/.test(invoked)) {
	process.exitCode = await main(process.argv.slice(2), {
		cwd: process.cwd(),
		out: (t) => process.stdout.write(`${t}\n`),
		err: (t) => process.stderr.write(`${t}\n`),
	});
}
