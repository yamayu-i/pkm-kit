/**
 * md / html の中の図の参照を、共有用の SVG の data URI に置き換える（ADR-0064）。
 * 置き換えるのは参照の範囲だけで、ほかの本文は変えない。コード・HTML のコメント・エスケープした記述は対象外。
 * DOM にも Obsidian にも Node にも依存しない（Obsidian のコマンドと CLI が同じものを使う）
 */
import { candidatePaths } from "../../../pkm-html/src/core/policy.ts";
import { decodeDataUri, SVG_MIME, svgDataUri, utf8 } from "./encoding.ts";
import { DrawioFormatError, extractDiagramXml, findSvgProblems, isDiagramSvgPath, isDrawioSvgPath, parseRootSvg, toSharingSvg } from "./svg.ts";

export type DocumentKind = "markdown" | "html";

export function documentKind(path: string): DocumentKind | null {
	const ext = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
	if (ext === "md" || ext === "markdown") return "markdown";
	if (ext === "html" || ext === "htm") return "html";
	return null;
}

export interface Reference {
	/** 置き換える範囲（URL の部分だけ。引用符や <> は含めない） */
	start: number;
	end: number;
	/** 書かれたままの URL */
	url: string;
	/** md の ![]() か、<img src> か */
	syntax: "markdown" | "html";
}

type Range = readonly [number, number];

/** md のうち、参照を探さない範囲（フェンスのコードブロック、インラインのコード、HTML のコメント） */
export function markdownSkipRanges(text: string): Range[] {
	const ranges: Range[] = [];
	// フェンスのコードブロック（行単位）
	let offset = 0;
	let fence: { char: string; len: number; start: number } | null = null;
	const prose: Range[] = [];
	let proseStart = 0;
	for (const line of text.split(/(?<=\n)/)) {
		const body = line.replace(/\r?\n$/, "");
		// 引用（>）とリストの字下げの中のフェンスも拾うため、先頭の > と空白を除いて見る
		const stripped = body.replace(/^(?:\s*>)*\s*(?:(?:[-*+]|\d{1,9}[.)])\s+)?/, "");
		if (fence) {
			const close = new RegExp(`^${fence.char === "`" ? "`" : "~"}{${fence.len},}\\s*$`);
			if (close.test(stripped)) {
				ranges.push([fence.start, offset + line.length]);
				fence = null;
				proseStart = offset + line.length;
			}
		} else {
			const open = /^(`{3,}|~{3,})(.*)$/.exec(stripped);
			if (open && !(open[1]?.startsWith("`") && open[2]?.includes("`"))) {
				prose.push([proseStart, offset]);
				fence = { char: (open[1] as string)[0] as string, len: (open[1] as string).length, start: offset };
			}
		}
		offset += line.length;
	}
	if (fence) ranges.push([fence.start, text.length]);
	else prose.push([proseStart, text.length]);

	// フェンスの外: HTML のコメントとインラインのコード
	for (const [from, to] of prose) {
		let i = from;
		while (i < to) {
			const ch = text[i];
			if (ch === "\\") {
				i += 2;
				continue;
			}
			if (text.startsWith("<!--", i)) {
				const end = text.indexOf("-->", i + 4);
				const stop = end < 0 || end + 3 > to ? to : end + 3;
				ranges.push([i, stop]);
				i = stop;
				continue;
			}
			if (ch === "`") {
				let n = 0;
				while (text[i + n] === "`") n++;
				let j = i + n;
				let found = -1;
				while (j < to) {
					const k = text.indexOf("`", j);
					if (k < 0 || k >= to) break;
					let m = 0;
					while (text[k + m] === "`") m++;
					if (m === n) {
						found = k;
						break;
					}
					j = k + m;
				}
				if (found >= 0) {
					ranges.push([i, found + n]);
					i = found + n;
				} else {
					i += n;
				}
				continue;
			}
			i++;
		}
	}
	return ranges.sort((a, b) => a[0] - b[0]);
}

function inRanges(ranges: readonly Range[], pos: number): boolean {
	return ranges.some(([a, b]) => pos >= a && pos < b);
}

function isEscaped(text: string, pos: number): boolean {
	let n = 0;
	for (let i = pos - 1; i >= 0 && text[i] === "\\"; i--) n++;
	return n % 2 === 1;
}

