import { ISSUE_BODY_TEMPLATE } from "./issue-file";
import { reopenSubOnPeriod } from "./transition";
import type { LocalDate } from "./dates";
import { isId } from "./ids";
import type { Problem } from "./problem";
import { Reader, STATUSES, type Frontmatter, type Status } from "./schema";

/** サブイシューのブロックの始まり（行頭。ADR-0135） */
export const SUB_ISSUE_MARKER = "<!-- sub-issue";
const BLOCK_END = "-->";

/** YAML の文字列を値にする関数（プラグインは Obsidian の parseYaml、CLI は yaml の parse） */
export type YamlParse = (text: string) => unknown;

/** issue の md の中のサブイシュー（ADR-0135） */
export interface SubIssue {
	/** 親の issue の ID */
	parent: string;
	/** 親の md のパス */
	path: string;
	/** 英小文字と数字の 6 文字。一意なのは同じ親の中だけ */
	id: string;
	/** 合成キー `i-12#k3f9a2` */
	key: string;
	/** 親の中の並び（0 から。md に書いた順） */
	order: number;
	summary: string;
	status: Status;
	delegatedTo: string | null;
	start: LocalDate | null;
	/** 期間の終わり。サブの期限を兼ねる（ADR-0190） */
	end: LocalDate | null;
	/** Calendar: その日にやらなければならない日（ADR-0152）。日付 1 つ */
	scheduled: LocalDate | null;
	/** 分 */
	estimated: number | null;
	/** 同じ親のサブの id */
	dependsOn: string[];
	created: string | null;
	/** 移行で子の issue から変換したときの元の ID */
	migratedFrom: string | null;
	/** `-->` の後ろからのサブの本文（前後の空行は除く） */
	body: string;
}

/** md の中のブロック 1 つ。読めなかったら sub は null で、raw を書き戻す */
export interface SubIssueBlock {
	raw: string;
	sub: SubIssue | null;
}

/** 書き出せない値（ADR-0135「書式」） */
export class SubIssueFormatError extends Error {}

/** サブではなくした項目（ADR-0190） */
export const REMOVED_SUB_KEYS = ["soft_deadline", "deadline"] as const;

const SUB_ID_RE = /^[a-z0-9]{6}$/;
const SUB_ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

export function isSubId(value: unknown): value is string {
	return typeof value === "string" && SUB_ID_RE.test(value);
}

export function subKey(parent: string, id: string): string {
	return `${parent}#${id}`;
}

export function parseSubKey(key: string): { parent: string; id: string } | null {
	const at = key.indexOf("#");
	if (at < 0) return null;
	const parent = key.slice(0, at);
	const id = key.slice(at + 1);
	return isId(parent, "i") && isSubId(id) ? { parent, id } : null;
}

/** 同じ親の既存の id と重ならない id を振る */
export function newSubId(existing: Iterable<string>, random: () => number = Math.random): string {
	const taken = new Set(existing);
	for (;;) {
		let id = "";
		for (let i = 0; i < 6; i++) id += SUB_ID_CHARS[Math.min(SUB_ID_CHARS.length - 1, Math.floor(random() * SUB_ID_CHARS.length))];
		if (!taken.has(id)) return id;
	}
}

const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/;

/** md を、親の部分（frontmatter と親の本文）とサブのブロック（マーカーから次のマーカーの前まで）に分ける */
export function splitSubIssueText(text: string): { head: string; blocks: string[] } {
	const fm = FRONTMATTER_RE.exec(text);
	const from = fm ? fm[0].length : 0;
	const starts: number[] = [];
	let pos = from;
	while (pos <= text.length) {
		if (text.startsWith(SUB_ISSUE_MARKER, pos)) {
			const next = text[pos + SUB_ISSUE_MARKER.length];
			if (next === undefined || next === "\n" || next === "\r" || next === " ") starts.push(pos);
		}
		const nl = text.indexOf("\n", pos);
		if (nl < 0) break;
		pos = nl + 1;
	}
	if (starts.length === 0) return { head: text, blocks: [] };
	const blocks = starts.map((s, i) => text.slice(s, starts[i + 1] ?? text.length));
	return { head: text.slice(0, starts[0]), blocks };
}

