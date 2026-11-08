#!/usr/bin/env node
// SessionStart フック: 前回のセキュリティチェックからの経過日数を Claude に伝える。
// 判定ルールは .kit/harness/docs/security-check-schedule.md を参照。出力はセッションのコンテキストに入る。
// 記録はレポート（.kit/harness/security/reports/YYYY-MM-DD[-名前].md）だけ。作業ツリーと origin/main の両方から読む。
// 1 つのファイルに書き足す実施記録は、並行するブランチがぶつかるので置かない（ADR-0056）
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const INTERVAL_DAYS = 7;
export const REPORTS = ".kit/harness/security/reports";
const REPORT_FILE = /^(\d{4}-\d{2}-\d{2})(?:-[a-z0-9-]+)?\.md$/;

/** レポートの本文から、最後に書かれたチェックの commit と結果を読む（1 つのファイルに 2 回分あれば後のもの） */
export function parseReport(name, text) {
	const date = name.match(REPORT_FILE)?.[1];
	if (!date) return null;
	const commits = [...text.matchAll(/^- 対象 commit: .*?\b([0-9a-f]{7,40})\b/gm)].map((m) => m[1]);
	const results = [...text.matchAll(/^- 結果: *(pass|partial|fail)\b/gm)].map((m) => m[1]);
	return { date, report: name, commit: commits.at(-1) ?? null, result: results.at(-1) ?? null };
}

/** レポートの一覧から前回のチェックを選ぶ。最新の日付のうち、pass のものがあればそれ */
export function latestCheck(reports) {
	const valid = reports.filter((r) => r?.result);
	if (!valid.length) return null;
	const date = valid.map((r) => r.date).sort().at(-1);
	const sameDay = valid.filter((r) => r.date === date).sort((a, b) => a.report.localeCompare(b.report));
	return sameDay.findLast((r) => r.result === "pass") ?? sameDay.at(-1);
}

/** 作業ツリーと origin/main のレポートを読む（同じ名前なら作業ツリーのもの） */
export function collectReports(root) {
	const byName = new Map();
	try {
		const out = execFileSync("git", ["ls-tree", "--name-only", "origin/main", `${REPORTS}/`], {
			cwd: root,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		});
		for (const path of out.split("\n").filter(Boolean)) {
			const name = path.slice(REPORTS.length + 1);
			if (!REPORT_FILE.test(name)) continue;
			const text = execFileSync("git", ["show", `origin/main:${path}`], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
			byName.set(name, parseReport(name, text));
		}
	} catch {
		// origin/main がない（git でない、clone していない）なら作業ツリーだけ
	}
	const dir = join(root, REPORTS);
	if (existsSync(dir)) {
		for (const name of readdirSync(dir).filter((f) => REPORT_FILE.test(f))) byName.set(name, parseReport(name, readFileSync(join(dir, name), "utf8")));
	}
	return [...byName.values()];
}

export function statusMessage(last, today = new Date()) {
	const skill = "security-check（.kit/harness/skills/security-check/SKILL.md）";
	if (!last) return `[security-check] 記録がありません。作業を始める前に ${skill} を実行してください。`;
	const days = Math.floor((today - new Date(`${last.date}T00:00:00`)) / 86_400_000);
	const prev = `前回 ${last.date}、commit ${last.commit ?? "不明"}、${REPORTS}/${last.report}`;
	if (days >= INTERVAL_DAYS || last.result !== "pass") {
		const why = last.result !== "pass" ? `前回の結果が ${last.result}` : `前回から ${days} 日経過`;
		return `[security-check] 期限切れ（${why}。${prev}）。作業を始める前に ${skill} を実行してください。`;
	}
	return `[security-check] OK（${prev}、${days} 日前。次回期限まで ${INTERVAL_DAYS - days} 日）`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
	// 上流（pkm-kit）のときだけ知らせる。子の Vault（.kit-local/ がある）ではプラグインのソースを変えないので出さない（ADR-0011）
	if (!existsSync(join(root, ".kit-local"))) console.log(statusMessage(latestCheck(collectReports(root))));
}
