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
	end: LocalDate | null;
	/** 昇順・重複なし */
	scheduled: LocalDate[];
	softDeadline: LocalDate | null;
	deadline: LocalDate | null;
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
		scheduled: r.dates("scheduled"),
		softDeadline: r.date("soft_deadline"),
		deadline: r.date("deadline"),
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

/** サブ 1 件のブロック（項目は ADR の表の順、空の項目は書かない）。書けない値なら SubIssueFormatError */
export function formatSubIssue(sub: SubIssueInput): string {
	if (!isSubId(sub.id)) throw new SubIssueFormatError(`id が英小文字と数字の 6 文字ではありません: ${sub.id}`);
	const lines = [SUB_ISSUE_MARKER, `id: ${sub.id}`, `summary: ${yamlString(sub.summary)}`, `status: ${sub.status}`];
	const put = (key: string, value: string | null) => {
		if (value !== null) lines.push(`${key}: ${value}`);
	};
	put("delegated_to", sub.delegatedTo);
	put("start", sub.start);
	put("end", sub.end);
	if (sub.scheduled.length > 0) put("scheduled", JSON.stringify(sub.scheduled));
	put("soft_deadline", sub.softDeadline);
	put("deadline", sub.deadline);
	put("estimated", sub.estimated === null ? null : String(sub.estimated));
	if (sub.dependsOn.length > 0) put("depends_on", JSON.stringify(sub.dependsOn));
	put("created", sub.created);
	put("migrated_from", sub.migratedFrom);
	for (const line of lines.slice(1)) {
		if (line.includes(BLOCK_END)) throw new SubIssueFormatError(`サブの項目に ${BLOCK_END} は書けません: ${line}`);
		if (/[\r\n]/.test(line)) throw new SubIssueFormatError(`サブの項目に改行は書けません: ${line}`);
	}
	const body = sub.body.replace(/^(?:[ \t]*\r?\n)+/, "").trimEnd();
	if (body.split(/\r?\n/).some((l) => l.startsWith(SUB_ISSUE_MARKER))) {
		throw new SubIssueFormatError(`サブの本文の行頭に ${SUB_ISSUE_MARKER} は書けません`);
	}
	lines.push(BLOCK_END);
	return `${lines.join("\n")}\n${body ? `${body}\n` : ""}`;
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
	const next = replaceSubIssues(
		text,
		blocks.map((b, i) => (i === at ? after : (b.sub ?? b.raw))),
	);
	return { text: next, before, after };
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
			["soft_deadline", s.softDeadline],
			["deadline", s.deadline],
		] as const) {
			if (!isDate(value)) errors.push(`${where}: ${key} が YYYY-MM-DD の日付ではありません: ${String(value)}`);
		}
		for (const d of s.scheduled) if (!isDate(d)) errors.push(`${where}: scheduled に日付でない値があります: ${d}`);
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
		scheduled: [...new Set(item.scheduled ?? [])].sort(),
		softDeadline: item.softDeadline ?? null,
		deadline: item.deadline ?? null,
		estimated: item.estimated ?? null,
		dependsOn: item.dependsOn ?? [],
		created,
		migratedFrom: null,
		body: item.body ?? "",
	};
}

/** そのサブに依存しているサブ（消す前に確かめる） */
export function dependentsOf(subs: readonly SubIssue[], id: string): string[] {
	return subs.filter((s) => s.dependsOn.includes(id)).map((s) => s.id);
}

const isDone = (s: Pick<SubIssue, "status">) => s.status === "closed" || s.status === "canceled";

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

/** 行の補足（ADR-0142）: 期間 → 今日以降の次の予定日 → 期限（deadline、なければ soft_deadline）。なければ null */
export function subHint(sub: Pick<SubIssue, "start" | "end" | "scheduled" | "deadline" | "softDeadline">, today: LocalDate): string | null {
	if (sub.start !== null || sub.end !== null) return `${sub.start ? shortDate(sub.start) : ""}–${sub.end ? shortDate(sub.end) : ""}`;
	const next = sub.scheduled.find((d) => d >= today);
	if (next) return shortDate(next);
	const due = sub.deadline ?? sub.softDeadline;
	return due ? `Due ${shortDate(due)}` : null;
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

/** サブの領域の始まりの行（0 から。frontmatter の後ろの最初のマーカー）。なければ null。リーディング表示で隠すのに使う */
export function subAreaStartLine(text: string): number | null {
	const { head, blocks } = splitSubIssueText(text);
	if (blocks.length === 0) return null;
	return head.split("\n").length - 1;
}

/** 書く前の検査で、touched のサブ（足す・変えるもの）に関わる問題だけを返す。ほかのサブの既存の誤りは lint に任せる */
export function touchedSubErrors(subs: readonly SubIssueInput[], touched: readonly string[], memberIds: ReadonlySet<string>): string[] {
	return checkSubIssues(subs, memberIds).filter((e) => touched.some((id) => e.startsWith(`サブ ${id}: `)));
}

/** delegated から外したら、委任先も外す（issue と同じ。ADR-0032） */
export function normalizeSubPatch(patch: SubIssuePatch): SubIssuePatch {
	return patch.status !== undefined && patch.status !== "delegated" && patch.delegatedTo === undefined ? { ...patch, delegatedTo: null } : patch;
}
