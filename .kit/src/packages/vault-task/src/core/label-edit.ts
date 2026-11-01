import { formatRatio } from "../../../design/src/color.ts";
import type { TaskIndex } from "./index";
import type { LabelDef } from "./labels";
import { LABEL_CONTRAST_MIN, labelContrast } from "./lint";

/** Labels 画面で編集中の label（ADR-0024）。from は labels.json での元の名前（新しく足したものは null） */
export interface LabelDraft {
	key: number;
	from: string | null;
	name: string;
	color: string;
}

/** 保存する内容。renames は 元の名前 → 新しい名前 */
export interface LabelSavePlan {
	labels: LabelDef[];
	renames: Map<string, string>;
	removed: string[];
}

/** 名前の検査。others は同じ一覧のほかの名前 */
export function labelNameError(name: string, others: readonly string[]): string | null {
	const n = name.trim();
	if (!n) return "名前を入れてください";
	if (others.some((o) => o.trim() === n)) return "同じ名前の label があります";
	return null;
}

/** 色の検査。書式と、文字（--vt-on-label）とのコントラスト（low-contrast-label と同じ基準） */
export function labelColorError(color: string): string | null {
	if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)) return "#rrggbb の形で入れてください";
	const ratio = labelContrast(color);
	if (ratio < LABEL_CONTRAST_MIN) return `文字との比が ${formatRatio(ratio)} で、${LABEL_CONTRAST_MIN} に届きません`;
	return null;
}

/** label ごとの、使っている issue と routine の数 */
export function labelUsage(index: Pick<TaskIndex, "issues" | "routines">): Map<string, number> {
	const usage = new Map<string, number>();
	for (const item of [...index.issues.values(), ...index.routines.values()]) {
		for (const l of item.labels) usage.set(l, (usage.get(l) ?? 0) + 1);
	}
	return usage;
}

/**
 * frontmatter の `label` 欄に改名を当てる。変わらないなら undefined。
 * 文字列 1 つで書かれていたら文字列のまま返し、置き換えて重なった名前は 1 つにまとめる
 */
export function renameLabelField(raw: unknown, renames: ReadonlyMap<string, string>): unknown {
	const list = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : null;
	if (list === null) return undefined;
	let changed = false;
	const next: unknown[] = [];
	for (const v of list) {
		const to = typeof v === "string" ? renames.get(v.trim()) : undefined;
		if (to !== undefined) changed = true;
		const value = to ?? v;
		if (typeof value === "string" && next.some((x) => typeof x === "string" && x.trim() === value.trim())) {
			changed = true;
			continue;
		}
		next.push(value);
	}
	if (!changed) return undefined;
	return typeof raw === "string" && next.length === 1 ? next[0] : next;
}

/** 下書きから保存する内容を作る。名前・色のエラーや、使われている label の削除があれば例外 */
export function planLabelSave(original: readonly LabelDef[], drafts: readonly LabelDraft[], usage: ReadonlyMap<string, number>): LabelSavePlan {
	const labels: LabelDef[] = [];
	const renames = new Map<string, string>();
	for (const d of drafts) {
		const name = d.name.trim();
		const error = labelNameError(name, drafts.filter((x) => x.key !== d.key).map((x) => x.name)) ?? labelColorError(d.color);
		if (error) throw new Error(`label「${name}」: ${error}`);
		labels.push({ name, color: d.color });
		if (d.from !== null && d.from !== name) renames.set(d.from, name);
	}
	const kept = new Set(drafts.map((d) => d.from));
	const removed = original.map((l) => l.name).filter((n) => !kept.has(n));
	assertUnused(removed, usage);
	return { labels, renames, removed };
}

/** 使われている label を消そうとしていたら例外（ADR-0024） */
export function assertUnused(removed: readonly string[], usage: ReadonlyMap<string, number>): void {
	const used = removed.filter((n) => (usage.get(n) ?? 0) > 0);
	if (used.length > 0) throw new Error(`使われている label は削除できません: ${used.join(", ")}`);
}
