import { sanitizeDeviceName } from "../../../pkm-task/src/core/worklog";

/**
 * Viewed を押した記録（ADR-0070 の 4）。`updates/<端末名>/YYYY-MM.jsonl` に 1 行 `{"viewed_at": …}` を足すだけ。
 * board・statuslog と同じく端末別の追記だけなので、同期で衝突しない。基準は全端末の最大
 */
const VIEWED_LOG_PATH_RE = /^updates\/([^/]+)\/(\d{4}-\d{2})\.jsonl$/;

export function isViewedLogPath(path: string): boolean {
	return VIEWED_LOG_PATH_RE.test(path);
}

/** 月は押した時刻（端末のタイムゾーン）の月 */
export function viewedLogPath(device: string, at: Date): string {
	const safe = sanitizeDeviceName(device);
	if (!safe) throw new Error("端末名が空です");
	const month = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}`;
	return `updates/${safe}/${month}.jsonl`;
}

export function serializeViewed(viewedAt: string): string {
	return JSON.stringify({ viewed_at: viewedAt });
}

/** 末尾に改行がなければ補ってから、1 行足す */
export function appendViewedLine(text: string, line: string): string {
	const base = text === "" || text.endsWith("\n") ? text : `${text}\n`;
	return `${base}${line}\n`;
}

/** 全端末のログの中身から、viewed_at の最大（ミリ秒）。読めない行は飛ばす。1 つもなければ null */
export function latestViewed(texts: Iterable<string>): number | null {
	let latest: number | null = null;
	for (const text of texts) {
		for (const line of text.split("\n")) {
			if (line.trim() === "") continue;
			let value: unknown;
			try {
				value = JSON.parse(line);
			} catch {
				continue;
			}
			const at = typeof value === "object" && value !== null ? (value as { viewed_at?: unknown }).viewed_at : undefined;
			const ms = typeof at === "string" ? Date.parse(at) : NaN;
			if (!Number.isNaN(ms) && (latest === null || ms > latest)) latest = ms;
		}
	}
	return latest;
}
