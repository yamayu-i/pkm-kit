import { contrastRatio, formatRatio, parseHex, stack } from "../../../design/src/color.ts";
import { colors } from "../../../design/generated/tokens.ts";
import { TaskIndex, type VaultData } from "./index";
import { LABELS_PATH } from "./labels";
import { isId } from "./ids";
import type { Problem } from "./problem";
import { STATUS_DETAIL_MAX } from "./schema";
import { parseSubKey, subKey, type SubIssue } from "./sub-issue";

export interface LintOptions {
	/** Vault にあるファイルのパス。related のパス参照を確かめるのに使う（省略時は確かめない） */
	paths?: ReadonlySet<string>;
}

function safeDecode(path: string): string {
	try {
		return decodeURI(path);
	} catch {
		return path;
	}
}

/** label の文字と面の比の下限（WCAG 1.4.3） */
export const LABEL_CONTRAST_MIN = 4.5;

/**
 * label の面（ユーザーが書いた色）と文字（トークン on-label）の比。ライト / ダークの低い方。
 * 半透明の色はカードの面（surface-container）に重ねて測る
 */
export function labelContrast(color: string): number {
	return Math.min(
		...(["light", "dark"] as const).map((mode) => {
			const bg = stack([parseHex(colors[mode]["color.surface-container"]), parseHex(color)]);
			return contrastRatio(parseHex(colors[mode]["color.on-label"]), bg);
		}),
	);
}

type Add = (severity: Problem["severity"], path: string, code: string, message: string) => void;

/** サブイシューの検査（ADR-0135）。項目の型の誤りはパースのときに報告する */
function lintSubIssues(data: VaultData, index: TaskIndex, add: Add): void {
	const byParent = new Map<string, SubIssue[]>();
	for (const sub of data.subIssues) byParent.set(sub.parent, [...(byParent.get(sub.parent) ?? []), sub]);
	for (const subs of byParent.values()) {
		const seen = new Set<string>();
		for (const sub of subs) {
			if (seen.has(sub.id)) add("error", sub.path, "duplicate-sub-id", `サブの id ${sub.id} が同じ issue の中で重なっています`);
			seen.add(sub.id);
		}
	}
	for (const sub of data.subIssues) {
		const { path } = sub;
		const where = `サブ ${sub.id}`;
		if (index.sub(sub.key) !== sub) continue;
		if (sub.status === "delegated" && sub.delegatedTo === null) add("error", path, "missing-delegated-to", `${where}: delegated なのに delegated_to がありません`);
		if (sub.delegatedTo !== null) {
			if (!index.members.has(sub.delegatedTo)) add("error", path, "dangling-member", `${where}: delegated_to の ${sub.delegatedTo} がありません`);
			if (sub.status !== "delegated") add("warning", path, "stale-delegated-to", `${where}: delegated ではないのに delegated_to があります`);
		}
		for (const dep of sub.dependsOn) {
			if (dep === sub.id) {
				add("error", path, "self-depends-on", `${where}: depends_on が自分自身です`);
				continue;
			}
			const target = index.sub(subKey(sub.parent, dep));
			if (!target) {
				add("error", path, "dangling-depends-on", `${where}: depends_on の ${dep} が同じ issue の中にありません`);
				continue;
			}
			if (sub.start !== null && target.end !== null && sub.start < target.end) {
				add("warning", path, "start-before-dependency", `${where}: start（${sub.start}）が依存先 ${dep} の end（${target.end}）より前です`);
			}
		}
		if (dependsOnCycle(index, sub)) add("error", path, "depends-on-cycle", `${where}: depends_on が循環しています`);
	}
}

/** そのサブから depends_on をたどって、自分に戻るか（自分自身への依存は self-depends-on で別に出す） */
function dependsOnCycle(index: TaskIndex, start: SubIssue): boolean {
	const seen = new Set<string>();
	const stack = start.dependsOn.filter((d) => d !== start.id);
	while (stack.length > 0) {
		const id = stack.pop()!;
		if (id === start.id) return true;
		if (seen.has(id)) continue;
		seen.add(id);
		const next = index.sub(subKey(start.parent, id));
		if (next) stack.push(...next.dependsOn.filter((d) => d !== next.id));
	}
	return false;
}

