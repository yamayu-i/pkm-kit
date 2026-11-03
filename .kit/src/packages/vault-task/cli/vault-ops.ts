import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { parse, stringify } from "yaml";
import { cancelPatch, closePatch, inboxPatch, reschedulePatch, somedayPatch } from "../src/core/actions";
import { dailyNotePath, emptyBoard, type RoutineResult } from "../src/core/board";
import { boardLogPath, newBoardLogId, nextBoardAt, serializeBoardLogEntry, type BoardOp } from "../src/core/board-log";
import { closeBoardNote } from "../src/core/board-note";
import { isLocalDate, localDateTime, type LocalDate } from "../src/core/dates";
import { groupKeys, UNGROUPED } from "../src/core/groups";
import { nextIds, pathForId } from "../src/core/ids";
import type { TaskIndex } from "../src/core/index";
import { frontmatterRange, newDailyContent, newIssueContent } from "../src/core/issue-file";
import { PRIORITIES, STATUS_DETAIL_MAX, STATUSES, parseIssue, type Issue, type Priority, type Status } from "../src/core/schema";
import { isDoneStatus, statusLogLine, statusLogPath, type StatusVia } from "../src/core/status-log";
import {
	appendWorklogLine,
	newWorklogId,
	 sanitizeDeviceName,
	serializeWorklogEntry,
	stopWorklogLines,
	worklogPath,
} from "../src/core/worklog";

/** Vault ルート内の相対パスを安全に解決する（ルート外へのアクセスを防ぐ） */
export function resolveInVault(root: string, relPath: string): string {
	const absRoot = resolve(root);
	const absTarget = resolve(absRoot, relPath);
	if (absTarget !== absRoot && !absTarget.startsWith(`${absRoot}${sep}`)) {
		throw new Error(`Vault の外のパスにはアクセスできません: ${relPath}`);
	}
	return absTarget;
}

function readTextOrEmpty(root: string, relPath: string): string {
	const full = resolveInVault(root, relPath);
	return existsSync(full) ? readFileSync(full, "utf8") : "";
}

function writeTextInVault(root: string, relPath: string, text: string): void {
	const full = resolveInVault(root, relPath);
	mkdirSync(dirname(full), { recursive: true });
	writeFileSync(full, text, "utf8");
}

export function readMarkdownBody(root: string, relPath: string): string {
	const text = readTextOrEmpty(root, relPath);
	const range = frontmatterRange(text);
	return range ? text.slice(range.to) : text;
}

/** status を変えたときに statuslog に書くための情報（ADR-0031） */
export interface StatusLogContext {
	device: string;
	now: Date;
	via: StatusVia;
}

/** status の変化を statuslog に 1 行追記する（ADR-0031）。端末名がなければ書かない */
export function appendStatusLogOnDisk(root: string, task: string, from: Status, to: Status, log: StatusLogContext): void {
	const dev = sanitizeDeviceName(log.device);
	if (!dev) return;
	const line = statusLogLine(task, from, to, log.via, log.now);
	if (line === null) return;
	const relPath = statusLogPath(dev, log.now);
	writeTextInVault(root, relPath, appendWorklogLine(readTextOrEmpty(root, relPath), line));
}

export function updateIssueFrontmatter(
	root: string,
	relPath: string,
	fields: Record<string, unknown>,
	log?: StatusLogContext,
): Issue {
	const full = resolveInVault(root, relPath);
	if (!existsSync(full)) throw new Error(`ファイルがありません: ${relPath}`);
	const text = readFileSync(full, "utf8");
	const range = frontmatterRange(text);
	if (!range) throw new Error(`frontmatter がありません: ${relPath}`);

	const rawYaml = text.slice(text.indexOf("\n") + 1, range.to).replace(/\r?\n---\r?\n?$/, "");
	const parsed = parse(rawYaml);
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
		throw new Error(`frontmatter がオブジェクトではありません: ${relPath}`);
	}
	const fm = { ...(parsed as Record<string, unknown>) };
	const fromStatus = fm.status;
	for (const [key, value] of Object.entries(fields)) {
		if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
			delete fm[key];
		} else {
			fm[key] = value;
		}
	}

	const check = parseIssue(relPath, fm);
	const errors = check.problems.filter((p) => p.severity === "error");
	if (!check.value || errors.length > 0) {
		throw new Error(`不正な frontmatter です: ${errors.map((e) => e.message).join(", ") || "ID が読めません"}`);
	}

	const nextYaml = stringify(fm).trimEnd();
	const body = text.slice(range.to);
	writeFileSync(full, `---\n${nextYaml}\n---\n${body}`, "utf8");
	if (log && typeof fromStatus === "string" && (STATUSES as readonly string[]).includes(fromStatus)) {
		appendStatusLogOnDisk(root, check.value.id, fromStatus as Status, check.value.status, log);
	}
	return check.value;
}

