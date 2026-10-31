#!/usr/bin/env node
/**
 * 利用実態を集計する（harness-review の入力）。
 * 決定: .claude/docs/adr/0006-self-improvement-loop.md
 *
 * 集計するもの: コミットの種類（端末ごとの snapshot、wiki の操作、開発）、よく編集されたノート、
 * wiki のページの状態（更新されていない、他のページから参照されていない）、log.md の操作、
 * feedback.md への追記、未処理の気づき、未処理のデイリーノート
 *
 * 使い方: node .claude/scripts/usage-report.mjs [--since YYYY-MM-DD]（既定は 30 日前）
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { pendingDaily } from "./daily-pending.mjs";
import { extractLinks, isExternal, parseFrontmatter, splitTarget } from "./lib/markdown.mjs";
import { classify, isWikiPage, vaultFiles, WIKI_FEEDBACK, WIKI_INDEX, WIKI_LOG } from "./lib/vault.mjs";

const STALE_DAYS = 90;

/** コミットの件名を種類に分ける。 */
export function commitKind(subject) {
	const snap = subject.match(/^vault: snapshot \((.+)\)$/);
	if (snap) return `snapshot（${snap[1]}）`;
	if (/^Merge /.test(subject)) return "マージ";
	const conv = subject.match(/^([a-z]+)(?:\(([^)]+)\))?!?:/);
	if (conv) return conv[1] === "wiki" ? `wiki(${conv[2] ?? "?"})` : conv[1];
	return "その他";
}

function daysAgo(n) {
	const d = new Date(Date.now() - n * 86_400_000);
	return d.toISOString().slice(0, 10);
}

export function usageReport(root, since = daysAgo(30), today = new Date().toISOString().slice(0, 10)) {
	const git = (...args) => execFileSync("git", ["-c", "core.quotepath=false", ...args], { cwd: root, encoding: "utf8" });
	const out = [`# 利用実態（${since} 〜 ${today}）`, ""];

	// コミットの種類
	const kinds = new Map();
	for (const s of git("log", `--since=${since}`, "--format=%s").split("\n").filter(Boolean))
		kinds.set(commitKind(s), (kinds.get(commitKind(s)) ?? 0) + 1);
	out.push("## コミットの種類", "");
	if (!kinds.size) out.push("- なし");
	for (const [k, n] of [...kinds].sort((a, b) => b[1] - a[1])) out.push(`- ${k}: ${n}`);

	// よく編集されたノート（隠しパスを除く）
	const edits = new Map();
	for (const p of git("log", `--since=${since}`, "--no-merges", "--format=", "--name-only").split("\n"))
		if (p.endsWith(".md") && classify(p) !== "hidden") edits.set(p, (edits.get(p) ?? 0) + 1);
	out.push("", "## よく編集されたノート（上位 10）", "");
	if (!edits.size) out.push("- なし");
	for (const [p, n] of [...edits].sort((a, b) => b[1] - a[1]).slice(0, 10)) out.push(`- ${p}: ${n} 回（${classify(p)}）`);

	// wiki のページ
	const files = vaultFiles(root);
	const pages = files.filter(isWikiPage);
	const inbound = new Map(pages.map((p) => [p, 0]));
	for (const f of files.filter((f) => f.endsWith(".md") && f !== WIKI_INDEX && f !== WIKI_LOG)) {
		for (const l of extractLinks(readFileSync(join(root, f), "utf8"))) {
			if (isExternal(l.target)) continue;
			const t = splitTarget(l.target).path;
			if (inbound.has(t) && t !== f) inbound.set(t, inbound.get(t) + 1);
		}
	}
	const staleBefore = new Date(Date.parse(today) - STALE_DAYS * 86_400_000).toISOString().slice(0, 10);
	const stale = pages.filter((p) => {
		const u = parseFrontmatter(readFileSync(join(root, p), "utf8")).data?.updated;
		return typeof u === "string" && u < staleBefore;
	});
	const byType = new Map();
	for (const p of pages) {
		const t = parseFrontmatter(readFileSync(join(root, p), "utf8")).data?.type ?? "?";
		byType.set(t, (byType.get(t) ?? 0) + 1);
	}
	out.push("", "## wiki のページ", "");
	out.push(`- ページ数: ${pages.length}（${[...byType].map(([t, n]) => `${t} ${n}`).join("、") || "なし"}）`);
	out.push(`- 元資料: ${files.filter((f) => f.startsWith("sources/")).length}`);
	out.push(`- 他のページから参照されていない（index と log を除く）: ${[...inbound].filter(([, n]) => n === 0).map(([p]) => p).join(", ") || "なし"}`);
	out.push(`- ${STALE_DAYS} 日以上更新されていない: ${stale.join(", ") || "なし"}`);

	// log.md の操作
	const ops = new Map();
	if (existsSync(join(root, WIKI_LOG)))
		for (const m of readFileSync(join(root, WIKI_LOG), "utf8").matchAll(/^## (\d{4}-\d{2}-\d{2}) (\S+) \|/gm))
			if (m[1] >= since) ops.set(m[2], (ops.get(m[2]) ?? 0) + 1);
	out.push("", "## wiki の操作（log.md）", "");
	if (!ops.size) out.push("- なし");
	for (const [k, n] of ops) out.push(`- ${k}: ${n}`);

	// フィードバック
	out.push("", "## フィードバック（wiki/feedback.md への追記）", "");
	const sinceCommit = git("log", `--until=${since}`, "-1", "--format=%H").trim();
	const fb = existsSync(join(root, WIKI_FEEDBACK))
		? git("diff", sinceCommit || git("hash-object", "-t", "tree", "/dev/null").trim(), "HEAD", "--", WIKI_FEEDBACK)
				.split("\n")
				.filter((l) => l.startsWith("+") && !l.startsWith("+++") && l.slice(1).trim())
				.map((l) => l.slice(1))
		: [];
	if (!fb.length) out.push("- なし");
	else out.push(...fb.map((l) => `> ${l}`));

	// 気づきとデイリーノート
	const notesDir = join(root, ".claude/notes");
	const notes = existsSync(notesDir) ? readdirSync(notesDir).filter((f) => f.endsWith(".md") && f !== "README.md") : [];
	out.push("", "## その他", "");
	out.push(`- 未処理の気づき（.claude/notes/）: ${notes.length} 件`);
	out.push(`- 未処理のデイリーノート: ${pendingDaily(root, today).pending.length} 件`);
	return out.join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const root = fileURLToPath(new URL("../..", import.meta.url));
	const i = process.argv.indexOf("--since");
	console.log(usageReport(root, i === -1 ? undefined : process.argv[i + 1]));
}
