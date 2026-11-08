import { normalizeDate, type LocalDate } from "./dates";
import { isId } from "./ids";
import type { Problem } from "./problem";
import { parseRepeat, type RepeatRule } from "./repeat";

export const SCHEMA_VERSION = 1;

export const STATUSES = ["open", "in-progress", "waiting", "delegated", "someday", "closed", "canceled"] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ["high", "mid", "low", "chore"] as const;
export type Priority = (typeof PRIORITIES)[number];

/** status-detail の上限（ADR-0007） */
export const STATUS_DETAIL_MAX = 20;

/** frontmatter から読んだ issue（ADR-0002）。読めなかった欄は null / 空 */
export interface Issue {
	path: string;
	id: string;
	summary: string;
	status: Status;
	statusDetail: string;
	delegatedTo: string | null;
	priority: Priority | null;
	labels: string[];
	parent: string | null;
	/** issue の ID か、Vault ルートからのパス */
	related: string[];
	/** 分 */
	estimated: number | null;
	/** 昇順・重複なし */
	scheduled: LocalDate[];
	softDeadline: LocalDate | null;
	deadline: LocalDate | null;
	revisit: LocalDate | null;
	reviewed: LocalDate | null;
	created: string | null;
}

export interface Routine {
	path: string;
	id: string;
	summary: string;
	repeat: RepeatRule | null;
	start: LocalDate | null;
	end: LocalDate | null;
	active: boolean;
	group: string | null;
	priority: Priority | null;
	labels: string[];
	estimated: number | null;
	created: string | null;
}

/** 委任先の人（ADR-0007, 0035）。nickname と alias は、なければ name と ID で埋めた値 */
export interface Member {
	path: string;
	id: string;
	/** 本名（姓・名） */
	name: string;
	/** 自分が呼んでいる呼び名 */
	nickname: string;
	/** 検索と候補に出す短い呼び方。先頭の @ は付けない */
	alias: string;
	/** issue / routine と共用の label（ADR-0036） */
	labels: string[];
	created: string | null;
}

export interface Parsed<T> {
	/** ID が読めないときは null（索引に入れられない） */
	value: T | null;
	problems: Problem[];
}

type Frontmatter = Record<string, unknown>;

class Reader {
	readonly problems: Problem[] = [];
	constructor(
		private readonly path: string,
		private readonly fm: Frontmatter,
	) {}

	problem(code: string, message: string, severity: Problem["severity"] = "error"): void {
		this.problems.push({ severity, path: this.path, code, message });
	}

	has(key: string): boolean {
		const v = this.fm[key];
		return v !== undefined && v !== null && v !== "";
	}

	string(key: string): string | null {
		if (!this.has(key)) return null;
		const v = this.fm[key];
		if (typeof v === "string") return v.trim();
		if (typeof v === "number") return String(v);
		this.problem("invalid-field", `${key} が文字列ではありません`);
		return null;
	}

	oneOf<T extends string>(key: string, values: readonly T[]): T | null {
		const v = this.string(key);
		if (v === null) return null;
		if ((values as readonly string[]).includes(v)) return v as T;
		this.problem("invalid-field", `${key} は ${values.join(" / ")} のどれかにしてください: ${v}`);
		return null;
	}

	date(key: string): LocalDate | null {
		if (!this.has(key)) return null;
		const d = normalizeDate(this.fm[key]);
		if (d === null) this.problem("invalid-date", `${key} が YYYY-MM-DD の日付ではありません: ${String(this.fm[key])}`);
		return d;
	}

	datetime(key: string): string | null {
		if (!this.has(key)) return null;
		const v = this.fm[key];
		if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString();
		if (typeof v === "string" && !Number.isNaN(Date.parse(v))) return v.trim();
		this.problem("invalid-date", `${key} が日時ではありません: ${String(v)}`);
		return null;
	}

	minutes(key: string): number | null {
		if (!this.has(key)) return null;
		const v = this.fm[key];
		if (typeof v === "number" && Number.isFinite(v) && v >= 0) return v;
		this.problem("invalid-field", `${key} は 0 以上の数（分）にしてください: ${String(v)}`);
		return null;
	}

	list(key: string): unknown[] {
		if (!this.has(key)) return [];
		const v = this.fm[key];
		return Array.isArray(v) ? v.filter((x) => x !== null && x !== "") : [v];
	}

	strings(key: string): string[] {
		const out: string[] = [];
		for (const v of this.list(key)) {
			if (typeof v === "string" || typeof v === "number") {
				const s = String(v).trim();
				if (s && !out.includes(s)) out.push(s);
			} else {
				this.problem("invalid-field", `${key} に文字列でない値があります`);
			}
		}
		return out;
	}

