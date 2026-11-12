/**
 * インラインコードの見つけ方（ADR-0128）。CommonMark のコードスパンの規則のうち、1 行の中で決まる部分だけを扱う。
 * - 開きの ` の並び（n 個）は、ちょうど n 個の ` の並びで閉じる。閉じがなければ、ただの文字
 * - \` はコードの始まりにしない（コードの中では \ は普通の文字）
 * - 中身の前後に空白が 1 つずつあり、空白だけでなければ、それを除く
 */

export interface InlineCode {
	/** 開きの ` の位置（行の先頭からの文字数） */
	from: number;
	/** 閉じの ` の直後の位置 */
	to: number;
	/** コピーする中身（` を除く） */
	text: string;
}

function runLength(line: string, at: number): number {
	let n = 0;
	while (line[at + n] === "`") n++;
	return n;
}

/** 行の中のインラインコードをすべて返す */
export function inlineCodes(line: string): InlineCode[] {
	const found: InlineCode[] = [];
	let i = 0;
	while (i < line.length) {
		if (line[i] === "\\") {
			i += 2;
			continue;
		}
		if (line[i] !== "`") {
			i++;
			continue;
		}
		const n = runLength(line, i);
		let j = i + n;
		let close = -1;
		while (j < line.length) {
			if (line[j] !== "`") {
				j++;
				continue;
			}
			const m = runLength(line, j);
			if (m === n) {
				close = j;
				break;
			}
			j += m;
		}
		if (close < 0) {
			i += n;
			continue;
		}
		let text = line.slice(i + n, close);
		if (text.length >= 2 && text.startsWith(" ") && text.endsWith(" ") && text.trim() !== "") text = text.slice(1, -1);
		found.push({ from: i, to: close + n, text });
		i = close + n;
	}
	return found;
}

/** 位置（行の先頭からの文字数）を含むインラインコード。` の上と、閉じの直後も含む */
export function findInlineCode(line: string, offset: number): InlineCode | null {
	return inlineCodes(line).find((c) => offset >= c.from && offset <= c.to) ?? null;
}

/** 編集中に、どれかのカーソルがコードの中か端にあるか（Obsidian は ` を見せる） */
export function cursorInside(span: { from: number; to: number }, cursors: readonly number[]): boolean {
	return cursors.some((p) => p >= span.from && p <= span.to);
}
