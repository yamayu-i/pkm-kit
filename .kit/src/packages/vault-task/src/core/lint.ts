import { contrastRatio, formatRatio, parseHex, stack } from "../../../design/src/color.ts";
import { colors } from "../../../design/generated/tokens.ts";
import { TaskIndex, type VaultData } from "./index";
import { LABELS_PATH } from "./labels";
import { isId } from "./ids";
import type { Problem } from "./problem";
import { STATUS_DETAIL_MAX } from "./schema";

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
		if (issue.parent !== null) {
			if (issue.parent === issue.id) add("error", path, "self-parent", "parent が自分自身です");
			else if (!index.issues.has(issue.parent)) add("error", path, "dangling-parent", `parent の ${issue.parent} がありません`);
			else if (!index.canSetParent(issue.id, issue.parent)) {
				add("error", path, "parent-cycle", "親子関係が循環しています");
			}
		}
		for (const ref of issue.related) {
			if (isId(ref, "i")) {
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
		if (issue.statusDetail.length > STATUS_DETAIL_MAX) {
			add("warning", path, "long-status-detail", `status-detail が ${STATUS_DETAIL_MAX} 文字を超えています`);
		}
		if (issue.status === "someday" && (issue.scheduled.length > 0 || issue.softDeadline !== null || issue.deadline !== null)) {
			add("warning", path, "someday-with-dates", "someday なのに scheduled / soft_deadline / deadline が残っています");
		}
		if (issue.revisit !== null && issue.status !== "someday") {
			add("warning", path, "stale-revisit", "someday ではないのに revisit があります");
		}
		for (const label of issue.labels) {
			if (!labelNames.has(label)) add("warning", path, "unknown-label", `label「${label}」が labels.json にありません`);
		}
	}

	// member の label も issue と同じ定義を使う（ADR-0036）
	for (const member of data.members) {
		for (const label of member.labels) {
			if (!labelNames.has(label)) add("warning", member.path, "unknown-label", `label「${label}」が labels.json にありません`);
		}
	}

	for (const b of data.boards) {
		for (const id of b.board.issues) {
			if (!index.issues.has(id)) add("warning", b.path, "dangling-board-issue", `ボードに載っている ${id} がありません`);
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
		}
		if (log.toMs !== null && log.toMs <= log.fromMs) {
			add("error", log.path, "non-positive-worklog", `${log.line} 行目: to が from 以前です`);
		}
	}
	return problems;
}
