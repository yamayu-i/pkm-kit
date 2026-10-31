#!/usr/bin/env node
/**
 * ハーネスの文書（.claude/ の md）の構造を検査する。
 * 決定: .claude/docs/adr/0001-harness-scope.md
 *
 * - CLAUDE.md は 100 行以内（毎回全文が読み込まれるため）
 * - リンク（相対パス）と @import の参照先がある
 * - docs/ とスキルの SKILL.md に、CLAUDE.md からリンクを辿って到達できる
 * - SKILL.md の frontmatter の name がディレクトリ名と同じで、description がある
 * - 300 行を超える文書は警告
 *
 * 使い方: node .claude/scripts/check-docs.mjs [.claude のパス]
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { extractLinks, isExternal, parseFrontmatter, splitTarget, stripCode, walk } from "./lib/markdown.mjs";

const MAX_ENTRY_LINES = 100;
const WARN_LINES = 300;
// 作業の記録で、目次から辿る必要がないもの（.claude/docs/harness.md の「ディレクトリ」）
const UNREACHABLE_OK = [/^notes\//, /^reviews\//, /^security\/reports\//];

export function checkDocs(dir) {
	const errors = [];
	const warnings = [];
	const files = walk(dir, (rel) => rel === "settings.local.json" || rel.startsWith("worktrees")).filter((f) =>
		f.endsWith(".md"),
	);
	const toRel = (abs) => relative(dir, abs).split(sep).join("/");
	const graph = new Map();

	for (const file of files) {
		const text = readFileSync(join(dir, file), "utf8");
		const lines = text.split("\n").length;
		if (file === "CLAUDE.md" && lines > MAX_ENTRY_LINES)
			errors.push(`${file}: ${lines} 行。${MAX_ENTRY_LINES} 行以内にする（詳細は docs/ に分ける）`);
		else if (lines > WARN_LINES) warnings.push(`${file}: ${lines} 行。分割を検討する`);

		const targets = [];
		for (const { target, line } of extractLinks(text)) {
			if (isExternal(target) || target.startsWith("#")) continue;
			const { path } = splitTarget(target);
			const abs = normalize(join(dir, dirname(file), path));
			if (!existsSync(abs)) errors.push(`${file}:${line}: リンク切れ: ${target}`);
			else targets.push(toRel(abs));
		}
		stripCode(text)
			.split("\n")
			.forEach((l, i) => {
				for (const m of l.matchAll(/(?:^|\s)@([\w./-]+\.md)\b/g)) {
					const abs = normalize(join(dir, dirname(file), m[1]));
					if (!existsSync(abs)) errors.push(`${file}:${i + 1}: @import の参照先がない: ${m[1]}`);
					else targets.push(toRel(abs));
				}
			});
		graph.set(file, targets);

		const skill = file.match(/^skills\/([^/]+)\/SKILL\.md$/);
		if (skill) {
			const { data } = parseFrontmatter(text);
			if (!data?.name || data.name !== skill[1]) errors.push(`${file}: frontmatter の name を ${skill[1]} にする`);
			if (!data?.description) errors.push(`${file}: frontmatter に description がない`);
		}
	}

	const reached = new Set();
	const queue = ["CLAUDE.md"];
	while (queue.length) {
		const f = queue.shift();
		if (reached.has(f)) continue;
		reached.add(f);
		for (const t of graph.get(f) ?? []) if (t.endsWith(".md")) queue.push(t);
	}
	for (const f of files) {
		if (reached.has(f) || UNREACHABLE_OK.some((re) => re.test(f))) continue;
		errors.push(`${f}: CLAUDE.md からリンクを辿って到達できない`);
	}
	return { errors, warnings };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const dir = process.argv[2] ?? fileURLToPath(new URL("..", import.meta.url));
	const { errors, warnings } = checkDocs(dir);
	for (const w of warnings) console.log(`警告: ${w}`);
	for (const e of errors) console.log(`エラー: ${e}`);
	if (errors.length) process.exit(1);
	console.log(`check-docs: エラーなし（警告 ${warnings.length} 件）`);
}