function prefixed(problems: Problem[], id: string): Problem[] {
	return problems.map((p) => ({ ...p, message: `サブ ${id}: ${p.message}` }));
}

function parseBlock(path: string, parent: string, raw: string, order: number, parseYaml: YamlParse): { sub: SubIssue | null; problems: Problem[] } {
	const invalid = (message: string) => ({ sub: null, problems: [{ severity: "error" as const, path, code: "invalid-sub-issue", message: `${order + 1} 件目のサブ: ${message}` }] });
	const lines = raw.split(/\r?\n/);
	const endLine = lines.findIndex((l, i) => i > 0 && l.trim() === BLOCK_END);
	if (endLine < 0) return invalid(`閉じの ${BLOCK_END} がありません`);
	const yamlText = [lines[0]!.slice(SUB_ISSUE_MARKER.length), ...lines.slice(1, endLine)].join("\n");
	let fm: unknown;
	try {
		fm = parseYaml(yamlText);
	} catch {
		return invalid("項目が YAML として読めません");
	}
	if (typeof fm !== "object" || fm === null || Array.isArray(fm)) return invalid("項目が YAML として読めません");
	const r = new Reader(path, fm as Frontmatter);
	const id = r.string("id");
	if (!isSubId(id)) return invalid(`id が英小文字と数字の 6 文字ではありません: ${String(id)}`);
	const extra: Problem[] = [];
	const summary = r.string("summary") ?? "";
	if (!summary) extra.push({ severity: "error", path, code: "invalid-sub-issue", message: "summary がありません" });
	const status = r.oneOf("status", STATUSES);
	if (status === null && !r.has("status")) extra.push({ severity: "error", path, code: "invalid-sub-issue", message: "status がありません" });
	const migratedFrom = r.ref("migrated_from", "i");
	// サブの期限は end にまとめた（ADR-0190）。古い項目は読まず、書き換えたときに消える
	const removed = REMOVED_SUB_KEYS.filter((k) => r.has(k));
	if (removed.length > 0) extra.push({ severity: "warning", path, code: "sub-deadline-removed", message: `${removed.join(" と ")} はサブでは使わなくなりました。end にまとめてください（ADR-0190、移行 0190）` });
	const sub: SubIssue = {
		parent,
		path,
		id,
		key: subKey(parent, id),
		order,
		summary,
		status: status ?? "open",
		delegatedTo: r.ref("delegated_to", "m"),
		start: r.date("start"),
		end: r.date("end"),
		scheduled: r.calendarDate("scheduled"),
		estimated: r.minutes("estimated"),
		dependsOn: r.strings("depends_on"),
		created: r.datetime("created"),
		migratedFrom,
		body: lines.slice(endLine + 1).join("\n").replace(/^(?:[ \t]*\r?\n)+/, "").trimEnd(),
	};
	return { sub, problems: prefixed([...extra, ...r.problems], id) };
}

/** issue の md の本文からサブを読む（ADR-0135）。並びは md に書いた順 */
export function parseSubIssues(path: string, parent: string, text: string, parseYaml: YamlParse): { subs: SubIssue[]; blocks: SubIssueBlock[]; problems: Problem[] } {
	const blocks: SubIssueBlock[] = [];
	const problems: Problem[] = [];
	const subs: SubIssue[] = [];
	for (const raw of splitSubIssueText(text).blocks) {
		const r = parseBlock(path, parent, raw, blocks.length, parseYaml);
		blocks.push({ raw: raw.trimEnd(), sub: r.sub });
		problems.push(...r.problems);
		if (r.sub) subs.push(r.sub);
	}
	return { subs, blocks, problems };
}

/** 書き出すサブ（索引で作る値は要らない） */
export type SubIssueInput = Omit<SubIssue, "parent" | "path" | "key" | "order">;

function yamlString(s: string): string {
	return JSON.stringify(s);
}

