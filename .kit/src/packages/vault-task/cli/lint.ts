/**
 * Vault のタスク管理データを検査する CLI（ADR-0001）。Claude Code やスキルから使う。
 * プラグインには同梱しない（Node の API を使うため）。
 *
 * 使い方: node dist/cli.mjs <Vault のルート> [--json]
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { parse } from "yaml";
import { lintVault } from "../src/core/lint";
import { collectVault, fileKind, type VaultInput } from "../src/core/load";
import type { Problem } from "../src/core/problem";

function walk(root: string, dir = root, out: string[] = []): string[] {
	for (const name of readdirSync(dir)) {
		// 隠しフォルダ（.git, .obsidian, .plugin-src など）は Vault のノートではない
		if (name.startsWith(".") || name === "node_modules") continue;
		const p = join(dir, name);
		if (statSync(p).isDirectory()) walk(root, p, out);
		else out.push(relative(root, p).split(sep).join("/"));
	}
	return out;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

function readFrontmatter(text: string): Record<string, unknown> | null {
	const m = FRONTMATTER_RE.exec(text);
	if (!m) return null;
	try {
		// YAML 1.2 の core スキーマなので、日付は文字列のまま読まれる（Obsidian と同じ）
		const value: unknown = parse(m[1]!);
		return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
	} catch {
		return null;
	}
}

function main(): void {
	const args = process.argv.slice(2);
	const json = args.includes("--json");
	const root = args.find((a) => !a.startsWith("--")) ?? process.cwd();
	const paths = walk(root);
	const input: VaultInput = { markdown: [], worklogs: [], labels: null };
	for (const path of paths) {
		const kind = fileKind(path);
		if (kind === null) continue;
		const text = readFileSync(join(root, path), "utf8");
		if (kind === "worklog") input.worklogs.push({ path, text });
		else if (kind === "labels") input.labels = text;
		else input.markdown.push({ path, frontmatter: readFrontmatter(text) });
	}
	const { data, problems: parseProblems } = collectVault(input);
	const problems: Problem[] = [...parseProblems, ...lintVault(data, { paths: new Set(paths) })];

	if (json) {
		console.log(JSON.stringify({ issues: data.issues.length, routines: data.routines.length, worklogs: data.worklogs.length, problems }, null, 2));
	} else {
		for (const p of problems) console.log(`${p.severity === "error" ? "ERROR" : "WARN "} ${p.path}  [${p.code}] ${p.message}`);
		const errors = problems.filter((p) => p.severity === "error").length;
		console.log(
			`\nissue ${data.issues.length} / routine ${data.routines.length} / member ${data.members.length} / worklog ${data.worklogs.length} 件` +
				` — エラー ${errors}、警告 ${problems.length - errors}`,
		);
	}
	process.exit(problems.some((p) => p.severity === "error") ? 1 : 0);
}

main();
