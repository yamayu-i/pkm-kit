#!/usr/bin/env node
/**
 * Vault のノートを機械的に検査する（wiki-lint スキルと CI が使う）。
 * 規約: .claude/docs/vault-conventions.md、.claude/docs/llm-wiki.md
 *
 * 使い方: node .claude/scripts/wiki-lint.mjs [Vault のルート]
 * 人のノート（LLM が直せない場所）の問題は警告、それ以外はエラー。エラーがあれば終了コード 1。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { extractLinks, findWikiLinks, isExternal, parseFrontmatter, splitTarget, stripCode } from "./lib/markdown.mjs";
import { classify, DAILY_RE, isWikiPage, vaultFiles, WIKI_INDEX } from "./lib/vault.mjs";
// updated の規則の正本は pkm-git にある（ADR-0009）。Node の型の除去で .ts をそのまま読む
import { isTargetPath } from "../../.kit/src/packages/pkm-git/src/stamp/updated.ts";

export const PAGE_TYPES = ["concept", "entity", "topic", "answer"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** 秒までの ISO 8601。UTC の Z か、オフセット付き(ADR-0007、ADR-0028) */
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;
const DATETIME_HINT = "秒までの ISO 8601（オフセット付き。例 2026-11-01T13:30:00+09:00）";

export function lintVault(root) {
	const errors = [];
	const warnings = [];
	const files = vaultFiles(root);
	const fileSet = new Set(files);
	const report = (path, line, message) => {
		const area = classify(path);
		(area === "human" ? warnings : errors).push({ path, line, message });
	};
	const exists = (p) => fileSet.has(p);

	for (const path of files) {
		if (path.startsWith("asset/") && path.split("/").length > 2)
			report(path, 0, "asset/ にサブフォルダを作らない（asset/ 直下に置く）");
		if ((path.startsWith("wiki/") || path.startsWith("sources/")) && path.split("/").length > 2)
			report(path, 0, `${path.split("/")[0]}/ にサブフォルダを作らない`);
		if (!path.endsWith(".md")) continue;

		const text = readFileSync(join(root, path), "utf8");
		for (const line of findWikiLinks(text)) report(path, line, "wiki リンク（[[...]]）を使わない。Markdown リンクにする");
		stripCode(text)
			.split("\n")
			.forEach((l, i) => {
				if (/^ *\t/.test(l)) report(path, i + 1, "インデントにタブを使わない（スペース 2 つ）");
			});

		for (const { embed, target, line } of extractLinks(text)) {
			if (isExternal(target) || target.startsWith("#")) continue;
			if (target.startsWith("/")) {
				report(path, line, `リンク先の先頭に / を付けない: ${target}`);
				continue;
			}
			const { path: p } = splitTarget(target);
			if (!exists(p)) {
				const hint = !p.endsWith(".md") && fileSet.has(`${p}.md`) ? "（拡張子 .md まで書く）" : "";
				report(path, line, `リンク切れ: ${target}${hint}（リンク先は Vault ルートからのパス）`);
				continue;
			}
			if (embed && !p.endsWith(".md") && !/^asset\/[^/]+$/.test(p))
				report(path, line, `添付は asset/ 直下に置く: ${target}`);
		}

		const daily = path.startsWith("daily/");
		if (daily) {
			const m = path.match(DAILY_RE);
			if (!m || m[1] !== m[3] || m[2] !== m[4])
				report(path, 0, "デイリーノートは daily/YYYY/MM/YYYY-MM-DD.md に置く");
		}

		if (isWikiPage(path)) lintWikiPage(path, text, report, exists);
		else if (isTargetPath(path)) lintUpdated(path, text, report);
		if (path.startsWith("sources/")) lintSourcePage(path, text, report);
	}

	lintIndex(files, fileSet, report, root);
	return { errors, warnings };
}

/** frontmatter のあるノートは updated が必須。コミット時に自動で付与される(ADR-0028) */
function lintUpdated(path, text, report) {
	const { data } = parseFrontmatter(text);
	if (!data) return;
	const value = data.updated;
	if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0))
		return report(path, 1, "frontmatter に updated がない（コミット時に自動で付与される。既存のノートは node .kit/bin/stamp-updated.mjs --migrate）");
	if (typeof value !== "string" || !DATETIME_RE.test(value)) report(path, 1, `updated は${DATETIME_HINT}: ${value}`);
}

function lintWikiPage(path, text, report, exists) {
	const { data, error } = parseFrontmatter(text);
	if (!data) return report(path, 1, error ?? "frontmatter がない（.claude/docs/llm-wiki.md のページの書式）");
	for (const key of ["title", "type", "created", "updated"])
		if (!data[key] || Array.isArray(data[key])) report(path, 1, `frontmatter に ${key} がない`);
	if (data.type && !PAGE_TYPES.includes(data.type))
		report(path, 1, `type は ${PAGE_TYPES.join(" / ")} のどれか: ${data.type}`);
	for (const key of ["created", "updated"])
		if (typeof data[key] === "string" && !DATETIME_RE.test(data[key])) report(path, 1, `${key} は${DATETIME_HINT}: ${data[key]}`);
	if (!Array.isArray(data.sources)) report(path, 1, "frontmatter に sources（リスト）がない");
	else
		for (const s of data.sources)
			if (!isExternal(s) && !exists(splitTarget(s).path)) report(path, 1, `sources の参照先がない: ${s}`);
}

function lintSourcePage(path, text, report) {
	const { data, error } = parseFrontmatter(text);
	if (!data) return report(path, 1, error ?? "frontmatter がない（.claude/docs/llm-wiki.md の元資料の書式）");
	for (const key of ["title", "origin", "retrieved"])
		if (!data[key] || Array.isArray(data[key])) report(path, 1, `frontmatter に ${key} がない`);
	if (typeof data.retrieved === "string" && !DATE_RE.test(data.retrieved))
		report(path, 1, `retrieved は YYYY-MM-DD: ${data.retrieved}`);
}

function lintIndex(files, fileSet, report, root) {
	const pages = files.filter(isWikiPage);
	if (!fileSet.has(WIKI_INDEX)) {
		if (pages.length) report(WIKI_INDEX, 0, "wiki/index.md がない");
		return;
	}
	const linked = new Set(
		extractLinks(readFileSync(join(root, WIKI_INDEX), "utf8")).map((l) => splitTarget(l.target).path),
	);
	for (const p of pages) if (!linked.has(p)) report(p, 0, "wiki/index.md に載っていない");
}

function format({ path, line, message }) {
	return `  ${path}${line ? `:${line}` : ""}  ${message}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const root = process.argv[2] ?? fileURLToPath(new URL("../..", import.meta.url));
	const { errors, warnings } = lintVault(root);
	if (warnings.length) {
		console.log(`警告 ${warnings.length} 件（人のノート。LLM は直さず、ユーザーに伝える）`);
		for (const w of warnings) console.log(format(w));
	}
	if (errors.length) {
		console.log(`エラー ${errors.length} 件`);
		for (const e of errors) console.log(format(e));
		process.exit(1);
	}
	console.log(`wiki-lint: エラーなし（警告 ${warnings.length} 件）`);
}
