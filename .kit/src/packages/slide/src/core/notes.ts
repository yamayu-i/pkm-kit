/**
 * 発表者ノート（<aside class="notes">）の書式（ADR-0132）。
 * - 書ける表現は、段落・段落の中の改行・箇条書き・番号付きの箇条書き（入れ子は 2 段まで）だけ。ビルドの規則 notes-format が守らせる
 * - その範囲の HTML と、編集の画面の素の文字（空行で段落、`- ` と `1. ` で箇条書き、スペース 2 つで 1 段下げる）を、失うことなく行き来する
 * - deck.html の中の、何枚目のスライドのノートの位置を探し、そこだけを入れ替える（ほかの部分は 1 バイトも変えない）
 * DOM にも Obsidian にも依存しない（DOM が要る所は、解析した要素を受け取る）
 */

export const NOTES_CLASS = "notes";
/** 入れ子の深さの上限（スライドの箇条書きと同じ。build.ts の MAX_LIST_DEPTH） */
export const MAX_NOTES_DEPTH = 2;
const LINE_ATTR = "data-l";
const TEXT = 3;
const ELEMENT = 1;

/** 使える表現の一覧（エラーのメッセージに出す） */
export const NOTES_FORMAT_HINT = "発表者ノートに書けるのは、文字・<p>・<br>・<ul> / <ol> と <li>（入れ子は 2 段まで）だけ。属性・強調・リンクなどは使わない";

const tagOf = (node: Node) => (node as Element).tagName.toLowerCase();
const isBlank = (node: Node) => node.nodeType === TEXT && (node.textContent ?? "").trim() === "";

function attributeError(el: Element): string | null {
	for (const attr of [...el.attributes]) {
		if (attr.name === LINE_ATTR) continue;
		return `<${tagOf(el)}> に属性（${attr.name}）を書かない`;
	}
	return null;
}

/** 文字と <br> だけか */
function inlineError(el: Element, where: string): string | null {
	for (const node of [...el.childNodes]) {
		if (node.nodeType === TEXT) continue;
		if (node.nodeType === ELEMENT && tagOf(node) === "br") {
			const e = attributeError(node as Element);
			if (e) return e;
			continue;
		}
		return node.nodeType === ELEMENT ? `${where}の中に <${tagOf(node)}> を書かない` : `${where}の中にコメントなどを書かない`;
	}
	return null;
}

function listError(list: Element, depth: number): string | null {
	if (depth > MAX_NOTES_DEPTH) return `箇条書きの入れ子は ${MAX_NOTES_DEPTH} 段まで`;
	const e = attributeError(list);
	if (e) return e;
	for (const node of [...list.childNodes]) {
		if (isBlank(node)) continue;
		if (node.nodeType !== ELEMENT || tagOf(node) !== "li") return `<${tagOf(list)}> の中は <li> だけにする`;
		const li = node as Element;
		const le = attributeError(li);
		if (le) return le;
		let nested: Element | null = null;
		for (const child of [...li.childNodes]) {
			if (child.nodeType === ELEMENT && (tagOf(child) === "ul" || tagOf(child) === "ol")) {
				if (nested) return "1 つの <li> の中の箇条書きは 1 つまで";
				nested = child as Element;
				const ne = listError(nested, depth + 1);
				if (ne) return ne;
				continue;
			}
			if (nested && !isBlank(child)) return "<li> の中の文字は、入れ子の箇条書きより前に書く";
			if (child.nodeType === TEXT) continue;
			if (child.nodeType === ELEMENT && tagOf(child) === "br") {
				const be = attributeError(child as Element);
				if (be) return be;
				continue;
			}
			return child.nodeType === ELEMENT ? `<li> の中に <${tagOf(child)}> を書かない` : "<li> の中にコメントなどを書かない";
		}
	}
	return null;
}

