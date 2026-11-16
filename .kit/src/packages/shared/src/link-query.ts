/**
 * @ で開く検索ダイアログの、検索語の解釈・並べ方・取得の上限と、Markdown リンクの読み書き（ADR-0194）。
 * Obsidian に依存しない
 */

/** 一度に出す件数。残りは「Load more」で足す */
export const PAGE_SIZE = 50;

export interface LinkQuery {
	/** 絞り込みと ID を除いた検索語（小文字）。空白で区切った語 */
	words: string[];
	/** 数字だけ（か `i-12` の形）のとき、その数字。ID で探す */
	number: string | null;
	/** `キー:値`（カンマで複数）。キーは keys に挙げたものだけ */
	filters: Record<string, string[]>;
}

/**
 * 入力を語に分ける。`キー:値` の語は絞り込み、それ以外は検索語。
 * 検索語が 1 語で、数字だけか `<prefix>-<数字>` なら ID で探す
 */
export function parseLinkQuery(input: string, keys: readonly string[] = [], idPrefix = ""): LinkQuery {
	const words: string[] = [];
	const filters: Record<string, string[]> = {};
	for (const token of input.trim().split(/\s+/)) {
		if (token === "") continue;
		const m = /^([a-z]+):(.*)$/.exec(token);
		if (m && keys.includes(m[1]!)) {
			const values = m[2]!.split(",").map((v) => v.trim().toLowerCase()).filter((v) => v !== "");
			filters[m[1]!] = [...(filters[m[1]!] ?? []), ...values];
			continue;
		}
		words.push(token.toLowerCase());
	}
	let number: string | null = null;
	if (words.length === 1) {
		const w = words[0]!;
		const re = idPrefix ? new RegExp(`^(?:${idPrefix}-)?(\\d+)$`) : /^(\d+)$/;
		const m = re.exec(w);
		if (m) number = m[1]!;
	}
	return { words: number === null ? words : [], number, filters };
}

/**
 * 検索語との一致の度合い。すべての語をどこかに含めば一致。最初の語で先頭から始まるものを 0、ほかを 1。一致しなければ null。
 * 語がなければ 1（並びは別の基準に任せる）
 */
export function matchRank(haystacks: readonly string[], words: readonly string[]): number | null {
	if (words.length === 0) return 1;
	const hs = haystacks.map((h) => h.toLowerCase());
	for (const w of words) if (!hs.some((h) => h.includes(w))) return null;
	return hs.some((h) => h.startsWith(words[0]!)) ? 0 : 1;
}

/** ID の数字が、打った数字で始まるか。同じ数なら 0、始まるだけなら 1、違えば null */
export function idRank(id: string, number: string): number | null {
	const m = /(\d+)$/.exec(id);
	if (!m) return null;
	if (m[1] === number) return 0;
	return m[1]!.startsWith(number) ? 1 : null;
}

/**
 * 検索語（数字なら ID）で絞り、並べる。並びは一致の度合い → recency の大きい順（新しい順）→ 元の順
 */
export function searchItems<T>(
	items: readonly T[],
	query: LinkQuery,
	opts: { haystacks(item: T): string[]; id?(item: T): string; recency?(item: T): number },
): T[] {
	const ranked: { item: T; rank: number; recency: number; index: number }[] = [];
	items.forEach((item, index) => {
		const rank = query.number !== null ? (opts.id ? idRank(opts.id(item), query.number) : null) : matchRank(opts.haystacks(item), query.words);
		if (rank === null) return;
		ranked.push({ item, rank, recency: opts.recency?.(item) ?? 0, index });
	});
	ranked.sort((a, b) => a.rank - b.rank || b.recency - a.recency || a.index - b.index);
	return ranked.map((r) => r.item);
}

/** 先頭の shown 件と、残りの件数 */
export function pageOf<T>(items: readonly T[], shown: number): { items: T[]; rest: number } {
	return { items: items.slice(0, shown), rest: Math.max(0, items.length - shown) };
}

