#!/usr/bin/env node
/**
 * 日本語などの名前のノートのファイル名を、英語のケバブケースに改名する（note-rename スキルが使う）。
 * 決定: .kit/harness/docs/adr/0015-english-file-names.md
 *
 * - 改名は同じフォルダの中で名前だけを変える。title がなければ、もとのファイル名を title に入れる
 * - Vault のすべてのノートで、そのノートを指すリンクのリンク先のパスだけを書き換える
 *   （DailyNote の本文も対象。ADR-0015 の例外）。表示文字列・アンカー・コードの中は変えない
 * - 元資料（sources/）は変えないので、そこから指されたノートは改名しない
 *
 * 使い方:
 *   node .claude/scripts/note-rename.mjs --list
 *   node .claude/scripts/note-rename.mjs --apply <対応表.json> [--dry-run]
 *     対応表は { "もとのパス": "新しいパス" }（Vault ルートからのパス）
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isExternal, splitTarget, stripCode } from "./lib/markdown.mjs";
import { classify, KEBAB_MD_RE, vaultFiles } from "./lib/vault.mjs";

/** 名前が決まっていて、改名しない場所 */
const FIXED_DIRS = ["daily/", "issue/", "routine/", "member/", "asset/", "tmp/", "template/", "sources/"];

export function isRenameCandidate(path) {
	if (!path.endsWith(".md")) return false;
	if (classify(path) === "hidden") return false;
	if (FIXED_DIRS.some((d) => path.startsWith(d))) return false;
	const base = path.split("/").pop();
	if (base === "README.md") return false;
	return !KEBAB_MD_RE.test(base);
}

export function listCandidates(root) {
	return vaultFiles(root).filter(isRenameCandidate);
}

/** Markdown リンクの、リンク先の手前（1）とリンク先（2） */
export const LINK_RE = /(!?\[(?:[^\]\\]|\\.)*\]\(\s*)(<[^>]*>|[^\s)]+)/g;

/**
 * リンク先のパスが map（もとのパス → 新しいパス）に当たるものを書き換える。
 * コードの中は stripCode で隠した行で位置を求め、もとの行の同じ位置を置き換える。
 */
export function rewriteLinks(text, map) {
	const original = text.split("\n");
	const masked = stripCode(text).split("\n");
	return original
		.map((line, i) => {
			let out = "";
			let last = 0;
			for (const m of masked[i].matchAll(LINK_RE)) {
				const start = m.index + m[1].length;
				const raw = line.slice(start, start + m[2].length);
				const replaced = rewriteTarget(raw, map);
				if (replaced === null) continue;
				out += line.slice(last, start) + replaced;
				last = start + raw.length;
			}
			return out + line.slice(last);
		})
		.join("\n");
}

function rewriteTarget(raw, map) {
	const angled = raw.startsWith("<");
	const target = angled ? raw.slice(1, -1) : raw;
	if (isExternal(target) || target.startsWith("#")) return null;
	const { path } = splitTarget(target);
	const to = map.get(path);
	if (!to) return null;
	const hash = target.indexOf("#");
	const anchor = hash === -1 ? "" : target.slice(hash);
	// フォルダは変わらない。もとの書き方（%20 など）をそのまま残し、名前だけを差し替える
	const pathPart = hash === -1 ? target : target.slice(0, hash);
	const slash = pathPart.lastIndexOf("/");
	const next = `${slash === -1 ? "" : pathPart.slice(0, slash + 1)}${to.split("/").pop()}${anchor}`;
	return angled ? `<${next}>` : next;
}

/** frontmatter に title がなければ足す。frontmatter がなければ作る */
export function insertTitle(text, title) {
	const line = `title: ${JSON.stringify(title)}`;
	const nl = text.includes("\r\n") ? "\r\n" : "\n";
	if (!text.startsWith(`---${nl}`)) return `---${nl}${line}${nl}---${nl}${text}`;
	const lines = text.split(nl);
	const end = lines.indexOf("---", 1);
	if (end === -1) return text;
	if (lines.slice(1, end).some((l) => /^title:/.test(l))) return text;
	lines.splice(1, 0, line);
	return lines.join(nl);
}

function baseName(path) {
	return path.split("/").pop().replace(/\.md$/, "");
}