/** ノートが書式の範囲にあるか。範囲の外ならその理由（ビルドの規則 notes-format） */
export function notesFormatError(aside: Element): string | null {
	for (const attr of [...aside.attributes]) {
		if (attr.name === LINE_ATTR) continue;
		if (attr.name === "class" && attr.value.trim() === NOTES_CLASS) continue;
		return `<aside class="notes"> に、ほかの属性やクラス（${attr.name}="${attr.value}"）を書かない`;
	}
	const nodes = [...aside.childNodes];
	const blocks = nodes.some((n) => n.nodeType === ELEMENT && ["p", "ul", "ol"].includes(tagOf(n)));
	if (!blocks) return inlineError(aside, "ノート");
	for (const node of nodes) {
		if (isBlank(node)) continue;
		if (node.nodeType !== ELEMENT) return node.nodeType === TEXT ? "段落と箇条書きを混ぜるときは、文字も <p> で包む" : "ノートの中にコメントなどを書かない";
		const tag = tagOf(node);
		if (tag === "p") {
			const e = attributeError(node as Element) ?? inlineError(node as Element, "<p> ");
			if (e) return e;
		} else if (tag === "ul" || tag === "ol") {
			const e = listError(node as Element, 1);
			if (e) return e;
		} else if (tag === "br") {
			return "段落と箇条書きを混ぜるときは、改行も <p> の中に書く";
		} else {
			return `ノートの中に <${tag}> を書かない`;
		}
	}
	return null;
}

// ---- HTML → 素の文字

/** 文字と <br> を行にする。空白はまとめ、行の前後の空白と空の行を除く（表示では同じ） */
function inlineLines(nodes: readonly Node[]): string[] {
	let text = "";
	for (const node of nodes) {
		if (node.nodeType === TEXT) text += (node.textContent ?? "").replace(/\s+/g, " ");
		else if (node.nodeType === ELEMENT && tagOf(node) === "br") text += "\n";
	}
	return text
		.split("\n")
		.map((l) => l.trim())
		.filter((l) => l !== "");
}

function listLines(list: Element, level: number): string[] {
	const ordered = tagOf(list) === "ol";
	const out: string[] = [];
	let n = 0;
	for (const node of [...list.childNodes]) {
		if (node.nodeType !== ELEMENT || tagOf(node) !== "li") continue;
		n++;
		const children = [...node.childNodes];
		const nested = children.find((c) => c.nodeType === ELEMENT && (tagOf(c) === "ul" || tagOf(c) === "ol")) as Element | undefined;
		const lines = inlineLines(children.filter((c) => c !== nested));
		const marker = ordered ? `${n}. ` : "- ";
		const indent = "  ".repeat(level);
		out.push(`${indent}${marker}${lines[0] ?? ""}`);
		for (const line of lines.slice(1)) out.push(`${"  ".repeat(level + 1)}${line}`);
		if (nested) out.push(...listLines(nested, level + 1));
	}
	return out;
}

/** 書式の範囲にあるノート（aside の要素）を、編集の画面の素の文字にする */
export function notesToText(aside: Element): string {
	const nodes = [...aside.childNodes];
	const blocks = nodes.some((n) => n.nodeType === ELEMENT && ["p", "ul", "ol"].includes(tagOf(n)));
	if (!blocks) return inlineLines(nodes).join("\n");
	const parts: string[] = [];
	for (const node of nodes) {
		if (node.nodeType !== ELEMENT) continue;
		const tag = tagOf(node);
		if (tag === "p") {
			const lines = inlineLines([...node.childNodes]);
			if (lines.length > 0) parts.push(lines.join("\n"));
		} else if (tag === "ul" || tag === "ol") {
			parts.push(listLines(node as Element, 0).join("\n"));
		}
	}
	return parts.join("\n\n");
}

// ---- 素の文字 → HTML

interface Item {
	lines: string[];
	child: List | null;
}
interface List {
	ordered: boolean;
	items: Item[];
}
type Block = { kind: "p"; lines: string[] } | { kind: "list"; list: List };

const MARKER = /^( *)(-|\d+\.)(?: +(.*))?$/;

