#!/usr/bin/env node
/**
 * LLM による wiki の操作（件名が `wiki(` で始まるコミット）が、所有の区分を守っているかを検査する。
 * 決定: .claude/docs/adr/0004-human-notes-append-only.md
 *
 * - 人のノート（daily/、wiki/feedback.md、その他）: 既存の行を変えない・消さない。新しいファイルも作らない
 * - sources/、asset/: 追加だけ
 * - 隠しパス（.claude、.obsidian など）: 変えない
 * - wiki/: 自由
 *
 * 使い方: node .claude/scripts/check-append-only.mjs [git log に渡す範囲]
 *   範囲を省くと origin/main..HEAD。例: `origin/main..HEAD`、`-1 <commit>`
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { classify } from "./lib/vault.mjs";

export const WIKI_COMMIT_RE = /^wiki\(/;

function git(repo, args) {
	return execFileSync("git", ["-c", "core.quotepath=false", ...args], { cwd: repo, encoding: "utf8" });
}

/** -U0 の差分から、消された（変えられた）行を返す。末尾の改行を足しただけの行は除く。 */
export function removedLines(diff) {
	const removed = [];
	let hunk = null;
	const flush = () => {
		if (!hunk) return;
		const onlyNewline =
			hunk.removed.length === 1 && hunk.noNewlineAfterRemoved && hunk.added[0] === hunk.removed[0];
		if (!onlyNewline) removed.push(...hunk.removed);
		hunk = null;
	};
	let last = "";
	for (const line of diff.split("\n")) {
		if (line.startsWith("@@")) {
			flush();
			hunk = { removed: [], added: [], noNewlineAfterRemoved: false };
		} else if (!hunk) {
			continue;
		} else if (line.startsWith("-")) hunk.removed.push(line.slice(1));
		else if (line.startsWith("+")) hunk.added.push(line.slice(1));
		else if (line.startsWith("\\") && last.startsWith("-")) hunk.noNewlineAfterRemoved = true;
		last = line;
	}
	flush();
	return removed;
}

export function checkCommits(repo, range = ["origin/main..HEAD"]) {
	const problems = [];
	const log = git(repo, ["log", "--no-merges", "--format=%H%x09%s", ...range]).trim();
	if (!log) return problems;
	for (const entry of log.split("\n")) {
		const [sha, subject] = entry.split("\t");
		if (!WIKI_COMMIT_RE.test(subject)) continue;
		const short = sha.slice(0, 7);
		const add = (path, message) => problems.push({ commit: short, subject, path, message });
		const changes = git(repo, ["diff-tree", "--root", "--no-commit-id", "-r", "-M", "--name-status", sha])
			.trim()
			.split("\n")
			.filter(Boolean);
		for (const change of changes) {
			const [status, ...paths] = change.split("\t");
			const kind = status[0];
			const path = paths.at(-1);
			const areas = paths.map(classify);
			if (areas.includes("hidden")) {
				add(path, "wiki の操作で隠しパス（.claude、.obsidian など）を変えない");
				continue;
			}
			if (kind === "R" && areas.some((a) => a !== "wiki")) {
				add(`${paths[0]} → ${paths[1]}`, "wiki/ の外のファイルを移動・改名しない");
				continue;
			}
			const area = areas.at(-1);
			if (area === "wiki") continue;
			if (area === "source" || area === "asset") {
				if (kind !== "A") add(path, `${area === "source" ? "sources/" : "asset/"} は追加だけ（既存のファイルを変えない）`);
				continue;
			}
			// 人のノート
			if (kind === "A") add(path, "人のノートの場所に新しいファイルを作らない（LLM のページは wiki/ に作る）");
			else if (kind === "D") add(path, "人のノートを消さない");
			else if (kind === "M") {
				const diff = git(repo, ["diff", "-U0", `${sha}^`, sha, "--", path]);
				const removed = removedLines(diff);
				if (removed.length)
					add(path, `人のノートは追記だけ。変えた・消した行: ${removed.slice(0, 3).map((l) => JSON.stringify(l)).join(", ")}`);
			} else add(path, `人のノートへの変更（${status}）は許されていない`);
		}
	}
	return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const repo = fileURLToPath(new URL("../..", import.meta.url));
	const range = process.argv.slice(2);
	const problems = checkCommits(repo, range.length ? range : undefined);
	if (problems.length) {
		console.log(`append-only: 違反 ${problems.length} 件`);
		for (const p of problems) console.log(`  ${p.commit} ${p.subject}\n    ${p.path}: ${p.message}`);
		process.exit(1);
	}
	console.log("append-only: 違反なし");
}
