import { formatMinutes } from "./format";
import type { TaskIndex } from "./index";

/** ステータスバーの summary の最大文字数（ADR-0075） */
const SUMMARY_MAX = 24;

export interface RunningStatus {
	/** ステータスバーに出す文字 */
	text: string;
	/** ツールチップ（タスクを 1 行ずつ。長い順） */
	tooltip: string;
	/** 押したら開くノート。2 つ以上か、索引にないタスクなら null（サイドバーを開く） */
	path: string | null;
}

/**
 * 記録中のタイマーの、ステータスバーの表示（ADR-0075）。記録中がなければ null。
 * 同じタスクの複数のログは 1 つにまとめ、経過時間はいちばん長いものにする
 */
export function runningStatus(index: TaskIndex, now: number): RunningStatus | null {
	const elapsedByTask = new Map<string, number>();
	for (const l of index.running()) {
		const elapsed = Math.max(0, now - l.fromMs);
		elapsedByTask.set(l.taskId, Math.max(elapsedByTask.get(l.taskId) ?? 0, elapsed));
	}
	if (elapsedByTask.size === 0) return null;
	const rows = [...elapsedByTask.entries()]
		.sort((a, b) => b[1] - a[1])
		.map(([taskId, elapsed]) => {
			const task = index.issues.get(taskId) ?? index.routines.get(taskId);
			return { taskId, summary: task?.summary ?? "", path: task?.path ?? null, time: formatMinutes(Math.floor(elapsed / 60_000)) };
		});
	const tooltip = rows.map((r) => [r.taskId, r.summary, r.time].filter(Boolean).join(" ")).join("\n");
	if (rows.length > 1) return { text: `● ${rows.length} running ${rows[0]!.time}`, tooltip, path: null };
	const r = rows[0]!;
	const summary = r.summary.length > SUMMARY_MAX ? `${r.summary.slice(0, SUMMARY_MAX)}…` : r.summary;
	return { text: ["●", r.taskId, summary, r.time].filter(Boolean).join(" "), tooltip, path: r.path };
}
