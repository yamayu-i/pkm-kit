/**
 * 引用ブロックの扱い（ADR-0251）。Markdown のソースの行だけを見て決める（構文木は使わない）
 * - 引用の記号: 行の頭の `>`（前に空白 3 つまで）と、その後ろの空白 1 つ。入れ子は並べて書く（`> > `）
 * - 貼り付け: 引用の中に複数行を貼るとき、2 行目から下にカーソルの行と同じ記号を付ける
 * - コピー: ひと続きの引用の行から、外側の記号を 1 段だけ外した文を作る。コールアウトは `[!type]` の行を除く
 */

const PREFIX = /^(?: {0,3}>[ \t]?)+/;
/** 外側の 1 段 */
const OUTER = /^ {0,3}>[ \t]?/;
/** コールアウトの 1 行目（`[!note] 題`、`[!tip]- 題`） */
const CALLOUT_HEAD = /^\[![^\]\s]+\][+-]?(?:\s|$)/;

/** 行の頭の引用の記号。引用でなければ null */
export function quotePrefix(line: string): string | null {
	return PREFIX.exec(line)?.[0] ?? null;
}

/**
 * 引用の行の ch の位置に text を貼るときの、記号を付けた文。手を出さないとき（引用でない、記号より前、1 行だけ）は null
 * 途中の空行には末尾の空白を除いた記号だけを付ける。最後の行には元の行の続きがつながるので、記号をそのまま付ける
 */
export function pasteIntoQuote(line: string, ch: number, text: string): string | null {
	const prefix = quotePrefix(line);
	if (prefix === null || ch < prefix.length) return null;
	const lines = text.replace(/\r\n?/g, "\n").split("\n");
	if (lines.length < 2) return null;
	const last = lines.length - 1;
	return lines.map((l, i) => (i === 0 ? l : l === "" && i < last ? prefix.trimEnd() : prefix + l)).join("\n");
}

/** n 行目を含む、ひと続きの引用の行の範囲。lineAt は範囲の外で null を返す。n が引用でなければ null */
export function quoteBlock(lineAt: (n: number) => string | null, n: number): { first: number; last: number } | null {
	const isQuote = (i: number): boolean => {
		const line = lineAt(i);
		return line !== null && quotePrefix(line) !== null;
	};
	if (!isQuote(n)) return null;
	let first = n;
	let last = n;
	while (isQuote(first - 1)) first--;
	while (isQuote(last + 1)) last++;
	return { first, last };
}

/** 引用の行から、コピーする生の文を作る。外側の記号を 1 段だけ外し、コールアウトなら 1 行目（`[!type]`）を除く */
export function quoteSource(lines: readonly string[]): string {
	const body = lines.map((l) => l.replace(OUTER, ""));
	if (body.length > 0 && CALLOUT_HEAD.test(body[0] ?? "")) body.shift();
	return body.join("\n");
}
