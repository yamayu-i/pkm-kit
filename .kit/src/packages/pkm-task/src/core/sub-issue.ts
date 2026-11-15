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