	dates(key: string): LocalDate[] {
		const out = new Set<LocalDate>();
		for (const v of this.list(key)) {
			const d = normalizeDate(v);
			if (d === null) this.problem("invalid-date", `${key} に日付でない値があります: ${String(v)}`);
			else out.add(d);
		}
		return [...out].sort();
	}

	ref(key: string, prefix: "i" | "m"): string | null {
		const v = this.string(key);
		if (v === null) return null;
		if (isId(v, prefix)) return v;
		this.problem("invalid-ref", `${key} が ${prefix}-N の ID ではありません: ${v}`);
		return null;
	}

	common(type: string, prefix: "i" | "r" | "m"): string | null {
		if (this.fm.type !== type) this.problem("invalid-type", `type が ${type} ではありません`);
		if (this.has("schema") && this.fm.schema !== SCHEMA_VERSION) {
			this.problem("unknown-schema", `schema ${String(this.fm.schema)} は扱えません（${SCHEMA_VERSION} のみ）`);
		}
		const id = this.string("id");
		if (id === null || !isId(id, prefix)) {
			this.problem("invalid-id", `id が ${prefix}-N の形ではありません: ${String(this.fm.id)}`);
			return null;
		}
		const expected = this.path.replace(/^.*\//, "").replace(/\.md$/, "");
		if (expected !== id) this.problem("id-path-mismatch", `id（${id}）とファイル名（${expected}）が違います`);
		return id;
	}
}

export function parseIssue(path: string, fm: Frontmatter): Parsed<Issue> {
	const r = new Reader(path, fm);
	const id = r.common("issue", "i");
	const summary = r.string("summary") ?? "";
	if (!summary) r.problem("missing-summary", "summary がありません", "warning");
	const status = r.oneOf("status", STATUSES);
	if (status === null && !r.has("status")) r.problem("missing-status", "status がありません");
	// mid_due は soft_deadline に改名した（ADR-0032）。移行（0003-soft-deadline）で書き換える
	if (r.has("mid_due")) r.problem("legacy-mid-due", "mid_due は soft_deadline に改名しました（ADR-0032）。キーを soft_deadline に直してください");
	const issue: Issue = {
		path,
		id: id ?? "",
		summary,
		status: status ?? "open",
		statusDetail: r.string("status-detail") ?? "",
		delegatedTo: r.ref("delegated_to", "m"),
		priority: r.oneOf("priority", PRIORITIES),
		labels: r.strings("label"),
		parent: r.ref("parent", "i"),
		related: r.strings("related"),
		estimated: r.minutes("estimated"),
		scheduled: r.dates("scheduled"),
		softDeadline: r.date("soft_deadline"),
		deadline: r.date("deadline"),
		revisit: r.date("revisit"),
		reviewed: r.date("reviewed"),
		created: r.datetime("created"),
	};
	return { value: id === null ? null : issue, problems: r.problems };
}

export function parseRoutine(path: string, fm: Frontmatter): Parsed<Routine> {
	const r = new Reader(path, fm);
	const id = r.common("routine", "r");
	let repeat: RepeatRule | null = null;
	const parsed = parseRepeat(fm.repeat);
	if (parsed.ok) repeat = parsed.value;
	else r.problem("invalid-repeat", parsed.error);
	const active = fm.active === undefined || fm.active === null ? true : fm.active;
	if (typeof active !== "boolean") r.problem("invalid-field", "active は true / false にしてください");
	const routine: Routine = {
		path,
		id: id ?? "",
		summary: r.string("summary") ?? "",
		repeat,
		start: r.date("start"),
		end: r.date("end"),
		active: active !== false,
		group: r.string("group"),
		priority: r.oneOf("priority", PRIORITIES),
		labels: r.strings("label"),
		estimated: r.minutes("estimated"),
		created: r.datetime("created"),
	};
	return { value: id === null ? null : routine, problems: r.problems };
}

export function parseMember(path: string, fm: Frontmatter): Parsed<Member> {
	const r = new Reader(path, fm);
	const id = r.common("member", "m");
	const name = r.string("name") ?? "";
	if (!name) r.problem("missing-name", "name がありません");
	const nickname = r.string("nickname") || name;
	const alias = (r.string("alias") ?? "").replace(/^@+/, "").trim();
	if (id === null) return { value: null, problems: r.problems };
	return { value: { path, id, name, nickname, alias: alias || id, labels: r.strings("label"), created: r.datetime("created") }, problems: r.problems };
}
