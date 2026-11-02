#!/usr/bin/env node
/**
 * wiki-daily で次に処理するデイリーノートを列挙する。
 * 決定: .kit/harness/docs/adr/0003-wiki-layout.md（daily/ はその場で元資料として扱う）
 *
 * wiki/log.md の最後の daily の記録（`## YYYY-MM-DD daily | …` と `- コミット: <sha>`）を基準に、
 * 次のどちらかに当たる「今日より前」のデイリーノートを返す。
 * - 前回の処理日以降の日付（前回は対象外だった）
 * - 前回のコミットから変更された（追記された）
 * 記録がなければ、今日より前のものをすべて返す。
 *
 * 使い方: node .claude/scripts/daily-pending.mjs [--today YYYY-MM-DD]
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { DAILY_RE, vaultFiles, WIKI_LOG } from "./lib/vault.mjs";

/** log.md から最後の daily の記録を返す。 */
export function lastDailyRun(logText) {
	let last = null;
	let current = null;
	for (const line of logText.split("\n")) {
		const h = line.match(/^## (\d{4}-\d{2}-\d{2}) (\S+) \|/);
		if (h) {
			current = h[2] === "daily" ? { date: h[1], commit: null } : null;
			if (current) last = current;
			continue;
		}
		const c = line.match(/^- コミット: ([0-9a-f]{7,40})/);
		if (c && current) current.commit = c[1];
	}
	return last;
}

function localDate(d = new Date()) {
	const pad = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function pendingDaily(root, today = localDate()) {
	const git = (...args) => execFileSync("git", ["-c", "core.quotepath=false", ...args], { cwd: root, encoding: "utf8" });
	const logPath = join(root, WIKI_LOG);
	const last = existsSync(logPath) ? lastDailyRun(readFileSync(logPath, "utf8")) : null;
	let changed = new Set();
	if (last?.commit) {
		changed = new Set(git("diff", "--name-only", last.commit, "HEAD", "--", "daily/").trim().split("\n").filter(Boolean));
	}
	const result = [];
	for (const path of vaultFiles(root)) {
		const m = path.match(DAILY_RE);
		if (!m) continue;
		const date = `${m[3]}-${m[4]}-${m[5]}`;
		if (date >= today) continue;
		if (!last?.commit) result.push({ path, date, reason: "未処理" });
		else if (date >= last.date) result.push({ path, date, reason: "前回の処理の後の日付" });
		else if (changed.has(path)) result.push({ path, date, reason: `前回（${last.commit}）の後に変更された` });
	}
	return { last, head: git("rev-parse", "--short", "HEAD").trim(), pending: result };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const root = fileURLToPath(new URL("../..", import.meta.url));
	const i = process.argv.indexOf("--today");
	const { last, head, pending } = pendingDaily(root, i === -1 ? undefined : process.argv[i + 1]);
	console.log(last ? `前回: ${last.date}（コミット ${last.commit ?? "記録なし"}）` : "前回: なし");
	console.log(`今回の基準コミット: ${head}（log.md の「- コミット:」に書く）`);
	if (!pending.length) console.log("処理するデイリーノートはない");
	for (const p of pending) {
		const diff = p.reason.startsWith("前回（") ? `  差分: git diff ${last.commit} HEAD -- ${p.path}` : "";
		console.log(`- ${p.path}  ${p.reason}${diff}`);
	}
}
