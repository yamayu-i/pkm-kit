#!/usr/bin/env node
// SessionStart フック: 前回のセキュリティチェックからの経過日数を Claude に伝える。
// 判定ルールは .claude/docs/security-check-schedule.md を参照。出力はセッションのコンテキストに入る。
import { readFileSync } from "node:fs";
import { join } from "node:path";

const INTERVAL_DAYS = 7;
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const file = join(root, ".claude/security/last-check.json");

let last = null;
try {
	last = JSON.parse(readFileSync(file, "utf8"));
} catch {
	// 未実施として扱う
}

const today = new Date();
const days = last?.date ? Math.floor((today - new Date(`${last.date}T00:00:00`)) / 86_400_000) : null;

if (days === null) {
	console.log("[security-check] 記録がありません。作業を始める前に security-check スキルを実行してください。");
} else if (days >= INTERVAL_DAYS || last.result !== "pass") {
	const why = last.result !== "pass" ? `前回の結果が ${last.result}` : `前回から ${days} 日経過`;
	console.log(
		`[security-check] 期限切れ（${why}、前回 ${last.date}）。作業を始める前に security-check スキルを実行してください。`,
	);
} else {
	console.log(`[security-check] OK（前回 ${last.date}、${days} 日前。次回期限まで ${INTERVAL_DAYS - days} 日）`);
}
