import { diff3Merge } from "node-diff3";

export interface TextMergeResult {
	clean: boolean;
	text: string;
}

export interface ConflictLabels {
	ours: string;
	theirs: string;
}

/** 行末（\n）を残したまま行に分割する */
function splitLines(text: string): string[] {
	return text === "" ? [] : text.split(/(?<=\n)/);
}

function pushBlock(out: string[], lines: string[]): void {
	out.push(...lines);
	const last = out[out.length - 1];
	if (last !== undefined && !last.endsWith("\n")) out[out.length - 1] = last + "\n";
}

/**
 * 行単位の 3-way マージ。重なる変更は標準形式のコンフリクトマーカーで両方残す。
 * ローカル (ours) とリモート (theirs) で同じ変更をしている箇所はコンフリクトにしない。
 */
export function mergeText(base: string, ours: string, theirs: string, labels: ConflictLabels): TextMergeResult {
	const regions = diff3Merge(splitLines(ours), splitLines(base), splitLines(theirs), {
		excludeFalseConflicts: true,
	});
	const out: string[] = [];
	let clean = true;
	for (const region of regions) {
		if (region.ok) {
			out.push(...region.ok);
		} else if (region.conflict) {
			// 両側で共通の先頭・末尾の行はマーカーの外に出す（新規作成同士のデイリーノートなど）
			const { a, b } = region.conflict;
			let head = 0;
			while (head < a.length && head < b.length && a[head] === b[head]) head++;
			let tail = 0;
			while (
				tail < a.length - head &&
				tail < b.length - head &&
				a[a.length - 1 - tail] === b[b.length - 1 - tail]
			) {
				tail++;
			}
			out.push(...a.slice(0, head));
			clean = false;
			out.push(`<<<<<<< ${labels.ours}\n`);
			pushBlock(out, a.slice(head, a.length - tail));
			out.push("=======\n");
			pushBlock(out, b.slice(head, b.length - tail));
			out.push(`>>>>>>> ${labels.theirs}\n`);
			out.push(...a.slice(a.length - tail));
		}
	}
	return { clean, text: out.join("") };
}

const MARKER_START = /^<{7} /m;
const MARKER_END = /^>{7} /m;

export function hasConflictMarkers(text: string): boolean {
	return MARKER_START.test(text) && MARKER_END.test(text);
}