export function appendBoardOpsOnDisk(
	root: string,
	index: TaskIndex,
	date: LocalDate,
	device: string,
	ops: BoardOp[],
	now: Date,
): void {
	if (!isLocalDate(date)) throw new Error(`日付が YYYY-MM-DD ではありません: ${String(date)}`);
	const dev = sanitizeDeviceName(device);
	if (!dev) throw new Error("端末名が空です");
	if (ops.length === 0) return;

	const relPath = boardLogPath(dev, date);
	const current = readTextOrEmpty(root, relPath);
	let latest: number | null = index.board(date)?.latestAt ?? null;
	const nowMs = now.getTime();
	const next = ops.reduce((acc, op) => {
		latest = nextBoardAt(nowMs, latest);
		const line = serializeBoardLogEntry({
			id: newBoardLogId(),
			at: new Date(latest).toISOString(),
			date,
			...op,
		});
		return appendWorklogLine(acc, line);
	}, current);
	writeTextInVault(root, relPath, next);
}

export function addToBoardOnDisk(root: string, index: TaskIndex, date: LocalDate, issueIds: string[], device: string, now: Date): void {
	if (!Array.isArray(issueIds) || issueIds.length === 0) throw new Error("issue_ids を 1 件以上指定してください");
	for (const id of issueIds) {
		if (!index.issues.has(id)) throw new Error(`issue がありません: ${id}`);
	}
	appendBoardOpsOnDisk(
		root,
		index,
		date,
		device,
		issueIds.map((task) => ({ op: "add", task })),
		now,
	);
}

export function removeFromBoardOnDisk(root: string, index: TaskIndex, date: LocalDate, issueId: string, device: string, now: Date): void {
	if (!index.issues.has(issueId)) throw new Error(`issue がありません: ${issueId}`);
	appendBoardOpsOnDisk(root, index, date, device, [{ op: "remove", task: issueId }], now);
}

export function moveCardOnDisk(
	root: string,
	index: TaskIndex,
	date: LocalDate,
	id: string,
	group: string | null,
	device: string,
	now: Date,
): void {
	if (!index.issues.has(id) && !index.routines.has(id)) {
		throw new Error(`issue または routine がありません: ${id}`);
	}
	const normalized = group === null || group === UNGROUPED ? null : group.trim();
	if (normalized !== null) {
		const validGroups = groupKeys(index.data.groups);
		if (!validGroups.includes(normalized)) {
			throw new Error(`定義されていないグループです: ${normalized}（有効なグループ: ${validGroups.join(", ") || "なし"}）`);
		}
	}
	appendBoardOpsOnDisk(root, index, date, device, [{ op: "place", task: id, group: normalized }], now);
}

export function setRoutineResultOnDisk(
	root: string,
	index: TaskIndex,
	date: LocalDate,
	routineId: string,
	result: RoutineResult | null,
	device: string,
	now: Date,
): void {
	if (!index.routines.has(routineId)) throw new Error(`routine がありません: ${routineId}`);
	if (result !== null && result !== "closed" && result !== "canceled") {
		throw new Error(`routine の結果は closed / canceled / null のどれかにしてください: ${String(result)}`);
	}
	appendBoardOpsOnDisk(root, index, date, device, [{ op: "routine", task: routineId, result }], now);
}

export function carryIssuesOnDisk(
	root: string,
	index: TaskIndex,
	date: LocalDate,
	issueIds: string[],
	mode: "reschedule" | "inbox",
	rescheduleTo: LocalDate | null,
	device: string,
	now: Date,
): void {
	if (!isLocalDate(date)) throw new Error(`日付が YYYY-MM-DD ではありません: ${String(date)}`);
	if (!Array.isArray(issueIds) || issueIds.length === 0) throw new Error("issue_ids を 1 件以上指定してください");
	if (mode !== "reschedule" && mode !== "inbox") throw new Error("mode は reschedule か inbox にしてください");
	if (mode === "reschedule" && (rescheduleTo === null || !isLocalDate(rescheduleTo))) {
		throw new Error(`reschedule_to に YYYY-MM-DD の日付を指定してください: ${String(rescheduleTo)}`);
	}

	const board = index.board(date)?.board ?? emptyBoard();
	const issues: Issue[] = [];
	for (const id of issueIds) {
		const issue = index.issues.get(id);
		if (!issue) throw new Error(`issue がありません: ${id}`);
		if (!board.issues.includes(id)) throw new Error(`${id} は ${date} のボードに載っていません`);
		issues.push(issue);
	}

	for (const issue of issues) {
		const patch = mode === "inbox" ? inboxPatch() : reschedulePatch(issue, "scheduled", rescheduleTo!, date);
		updateIssueFrontmatter(root, issue.path, patch, { device, now, via: "mcp" });
	}
	appendBoardOpsOnDisk(
		root,
		index,
		date,
		device,
		issues.map((i) => ({ op: "carry", task: i.id })),
		now,
	);
}