/** 整合性の検査（ADR-0001）。パース時の問題とは別に、ファイルをまたいだ問題を見る */
export function lintVault(data: VaultData, options: LintOptions = {}): Problem[] {
	const problems: Problem[] = [];
	const add = (severity: Problem["severity"], path: string, code: string, message: string) =>
		problems.push({ severity, path, code, message });
	const index = new TaskIndex(data);

	for (const [kind, items] of [
		["issue", data.issues],
		["routine", data.routines],
		["member", data.members],
	] as const) {
		const first = new Map<string, string>();
		for (const item of items) {
			const prev = first.get(item.id);
			if (prev === undefined) first.set(item.id, item.path);
			else add("error", item.path, "duplicate-id", `${kind} の ID ${item.id} が ${prev} と重複しています`);
		}
	}

	const labelNames = new Set(data.labels.map((l) => l.name));
	for (const label of data.labels) {
		const ratio = labelContrast(label.color);
		if (ratio < LABEL_CONTRAST_MIN) {
			add("error", LABELS_PATH, "low-contrast-label", `label「${label.name}」の色 ${label.color} は文字との比が ${formatRatio(ratio)} で、${LABEL_CONTRAST_MIN} に届きません（docs/design.md）`);
		}
	}
	for (const issue of data.issues) {
		const { path } = issue;
		for (const ref of issue.related) {
			if (parseSubKey(ref) !== null) {
				if (!index.sub(ref)) add("error", path, "dangling-related", `related のサブ ${ref} がありません`);
			} else if (isId(ref, "i")) {
				if (!index.issues.has(ref)) add("error", path, "dangling-related", `related の ${ref} がありません`);
			} else if (options.paths && !options.paths.has(safeDecode(ref))) {
				add("error", path, "dangling-related", `related のノート ${ref} がありません`);
			}
		}
		if (issue.status === "delegated" && issue.delegatedTo === null) {
			add("error", path, "missing-delegated-to", "delegated なのに delegated_to がありません");
		}
		if (issue.delegatedTo !== null) {
			if (!index.members.has(issue.delegatedTo)) add("error", path, "dangling-member", `delegated_to の ${issue.delegatedTo} がありません`);
			if (issue.status !== "delegated") add("warning", path, "stale-delegated-to", "delegated ではないのに delegated_to があります");
		}
		// Calendar とサブを同時に持たせない（ADR-0203）。閉じたサブも数える。自動では消さない
		if (issue.scheduled !== null && index.subs(issue.id).length > 0) {
			add("warning", path, "calendar-with-subs", "サブイシューを持つのに Calendar の日（scheduled）があります。どちらかを外してください（ADR-0203）");
		}
		if (issue.statusDetail.length > STATUS_DETAIL_MAX) {
			add("warning", path, "long-status-detail", `status-detail が ${STATUS_DETAIL_MAX} 文字を超えています`);
		}
		if (issue.status === "someday" && (issue.scheduled !== null || issue.softDeadline !== null || issue.deadline !== null)) {
			add("warning", path, "someday-with-dates", "someday なのに scheduled / soft_deadline / deadline が残っています");
		}
		if (issue.tickler !== null && issue.status !== "open") {
			add("warning", path, "stale-tickler", "open ではないのに tickler があります（Inbox にも Next にも出ません。ADR-0183）");
		}
		if (issue.revisit !== null && issue.status !== "someday") {
			add("warning", path, "stale-revisit", "someday ではないのに revisit があります");
		}
		for (const label of issue.labels) {
			if (!labelNames.has(label)) add("warning", path, "unknown-label", `label「${label}」が labels.json にありません`);
		}
	}

	lintSubIssues(data, index, add);

	// member の label も issue と同じ定義を使う（ADR-0036）
	for (const member of data.members) {
		for (const label of member.labels) {
			if (!labelNames.has(label)) add("warning", member.path, "unknown-label", `label「${label}」が labels.json にありません`);
		}
	}

	for (const b of data.boards) {
		for (const id of b.board.issues) {
			// 移行でサブにした子の ID は、過去のボードに残ってよい（ADR-0135）
			if (!index.issues.has(id) && !index.sub(id) && !index.migrated(id)) add("warning", b.path, "dangling-board-issue", `ボードに載っている ${id} がありません`);
		}
	}

	const logIds = new Map<string, string>();
	for (const log of data.worklogs) {
		const where = `${log.path}:${log.line}`;
		const prev = logIds.get(log.id);
		if (prev !== undefined) add("error", log.path, "duplicate-worklog-id", `${log.line} 行目: worklog の ID ${log.id} が ${prev} と重複しています`);
		else logIds.set(log.id, where);
		if (!index.issues.has(log.taskId) && !index.routines.has(log.taskId)) {
			add("error", log.path, "dangling-task", `${log.line} 行目: task_id の ${log.taskId} がありません`);
		} else if (log.sub && !index.sub(subKey(log.taskId, log.sub))) {
			// 消したサブの行は消さず、集計では親に含める（ADR-0135）
			add("warning", log.path, "dangling-sub-worklog", `${log.line} 行目: sub の ${log.sub} が ${log.taskId} にありません（削除済みとして親に含めます）`);
		}
		if (log.toMs !== null && log.toMs <= log.fromMs) {
			add("error", log.path, "non-positive-worklog", `${log.line} 行目: to が from 以前です`);
		}
	}
	return problems;
}