/** サブ 1 件の項目のブロック（`<!-- sub-issue` から `-->` まで。末尾の改行なし）。書けない値なら SubIssueFormatError */
export function formatSubHead(sub: SubIssueInput): string {
	if (!isSubId(sub.id)) throw new SubIssueFormatError(`id が英小文字と数字の 6 文字ではありません: ${sub.id}`);
	const lines = [SUB_ISSUE_MARKER, `id: ${sub.id}`, `summary: ${yamlString(sub.summary)}`, `status: ${sub.status}`];
	const put = (key: string, value: string | null) => {
		if (value !== null) lines.push(`${key}: ${value}`);
	};
	put("delegated_to", sub.delegatedTo);
	put("start", sub.start);
	put("end", sub.end);
	put("scheduled", sub.scheduled);
	put("estimated", sub.estimated === null ? null : String(sub.estimated));
	if (sub.dependsOn.length > 0) put("depends_on", JSON.stringify(sub.dependsOn));
	put("created", sub.created);
	put("migrated_from", sub.migratedFrom);
	for (const line of lines.slice(1)) {
		if (line.includes(BLOCK_END)) throw new SubIssueFormatError(`サブの項目に ${BLOCK_END} は書けません: ${line}`);
		if (/[\r\n]/.test(line)) throw new SubIssueFormatError(`サブの項目に改行は書けません: ${line}`);
	}
	lines.push(BLOCK_END);
	return lines.join("\n");
}

/** サブ 1 件のブロック（項目は ADR の表の順、空の項目は書かない）。書けない値なら SubIssueFormatError */
export function formatSubIssue(sub: SubIssueInput): string {
	const head = formatSubHead(sub);
	const body = sub.body.replace(/^(?:[ \t]*\r?\n)+/, "").trimEnd();
	if (body.split(/\r?\n/).some((l) => l.startsWith(SUB_ISSUE_MARKER))) {
		throw new SubIssueFormatError(`サブの本文の行頭に ${SUB_ISSUE_MARKER} は書けません`);
	}
	return `${head}\n${body ? `${body}\n${sub.body.endsWith("\n\n") ? "\n" : ""}` : ""}`;
}

/**
 * md のサブの領域を、`blocks` の順に書き直す（並べ替え・追加・削除）。文字列のものは元の文字のまま書く（読めなかったブロック）。
 * 親の部分（frontmatter と親の本文）は変えない
 */
export function replaceSubIssues(text: string, blocks: readonly (SubIssueInput | string)[]): string {
	const { head, blocks: existing } = splitSubIssueText(text);
	if (blocks.length === 0) return existing.length === 0 ? text : `${head.trimEnd()}\n`;
	const parts = blocks.map((b) => (typeof b === "string" ? `${b.trimEnd()}\n` : formatSubIssue(b)));
	return `${head.trimEnd()}\n\n${parts.join("\n")}`;
}

/**
 * 親の本文（サブの領域の前）の末尾に、空行を 1 つ挟んで body を追記する（プリセットの呼び出し。ADR-0186）。
 * 既存の本文とサブのブロックは変えない。body が空なら元のまま
 */
export function appendParentBodyText(text: string, body: string): string {
	const add = body.replace(/^(?:[ \t]*\r?\n)+/, "").trimEnd();
	if (!add) return text;
	if (add.split(/\r?\n/).some((l) => l.startsWith(SUB_ISSUE_MARKER))) throw new SubIssueFormatError(`追記する本文の行頭に ${SUB_ISSUE_MARKER} は書けません`);
	const { head, blocks } = splitSubIssueText(text);
	const base = head.trimEnd();
	// frontmatter だけ（本文が空）なら、frontmatter の直後に 1 行空けて書く
	const nextHead = `${base}${base ? "\n\n" : ""}${add}\n`;
	return blocks.length === 0 ? nextHead : `${nextHead}\n${blocks.join("")}`;
}

/** サブの項目のうち、書き換えられるもの（id と、索引で作る値は変えない） */
export type SubIssuePatch = Partial<Omit<SubIssueInput, "id">>;

/**
 * md の中のサブ 1 件の項目を書き換える。ほかのサブ（読めなかったブロックを含む）と親の部分は変えない。
 * そのサブがなければ例外。書けない値なら SubIssueFormatError
 */
