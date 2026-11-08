import { isInbox, isScheduledAhead, organizeQueue } from "../../../pkm-task/src/core/index";
import type { LocalDate } from "../../../pkm-task/src/core/dates";
import { collectVault, fileKind } from "../../../pkm-task/src/core/load";
import type { Issue } from "../../../pkm-task/src/core/schema";
import { dailyDate, noteTitle } from "../../../pkm-template/src/core/note-title";

/**
 * PKM Updates のセクション（ADR-0070 の 2）。載せる規則は、元の View と同じ関数を使う（写さない）。
 * Obsidian に依存しない。ノートの一覧は metadataCache から呼ぶ側が作る
 */

/** Vault の Markdown 1 つ。frontmatter が読めなければ null */
export interface NoteRecord {
	path: string;
	/** 拡張子なしのファイル名 */
	basename: string;
	frontmatter: Record<string, unknown> | null;
}

export interface UpdateItem {
	path: string;
	title: string;
	updatedMs: number;
}

export interface Section {
	id: SectionId;
	title: string;
	/** 見出しが開く一覧 View のコマンド */
	command: string;
	items: UpdateItem[];
}

export type SectionId = "issues" | "inbox" | "organize" | "scheduled" | "someday" | "routines" | "members" | "daily" | "notes" | "sources";

interface Prepared {
	issues: Issue[];
	routinePaths: string[];
	memberPaths: string[];
	byType: (type: string) => string[];
	today: LocalDate;
	titles: Map<string, string>;
}

interface SectionDef {
	id: SectionId;
	title: string;
	command: string;
	/** その一覧に載るノートのパス */
	paths: (p: Prepared) => string[];
}

const issuePaths = (issues: Iterable<Issue>) => [...issues].map((i) => i.path);

export const SECTIONS: readonly SectionDef[] = [
	// 閉じた変更も見えるよう、Issues は closed / canceled / someday も含むすべて
	{ id: "issues", title: "Issues", command: "pkm-task:open-issues", paths: (p) => issuePaths(p.issues) },
	{ id: "inbox", title: "Inbox", command: "pkm-task:open-inbox", paths: (p) => issuePaths(p.issues.filter(isInbox)) },
	{ id: "organize", title: "Organize", command: "pkm-task:open-organize", paths: (p) => issuePaths(organizeQueue(p.issues, p.today)) },
	{ id: "scheduled", title: "Scheduled", command: "pkm-task:open-scheduled", paths: (p) => issuePaths(p.issues.filter((i) => isScheduledAhead(i, p.today))) },
	{ id: "someday", title: "Someday", command: "pkm-task:open-someday", paths: (p) => issuePaths(p.issues.filter((i) => i.status === "someday")) },
	{ id: "routines", title: "Routines", command: "pkm-task:open-routines", paths: (p) => p.routinePaths },
	{ id: "members", title: "Members", command: "pkm-task:open-members", paths: (p) => p.memberPaths },
	{ id: "daily", title: "Daily notes", command: "pkm-template:open-daily-list", paths: (p) => p.byType("daily") },
	{ id: "notes", title: "Notes", command: "pkm-template:open-note-list", paths: (p) => p.byType("note") },
	{ id: "sources", title: "Sources", command: "pkm-template:open-source-list", paths: (p) => p.byType("source") },
];

/** frontmatter の updated をミリ秒に。文字列（ISO 8601）と Date だけを読む */
export function updatedMs(value: unknown): number | null {
	const ms = value instanceof Date ? value.getTime() : typeof value === "string" ? Date.parse(value) : NaN;
	return Number.isNaN(ms) ? null : ms;
}

function prepare(notes: readonly NoteRecord[], today: LocalDate): Prepared {
	const task = notes.filter((n) => {
		const kind = fileKind(n.path);
		return kind === "issue" || kind === "routine" || kind === "member";
	});
	const { data } = collectVault({ markdown: task.map((n) => ({ path: n.path, frontmatter: n.frontmatter })), worklogs: [], labels: null });
	const titles = new Map<string, string>();
	for (const i of data.issues) titles.set(i.path, `${i.id} ${i.summary}`.trim());
	for (const r of data.routines) titles.set(r.path, `${r.id} ${r.summary}`.trim());
	for (const m of data.members) titles.set(m.path, m.nickname || m.name || m.id);
	const typed = new Map<string, string[]>();
	for (const n of notes) {
		const type = n.frontmatter?.type;
		if (typeof type !== "string") continue;
		typed.set(type, [...(typed.get(type) ?? []), n.path]);
		if (!titles.has(n.path)) {
			const title = type === "daily" ? (dailyDate(n.basename)?.label ?? n.basename) : noteTitle(n.frontmatter ?? undefined, n.basename);
			titles.set(n.path, title);
		}
	}
	return {
		issues: data.issues,
		routinePaths: data.routines.map((r) => r.path),
		memberPaths: data.members.map((m) => m.path),
		byType: (type) => typed.get(type) ?? [],
		today,
		titles,
	};
}

/**
 * 各セクションに、基準（since）より後に updated が新しくなったノートを、updated の新しい順に入れる。
 * since が null（まだ一度も Viewed を押していない）なら、updated があるものすべて。0 件のセクションは返さない
 */
export function buildSections(notes: readonly NoteRecord[], since: number | null, today: LocalDate): Section[] {
	const changed = new Map<string, number>();
	for (const n of notes) {
		const ms = updatedMs(n.frontmatter?.updated);
		if (ms !== null && (since === null || ms > since)) changed.set(n.path, ms);
	}
	if (changed.size === 0) return [];
	const p = prepare(notes, today);
	const out: Section[] = [];
	for (const def of SECTIONS) {
		const items = [...new Set(def.paths(p))]
			.filter((path) => changed.has(path))
			.map((path) => ({ path, title: p.titles.get(path) ?? path, updatedMs: changed.get(path) as number }))
			.sort((a, b) => b.updatedMs - a.updatedMs || a.path.localeCompare(b.path, "en", { numeric: true }));
		if (items.length > 0) out.push({ id: def.id, title: def.title, command: def.command, items });
	}
	return out;
}

/** 全セクションを通したノートの数（重複を数えない） */
export function uniqueCount(sections: readonly Section[]): number {
	return new Set(sections.flatMap((s) => s.items.map((i) => i.path))).size;
}
