const LIST_MARKER_RE = /^\s*(?:[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)/;

/** 一括登録のテキストを summary の一覧にする（ADR-0011）。空行と行頭の箇条書き記号を取り除く */
export function parseCaptureText(text: string): string[] {
	return text
		.split(/\r?\n/)
		.map((line) => line.replace(LIST_MARKER_RE, "").trim())
		.filter((line) => line.length > 0);
}