export function updateSubIssueText(
	path: string,
	parent: string,
	text: string,
	id: string,
	patch: SubIssuePatch,
	parseYaml: YamlParse,
): { text: string; before: SubIssue; after: SubIssue } {
	const { blocks } = parseSubIssues(path, parent, text, parseYaml);
	const at = blocks.findIndex((b) => b.sub?.id === id);
	if (at < 0) throw new Error(`サブがありません: ${subKey(parent, id)}`);
	const before = blocks[at]!.sub!;
	const after: SubIssue = { ...before, ...patch, id: before.id };
	const items = blocks.map((b, i) => (i === at ? after : (b.sub ?? b.raw)));
	// 終わったサブは md の末尾へ送る（ADR-0181）
	if (becomesDone(before.status, after.status)) items.push(...items.splice(at, 1));
	return { text: replaceSubIssues(text, items), before, after };
}

/** md のサブを組み替える。読めなかったブロックは元の文字のまま、同じ並びに残す */
function rebuild(path: string, parent: string, text: string, parseYaml: YamlParse, edit: (blocks: (SubIssueInput | string)[], ids: (string | null)[]) => void): string {
	const { blocks } = parseSubIssues(path, parent, text, parseYaml);
	const items: (SubIssueInput | string)[] = blocks.map((b) => b.sub ?? b.raw);
	edit(
		items,
		blocks.map((b) => b.sub?.id ?? null),
	);
	return replaceSubIssues(text, items);
}

function indexOfSub(ids: (string | null)[], parent: string, id: string): number {
	const at = ids.indexOf(id);
	if (at < 0) throw new Error(`サブがありません: ${subKey(parent, id)}`);
	return at;
}

/** サブを足す。at を省くと末尾。位置はブロックの並び（読めなかったブロックを含む）で数える */
export function insertSubIssuesText(path: string, parent: string, text: string, subs: readonly SubIssueInput[], parseYaml: YamlParse, at?: number): string {
	return rebuild(path, parent, text, parseYaml, (items) => {
		const pos = at ?? items.length;
		if (!Number.isInteger(pos) || pos < 0 || pos > items.length) throw new Error(`位置は 0 から ${items.length} までにしてください: ${pos}`);
		items.splice(pos, 0, ...subs);
	});
}

/** サブを to の位置へ移す（ブロックの並びで数える） */
export function moveSubIssueText(path: string, parent: string, text: string, id: string, to: number, parseYaml: YamlParse): string {
	return rebuild(path, parent, text, parseYaml, (items, ids) => {
		const from = indexOfSub(ids, parent, id);
		if (!Number.isInteger(to) || to < 0 || to >= items.length) throw new Error(`位置は 0 から ${items.length - 1} までにしてください: ${to}`);
		const [moved] = items.splice(from, 1);
		items.splice(to, 0, moved!);
	});
}

/** サブを消す（本文ごと） */
export function removeSubIssueText(path: string, parent: string, text: string, id: string, parseYaml: YamlParse): string {
	return rebuild(path, parent, text, parseYaml, (items, ids) => {
		items.splice(indexOfSub(ids, parent, id), 1);
	});
}

/**
 * 書く前の検査（ADR-0135）。同じ親のサブ全体（書いた後の姿）を渡す。問題の文（なければ空）。
 * lint と同じ規則のうち、書く操作で止めるもの: 項目の値、delegated_to、depends_on、id の重なり、書けない値
 */
