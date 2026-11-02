#!/usr/bin/env node
// SessionStart フック: 子の Vault のハーネスの評価の期限と、未処理の気づきの数を Claude に伝える。
// 判定ルールは .claude/skills/harness-review/SKILL.md の「いつ行うか」を参照。
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const INTERVAL_DAYS = 30;
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
// 子の Vault（.kit-local/ がある）のときだけ知らせる。上流では .kit/harness/hooks/kit-review-status.mjs が知らせる（ADR-0011）
if (!existsSync(join(root, ".kit-local"))) process.exit(0);

let last = null;
try {
	last = JSON.parse(readFileSync(join(root, ".claude/reviews/last-review.json"), "utf8"));
} catch {
	// 未実施として扱う
}
const days = last?.date ? Math.floor((Date.now() - new Date(`${last.date}T00:00:00`)) / 86_400_000) : null;

const notesDir = join(root, ".claude/notes");
const notes = existsSync(notesDir) ? readdirSync(notesDir).filter((f) => f.endsWith(".md") && f !== "README.md").length : 0;

if (days === null) {
	console.log(`[harness-review] 記録がありません。ユーザーに harness-review の実施を提案してください（未処理の気づき ${notes} 件）。`);
} else if (days >= INTERVAL_DAYS) {
	console.log(
		`[harness-review] 期限切れ（前回 ${last.date}、${days} 日前）。ユーザーに harness-review の実施を提案してください（未処理の気づき ${notes} 件）。`,
	);
} else {
	console.log(`[harness-review] OK（前回 ${last.date}、次回まで ${INTERVAL_DAYS - days} 日。未処理の気づき ${notes} 件）`);
}
