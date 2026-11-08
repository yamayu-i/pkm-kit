/**
 * スニペット（ADR-0060）。行頭の `/` で本文の途中に挿入する断片。
 * インラインテンプレート（ADR-0067）も同じ書式で、行頭か半角空白の後の `@` で行の中に挿入する
 */

/** その Vault のスニペット（子のもの。同じファイル名なら上流を上書きする） */
export const SNIPPET_DIR = "template/snippet";
/** 上流（pkm-kit）の既定のスニペット。隠しパスなので Vault の索引には載らない */
export const UPSTREAM_SNIPPET_DIR = ".kit/templates/snippet";

/** その Vault のインラインテンプレート（ADR-0067） */
export const INLINE_DIR = "template/inline";
/** 上流の既定のインラインテンプレート */
export const UPSTREAM_INLINE_DIR = ".kit/templates/inline";

export interface Snippet {
	/** スニペットのフォルダ直下のファイル名 */
	file: string;
	name: string;
	alias: string;
	/** frontmatter を閉じる `---` の行の直後から終わりまで。改行も含めてそのまま挿入する */
	body: string;
	/**
	 * 選んだときに実行する Obsidian のコマンドの ID（ADR-0094）。あれば本文は挿入せず、
	 * 打った `/…` を消してからこのコマンドを実行する
	 */
	command?: string;
}

const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Obsidian のコマンドの ID（`<プラグイン ID>:<コマンド>`） */
const COMMAND_RE = /^[a-z0-9-]+:[A-Za-z0-9_-]+$/;

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
	const command = fields.command;
	if (command !== undefined && !COMMAND_RE.test(command)) {
		return fail(`command は <プラグイン ID>:<コマンド> の形にします（${command}）`);
	}
	const snippet: Snippet = { file, name: fields.name!, alias: fields.alias!, body };
	if (command !== undefined) snippet.command = command;
	return { snippet, problem: null };
}

/** command のあるものを除く。インラインテンプレートでは command を使わない（ADR-0094） */
export function withoutCommands(snippets: readonly Snippet[]): Snippet[] {
	return snippets.filter((s) => s.command === undefined);
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

/**
 * インラインテンプレートとして挿入する本文。行の中に入れるので、ファイルの終わりの改行は削る
 * （途中の改行はそのまま）
 */
export function inlineBody(body: string): string {
	return body.replace(/(?:\r?\n)+$/, "");
}

/** 打った `/`（または `@`）から続く入力。from はその文字の位置 */
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
	/** 入力（タイプ）できっかけの文字（`/` か `@`）を 1 文字だけ挿入したとき、その位置（変更のあと）。それ以外は null */
	typedAt: number | null;
	/** 変更の前の位置を、変更のあとの位置に写す */
	mapPos(pos: number): number;
	/** 主カーソルの位置と、選択が空か */
	head: number;
	empty: boolean;
}

/** きっかけの文字と、その文字で始めてよい位置 */
export interface SessionTrigger {
	char: string;
	/** pos にきっかけの文字があるとき、そこで始めてよいか（続いているあいだも毎回確かめる） */
	canStartAt(pos: number, doc: SessionDoc): boolean;
}

/** スニペット: 行頭の `/`（ADR-0060） */
export const SLASH_TRIGGER: SessionTrigger = {
	char: "/",
	canStartAt: (pos, doc) => doc.lineStartAt(pos) === pos,
};

/** インラインテンプレート: 行頭か、半角空白の直後の `@`（ADR-0067） */
export const AT_TRIGGER: SessionTrigger = {
	char: "@",
	canStartAt: (pos, doc) => doc.lineStartAt(pos) === pos || doc.slice(pos - 1, pos) === " ",
};

const QUERY_TAIL_RE = /^[A-Za-z0-9-]*$/;

/**
 * 1 回の変更（選択だけの変更も）のあとのセッション。始めてよい位置できっかけの文字を打ったときだけ始まり、
 * カーソルの前がその文字とケバブケースの文字だけ（同じ行）のあいだ続く。一度終わったら、同じ文字では始まらない
 */
export function nextTriggerSession(
	trigger: SessionTrigger,
	prev: SlashSession | null,
	update: SessionUpdate,
	doc: SessionDoc,
	newId: () => number,
): SlashSession | null {
	let candidate: SlashSession | null = null;
	const typed = update.typedAt;
	if (typed !== null && trigger.canStartAt(typed, doc)) candidate = { id: newId(), from: typed };
	else if (prev) candidate = { id: prev.id, from: update.mapPos(prev.from) };
	if (!candidate) return null;

	const { from } = candidate;
	const { head } = update;
	if (!update.empty || head <= from) return null;
	if (!trigger.canStartAt(from, doc) || doc.lineStartAt(head) !== doc.lineStartAt(from)) return null;
	const typedText = doc.slice(from, head);
	if (!typedText.startsWith(trigger.char) || !QUERY_TAIL_RE.test(typedText.slice(trigger.char.length))) return null;
	return candidate;
}

/** 行頭で打った `/` のセッション（ADR-0060） */
export function nextSlashSession(
	prev: SlashSession | null,
	update: SessionUpdate,
	doc: SessionDoc,
	newId: () => number,
): SlashSession | null {
	return nextTriggerSession(SLASH_TRIGGER, prev, update, doc, newId);
}
