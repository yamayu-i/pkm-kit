#!/usr/bin/env node
/**
 * コミットする変更ノートに updated を付与する(ADR-0028、.plugin-src/docs/adr/0028-auto-updated.md)。
 *
 * 使い方:
 *   node .claude/scripts/stamp-updated.mjs --staged    pre-commit フックから。ステージ済みの変更ノートに付与する
 *   node .claude/scripts/stamp-updated.mjs --migrate   空・欠けた updated に、最後に変えたコミットの日時を入れる(1 回だけ)
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { formatIso, isTargetPath, setUpdated, shouldStamp } from "./lib/updated.mjs";

function git(repo, args, input) {
	return execFileSync("git", args, { cwd: repo, encoding: "utf8", input, maxBuffer: 256 * 1024 * 1024 });
}

/** マージ・cherry-pick・rebase の途中か。同期で受け取っただけの内容に付与しない */
function inSync(repo) {
	return ["MERGE_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD", "rebase-merge", "rebase-apply"].some((name) =>
		existsSync(join(repo, git(repo, ["rev-parse", "--git-path", name]).trim())),
	);
}

/** ステージ済みの追加・変更ノートに updated を付与する。index の内容だけを書き換える。付与したパスを返す */
export function stampStaged(repo, { now = new Date(), offsetMinutes } = {}) {
	if (inSync(repo)) return [];
	const iso = formatIso(now, offsetMinutes);
	const parts = git(repo, ["diff", "--cached", "--name-status", "-z", "--no-renames", "--diff-filter=ADM"]).split("\0");
	const stamped = [];
	for (let i = 0; i + 1 < parts.length; i += 2) {
		const [status, path] = [parts[i], parts[i + 1]];
		if (!isTargetPath(path)) continue;
		// コミット済みの元資料は変えない(sources/ は作成後に変更しない。docs/llm-wiki.md)
		if (path.startsWith("sources/") && status !== "A") throw new Error(`${path}: コミット済みの元資料は変更・削除できません`);
		if (status === "D") continue;
		const entry = git(repo, ["ls-files", "-s", "--", path]).split("\t")[0].split(" ");
		if (!["100644", "100755"].includes(entry[0]) || entry[2] !== "0") continue; // 衝突中・シンボリックリンクは触らない
		const staged = git(repo, ["show", `:${path}`]);
		const old = status === "A" ? null : git(repo, ["show", `HEAD:${path}`]);
		if (!shouldStamp(old, staged)) continue;
		let next;
		try {
			next = setUpdated(staged, iso);
		} catch (e) {
			throw new Error(`${path}: ${e.message}`);
		}
		if (next === staged) continue;
		const mode = entry[0];
		const oid = git(repo, ["hash-object", "-w", "--stdin"], next).trim();
		git(repo, ["update-index", "--cacheinfo", `${mode},${oid},${path}`]);
		// 未 stage の変更がないときだけ、作業ツリーも合わせる(部分 stage の内容を壊さない)
		const file = join(repo, path);
		if (existsSync(file) && readFileSync(file, "utf8") === staged) writeFileSync(file, next);
		stamped.push(path);
	}
	return stamped;
}

/** 空・欠けた updated に、最後に変えたコミットの日時(なければファイルの更新時刻)を入れる。更新したパスを返す */
export function migrate(repo, { offsetMinutes } = {}) {
	const done = [];
	for (const path of git(repo, ["ls-files", "-z"]).split("\0")) {
		if (!path || !isTargetPath(path)) continue;
		const file = join(repo, path);
		const text = readFileSync(file, "utf8");
		const m = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/.exec(text);
		if (!m) continue;
		const line = m[1].split(/\r?\n/).find((l) => l.startsWith("updated:"));
		if (line !== undefined && line.slice("updated:".length).trim() !== "") continue;
		const last = git(repo, ["log", "-1", "--format=%aI", "--", path]).trim();
		const iso = last || formatIso(statSync(file).mtime, offsetMinutes);
		try {
			writeFileSync(file, setUpdated(text, iso));
			done.push(path);
		} catch (e) {
			console.error(`stamp-updated: ${path}: ${e.message}(スキップ)`);
		}
	}
	return done;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const repo = git(process.cwd(), ["rev-parse", "--show-toplevel"]).trim();
	const mode = process.argv[2];
	if (mode === "--staged") {
		let stamped;
		try {
			stamped = stampStaged(repo);
		} catch (e) {
			console.error(`stamp-updated: ${e.message}`);
			process.exit(1);
		}
		if (stamped.length) console.error(`stamp-updated: ${stamped.length} 件に updated を付与しました`);
	} else if (mode === "--migrate") {
		const done = migrate(repo);
		console.log(`stamp-updated: ${done.length} 件の updated を埋めました`);
		for (const p of done) console.log(`  ${p}`);
	} else {
		console.error("使い方: stamp-updated.mjs --staged | --migrate");
		process.exit(2);
	}
}
