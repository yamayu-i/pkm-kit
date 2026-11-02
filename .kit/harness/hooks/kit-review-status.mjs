#!/usr/bin/env node
// SessionStart フック: 上流（pkm-kit）の評価の期限と、未処理の気づきの数を Claude に伝える。
// 判定ルールは .kit/harness/skills/kit-review/SKILL.md の「いつ行うか」を参照。
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const INTERVAL_DAYS = 30;
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
// 上流のときだけ知らせる。子の Vault（.kit-local/ がある）では .claude/hooks/harness-status.mjs が知らせる（ADR-0011）
if (existsSync(join(root, ".kit-local"))) process.exit(0);

let last = null;
try {
	last = JSON.parse(readFileSync(join(root, ".kit/harness/reviews/last-review.json"), "utf8"));
} catch {
	// 未実施として扱う
}
const days = last?.date ? Math.floor((Date.now() - new Date(`${last.date}T00:00:00`)) / 86_400_000) : null;

const notesDir = join(root, ".kit/harness/notes");
const notes = existsSync(notesDir) ? readdirSync(notesDir).filter((f) => f.endsWith(".md") && f !== "README.md").length : 0;

if (days === null) {
	console.log(`[kit-review] 記録がありません。ユーザーに kit-review（.kit/harness/skills/kit-review/SKILL.md）の実施を提案してください（未処理の気づき ${notes} 件）。`);
} else if (days >= INTERVAL_DAYS) {
	console.log(
		`[kit-review] 期限切れ（前回 ${last.date}、${days} 日前）。ユーザーに kit-review（.kit/harness/skills/kit-review/SKILL.md）の実施を提案してください（未処理の気づき ${notes} 件）。`,
	);
} else {
	console.log(`[kit-review] OK（前回 ${last.date}、次回まで ${INTERVAL_DAYS - days} 日。未処理の気づき ${notes} 件）`);
}
