import { formatShortDate, type LocalDate } from "./dates";
import { isInbox } from "./index";
import type { Issue } from "./schema";
import { isDoneStatus } from "./status-log";
import type { SubIssue } from "./sub-issue";

/**
 * Project のサブの期間と Tickler の規則（ADR-0210）。Obsidian の書き込み・画面と MCP が同じ判定とエラーの文を使う。
 * - Inbox の Project のサブには、期間を新しく入れることも、今ある期間を変えることもできない（消すのはよい）
 * - Project の Tickler は、閉じていないサブの期間の始まりのうち、いちばん早い日以前
 */

type Period = Pick<SubIssue, "start" | "end">;

/** 期間の始まり（`end` だけならその日）。期間がなければ null */
export function periodStart(p: Period): LocalDate | null {
	return p.start ?? p.end;
}

/** 消すだけの変更か: 書いた後の値が、どれも空か元と同じ */
function onlyClears(before: Period | null, after: Period): boolean {
	const keep = (k: "start" | "end") => after[k] === null || after[k] === (before?.[k] ?? null);
	return keep("start") && keep("end");
}

/** Inbox の Project のサブに期間を入れられないときの文 */
export function periodInInboxMessage(parentId: string): string {
	return `${parentId}: Inbox（未整理）の Project のサブには、期間を入れられません（ADR-0210）。先に Inbox で整理してください`;
}

/** Tickler より前に始まる期間を入れられないときの文 */
export function periodBeforeTicklerMessage(parentId: string, tickler: LocalDate): string {
	return `${parentId}: Tickler（${formatShortDate(tickler)}）より前に始まる期間は入れられません（ADR-0210）。${formatShortDate(tickler)} 以降にしてください`;
}

/**
 * サブの期間を before から after にしてよいか。書けなければエラーの文。
 * planned は親が計画済みの Project か（書く前の値。TaskIndex.planned）。消すだけの変更はいつもよい
 */
export function subPeriodError(parent: Issue, planned: boolean, before: Period | null, after: Period, today: LocalDate): string | null {
	if (onlyClears(before, after)) return null;
	if (isInbox(parent, today, planned)) return periodInInboxMessage(parent.id);
	const start = periodStart(after);
	if (parent.tickler !== null && parent.tickler > today && start !== null && start < parent.tickler) return periodBeforeTicklerMessage(parent.id, parent.tickler);
	return null;
}

/** サブの期間を入れられるか（Inbox の Project でない）。画面で、入れる前に欄を押せなくする */
export function canEditSubPeriod(parent: Issue | undefined, planned: boolean, today: LocalDate): boolean {
	return parent === undefined || !isInbox(parent, today, planned);
}

/** 期間の始まりのいちばん早い日（閉じていないサブ）。期間を持つサブがなければ null */
export function earliestPeriodStart(subs: readonly Pick<SubIssue, "status" | "start" | "end">[]): LocalDate | null {
	let earliest: LocalDate | null = null;
	for (const s of subs) {
		if (isDoneStatus(s.status)) continue;
		const start = periodStart(s);
		if (start !== null && (earliest === null || start < earliest)) earliest = start;
	}
	return earliest;
}

/**
 * Project に付けられる Tickler の上限（ADR-0210）。latest は付けられる最後の日（null なら上限なし）。
 * blocked は、期間がすでに今日以前に始まっていて、Tickler を付けられないこと
 */
export function ticklerLimit(subs: readonly Pick<SubIssue, "status" | "start" | "end">[], today: LocalDate): { latest: LocalDate | null; blocked: boolean } {
	const latest = earliestPeriodStart(subs);
	return { latest, blocked: latest !== null && latest <= today };
}

/** Tickler を付けられないときの文（期間がすでに始まっている） */
export function ticklerBlockedMessage(id: string): string {
	return `${id}: 期間がすでに始まっているサブがあるので、Tickler を付けられません（ADR-0210）。サブの期間を後ろにずらしてください`;
}

/** Tickler を tickler にしてよいか。消す（null）のはよい。書けなければエラーの文 */
export function ticklerWithSubsError(id: string, subs: readonly Pick<SubIssue, "status" | "start" | "end">[], tickler: LocalDate | null, today: LocalDate): string | null {
	if (tickler === null) return null;
	const { latest, blocked } = ticklerLimit(subs, today);
	if (latest === null || tickler <= latest) return null;
	if (blocked) return ticklerBlockedMessage(id);
	return `${id}: Tickler はサブの期間の始まり（${formatShortDate(latest)}）より後にできません（ADR-0210）。${formatShortDate(latest)} 以前にするか、サブの期間を後ろにずらしてください`;
}

/** Project を someday にしたら期間と Calendar の日を消すサブ（閉じていないもので、どれかを持つもの。ADR-0210） */
export function somedayClears(subs: readonly SubIssue[]): SubIssue[] {
	return subs.filter((s) => !isDoneStatus(s.status) && (s.start !== null || s.end !== null || s.scheduled !== null));
}

/** someday で消えるサブの 1 行（確認のダイアログと MCP のエラー） */
export function describeClear(sub: SubIssue): string {
	const parts: string[] = [];
	if (sub.start !== null || sub.end !== null) parts.push(`${sub.start ? formatShortDate(sub.start) : "—"} – ${sub.end ? formatShortDate(sub.end) : "—"}`);
	if (sub.scheduled !== null) parts.push(`calendar ${formatShortDate(sub.scheduled)}`);
	return `${sub.summary}（${parts.join("、")}）`;
}