export function closeBoardOnDisk(
	root: string,
	index: TaskIndex,
	date: LocalDate,
	device: string,
	now: Date,
): { date: LocalDate; closed: boolean; alreadyClosed: boolean } {
	if (!isLocalDate(date)) throw new Error(`日付が YYYY-MM-DD ではありません: ${String(date)}`);
	const board = index.board(date)?.board ?? emptyBoard();
	if (board.closed) return { date, closed: true, alreadyClosed: true };

	const noteRelPath = dailyNotePath(date);
	const existing = readTextOrEmpty(root, noteRelPath) || newDailyContent(localDateTime(now));
	const updatedNote = closeBoardNote(existing, date, index, board);
	writeTextInVault(root, noteRelPath, updatedNote);
	appendBoardOpsOnDisk(root, index, date, device, [{ op: "close", tasks: board.issues }], now);
	return { date, closed: true, alreadyClosed: false };
}

export interface CreateIssueInput {
	summary: string;
	parent?: string | null;
	scheduled?: LocalDate[];
	priority?: Priority | null;
	labels?: string[];
	estimated?: number | null;
	mid_due?: LocalDate | null;
	deadline?: LocalDate | null;
	add_to_board_date?: LocalDate | null;
}

export function createIssueOnDisk(
	root: string,
	index: TaskIndex,
	input: CreateIssueInput,
	device: string,
	now: Date,
): Issue {
	const summary = typeof input.summary === "string" ? input.summary.trim() : "";
	if (!summary) throw new Error("summary を指定してください");
	const parent = input.parent ?? null;
	if (parent !== null && !index.issues.has(parent)) throw new Error(`parent の ${parent} がありません`);

	const scheduled = input.scheduled ?? [];
	for (const d of scheduled) {
		if (!isLocalDate(d)) throw new Error(`scheduled の日付が不正です: ${String(d)}`);
	}
	if (input.add_to_board_date && !isLocalDate(input.add_to_board_date)) {
		throw new Error(`add_to_board_date の日付が不正です: ${String(input.add_to_board_date)}`);
	}

	const labelNames = new Set(index.data.labels.map((l) => l.name));
	for (const l of input.labels ?? []) {
		if (!labelNames.has(l)) throw new Error(`label「${l}」が labels.json にありません`);
	}
	if (input.priority !== undefined && input.priority !== null && !PRIORITIES.includes(input.priority)) {
		throw new Error(`priority が不正です: ${String(input.priority)}`);
	}
	if (input.estimated !== undefined && input.estimated !== null && (typeof input.estimated !== "number" || input.estimated < 0)) {
		throw new Error(`estimated は 0 以上の数（分）にしてください: ${String(input.estimated)}`);
	}
	if (input.mid_due !== undefined && input.mid_due !== null && !isLocalDate(input.mid_due)) {
		throw new Error(`mid_due の日付が不正です: ${String(input.mid_due)}`);
	}
	if (input.deadline !== undefined && input.deadline !== null && !isLocalDate(input.deadline)) {
		throw new Error(`deadline の日付が不正です: ${String(input.deadline)}`);
	}

	const taken = [...index.issues.keys(), ...index.routines.keys(), ...index.members.keys()];
	const [id] = nextIds("i", taken, 1);
	const relPath = pathForId(id!);
	const allScheduled =
		input.add_to_board_date && !scheduled.includes(input.add_to_board_date)
			? [...scheduled, input.add_to_board_date].sort()
			: [...scheduled].sort();

	writeTextInVault(root, relPath, newIssueContent(id!, summary, localDateTime(now), parent, allScheduled));

	const extra: Record<string, unknown> = {};
	if (input.priority !== undefined) extra.priority = input.priority;
	if (input.labels !== undefined && input.labels.length > 0) extra.labels = input.labels;
	if (input.estimated !== undefined) extra.estimated = input.estimated;
	if (input.mid_due !== undefined) extra.mid_due = input.mid_due;
	if (input.deadline !== undefined) extra.deadline = input.deadline;

	const issue =
		Object.keys(extra).length > 0
			? updateIssueFrontmatter(root, relPath, extra)
			: parseIssue(relPath, {
					type: "issue",
					id: id!,
					summary,
					status: "open",
					parent,
					scheduled: allScheduled,
					created: localDateTime(now),
				}).value!;

	if (input.add_to_board_date) {
		appendBoardOpsOnDisk(root, index, input.add_to_board_date, device, [{ op: "add", task: id! }], now);
	}
	return issue;
}

