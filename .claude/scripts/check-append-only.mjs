#!/usr/bin/env node
/**
 * LLM による wiki の操作（件名が `wiki(` で始まるコミット）が、所有の区分を守っているかを検査する。
 * 決定: .kit/harness/docs/adr/0004-human-notes-append-only.md
 *
 * - 人のノート（daily/、wiki/feedback.md、その他）: 既存の行を変えない・消さない。新しいファイルも作らない
 * - sources/、asset/: 追加だけ
 * - 隠しパス（.claude、.obsidian など）: 変えない
 * - wiki/: 自由
 *
 * 件名が `note(rename):` のコミット（ADR-0015）は、ファイルは改名だけ（同じフォルダの中で、名前をケバブケースに）、
 * 改名したノートは title の追加とリンク先のパスの書き換えだけ、ほかのノートはリンク先のパスの書き換えだけを許す。
 *
 * 使い方: node .claude/scripts/check-append-only.mjs [git log に渡す範囲]
 *   範囲を省くと origin/main..HEAD。例: `origin/main..HEAD`、`-1 <commit>`
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { stripCode } from "./lib/markdown.mjs";
import { classify, KEBAB_MD_RE } from "./lib/vault.mjs";
import { insertTitle, isRenameCandidate, LINK_RE } from "./note-rename.mjs";

export const WIKI_COMMIT_RE = /^wiki\(/;
export const RENAME_COMMIT_RE = /^note\(rename\):/;

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
		const short = sha.slice(0, 7);
		const add = (path, message) => problems.push({ commit: short, subject, path, message });
		if (RENAME_COMMIT_RE.test(subject)) {
			checkRenameCommit(repo, sha, add);
			continue;
		}
		if (!WIKI_COMMIT_RE.test(subject)) continue;
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
				// updated の行はコミット時に自動で付与される(ADR-0028)ので、変わっても数えない
				const removed = removedLines(diff).filter((l) => !l.startsWith("updated:"));
				if (removed.length)
					add(path, `人のノートは追記だけ。変えた・消した行: ${removed.slice(0, 3).map((l) => JSON.stringify(l)).join(", ")}`);
			} else add(path, `人のノートへの変更（${status}）は許されていない`);
		}
	}
	return problems;
}

/** リンク先を伏せた行。updated の行は自動で付くので比べない */
function comparable(text) {
	const masked = stripCode(text).split("\n");
	return text
		.split("\n")
		.map((line, i) => {
			let out = "";
			let last = 0;
			for (const m of masked[i].matchAll(LINK_RE)) {
				const start = m.index + m[1].length;
				out += line.slice(last, start) + "\u0000";
				last = start + m[2].length;
			}
			return out + line.slice(last);
		})
		.filter((l) => !l.startsWith("updated:"));
}

/** before から after への変更が、リンク先のパスの書き換えだけか */
export function onlyLinkTargetsChanged(before, after) {
	const a = comparable(before);
	const b = comparable(after);
	return a.length === b.length && a.every((l, i) => l === b[i]);
}

function checkRenameCommit(repo, sha, add) {
	const show = (rev, path) => git(repo, ["show", `${rev}:${path}`]);
	const dir = (p) => p.slice(0, p.lastIndexOf("/") + 1);
	// 小さいノートは title を足すだけで git が改名と見なさないので、削除と追加を自分で組にする
	const changes = git(repo, ["diff-tree", "--root", "--no-commit-id", "-r", "--no-renames", "--name-status", sha])
		.trim()
		.split("\n")
		.filter(Boolean)
		.map((c) => c.split("\t"));
	const removed = [];
	const added = [];
	for (const [status, path] of changes) {
		if (classify(path) === "hidden") add(path, "改名の操作で隠しパス（.claude、.obsidian など）を変えない");
		else if (status === "D") removed.push(path);
		else if (status === "A") added.push(path);
		else if (status === "M") {
			if (classify(path) === "source" || classify(path) === "asset") add(path, "元資料と添付は変えない");
			else if (!onlyLinkTargetsChanged(show(`${sha}^`, path), show(sha, path)))
				add(path, "改名の操作で変えてよいのは、リンク先のパスだけ");
		} else add(path, `改名の操作での変更（${status}）は許されていない`);
	}
	const expected = (from) => insertTitle(show(`${sha}^`, from), from.split("/").pop().replace(/\.md$/, ""));
	const pairs = [];
	// 先に中身の合うものを組にし、残りは同じフォルダの改名の対象と組にする
	const pair = (find, sameContent) => {
		for (const to of [...added]) {
			const from = removed.find((f) => find(f, to));
			if (!from) continue;
			removed.splice(removed.indexOf(from), 1);
			added.splice(added.indexOf(to), 1);
			pairs.push({ from, to, sameContent });
		}
	};
	pair((from, to) => from.endsWith(".md") && to.endsWith(".md") && onlyLinkTargetsChanged(expected(from), show(sha, to)), true);
	pair((from, to) => dir(from) === dir(to) && isRenameCandidate(from), false);
	for (const { from, to, sameContent } of pairs) {
		if (dir(from) !== dir(to) || !isRenameCandidate(from) || !KEBAB_MD_RE.test(to.split("/").pop()))
			add(`${from} → ${to}`, "フォルダは変えず、名前をケバブケースにする改名だけ");
		else if (!sameContent) add(`${from} → ${to}`, "改名したノートで変えてよいのは、title の追加とリンク先のパスだけ");
	}
	for (const path of [...removed, ...added]) add(path, "改名の操作でファイルを足したり消したりしない");
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
