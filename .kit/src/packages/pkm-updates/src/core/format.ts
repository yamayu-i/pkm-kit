/** 行と「前回の確認」に出す日時（端末のタイムゾーン）。今年なら `11/08 10:00`、ほかの年は `2025/11/08 10:00` */
export function formatDateTime(ms: number, now: Date = new Date()): string {
	const d = new Date(ms);
	const pad = (n: number) => String(n).padStart(2, "0");
	const md = `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
	return d.getFullYear() === now.getFullYear() ? md : `${d.getFullYear()}/${md}`;
}