export interface UpdateIssueInput {
	id: string;
	summary?: string;
	status?: Status;
	status_detail?: string | null;
	delegated_to?: string | null;
	priority?: Priority | null;
	labels?: string[];
	parent?: string | null;
	scheduled?: LocalDate[];
	mid_due?: LocalDate | null;
	deadline?: LocalDate | null;
	revisit?: LocalDate | null;
	reviewed?: LocalDate | null;
	estimated?: number | null;
}

/**
 * issue を検査付きで更新する。log があれば status の変化を statuslog に書き、
 * closed / canceled にしたら記録中のタイマーを止める（ADR-0031）
 */
export function updateIssueOnDisk(root: string, index: TaskIndex, input: UpdateIssueInput, log?: Omit<StatusLogContext, "via">): Issue {
	const current = index.issues.get(input.id);
	if (!current) throw new Error(`issue がありません: ${input.id}`);

	const patch: Record<string, unknown> = {};
	if (input.summary !== undefined) {
		const s = input.summary.trim();
		if (!s) throw new Error("summary を空にはできません");
		patch.summary = s;
	}
	if (input.status !== undefined) {
		if (!STATUSES.includes(input.status)) throw new Error(`status が不正です: ${String(input.status)}`);
		if (input.status === "closed") Object.assign(patch, closePatch());
		else if (input.status === "canceled") Object.assign(patch, cancelPatch());
		else if (input.status === "someday") Object.assign(patch, somedayPatch(input.revisit ?? current.revisit));
		else patch.status = input.status;
	}
	if (input.status_detail !== undefined) {
		if (input.status_detail !== null && input.status_detail.length > STATUS_DETAIL_MAX) {
			throw new Error(`status-detail は ${STATUS_DETAIL_MAX} 文字以内にしてください`);
		}
		patch["status-detail"] = input.status_detail;
	}
	if (input.delegated_to !== undefined) {
		if (input.delegated_to !== null && !index.members.has(input.delegated_to)) {
			throw new Error(`delegated_to の member がありません: ${input.delegated_to}`);
		}
		patch.delegated_to = input.delegated_to;
	}
	const nextStatus = (patch.status as Status | undefined) ?? current.status;
	const nextDelegatedTo = input.delegated_to !== undefined ? input.delegated_to : current.delegatedTo;
	if (nextStatus === "delegated" && !nextDelegatedTo) {
		throw new Error("status を delegated にするときは delegated_to を指定してください");
	}

	if (input.priority !== undefined) {
		if (input.priority !== null && !PRIORITIES.includes(input.priority)) {
			throw new Error(`priority が不正です: ${String(input.priority)}`);
		}
		patch.priority = input.priority;
	}
	if (input.labels !== undefined) {
		const labelNames = new Set(index.data.labels.map((l) => l.name));
		for (const l of input.labels) {
			if (!labelNames.has(l)) throw new Error(`label「${l}」が labels.json にありません`);
		}
		patch.labels = input.labels;
	}
	if (input.parent !== undefined) {
		if (input.parent !== null && !index.canSetParent(current.id, input.parent)) {
			throw new Error(`親に ${input.parent} は選べません（存在しないか、親子関係が循環します）`);
		}
		patch.parent = input.parent;
	}
	if (input.scheduled !== undefined) {
		for (const d of input.scheduled) {
			if (!isLocalDate(d)) throw new Error(`scheduled の日付が不正です: ${String(d)}`);
		}
		patch.scheduled = [...new Set(input.scheduled)].sort();
	}
	if (input.mid_due !== undefined) {
		if (input.mid_due !== null && !isLocalDate(input.mid_due)) throw new Error(`mid_due の日付が不正です: ${String(input.mid_due)}`);
		patch.mid_due = input.mid_due;
	}
	if (input.deadline !== undefined) {
		if (input.deadline !== null && !isLocalDate(input.deadline)) throw new Error(`deadline の日付が不正です: ${String(input.deadline)}`);
		patch.deadline = input.deadline;
	}
	if (input.revisit !== undefined) {
		if (input.revisit !== null && !isLocalDate(input.revisit)) throw new Error(`revisit の日付が不正です: ${String(input.revisit)}`);
		patch.revisit = input.revisit;
	}
	if (input.reviewed !== undefined) {
		if (input.reviewed !== null && !isLocalDate(input.reviewed)) throw new Error(`reviewed の日付が不正です: ${String(input.reviewed)}`);
		patch.reviewed = input.reviewed;
	}
	if (input.estimated !== undefined) {
		if (input.estimated !== null && (typeof input.estimated !== "number" || input.estimated < 0)) {
			throw new Error(`estimated は 0 以上の数（分）にしてください: ${String(input.estimated)}`);
		}
		patch.estimated = input.estimated;
	}

	// someday の issue に実行日や期限を入れたら open に戻す（ADR-0018）
	const hasDatesAdded =
		(Array.isArray(patch.scheduled) && patch.scheduled.length > 0) ||
		(patch.mid_due !== undefined && patch.mid_due !== null) ||
		(patch.deadline !== undefined && patch.deadline !== null);
	if (current.status === "someday" && input.status === undefined && hasDatesAdded) {
		patch.status = "open";
		patch.revisit = null;
	}

	const updated = updateIssueFrontmatter(root, current.path, patch, log ? { ...log, via: "mcp" } : undefined);
	if (isDoneStatus(updated.status) && !isDoneStatus(current.status)) stopTimerOnDisk(root, index, [current.id], log?.now ?? new Date());
	return updated;
}