/** pos の `![` から始まる md の画像を読む。読めなければ null */
function readMarkdownImage(text: string, pos: number): Reference | null {
	let i = pos + 2;
	let depth = 0;
	for (; i < text.length; i++) {
		const ch = text[i];
		if (ch === "\\") {
			i++;
			continue;
		}
		if (ch === "\n" && text[i + 1] === "\n") return null;
		if (ch === "[") depth++;
		else if (ch === "]") {
			if (depth === 0) break;
			depth--;
		}
	}
	if (text[i] !== "]" || text[i + 1] !== "(") return null;
	i += 2;
	while (text[i] === " " || text[i] === "\t" || text[i] === "\n") i++;
	let start: number;
	let end: number;
	if (text[i] === "<") {
		start = i + 1;
		const close = text.indexOf(">", start);
		if (close < 0 || text.slice(start, close).includes("\n")) return null;
		end = close;
		i = close + 1;
	} else {
		start = i;
		let parens = 0;
		for (; i < text.length; i++) {
			const ch = text[i] as string;
			if (ch === "\\") {
				i++;
				continue;
			}
			if (/\s/.test(ch)) break;
			if (ch === "(") parens++;
			else if (ch === ")") {
				if (parens === 0) break;
				parens--;
			}
		}
		end = i;
		if (end === start) return null;
	}
	// タイトル（任意）と閉じかっこ
	while (text[i] === " " || text[i] === "\t" || text[i] === "\n") i++;
	const q = text[i];
	if (q === '"' || q === "'" || q === "(") {
		const closeQ = q === "(" ? ")" : q;
		const close = text.indexOf(closeQ, i + 1);
		if (close < 0) return null;
		i = close + 1;
		while (text[i] === " " || text[i] === "\t" || text[i] === "\n") i++;
	}
	if (text[i] !== ")") return null;
	return { start, end, url: text.slice(start, end), syntax: "markdown" };
}

/** <img> の src。範囲は値の部分だけ */
function readImgSrc(text: string, tagStart: number, tagEnd: number): Reference | null {
	const tag = text.slice(tagStart, tagEnd);
	const m = /\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(tag);
	if (!m) return null;
	const value = m[1] ?? m[2] ?? m[3] ?? "";
	const valueOffset = m.index + m[0].length - value.length - (m[3] === undefined ? 1 : 0);
	const start = tagStart + valueOffset;
	return { start, end: start + value.length, url: value, syntax: "html" };
}

function findImgTags(text: string, skip: readonly Range[]): Reference[] {
	const refs: Reference[] = [];
	for (const m of text.matchAll(/<img\b[^>]*>/gi)) {
		if (inRanges(skip, m.index)) continue;
		const ref = readImgSrc(text, m.index, m.index + m[0].length);
		if (ref) refs.push(ref);
	}
	return refs;
}

/** 文書の中の画像の参照（図かどうかを問わない） */
export function findImageReferences(text: string, kind: DocumentKind): Reference[] {
	if (kind === "html") {
		const skip: Range[] = [];
		for (const m of text.matchAll(/<!--[\s\S]*?(?:-->|$)/g)) skip.push([m.index, m.index + m[0].length]);
		for (const m of text.matchAll(/<(script|style|template|textarea)\b[\s\S]*?(?:<\/\1\s*>|$)/gi)) skip.push([m.index, m.index + m[0].length]);
		return findImgTags(text, skip);
	}
	const skip = markdownSkipRanges(text);
	const refs: Reference[] = [];
	for (let pos = text.indexOf("!["); pos >= 0; pos = text.indexOf("![", pos + 1)) {
		if (inRanges(skip, pos) || isEscaped(text, pos)) continue;
		const ref = readMarkdownImage(text, pos);
		if (ref) refs.push(ref);
	}
	refs.push(...findImgTags(text, skip));
	return refs.sort((a, b) => a.start - b.start);
}

