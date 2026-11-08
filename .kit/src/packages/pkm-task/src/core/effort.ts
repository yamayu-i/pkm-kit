/** 按分に使う区間。`toMs` が null なら `now` まで動いているものとして扱う */
export interface EffortInterval {
	taskId: string;
	fromMs: number;
	toMs: number | null;
}

/**
 * タスクごとの実績（ミリ秒）を、時間の重なった区間だけ同時に動いている数で割って求める（ADR-0005）。
 * 開始と終了を時刻順に並べて 1 回なめる。長さが 0 以下の区間は無視する
 */
export function prorateEffort(intervals: readonly EffortInterval[], now: number): Map<string, number> {
	const events: { t: number; delta: 1 | -1; taskId: string }[] = [];
	for (const iv of intervals) {
		const to = iv.toMs ?? Math.max(now, iv.fromMs);
		if (!(to > iv.fromMs)) continue;
		events.push({ t: iv.fromMs, delta: 1, taskId: iv.taskId }, { t: to, delta: -1, taskId: iv.taskId });
	}
	events.sort((a, b) => a.t - b.t);

	const result = new Map<string, number>();
	// 動いている区間の数をタスクごとに持つ（同じタスクのログが重なっていても k に数える）
	const active = new Map<string, number>();
	let k = 0;
	let prev = 0;
	for (let i = 0; i < events.length; ) {
		const t = events[i]!.t;
		if (k > 0 && t > prev) {
			const share = (t - prev) / k;
			for (const [taskId, count] of active) result.set(taskId, (result.get(taskId) ?? 0) + share * count);
		}
		for (; i < events.length && events[i]!.t === t; i++) {
			const e = events[i]!;
			const count = (active.get(e.taskId) ?? 0) + e.delta;
			if (count === 0) active.delete(e.taskId);
			else active.set(e.taskId, count);
			k += e.delta;
			if (!result.has(e.taskId)) result.set(e.taskId, 0);
		}
		prev = t;
	}
	return result;
}
