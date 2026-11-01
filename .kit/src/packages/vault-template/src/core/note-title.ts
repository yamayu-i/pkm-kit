/**
 * ノートのタイトルの決め方と、daily の日付・曜日（ADR-0026）。Obsidian には依存しない。
 */
export type Frontmatter = Record<string, unknown>;

/** 日曜始まりの曜日（`Date#getUTCDay` の値がそのまま添字になる） */
export const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

function text(value: unknown): string | null {
	const s = typeof value === "string" ? value : typeof value === "number" && Number.isFinite(value) ? String(value) : "";
	const t = s.trim();
	return t === "" ? null : t;
}

/** `title` → `name` → ファイル名（拡張子なし）の順で、最初に見つかったもの */
export function noteTitle(frontmatter: Frontmatter | undefined, basename: string): string {
	return text(frontmatter?.title) ?? text(frontmatter?.name) ?? basename;
}

export interface DailyDate {
	/** `YYYY-MM-DD` */
	date: string;
	/** 0 = 日曜 … 6 = 土曜 */
	weekday: number;
	/** `2026-11-01 SUN` */
	label: string;
}

/** daily のファイル名（`YYYY-MM-DD`）から日付と曜日を導く。実在しない日付や別の形は null */
export function dailyDate(basename: string): DailyDate | null {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(basename);
	if (!m) return null;
	const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
	const d = new Date(Date.UTC(year, month - 1, day));
	if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
	const weekday = d.getUTCDay();
	return { date: basename, weekday, label: `${basename} ${WEEKDAYS[weekday]}` };
}
