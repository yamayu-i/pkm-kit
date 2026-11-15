import type { Section } from "./sections";

/** 一度に足す行の数（ADR-0070 の 3） */
export const PAGE_SIZE = 50;

/** 全セクションを通した先頭の limit 行だけを残す。0 件のセクションは常に残し、上限に届かず見せられない行があるセクションは返さない */
export function visibleSections(sections: readonly Section[], limit: number): Section[] {
	const out: Section[] = [];
	let left = Math.max(0, limit);
	for (const s of sections) {
		if (left === 0 && s.items.length > 0) continue;
		const items = s.items.slice(0, left);
		left -= items.length;
		out.push({ ...s, items });
	}
	return out;
}

export function totalRows(sections: readonly Section[]): number {
	return sections.reduce((n, s) => n + s.items.length, 0);
}