function parseBlocks(text: string): Block[] {
	const blocks: Block[] = [];
	const groups = text
		.replace(/\r\n?/g, "\n")
		.replace(/\t/g, "  ")
		.split(/\n[ ]*\n/)
		.map((g) => g.split("\n").filter((l) => l.trim() !== ""))
		.filter((g) => g.length > 0);
	for (const group of groups) {
		let paragraph: string[] = [];
		let top: List | null = null;
		let last: { item: Item; level: number } | null = null;
		for (const raw of group) {
			const m = MARKER.exec(raw);
			if (!m) {
				if (last) last.item.lines.push(raw.trim());
				else paragraph.push(raw.trim());
				continue;
			}
			if (paragraph.length > 0) {
				blocks.push({ kind: "p", lines: paragraph });
				paragraph = [];
			}
			const ordered = m[2] !== "-";
			const item: Item = { lines: [(m[3] ?? "").trim()], child: null };
			// 字下げ 2 つで 1 段。入れ子は 2 段まで。前の項目がなければ 1 段目
			const level = last !== null && (m[1] ?? "").length >= 2 ? 1 : 0;
			if (level === 1 && last) {
				const parent = last.level === 1 ? ((top as List).items.at(-1) as Item) : last.item;
				// 1 つの項目の中の箇条書きは 1 つまで。種類は最初の項目のものにそろえる
				if (parent.child) parent.child.items.push(item);
				else parent.child = { ordered, items: [item] };
				last = { item, level: 1 };
				continue;
			}
			if (!top || top.ordered !== ordered) {
				top = { ordered, items: [] };
				blocks.push({ kind: "list", list: top });
			}
			top.items.push(item);
			last = { item, level: 0 };
		}
		if (paragraph.length > 0) blocks.push({ kind: "p", lines: paragraph });
	}
	return blocks;
}

const escapeText = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inlineHtml = (lines: readonly string[]) => lines.map(escapeText).join("<br>");

function listHtml(list: List, indent: string, unit: string): string {
	const tag = list.ordered ? "ol" : "ul";
	const items = list.items.map((item) => {
		const text = inlineHtml(item.lines.filter((l) => l !== ""));
		if (!item.child) return `${indent}${unit}<li>${text}</li>`;
		return `${indent}${unit}<li>${text}\n${listHtml(item.child, indent + unit + unit, unit)}\n${indent}${unit}</li>`;
	});
	return `${indent}<${tag}>\n${items.join("\n")}\n${indent}</${tag}>`;
}

/**
 * 素の文字を、aside の中の HTML にする。空なら null（aside ごと取り除く）。
 * 1 段落で箇条書きもなければ <p> で包まず 1 行に書く（パターンのひな形と同じ形）。
 * それ以外は、aside の行の字下げ（indent）から 1 段ずつ下げて、1 つずつ行に書く
 */
export function textToNotes(text: string, indent = "", unit = "  "): string | null {
	const blocks = parseBlocks(text);
	if (blocks.length === 0) return null;
	const only = blocks[0] as Block;
	if (blocks.length === 1 && only.kind === "p") return inlineHtml(only.lines);
	const inner = blocks.map((b) => (b.kind === "p" ? `${indent}${unit}<p>${inlineHtml(b.lines)}</p>` : listHtml(b.list, indent + unit, unit)));
	return `\n${inner.join("\n")}\n${indent}`;
}

// ---- deck.html の中の位置

export interface NotesSpan {
	/** `<aside` の位置 */
	start: number;
	/** 開始タグの直後 */
	innerStart: number;
	/** `</aside>` の位置 */
	innerEnd: number;
	/** `</aside>` の直後 */
	end: number;
}

export interface SectionSpan {
	/** `<section` の位置 */
	start: number;
	/** 開始タグの直後 */
	innerStart: number;
	/** `</section>` の位置 */
	innerEnd: number;
	/** ノート（なければ空）。2 つ以上あれば、ビルドの notes-format が止める */
	notes: NotesSpan[];
}

const TAG = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
const RAW_TEXT = new Set(["script", "style", "title", "textarea"]);
const CLASS_ATTR = /(?:^|\s)class\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i;

function hasNotesClass(attrs: string): boolean {
	const m = CLASS_ATTR.exec(attrs);
	const value = m ? (m[1] ?? m[2] ?? m[3] ?? "") : "";
	return value.split(/\s+/).includes(NOTES_CLASS);
}

