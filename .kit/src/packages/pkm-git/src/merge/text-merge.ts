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

/** 本文の一部。マーカーの外の本文か、マーカーの塊（ADR-0110 の 1） */
export type ConflictSegment =
	| { type: "text"; text: string }
	| { type: "conflict"; localLabel: string; remoteLabel: string; local: string; remote: string };

export type ConflictChoice = "local" | "remote" | "both";

/**
 * 本文をマーカーの塊とその外に分ける。塊は `<<<<<<< ` / `=======` / `>>>>>>> ` の行（行頭）で区切る。
 * 塊の形が崩れている（閉じていない・入れ子・区切りがない・区切りが 2 つ）ときは null（手で直してもらう）
 */
export function parseConflicts(text: string): ConflictSegment[] | null {
	const lines = splitLines(text);
	const out: ConflictSegment[] = [];
	let plain = "";
	let i = 0;
	while (i < lines.length) {
		const line = lines[i] as string;
		if (!line.startsWith("<<<<<<< ")) {
			// 塊の外の `=======`（Setext の見出しの下線）と `>>>>>>> ` は本文として扱う
			plain += line;
			i++;
			continue;
		}
		if (plain) out.push({ type: "text", text: plain });
		plain = "";
		const localLabel = line.slice(8).replace(/\r?\n$/, "");
		let local = "";
		let remote = "";
		let part: "local" | "remote" = "local";
		let closed = false;
		for (i++; i < lines.length; i++) {
			const l = lines[i] as string;
			if (l.startsWith("<<<<<<< ")) return null;
			if (/^={7}\r?\n?$/.test(l)) {
				if (part === "remote") return null;
				part = "remote";
				continue;
			}
			if (l.startsWith(">>>>>>> ")) {
				if (part !== "remote") return null;
				out.push({ type: "conflict", localLabel, remoteLabel: l.slice(8).replace(/\r?\n$/, ""), local, remote });
				closed = true;
				i++;
				break;
			}
			if (part === "local") local += l;
			else remote += l;
		}
		if (!closed) return null;
	}
	if (plain) out.push({ type: "text", text: plain });
	return out;
}

/** 塊ごとに選んだ本文で置き換える。choices は塊の順。塊の外の本文は変えない */
export function resolveConflicts(segments: readonly ConflictSegment[], choices: readonly ConflictChoice[]): string {
	let n = 0;
	let out = "";
	for (const s of segments) {
		if (s.type === "text") {
			out += s.text;
			continue;
		}
		const choice = choices[n++];
		if (choice === undefined) throw new Error("選んでいない塊があります");
		const both = s.local + (s.local && !s.local.endsWith("\n") ? "\n" : "") + s.remote;
		out += choice === "local" ? s.local : choice === "remote" ? s.remote : both;
	}
	if (n !== choices.length) throw new Error("塊の数と選んだ数が違います");
	return out;
}