function outside(path) {
	return path.startsWith("/") || path.split("/").includes("..") || path.includes("\\");
}

/**
 * 対応表から、改名と書き換えの計画を作る。ファイルは変えない。
 * 返す: { renames: [{ from, to }], edits: [{ path, to, text }], problems: [文] }
 */
export function planRenames(root, mapping) {
	const problems = [];
	const renames = [];
	const files = vaultFiles(root);
	const fileSet = new Set(files);
	const targets = new Set();
	for (const [from, to] of Object.entries(mapping)) {
		if (outside(from) || outside(to)) {
			problems.push(`${from}: Vault の外のパスは扱わない`);
			continue;
		}
		if (!fileSet.has(from)) {
			problems.push(`${from}: もとのファイルがない`);
			continue;
		}
		if (!isRenameCandidate(from)) {
			problems.push(`${from}: 改名の対象ではない（決まった名前のフォルダか、すでにケバブケース）`);
			continue;
		}
		if (dirname(from) !== dirname(to)) {
			problems.push(`${from}: フォルダは変えられない（名前だけを変える）: ${to}`);
			continue;
		}
		if (!KEBAB_MD_RE.test(to.split("/").pop())) {
			problems.push(`${from}: 改名先がケバブケース（英小文字・数字・ハイフン）でない: ${to}`);
			continue;
		}
		if (fileSet.has(to) || existsSync(join(root, to))) {
			problems.push(`${from}: 改名先がすでにある: ${to}`);
			continue;
		}
		if (targets.has(to)) {
			problems.push(`${from}: 改名先が重なっている: ${to}`);
			continue;
		}
		targets.add(to);
		renames.push({ from, to });
	}

	const map = new Map(renames.map((r) => [r.from, r.to]));
	const renamed = new Map(renames.map((r) => [r.from, r.to]));
	const edits = [];
	for (const path of files) {
		if (!path.endsWith(".md")) continue;
		const text = readFileSync(join(root, path), "utf8");
		let next = rewriteLinks(text, map);
		if (classify(path) === "source") {
			if (next !== text)
				for (const [from] of map)
					if (rewriteLinks(text, new Map([[from, "x.md"]])) !== text)
						problems.push(`${path}: 元資料は変えられないので、ここから指されたノートは改名できない: ${from}`);
			continue;
		}
		if (renamed.has(path)) next = insertTitle(next, baseName(path));
		if (next !== text || renamed.has(path)) edits.push({ path, to: renamed.get(path) ?? path, text: next });
	}
	return { renames, edits, problems };
}

/** 計画を適用する。問題があれば何も変えない */
export function applyRenames(root, plan) {
	if (plan.problems.length) throw new Error("問題のある計画は適用しない");
	for (const { path, to, text } of plan.edits) {
		writeFileSync(join(root, path), text);
		if (to !== path) {
			mkdirSync(dirname(join(root, to)), { recursive: true });
			renameSync(join(root, path), join(root, to));
		}
	}
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const root = fileURLToPath(new URL("../..", import.meta.url));
	const args = process.argv.slice(2);
	if (args[0] === "--list") {
		const list = listCandidates(root);
		console.log(`改名を待っているノート ${list.length} 件`);
		for (const p of list) console.log(`  ${p}`);
	} else if (args[0] === "--apply" && args[1]) {
		const mapping = JSON.parse(readFileSync(args[1], "utf8"));
		const plan = planRenames(root, mapping);
		if (plan.problems.length) {
			console.log(`改名できない: ${plan.problems.length} 件（何も変えていない）`);
			for (const p of plan.problems) console.log(`  ${p}`);
			process.exit(1);
		}
		const dryRun = args.includes("--dry-run");
		console.log(`${dryRun ? "改名する予定" : "改名した"}: ${plan.renames.length} 件`);
		for (const r of plan.renames) console.log(`  ${r.from} → ${r.to}`);
		const linked = plan.edits.filter((e) => e.path === e.to).map((e) => e.path);
		console.log(`リンクを書き換える${dryRun ? "予定の" : "た"}ノート: ${linked.length} 件`);
		for (const p of linked) console.log(`  ${p}`);
		if (!dryRun) applyRenames(root, plan);
	} else {
		console.log("使い方: note-rename.mjs --list | --apply <対応表.json> [--dry-run]");
		process.exit(2);
	}
}