// ---------- Markdown リンク ----------

/** リンクの文字で特別な意味を持つ文字を `\` で退避する */
export function escapeLinkText(text: string): string {
	return text.replace(/([\\[\]])/g, "\\$1");
}

/** リンク先を壊す文字（空白・括弧・<>・%）だけをエンコードする。`/` と日本語はそのまま */
export function encodeLinkPath(path: string): string {
	return path.replace(/[ ()<>%]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);
}

/** `[text](path#anchor)` を作る */
export function markdownLink(text: string, path: string, anchor?: string): string {
	return `[${escapeLinkText(text)}](${encodeLinkPath(path)}${anchor ? `#${encodeLinkPath(anchor)}` : ""})`;
}

export interface FoundLink {
	/** `[` の位置（文書の中の offset） */
	from: number;
	/** `)` の次の位置 */
	to: number;
	/** リンクの文字（退避を戻したもの） */
	text: string;
	/** リンク先（デコードしたパス。アンカーを除く） */
	path: string;
	/** `#` の後ろ（デコードしたもの）。なければ空 */
	anchor: string;
}

/** リンク先を、デコードしたパスとアンカーに分ける。外部（`https:` など）と、文書の中のアンカーだけのものは null */
export function splitLinkTarget(target: string): { path: string; anchor: string } | null {
	const t = target.trim().replace(/^<(.*)>$/, "$1");
	if (t === "" || t.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(t)) return null;
	const hash = t.indexOf("#");
	const rawPath = hash < 0 ? t : t.slice(0, hash);
	const rawAnchor = hash < 0 ? "" : t.slice(hash + 1);
	const decode = (s: string) => {
		try {
			return decodeURIComponent(s);
		} catch {
			return s;
		}
	};
	return { path: decode(rawPath), anchor: decode(rawAnchor) };
}

const LINK_RE = /(!?)\[((?:\\.|[^\]\\\n])*)\]\(([^()\s]+|<[^>\n]+>)\)/g;

/**
 * 文書の中の Markdown リンク（埋め込み `![…]` を除く）。frontmatter・フェンスのコード・インラインコードの中は見ない。
 * from / to で範囲を絞ると、その行だけを見る（フェンスの状態は先頭から数える）
 */
export function findMarkdownLinks(doc: string, range?: { from: number; to: number }): FoundLink[] {
	const found: FoundLink[] = [];
	let offset = 0;
	let fence: string | null = null;
	let lineNo = 0;
	let inFrontmatter = false;
	for (const line of doc.split("\n")) {
		const start = offset;
		offset += line.length + 1;
		if (lineNo === 0 && line.trim() === "---") {
			inFrontmatter = true;
			lineNo++;
			continue;
		}
		lineNo++;
		if (inFrontmatter) {
			if (/^(---|\.\.\.)\s*$/.test(line)) inFrontmatter = false;
			continue;
		}
		const f = /^\s*(`{3,}|~{3,})/.exec(line);
		if (fence !== null) {
			if (f && f[1]![0] === fence[0] && f[1]!.length >= fence.length && line.trim() === f[1]) fence = null;
			continue;
		}
		if (f) {
			fence = f[1]!;
			continue;
		}
		if (range && (offset <= range.from || start > range.to)) continue;
		// インラインコードは同じ長さの空白にして、位置を保ったまま見えなくする
		const masked = line.replace(/(`+)[^`]*?\1/g, (m) => " ".repeat(m.length));
		for (const m of masked.matchAll(LINK_RE)) {
			if (m[1] === "!") continue;
			const target = splitLinkTarget(m[3]!);
			if (!target) continue;
			const from = start + m.index!;
			found.push({ from, to: from + m[0].length, text: m[2]!.replace(/\\(.)/g, "$1"), ...target });
		}
	}
	return found;
}
