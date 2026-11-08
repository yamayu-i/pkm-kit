/** スニペット（ADR-0060）。行頭の `/` で本文の途中に挿入する断片 */

/** その Vault のスニペット（子のもの。同じファイル名なら上流を上書きする） */
export const SNIPPET_DIR = "template/snippet";
/** 上流（pkm-kit）の既定のスニペット。隠しパスなので Vault の索引には載らない */
export const UPSTREAM_SNIPPET_DIR = ".kit/templates/snippet";

export interface Snippet {
	/** スニペットのフォルダ直下のファイル名 */
	file: string;
	name: string;
	alias: string;
	/** frontmatter を閉じる `---` の行の直後から終わりまで。改行も含めてそのまま挿入する */
	body: string;
}

const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function unquote(value: string): string {
	const v = value.trim();
	if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1);
	if (v.length >= 2 && v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/''/g, "'");
	return v;
}

/** スニペットのファイルを読む。name と alias はケバブケースの必須項目 */
export function parseSnippet(file: string, text: string): { snippet: Snippet | null; problem: string | null } {
	const fail = (problem: string) => ({ snippet: null, problem: `${file}: ${problem}` });
	const open = /^---\r?\n/.exec(text);
	if (!open) return fail("frontmatter がありません");
	const close = /^---[ \t]*(?:\r?\n|$)/m;
	const rest = text.slice(open[0].length);
	const m = close.exec(rest);
	if (!m) return fail("frontmatter が閉じていません");
	const fm = rest.slice(0, m.index);
	const body = rest.slice(m.index + m[0].length);

	const fields: Record<string, string> = {};
	for (const line of fm.split(/\r?\n/)) {
		const kv = /^([A-Za-z_][\w-]*):(.*)$/.exec(line);
		if (kv) fields[kv[1]!] = unquote(kv[2]!);
	}
	for (const key of ["name", "alias"] as const) {
		const v = fields[key];
		if (v === undefined || v === "") return fail(`${key} がありません`);
		if (!KEBAB_RE.test(v)) return fail(`${key} はケバブケースにします（${v}）`);
	}
	return { snippet: { file, name: fields.name!, alias: fields.alias!, body }, problem: null };
}

/** 上流の既定に、その Vault のものを重ねる。同じファイル名ならその Vault のものを使う */
export function layerSnippets(upstream: readonly Snippet[], local: readonly Snippet[]): Snippet[] {
	const byFile = new Map<string, Snippet>();
	for (const s of upstream) byFile.set(s.file, s);
	for (const s of local) byFile.set(s.file, s);
	return [...byFile.values()];
}

/** name か alias の前方一致（大文字小文字を区別しない）。alias の順に並べる */
export function filterSnippets(snippets: readonly Snippet[], query: string): Snippet[] {
	const q = query.toLowerCase();
	return snippets
		.filter((s) => s.name.startsWith(q) || s.alias.startsWith(q))
		.sort((a, b) => a.alias.localeCompare(b.alias) || a.name.localeCompare(b.name));
}

/** 行頭に打った `/` から続く入力。from は `/` の位置 */
export interface SlashSession {
	id: number;
	from: number;
}

/** 判定に使う文書（変更のあと） */
export interface SessionDoc {
	/** pos を含む行の先頭の位置 */
	lineStartAt(pos: number): number;
	slice(from: number, to: number): string;
}

export interface SessionUpdate {
	/** 入力（タイプ）で `/` を 1 文字だけ挿入したとき、その位置（変更のあと）。それ以外は null */
	typedSlashAt: number | null;
	/** 変更の前の位置を、変更のあとの位置に写す */
	mapPos(pos: number): number;
	/** 主カーソルの位置と、選択が空か */
	head: number;
	empty: boolean;
}

const QUERY_RE = /^\/[A-Za-z0-9-]*$/;

/**
 * 1 回の変更（選択だけの変更も）のあとのセッション。行頭で `/` を打ったときだけ始まり、
 * カーソルの前が `/` とケバブケースの文字だけのあいだ続く。一度終わったら、同じ `/` では始まらない
 */
export function nextSlashSession(
	prev: SlashSession | null,
	update: SessionUpdate,
	doc: SessionDoc,
	newId: () => number,
): SlashSession | null {
	let candidate: SlashSession | null = null;
	const typed = update.typedSlashAt;
	if (typed !== null && doc.lineStartAt(typed) === typed) candidate = { id: newId(), from: typed };
	else if (prev) candidate = { id: prev.id, from: update.mapPos(prev.from) };
	if (!candidate) return null;

	const { from } = candidate;
	const { head } = update;
	if (!update.empty || head <= from) return null;
	if (doc.lineStartAt(from) !== from || doc.lineStartAt(head) !== from) return null;
	if (!QUERY_RE.test(doc.slice(from, head))) return null;
	return candidate;
}