export function checkSubIssues(subs: readonly SubIssueInput[], memberIds: ReadonlySet<string>): string[] {
	const errors: string[] = [];
	const ids = new Set<string>();
	const byId = new Map(subs.map((s) => [s.id, s]));
	const isDate = (v: unknown) => v === null || (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)));
	for (const s of subs) {
		const where = `サブ ${s.id}`;
		if (ids.has(s.id)) errors.push(`${where}: id が重なっています`);
		ids.add(s.id);
		if (!s.summary.trim()) errors.push(`${where}: summary がありません`);
		if (!(STATUSES as readonly string[]).includes(s.status)) errors.push(`${where}: status は ${STATUSES.join(" / ")} のどれかにしてください: ${s.status}`);
		for (const [key, value] of [
			["start", s.start],
			["end", s.end],
			["scheduled", s.scheduled],
		] as const) {
			if (!isDate(value)) errors.push(`${where}: ${key} が YYYY-MM-DD の日付ではありません: ${String(value)}`);
		}
		if (s.start !== null && s.end !== null && s.end < s.start) errors.push(`${where}: end が start より前です`);
		if (s.estimated !== null && !(typeof s.estimated === "number" && Number.isFinite(s.estimated) && s.estimated >= 0)) errors.push(`${where}: estimated は 0 以上の数（分）にしてください`);
		if (s.status === "delegated" && s.delegatedTo === null) errors.push(`${where}: delegated には delegated_to が要ります`);
		if (s.delegatedTo !== null) {
			if (!memberIds.has(s.delegatedTo)) errors.push(`${where}: delegated_to の ${s.delegatedTo} がありません`);
			if (s.status !== "delegated") errors.push(`${where}: delegated_to は status が delegated のときだけ付けられます`);
		}
		for (const d of s.dependsOn) {
			if (d === s.id) errors.push(`${where}: depends_on に自分自身は入れられません`);
			else if (!byId.has(d)) errors.push(`${where}: depends_on の ${d} が同じ issue の中にありません`);
		}
		try {
			formatSubIssue(s);
		} catch (e) {
			errors.push(`${where}: ${(e as Error).message}`);
		}
	}
	// 循環: depends_on をたどって自分に戻るか
	for (const s of subs) {
		const seen = new Set<string>();
		const stack = s.dependsOn.filter((d) => d !== s.id);
		let cycle = false;
		while (stack.length > 0 && !cycle) {
			const id = stack.pop()!;
			if (id === s.id) cycle = true;
			else if (!seen.has(id)) {
				seen.add(id);
				stack.push(...(byId.get(id)?.dependsOn ?? []));
			}
		}
		if (cycle) errors.push(`サブ ${s.id}: depends_on が循環しています`);
	}
	return errors;
}

/** 作るサブの項目（summary 以外は省略できる） */
export type NewSubIssue = { summary: string } & Partial<Omit<SubIssueInput, "id" | "created" | "migratedFrom">>;

/** 作るサブの既定値を埋める（status は open。ADR-0142） */
export function newSubIssueInput(item: NewSubIssue, id: string, created: string): SubIssueInput {
	return {
		id,
		summary: String(item.summary ?? "").trim(),
		status: item.status ?? "open",
		delegatedTo: item.delegatedTo ?? null,
		start: item.start ?? null,
		end: item.end ?? null,
		scheduled: item.scheduled ?? null,
		estimated: item.estimated ?? null,
		dependsOn: item.dependsOn ?? [],
		created,
		migratedFrom: null,
		body: item.body ?? ISSUE_BODY_TEMPLATE,
	};
}

/** そのサブに依存しているサブ（消す前に確かめる） */
export function dependentsOf(subs: readonly SubIssue[], id: string): string[] {
	return subs.filter((s) => s.dependsOn.includes(id)).map((s) => s.id);
}

/** 終わったサブ（closed / canceled。ADR-0181） */
export const isDone = (s: Pick<SubIssue, "status">) => s.status === "closed" || s.status === "canceled";

/** status の変化が「終わっていない → 終わった」か。このときだけ、サブのブロックを md の末尾へ送る（ADR-0181） */
export function becomesDone(from: Status, to: Status): boolean {
	return !isDone({ status: from }) && isDone({ status: to });
}

/** 一覧に出すサブ（ADR-0142）: closed と canceled は showClosed のときだけ。並びは md の順 */
export function visibleSubs<T extends Pick<SubIssue, "status">>(subs: readonly T[], showClosed: boolean): T[] {
	return showClosed ? [...subs] : subs.filter((s) => !isDone(s));
}

/** 見出しの件数: 未完了 / 全体、と隠している closed の数 */
export function subCounts(subs: readonly Pick<SubIssue, "status">[]): { open: number; total: number; closed: number } {
	const closed = subs.filter(isDone).length;
	return { open: subs.length - closed, total: subs.length, closed };
}

const shortDate = (d: LocalDate) => `${d.slice(5, 7)}/${d.slice(8, 10)}`;