export function startTimerOnDisk(root: string, index: TaskIndex, taskIds: string[], device: string, now: Date): string[] {
	const dev = sanitizeDeviceName(device);
	if (!dev) throw new Error("端末名が空です");
	if (!Array.isArray(taskIds) || taskIds.length === 0) throw new Error("task_ids を 1 件以上指定してください");
	for (const id of taskIds) {
		if (!index.issues.has(id) && !index.routines.has(id)) {
			throw new Error(`issue または routine がありません: ${id}`);
		}
	}
	const running = new Set(index.running().map((l) => l.taskId));
	const targets = taskIds.filter((id) => !running.has(id));
	if (targets.length === 0) return [];

	const from = localDateTime(now);
	const relPath = worklogPath(dev, now);
	const current = readTextOrEmpty(root, relPath);
	const next = targets.reduce(
		(acc, taskId) => appendWorklogLine(acc, serializeWorklogEntry({ id: newWorklogId(), taskId, from, to: null, description: "" })),
		current,
	);
	writeTextInVault(root, relPath, next);
	// open の issue は、記録を始めたら in-progress にする（ADR-0031）
	for (const id of targets) {
		const issue = index.issues.get(id);
		if (issue?.status === "open") updateIssueFrontmatter(root, issue.path, { status: "in-progress" }, { device: dev, now, via: "timer" });
	}
	return targets;
}

export function stopTimerOnDisk(root: string, index: TaskIndex, taskIds: string[] | undefined, now: Date): string[] {
	const running = index.running().filter((l) => !taskIds || taskIds.length === 0 || taskIds.includes(l.taskId));
	if (running.length === 0) return [];

	const to = localDateTime(now);
	const toMs = now.getTime();
	const byFile = new Map<string, typeof running>();
	for (const e of running) {
		byFile.set(e.path, [...(byFile.get(e.path) ?? []), e]);
	}
	for (const [relPath, entries] of byFile) {
		const current = readTextOrEmpty(root, relPath);
		const next = stopWorklogLines(current, entries, to, toMs);
		writeTextInVault(root, relPath, next);
	}
	return running.map((e) => e.taskId);
}

/** デイリーノート本文の末尾にセクションを追記する（既存の行は変更・削除しない。ADR-0025） */
export function appendDailyNoteOnDisk(
	root: string,
	date: LocalDate,
	heading: string,
	content: string,
	now: Date,
): { path: string } {
	if (!isLocalDate(date)) throw new Error(`日付が YYYY-MM-DD ではありません: ${String(date)}`);
	const cleanHeading = heading.trim().replace(/^#+\s*/, "");
	const cleanContent = content.trim();
	if (!cleanHeading) throw new Error("heading を指定してください");
	if (!cleanContent) throw new Error("content を指定してください");

	const relPath = dailyNotePath(date);
	const existing = readTextOrEmpty(root, relPath) || newDailyContent(localDateTime(now));
	const sepLine = existing.endsWith("\n") ? "\n" : "\n\n";
	const appended = `${existing}${sepLine}## ${cleanHeading}\n\n${cleanContent}\n`;
	writeTextInVault(root, relPath, appended);
	return { path: relPath };
}
