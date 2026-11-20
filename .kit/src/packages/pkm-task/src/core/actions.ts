import type { LocalDate } from "./dates";
import type { Issue, Status } from "./schema";

/** frontmatter の更新内容。null / 空配列は欄ごと消す（TaskWriter.update と同じ） */
export type Patch = Record<string, string | number | boolean | string[] | null>;

/** Cancel: 期限は外す（ADR-0009）。Tickler も消す（ADR-0152） */
export function cancelPatch(): Patch {
	return { status: "canceled", soft_deadline: null, deadline: null, delegated_to: null, revisit: null, tickler: null };
}

/** 終わっていた */
export function closePatch(): Patch {
	return { status: "closed", delegated_to: null, revisit: null, tickler: null };
}

/** Next（整理済み・日付なし）にする。someday なら open に戻す（ADR-0148）。整理したので Tickler を消す（ADR-0152） */
export function nextPatch(issue: Issue): Patch {
	return { clarified: true, tickler: null, ...(issue.status === "someday" ? reopenPatch() : {}) };
}

/** Back to Next（ADR-0152）: Calendar と Tickler を消し、整理済みのまま Next に戻す（持ち越し・Missed から） */
export function backToNextPatch(): Patch {
	return { scheduled: null, tickler: null, clarified: true };
}

/** Tickler（ADR-0152）: この日まで出さず、この日に Inbox に戻す。整理の先送りなので clarified は変えない。someday なら open に戻す */
export function ticklerPatch(issue: Issue, date: LocalDate): Patch {
	return { tickler: date, ...(issue.status === "someday" ? reopenPatch() : {}) };
}

/** Calendar（ADR-0152）: その日にやらなければならない日を 1 つ決める。整理の結果なので clarified を付け、Tickler を消す */
export function calendarPatch(issue: Issue, date: LocalDate): Patch {
	return { scheduled: date, clarified: true, tickler: null, ...(issue.status === "someday" ? reopenPatch() : {}) };
}

/** Someday へ: Calendar・期限・Tickler を外す。revisit は任意（ADR-0006, 0152） */
export function somedayPatch(revisit: LocalDate | null = null): Patch {
	return { status: "someday", scheduled: null, soft_deadline: null, deadline: null, delegated_to: null, revisit, tickler: null };
}

/** someday のまま残す（Organize で revisit を迎えたものに Someday を選んだとき）。revisit の役目は終わったので消す（ADR-0212） */
export function keepSomedayPatch(): Patch {
	return { tickler: null, revisit: null };
}

/** Someday の一覧の Reviewed（週次の見直し）。見直した日だけを書く（ADR-0212） */
export function reviewedPatch(date: LocalDate): Patch {
	return { reviewed: date };
}

/** someday から戻すときは open にして revisit を外す。clarified は書き込み（completeIssuePatch）が外す（ADR-0189） */
export function reopenPatch(): Patch {
	return { status: "open", revisit: null };
}

/** 期限を変える。someday は期限を持たないので、入れるときは open に戻す（ADR-0018） */
export function duePatch(issue: Issue, key: "soft_deadline" | "deadline", date: LocalDate | null): Patch {
	return { [key]: date, ...(issue.status === "someday" && date !== null ? reopenPatch() : {}) };
}

/** Calendar の日（scheduled）を置き換える・消す。someday に入れるときは open に戻す（ADR-0018, 0152） */
export function scheduledPatch(issue: Issue, date: LocalDate | null): Patch {
	return { scheduled: date, ...(issue.status === "someday" && date !== null ? reopenPatch() : {}) };
}

/** Tickler の日を置き換える・消す（issue 画面。ADR-0152）。someday に入れるときは open に戻す */
export function ticklerFieldPatch(issue: Issue, date: LocalDate | null): Patch {
	return { tickler: date, ...(issue.status === "someday" && date !== null ? reopenPatch() : {}) };
}

export type RescheduleTarget = "scheduled" | "soft_deadline" | "deadline";

/** リスケ: 期限・Calendar の日を、その日に置き換える（ADR-0152。Calendar は日付 1 つ） */
export function reschedulePatch(target: RescheduleTarget, to: LocalDate): Patch {
	return { [target]: to };
}