/** Edit ダイアログの保存で書く項目。本文には触れない（本文は下部のカードで直す。ADR-0179） */
export function subItemPatch(draft: SubIssue, estimated: number | null): SubIssuePatch {
	return {
		summary: draft.summary.trim(),
		status: draft.status,
		delegatedTo: draft.delegatedTo,
		start: draft.start,
		end: draft.end,
		scheduled: draft.scheduled,
		estimated,
		dependsOn: draft.dependsOn,
	};
}

/** 行の補足（ADR-0142, 0190）: 期間 → 今日以降の Calendar の日（ADR-0152）。なければ null */
export function subHint(sub: Pick<SubIssue, "start" | "end" | "scheduled">, today: LocalDate): string | null {
	if (sub.start !== null || sub.end !== null) return `${sub.start ? shortDate(sub.start) : ""}–${sub.end ? shortDate(sub.end) : ""}`;
	if (sub.scheduled !== null && sub.scheduled >= today) return shortDate(sub.scheduled);
	return null;
}

/**
 * ドラッグで落としたときの移す先（moveSubIssueText の to）。ids は md のブロックの並び（読めないブロックは null）。
 * before の行の前に置く（null なら末尾）。変わらなければ null
 */
export function dropPosition(ids: readonly (string | null)[], dragged: string, before: string | null): number | null {
	const from = ids.indexOf(dragged);
	if (from < 0) return null;
	const rest = ids.filter((_, i) => i !== from);
	const to = before === null ? rest.length : rest.indexOf(before);
	if (to < 0 || to === from) return null;
	return to;
}

/** Move up / down（dir = -1 / 1）の移す先。出ている隣の行（visible）をまたぐ。端なら null */
export function stepPosition(ids: readonly (string | null)[], visible: readonly string[], id: string, dir: -1 | 1): number | null {
	const at = visible.indexOf(id);
	const neighbor = visible[at + dir];
	if (at < 0 || neighbor === undefined) return null;
	const from = ids.indexOf(id);
	const rest = ids.filter((_, i) => i !== from);
	const n = rest.indexOf(neighbor);
	const to = dir < 0 ? n : n + 1;
	return to === from ? null : to;
}

/** 素早い追加の入力（貼り付けを含む）を、空でない行ごとの題にする */
export function splitQuickAdd(text: string): string[] {
	return text
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter((l) => l !== "");
}

/** md の中のサブ 1 件の、項目と本文の位置（ADR-0161）。文字の位置は 0 から、行は 0 から */
export interface SubLayout {
	index: number;
	/** 読めなかったブロックは null */
	id: string | null;
	/** マーカーの行と、`-->` の行（なければ null） */
	startLine: number;
	endLine: number | null;
	/** 本文の最初の行と、最後の空でない行（本文がなければ bodyEndLine < bodyStartLine） */
	bodyStartLine: number;
	bodyEndLine: number;
	/** 項目の範囲: マーカーの行頭から、`-->` の行の終わり（改行の前）まで。`-->` がなければ cardTo は null */
	from: number;
	cardTo: number | null;
	/** 隠す本文の範囲: `-->` の次の行頭から、最後の空でない行の終わりまで（本文がなければ空）。`-->` がなければ null */
	bodyFrom: number | null;
	bodyTo: number | null;
}

