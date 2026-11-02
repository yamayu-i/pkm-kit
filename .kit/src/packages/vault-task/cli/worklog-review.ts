/**
 * 間違っていそうな worklog を挙げる CLI（worklog-review スキル。ADR-0009）。
 *
 * 使い方: node .kit/bin/worklog-review.mjs <Vault のルート> [--json] [--running-hours=4] [--long-hours=6] [--overlap-count=3]
 */
import { formatMinutes } from "../src/core/format";
import { TaskIndex } from "../src/core/index";
import { rawEffortMinutes, reviewWorklogs } from "../src/core/review";
import { parseArgs, readVault } from "./read-vault";

const { root, json, options } = parseArgs(process.argv.slice(2));
const { data } = readVault(root);
const index = new TaskIndex(data);
const now = Date.now();
const findings = reviewWorklogs(index, now, {
	runningHours: options["running-hours"],
	longHours: options["long-hours"],
	overlapCount: options["overlap-count"],
});

if (json) {
	const prorated = index.effortMinutes(now);
	const raw = rawEffortMinutes(data.worklogs, now);
	console.log(
		JSON.stringify(
			{
				now: new Date(now).toISOString(),
				findings: findings.map((f) => ({
					code: f.code,
					message: f.message,
					path: f.entry.path,
					line: f.entry.line,
					id: f.entry.id,
					task_id: f.entry.taskId,
					summary: index.issues.get(f.entry.taskId)?.summary ?? index.routines.get(f.entry.taskId)?.summary ?? null,
					from: f.entry.from,
					to: f.entry.to,
					description: f.entry.description,
				})),
				effort: [...raw].map(([id, minutes]) => ({ task_id: id, raw: Math.round(minutes), prorated: Math.round(prorated.get(id) ?? 0) })),
			},
			null,
			2,
		),
	);
} else {
	for (const f of findings) {
		const e = f.entry;
		console.log(`[${f.code}] ${e.path}:${e.line} ${e.id} ${e.taskId}  ${e.from} – ${e.to ?? "（記録中）"}  ${f.message}`);
	}
	const total = data.worklogs.reduce((m, l) => m + Math.max(0, ((l.toMs ?? now) - l.fromMs) / 60_000), 0);
	console.log(`\nworklog ${data.worklogs.length} 件（合計 ${formatMinutes(total)}）— 見直し候補 ${findings.length} 件`);
}
