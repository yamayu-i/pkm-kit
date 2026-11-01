import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { parse } from "yaml";
import { collectVault, fileKind, type VaultInput } from "../src/core/load";
import type { VaultData } from "../src/core/index";
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

/** Vault のタスク管理データを読む（CLI 用。プラグインは metadataCache から読む） */
export function readVault(root: string): { data: VaultData; problems: Problem[]; paths: string[] } {
	const paths = walk(root);
	const input: VaultInput = { markdown: [], worklogs: [], labels: null, groups: null, boardLogs: [] };
	for (const path of paths) {
		const kind = fileKind(path);
		if (kind === null) continue;
		const text = readFileSync(join(root, path), "utf8");
		if (kind === "worklog") input.worklogs.push({ path, text });
		else if (kind === "board") input.boardLogs!.push({ path, text });
		else if (kind === "labels") input.labels = text;
		else if (kind === "groups") input.groups = text;
		else input.markdown.push({ path, frontmatter: readFrontmatter(text) });
	}
	const { data, problems } = collectVault(input);
	return { data, problems, paths };
}

/** 引数から Vault のルートと --json を取り出す */
export function parseArgs(argv: string[]): { root: string; json: boolean; options: Record<string, number> } {
	const options: Record<string, number> = {};
	for (const a of argv) {
		const m = /^--([a-z-]+)=(\d+(?:\.\d+)?)$/.exec(a);
		if (m) options[m[1]!] = Number(m[2]);
	}
	return { root: argv.find((a) => !a.startsWith("--")) ?? process.cwd(), json: argv.includes("--json"), options };
}