/** HTML の属性の値の実体参照（よく使うものだけ）を戻す。md の URL のバックスラッシュのエスケープも戻す */
function unescapeUrl(ref: Reference): string {
	if (ref.syntax === "markdown") return ref.url.replace(/\\([!-/:-@[-`{-~])/g, "$1");
	return ref.url.replace(/&(amp|lt|gt|quot|apos|#39);/g, (_, e: string) => ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" })[e] ?? "");
}

/** 参照が図を指すなら、試す Vault の中のパス。md は Vault ルートから（ノートの規約）。html はファイルからの相対、なければルート（pkm-html と同じ） */
export function drawioCandidates(sourcePath: string, ref: Reference, kind: DocumentKind): string[] {
	const url = unescapeUrl(ref);
	const candidates = kind === "markdown" && ref.syntax === "markdown" ? candidatePaths("", url) : candidatePaths(sourcePath, url);
	return candidates.filter(isDiagramSvgPath);
}

export interface EmbedOptions {
	sourcePath: string;
	kind: DocumentKind;
	/** Vault の中のパスの中身。なければ null */
	readText(path: string): Promise<string | null>;
}

export interface EmbedResult {
	text: string;
	/** 置き換えた図（重複なし） */
	diagrams: string[];
	/** 1 つでもあれば、書き出さない */
	errors: string[];
	warnings: string[];
}

/** 文書の中の図の参照を、共有用の SVG の data URI に置き換える */
export async function embedDiagrams(text: string, options: EmbedOptions): Promise<EmbedResult> {
	const errors: string[] = [];
	const warnings: string[] = [];
	const raw = new Map<string, string | null>();
	const uris = new Map<string, string | null>();
	const replacements: Array<{ ref: Reference; uri: string }> = [];

	const read = async (path: string): Promise<string | null> => {
		if (!raw.has(path)) raw.set(path, await options.readText(path));
		return raw.get(path) ?? null;
	};
	const toUri = (path: string, svg: string): string | null => {
		if (uris.has(path)) return uris.get(path) ?? null;
		let uri: string | null = null;
		try {
			if (isDrawioSvgPath(path) && extractDiagramXml(svg).kind === "plain-svg") warnings.push(`${path}: 編集用 XML がない（普通の SVG として埋め込む）`);
			const sharing = toSharingSvg(svg);
			const problems = findSvgProblems(sharing);
			for (const p of problems.errors) errors.push(`${path}: ${p}がある`);
			for (const p of problems.warnings) warnings.push(`${path}: ${p}がある（書き出した先では表示されない）`);
			if (problems.errors.length === 0) uri = svgDataUri(sharing);
		} catch (e) {
			errors.push(`${path}: ${e instanceof DrawioFormatError ? e.message : String(e)}`);
		}
		uris.set(path, uri);
		return uri;
	};

	for (const ref of findImageReferences(text, options.kind)) {
		const candidates = drawioCandidates(options.sourcePath, ref, options.kind);
		if (candidates.length === 0) continue;
		let found = false;
		for (const path of candidates) {
			const svg = await read(path);
			if (svg === null) continue;
			found = true;
			const uri = toUri(path, svg);
			if (uri) replacements.push({ ref, uri });
			break;
		}
		if (!found) errors.push(`${ref.url}: 図のファイルが見つからない`);
	}

	let out = text;
	for (const { ref, uri } of [...replacements].sort((a, b) => b.ref.start - a.ref.start)) {
		out = out.slice(0, ref.start) + uri + out.slice(ref.end);
	}
	const diagrams = [...uris.entries()].filter(([, v]) => v !== null).map(([k]) => k);
	return { text: out, diagrams, errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}

/**
 * 書き出した文書の検査。図のファイルを指す参照が残っていないか、埋め込んだ SVG に編集用 XML が残っていないか
 */
export function checkExported(text: string, kind: DocumentKind, sourcePath = ""): string[] {
	const problems: string[] = [];
	for (const ref of findImageReferences(text, kind)) {
		if (drawioCandidates(sourcePath, ref, kind).length > 0) {
			problems.push(`図のファイルへの参照が残っている: ${ref.url}`);
			continue;
		}
		if (!ref.url.toLowerCase().startsWith(`data:${SVG_MIME}`)) continue;
		const decoded = decodeDataUri(ref.url);
		const svg = decoded ? utf8(decoded.bytes) : null;
		if (svg === null) {
			problems.push("SVG の data URI を読めない");
			continue;
		}
		try {
			if (parseRootSvg(svg).attributes.some((a) => a.name === "content")) problems.push("埋め込んだ SVG に編集用 XML が残っている");
		} catch (e) {
			problems.push(`埋め込んだ SVG を読めない（${e instanceof Error ? e.message : String(e)}）`);
		}
	}
	return problems;
}