/** md のサブの項目と本文の位置を、md に書いた順に返す。サブがなければ空 */
export function layoutSubIssues(path: string, parent: string, text: string, parseYaml: YamlParse): SubLayout[] {
	const { head, blocks } = splitSubIssueText(text);
	const parsed = parseSubIssues(path, parent, text, parseYaml).blocks;
	const out: SubLayout[] = [];
	let pos = head.length;
	let line = head.split("\n").length - 1;
	blocks.forEach((raw, index) => {
		const lines = raw.split("\n");
		const lineEnd = (i: number) => lines[i]!.replace(/\r$/, "").length;
		const startOf = (i: number) => lines.slice(0, i).reduce((n, l) => n + l.length + 1, 0);
		const endIdx = lines.findIndex((l, i) => i > 0 && l.trim() === BLOCK_END);
		const id = parsed[index]?.sub?.id ?? null;
		if (endIdx < 0) {
			out.push({ index, id, startLine: line, endLine: null, bodyStartLine: line + 1, bodyEndLine: line, from: pos, cardTo: null, bodyFrom: null, bodyTo: null });
		} else {
			let last = lines.length - 1;
			while (last > endIdx && lines[last]!.trim() === "") last--;
			const bodyFrom = Math.min(pos + startOf(endIdx + 1), pos + raw.length);
			out.push({
				index,
				id,
				startLine: line,
				endLine: line + endIdx,
				bodyStartLine: line + endIdx + 1,
				bodyEndLine: line + last,
				from: pos,
				cardTo: pos + startOf(endIdx) + lineEnd(endIdx),
				bodyFrom,
				bodyTo: last > endIdx ? pos + startOf(last) + lineEnd(last) : bodyFrom,
			});
		}
		pos += raw.length;
		line += lines.length - 1;
	});
	return out;
}

/** エディタの文書への変更 1 つ（変更前の文書の位置） */
export interface TextChange {
	from: number;
	to: number;
	insert: string;
}

/**
 * md の中のサブ 1 件の項目だけを書き換える変更（ADR-0161）。エディタの文書の、項目のブロックの範囲だけを置き換えるのに使う。
 * 本文、ほかのサブ、親の部分には触れない。検査に通らなければ・サブがなければ・書けない値なら例外。
 * `change` は項目の書き換え。status が終わりに変わるときは、ブロックごと末尾へ送る変更（`changes`。ADR-0181）で、`change` は使わない
 */
export function subHeadChange(
	path: string,
	parent: string,
	text: string,
	id: string,
	patch: SubIssuePatch,
	parseYaml: YamlParse,
	memberIds: ReadonlySet<string>,
): { change: TextChange; changes: TextChange[]; before: SubIssue; after: SubIssue } {
	const all = layoutSubIssues(path, parent, text, parseYaml);
	const layout = all.find((b) => b.id === id);
	const { subs } = parseSubIssues(path, parent, text, parseYaml);
	const before = subs.find((s) => s.id === id);
	if (!layout || !before || layout.cardTo === null) throw new Error(`サブがありません: ${subKey(parent, id)}`);
	// someday に期間を入れたら open に戻す（ADR-0190）
	const fixed = normalizeSubPatch(reopenSubOnPeriod(before.status, patch));
	const after: SubIssue = { ...before, ...fixed, id };
	const errors = touchedSubErrors(
		subs.map((s) => (s.id === id ? after : s)),
		[id],
		memberIds,
	);
	if (errors.length > 0) throw new Error(errors.join("\n"));
	const head = formatSubHead(after);
	const change = { from: layout.from, to: layout.cardTo, insert: head };
	const next = all[layout.index + 1];
	if (!becomesDone(before.status, after.status) || next === undefined) return { change, changes: [change], before, after };
	// 末尾へ送る: 元の場所のブロックを消し、書き換えた項目と本文を文書の末尾に足す
	const sep = text.endsWith("\n\n") ? "" : text.endsWith("\n") ? "\n" : "\n\n";
	const moved = `${sep}${head}${text.slice(layout.cardTo, next.from)}`;
	return {
		change,
		changes: [
			{ from: layout.from, to: next.from, insert: "" },
			{ from: text.length, to: text.length, insert: moved.endsWith("\n") ? moved : `${moved}\n` },
		],
		before,
		after,
	};
}

/** リーディング表示の 1 つのセクション（行 lineStart〜lineEnd。終わりを含む）の、サブとの関係（ADR-0161） */
export type SubSectionRole =
	| { role: "none" }
	/** マーカーの行を含むセクション。ここに項目のカードを描く（id は読めなければ null） */
	| { role: "card"; index: number; id: string | null }
	/** 項目の途中のセクション（隠す） */
	| { role: "hide" }
	/** 本文のセクション（そのサブが閉じていれば隠す） */
	| { role: "body"; id: string };