/** deck.html の、上の階層の <section> と、その中の <aside class="notes"> の位置を、出てくる順に返す */
export function sectionSpans(source: string): SectionSpan[] {
	const spans: SectionSpan[] = [];
	let section: { start: number; innerStart: number; depth: number; notes: NotesSpan[] } | null = null;
	let aside: { start: number; innerStart: number; depth: number } | null = null;
	let asideDepth = 0;
	const re = new RegExp(TAG.source, "g");
	for (let m = re.exec(source); m !== null; m = re.exec(source)) {
		const name = m[2]?.toLowerCase();
		if (name === undefined) continue;
		const closing = m[1] === "/";
		const end = m.index + m[0].length;
		if (!closing && RAW_TEXT.has(name)) {
			const close = source.toLowerCase().indexOf(`</${name}`, end);
			if (close === -1) break;
			re.lastIndex = close;
			continue;
		}
		if (name === "section") {
			if (!closing) {
				if (section === null) section = { start: m.index, innerStart: end, depth: 1, notes: [] };
				else section.depth++;
			} else if (section !== null && --section.depth === 0) {
				spans.push({ start: section.start, innerStart: section.innerStart, innerEnd: m.index, notes: section.notes });
				section = null;
				aside = null;
				asideDepth = 0;
			}
			continue;
		}
		if (name === "aside" && section !== null) {
			if (!closing) {
				asideDepth++;
				if (aside === null && hasNotesClass(m[3] ?? "")) aside = { start: m.index, innerStart: end, depth: asideDepth };
			} else {
				if (aside !== null && asideDepth === aside.depth) {
					section.notes.push({ start: aside.start, innerStart: aside.innerStart, innerEnd: m.index, end });
					aside = null;
				}
				asideDepth = Math.max(0, asideDepth - 1);
			}
		}
	}
	return spans;
}

/** 位置の行の字下げ（行頭からその位置までが空白だけなら、その空白。でなければ null） */
function indentAt(source: string, index: number): string | null {
	const lineStart = source.lastIndexOf("\n", index - 1) + 1;
	const before = source.slice(lineStart, index);
	return /^[ \t]*$/.test(before) ? before : null;
}

/** スライドの中の最初の行の字下げ（中の要素の字下げ）。1 行で書いたスライドなら null */
function childIndent(source: string, span: SectionSpan): string | null {
	const inner = source.slice(span.innerStart, span.innerEnd);
	const m = /\n([ \t]*)\S/.exec(inner);
	return m ? (m[1] ?? "") : null;
}

function indentUnit(source: string): string {
	const m = /\n(\t+|[ ]+)</.exec(source);
	return m?.[1]?.startsWith("\t") ? "\t" : "  ";
}

/**
 * n 枚目（1 始まり）のスライドのノートを、素の文字 text に書き換えたソースを返す。
 * ノートの中（なければ足す・空なら取り除く）だけを変え、ほかの部分は変えない。
 * スライドがない、ノートが 2 つ以上あるときは null
 */
export function replaceNotes(source: string, n: number, text: string): string | null {
	const spans = sectionSpans(source);
	const span = spans[n - 1];
	if (!span || span.notes.length > 1) return null;
	const unit = indentUnit(source);
	const current = span.notes[0];
	if (current) {
		const indent = indentAt(source, current.start) ?? "";
		const inner = textToNotes(text, indent, unit);
		if (inner !== null) return source.slice(0, current.innerStart) + inner + source.slice(current.innerEnd);
		// 空にしたら aside ごと取り除く。行に aside だけがあれば、その行ごと取り除く
		const lineStart = source.lastIndexOf("\n", current.start - 1) + 1;
		const nextBreak = source.indexOf("\n", current.end);
		const lineEnd = nextBreak === -1 ? source.length : nextBreak;
		const aloneOnLine = /^[ \t]*$/.test(source.slice(lineStart, current.start)) && /^[ \t]*$/.test(source.slice(current.end, lineEnd));
		if (aloneOnLine && lineStart > 0) return source.slice(0, lineStart - 1) + source.slice(lineEnd);
		return source.slice(0, current.start) + source.slice(current.end);
	}
	const child = childIndent(source, span);
	const closeIndent = indentAt(source, span.innerEnd);
	if (child === null || closeIndent === null) {
		// 1 行で書いたスライド: </section> の直前に 1 行で足す（中の改行は使わない）
		const inner = textToNotes(text, "", "");
		if (inner === null) return source;
		const flat = inner.replace(/\n/g, "");
		return `${source.slice(0, span.innerEnd)}<aside class="notes">${flat}</aside>${source.slice(span.innerEnd)}`;
	}
	const inner = textToNotes(text, child, unit);
	if (inner === null) return source;
	const lineStart = span.innerEnd - closeIndent.length;
	return `${source.slice(0, lineStart)}${child}<aside class="notes">${inner}</aside>\n${source.slice(lineStart)}`;
}
