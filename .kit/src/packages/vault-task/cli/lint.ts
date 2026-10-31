/**
 * Vault のタスク管理データを検査する CLI（ADR-0001）。Claude Code やスキルから使う。
 * プラグインには同梱しない（Node の API を使うため）。
 *
 * 使い方: node dist/lint.mjs <Vault のルート> [--json]
 */
import { lintVault } from "../src/core/lint";
import type { Problem } from "../src/core/problem";
import { parseArgs, readVault } from "./read-vault";

const { root, json } = parseArgs(process.argv.slice(2));
const { data, problems: parseProblems, paths } = readVault(root);
const problems: Problem[] = [...parseProblems, ...lintVault(data, { paths: new Set(paths) })];

if (json) {
	console.log(JSON.stringify({ issues: data.issues.length, routines: data.routines.length, worklogs: data.worklogs.length, problems }, null, 2));
} else {
	for (const p of problems) console.log(`${p.severity === "error" ? "ERROR" : "WARN "} ${p.path}  [${p.code}] ${p.message}`);
	const errors = problems.filter((p) => p.severity === "error").length;
	console.log(
		`\nissue ${data.issues.length} / routine ${data.routines.length} / member ${data.members.length} / worklog ${data.worklogs.length} 件` +
			` — エラー ${errors}、警告 ${problems.length - errors}`,
	);
}
process.exit(problems.some((p) => p.severity === "error") ? 1 : 0);
