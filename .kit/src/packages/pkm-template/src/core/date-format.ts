const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const TOKEN_RE = /\[([^\]]*)\]|YYYY|YY|MM|M|ddd|DDD|DD|D|HH|H|mm|m|ss|s|Z/g;

function pad2(n: number): string {
	return String(Math.trunc(Math.abs(n))).padStart(2, "0");
}

function formatOffset(date: Date): string {
	const offset = -date.getTimezoneOffset();
	const sign = offset >= 0 ? "+" : "-";
	return `${sign}${pad2(offset / 60)}:${pad2(offset % 60)}`;
}

/**
 * ローカル日時を指定フォーマットで文字列にする。
 * `[...]` で囲んだ部分はリテラルとしてそのまま出力する。
 */
export function formatDateTime(date: Date, format = "YYYY-MM-DD"): string {
	return format.replace(TOKEN_RE, (match, literal: string | undefined) => {
		if (literal !== undefined) return literal;
		switch (match) {
			case "YYYY":
				return String(date.getFullYear()).padStart(4, "0");
			case "YY":
				return String(date.getFullYear()).slice(-2);
			case "MM":
				return pad2(date.getMonth() + 1);
			case "M":
				return String(date.getMonth() + 1);
			case "ddd":
				return WEEKDAYS[date.getDay()] ?? "sun";
			case "DDD":
				// 曜日の英大文字 3 字（ADR-0060。moment.js の DDD とは違う）
				return (WEEKDAYS[date.getDay()] ?? "sun").toUpperCase();
			case "DD":
				return pad2(date.getDate());
			case "D":
				return String(date.getDate());
			case "HH":
				return pad2(date.getHours());
			case "H":
				return String(date.getHours());
			case "mm":
				return pad2(date.getMinutes());
			case "m":
				return String(date.getMinutes());
			case "ss":
				return pad2(date.getSeconds());
			case "s":
				return String(date.getSeconds());
			case "Z":
				return formatOffset(date);
			default:
				return match;
		}
	});
}
