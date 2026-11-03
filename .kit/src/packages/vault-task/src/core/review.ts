import type { TaskIndex } from "./index";
import type { WorklogEntry } from "./worklog";

/** worklog の見直し候補（worklog-review スキル。ADR-0009） */
export interface WorklogFinding {
	entry: WorklogEntry;
	code: "still-running" | "too-long" | "crosses-midnight" | "non-positive" | "many-overlaps" | "after-close" | "unknown-task";
	message: string;
}

export interface ReviewOptions {
	/** これより長く動いているログを候補にする（時間） */
	runningHours: number;
	/** 1 件がこれより長いと候補にする（時間） */
	longHours: number;
	/** 同時に動いているログがこの数以上だと候補にする */
	overlapCount: number;
}

export const DEFAULT_REVIEW: ReviewOptions = { runningHours: 4, longHours: 6, overlapCount: 3 };

const HOUR = 3_600_000;

function localDay(ms: number): string {
	const d = new Date(ms);
	return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * 間違っていそうな worklog を挙げる。`closedAt` は issue を閉じた日時。渡さなければ status の記録から決める（ADR-0031）
 */
export function reviewWorklogs(index: TaskIndex, now: number, options: Partial<ReviewOptions> = {}, closedAt: Map<string, number> = index.closedAt()): WorklogFinding[] {
	const o = {
		runningHours: options.runningHours ?? DEFAULT_REVIEW.runningHours,
		longHours: options.longHours ?? DEFAULT_REVIEW.longHours,
		overlapCount: options.overlapCount ?? DEFAULT_REVIEW.overlapCount,
	};
	const logs = index.data.worklogs;
	const findings: WorklogFinding[] = [];
	const add = (entry: WorklogEntry, code: WorklogFinding["code"], message: string) => findings.push({ entry, code, message });

	// 同時に動いている数の最大値をログごとに求める
	const events = logs
		.flatMap((l, i) => {
			const to = l.toMs ?? now;
			return to > l.fromMs ? [{ t: l.fromMs, d: 1, i }, { t: to, d: -1, i }] : [];
		})
		.sort((a, b) => a.t - b.t || a.d - b.d);
	const active = new Set<number>();
	const peak = new Map<number, number>();
	for (const e of events) {
		if (e.d === 1) active.add(e.i);
		else active.delete(e.i);
		for (const i of active) peak.set(i, Math.max(peak.get(i) ?? 0, active.size));
	}

	logs.forEach((l, i) => {
		if (!index.issues.has(l.taskId) && !index.routines.has(l.taskId)) add(l, "unknown-task", `task_id の ${l.taskId} がありません`);
		if (l.toMs === null) {
			const h = (now - l.fromMs) / HOUR;
			if (h >= o.runningHours) add(l, "still-running", `${Math.floor(h)} 時間以上、記録中のままです（止め忘れ？）`);
			return;
		}
		const h = (l.toMs - l.fromMs) / HOUR;
		if (h <= 0) add(l, "non-positive", "終了が開始以前です");
		else {
			if (h >= o.longHours) add(l, "too-long", `1 件で ${h.toFixed(1)} 時間あります`);
			if (localDay(l.fromMs) !== localDay(l.toMs - 1)) add(l, "crosses-midnight", "日をまたいでいます");
		}
		const p = peak.get(i) ?? 0;
		if (p >= o.overlapCount) add(l, "many-overlaps", `${p} 件のログと時間が重なっています`);
		const closed = closedAt.get(l.taskId);
		if (closed !== undefined && l.fromMs > closed) add(l, "after-close", "issue を閉じた後のログです");
	});
	return findings.sort((a, b) => b.entry.fromMs - a.entry.fromMs);
}

/** 按分前の合計（スキルで按分後と比べるため） */
export function rawEffortMinutes(logs: WorklogEntry[], now: number): Map<string, number> {
	const out = new Map<string, number>();
	for (const l of logs) {
		const ms = (l.toMs ?? now) - l.fromMs;
		if (ms > 0) out.set(l.taskId, (out.get(l.taskId) ?? 0) + ms / 60_000);
	}
	return out;
}