export function subSectionRole(layout: readonly SubLayout[], lineStart: number, lineEnd: number): SubSectionRole {
	for (const b of layout) {
		if (lineStart <= b.startLine && b.startLine <= lineEnd) return { role: "card", index: b.index, id: b.id };
		if (b.endLine !== null && lineStart > b.startLine && lineStart <= b.endLine) return { role: "hide" };
	}
	// 本文: 項目の `-->` の後ろから、次のマーカーの前まで
	for (let i = layout.length - 1; i >= 0; i--) {
		const b = layout[i]!;
		if (b.endLine !== null && lineStart > b.endLine && lineStart > b.startLine) {
			return b.id === null ? { role: "none" } : { role: "body", id: b.id };
		}
	}
	return { role: "none" };
}

/**
 * カーソル（選択）が範囲の中にあるか（ADR-0161）。
 * 範囲の先頭と終わりの位置は「中」に数えない（隣の位置にカーソルがあっても、描き替えを外さない）。選択は重なれば中
 */
export function cursorInside(sel: { from: number; to: number }, from: number, to: number): boolean {
	return sel.from === sel.to ? sel.from > from && sel.from < to : sel.to > from && sel.from < to;
}

/**
 * 開いているサブ（issue のノートのパス → サブの id）。issue ごとに多くても 1 つ。
 * プラグインの中（メモリ）だけで持ち、保存しない（ADR-0197。ADR-0158 の保存を置き換える）
 */
export type SubOpenMap = ReadonlyMap<string, string>;

export function isSubOpen(map: SubOpenMap, path: string, id: string): boolean {
	return map.get(path) === id;
}

/** そのサブを開いた新しい値。ほかに開いていたサブは閉じる。元の値は変えない */
export function openSub(map: SubOpenMap, path: string, id: string): SubOpenMap {
	if (map.get(path) === id) return map;
	return new Map(map).set(path, id);
}

/** 開閉を入れ替えた新しい値。開いていれば閉じて（どれも開いていない）、閉じていれば開いてほかを閉じる */
export function toggleSubOpen(map: SubOpenMap, path: string, id: string): SubOpenMap {
	if (map.get(path) !== id) return openSub(map, path, id);
	const next = new Map(map);
	next.delete(path);
	return next;
}

/** 表示しているペインがなくなったノートの開閉を忘れた値（shown は、今どこかのペインで表示しているノートのパス） */
export function forgetSubOpen(map: SubOpenMap, shown: ReadonlySet<string>): SubOpenMap {
	if ([...map.keys()].every((p) => shown.has(p))) return map;
	return new Map([...map].filter(([p]) => shown.has(p)));
}

/** 書く前の検査で、touched のサブ（足す・変えるもの）に関わる問題だけを返す。ほかのサブの既存の誤りは lint に任せる */
export function touchedSubErrors(subs: readonly SubIssueInput[], touched: readonly string[], memberIds: ReadonlySet<string>): string[] {
	return checkSubIssues(subs, memberIds).filter((e) => touched.some((id) => e.startsWith(`サブ ${id}: `)));
}

/** delegated から外したら、委任先も外す（issue と同じ。ADR-0032） */
export function normalizeSubPatch(patch: SubIssuePatch): SubIssuePatch {
	return patch.status !== undefined && patch.status !== "delegated" && patch.delegatedTo === undefined ? { ...patch, delegatedTo: null } : patch;
}

/** 「Depends on」のボタンの文言。text は 0 件で None、1 件で題、2 件以上で件数。title は選んだ題を候補の順に並べたもの */
export function dependsChip(candidates: Pick<SubIssue, "id" | "summary">[], dependsOn: string[]): { text: string; title: string | null; empty: boolean } {
	const picked = candidates.filter((s) => dependsOn.includes(s.id));
	if (picked.length === 0) return { text: "None", title: null, empty: true };
	const title = picked.map((s) => s.summary).join("\n");
	return { text: picked.length === 1 ? picked[0]!.summary : `${picked.length} sub-issues`, title, empty: false };
}

/** 依存先を 1 件付け外しする */
export function toggleDepends(dependsOn: string[], id: string): string[] {
	return dependsOn.includes(id) ? dependsOn.filter((d) => d !== id) : [...dependsOn, id];
}
