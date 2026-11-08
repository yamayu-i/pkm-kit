#!/usr/bin/env node
/**
 * ADR の一覧（各 ADR ディレクトリの README.md の表）を、ADR の見出しと「- 状態:」の行から作る。
 * 決定: .kit/harness/docs/adr/0056-conflict-free-numbering.md
 *
 * 一覧は README の次の 2 行の間に置く。間は手で書かない（並行する PR がぶつかっても、--write で作り直せば解ける）。
 *   <!-- adr-index:start -->
 *   <!-- adr-index:end -->
 *
 * 使い方: node .claude/scripts/adr-index.mjs [--write] [ADR のディレクトリ ...]
 *   既定のディレクトリは .kit/harness/docs/adr と .kit/src/docs/adr
 *   --write なし: 一覧が ADR と合っているかを確かめる（合っていなければ終了コード 1）
 *   --write     : 一覧を書き直す
 *
 * 2 つ以上のディレクトリを渡すと、ディレクトリをまたいだ番号の重なりも確かめる。番号が Issue の番号になった
 * ADR-0056 より後（LEGACY_MAX より大きい番号）は、2 つのディレクトリで共通の番号の空間なので重なってはいけない。
 * それより前の番号は、ディレクトリごとに連番で振っていたので重なってよい
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const START = "<!-- adr-index:start -->";
const END = "<!-- adr-index:end -->";
const ADR_FILE = /^(\d{4})-[a-z0-9-]+\.md$/;
const root = fileURLToPath(new URL("../..", import.meta.url));
export const DEFAULT_DIRS = [".kit/harness/docs/adr", ".kit/src/docs/adr"];

// ADR-0056 の前に連番で振った番号の最大（プラグインの 0038）。これ以下はディレクトリをまたいで重なってよい
const LEGACY_MAX = 38;

const cell = (s) => s.replace(/\|/g, "\\|").trim();

/** ADR のファイルから番号・見出し・状態を読む。足りなければ problems に理由を入れる */
export function readAdrs(dir) {
	const adrs = [];
	const problems = [];
	for (const file of readdirSync(dir).filter((f) => ADR_FILE.test(f)).sort()) {
		const number = file.match(ADR_FILE)[1];
		const lines = readFileSync(join(dir, file), "utf8").split("\n");
		const heading = lines[0].match(/^# ADR-(\d{4}): (.+)$/);
		const status = lines.find((l) => l.startsWith("- 状態:"))?.slice("- 状態:".length).trim();
		if (!heading) problems.push(`${file}: 1 行目を「# ADR-${number}: タイトル」にする`);
		else if (heading[1] !== number) problems.push(`${file}: 見出しの番号（${heading[1]}）がファイル名と違う`);
		if (!status) problems.push(`${file}: 「- 状態:」の行がない`);
		adrs.push({ number, file, title: heading?.[2] ?? "", status: status ?? "" });
	}
	const seen = new Map();
	for (const a of adrs) {
		if (seen.has(a.number)) problems.push(`${a.file}: 番号 ${a.number} が ${seen.get(a.number)} と重なっている`);
		else seen.set(a.number, a.file);
	}
	return { adrs, problems };
}

export function renderIndex(adrs) {
	const rows = adrs.map((a) => `| [${a.number}](${a.file}) | ${cell(a.status)} | ${cell(a.title)} |`);
	return ["| ADR | 状態 | 内容 |", "|---|---|---|", ...rows].join("\n");
}

// 一覧の行。印の外にあれば、union の merge で残った古い行なので消す
const ROW = /^\| \[\d{4}\]\(/;
const dropRows = (text) =>
	text
		.split("\n")
		.filter((l) => !ROW.test(l))
		.join("\n");

/** README の START と END の間を一覧に置き換え、印の外の一覧の行を消した全文を返す。印がなければ null */
export function replaceIndex(readme, index) {
	const s = readme.indexOf(START);
	const e = readme.indexOf(END);
	if (s < 0 || e < s) return null;
	return `${dropRows(readme.slice(0, s + START.length))}\n${index}\n${dropRows(readme.slice(e))}`;
}

/** ディレクトリをまたいだ番号の重なり（ADR-0056 より後の番号だけ）。戻り値はエラーの配列 */
export function crossDirProblems(dirs) {
	const seen = new Map();
	const problems = [];
	for (const dir of dirs) {
		for (const a of readAdrs(dir).adrs) {
			if (Number(a.number) <= LEGACY_MAX) continue;
			const where = `${relative(root, dir) || dir}/${a.file}`;
			const prev = seen.get(a.number);
			if (prev && prev.dir !== dir) problems.push(`${where}: 番号 ${a.number} が ${prev.where} と重なっている。ADR の番号はその変更の Issue の番号にする（ADR-0056）`);
			else if (!prev) seen.set(a.number, { dir, where });
		}
	}
	return problems;
}

/** 1 つのディレクトリを確かめる（write なら書き直す）。戻り値はエラーの配列 */
export function indexDir(dir, { write = false } = {}) {
	const readmePath = join(dir, "README.md");
	if (!existsSync(readmePath)) return [`README.md: README.md がない`];
	const { adrs, problems } = readAdrs(dir);
	const readme = readFileSync(readmePath, "utf8");
	const next = replaceIndex(readme, renderIndex(adrs));
	if (next === null) return [...problems, `README.md: 一覧の印（${START} と ${END}）がない`];
	if (next !== readme) {
		if (write) writeFileSync(readmePath, next);
		else problems.push(`README.md: 一覧が ADR と合っていない。node .claude/scripts/adr-index.mjs --write で作り直す`);
	}
	return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const write = process.argv.includes("--write");
	const positional = process.argv.slice(2).filter((a) => !a.startsWith("--"));
	const dirs = positional.length ? positional : DEFAULT_DIRS.map((d) => join(root, d));
	const errors = [...dirs.flatMap((d) => indexDir(d, { write }).map((p) => `${relative(root, d) || d}: ${p}`)), ...crossDirProblems(dirs)];
	for (const e of errors) console.log(`エラー: ${e}`);
	if (errors.length) process.exit(1);
	console.log(write ? "adr-index: 一覧を書き直した" : "adr-index: 一覧は ADR と合っている");
}
