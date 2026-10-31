/** issue / routine / member の ID の接頭辞（ADR-0003, 0007, 0010） */
export type IdPrefix = "i" | "r" | "m";

export function idNumber(id: string, prefix: IdPrefix): number | null {
	const m = new RegExp(`^${prefix}-([1-9]\\d*)$`).exec(id);
	return m ? Number(m[1]) : null;
}

export function isId(value: unknown, prefix: IdPrefix): value is string {
	return typeof value === "string" && idNumber(value, prefix) !== null;
}

/** 既存の ID の最大値 + 1 から `count` 個の ID を振る */
export function nextIds(prefix: IdPrefix, existing: Iterable<string>, count = 1): string[] {
	let max = 0;
	for (const id of existing) {
		const n = idNumber(id, prefix);
		if (n !== null && n > max) max = n;
	}
	return Array.from({ length: count }, (_, i) => `${prefix}-${max + 1 + i}`);
}

/** ID からファイルのパスを作る */
export function pathForId(id: string): string {
	const folder = id.startsWith("i-") ? "issue" : id.startsWith("r-") ? "routine" : "member";
	return `${folder}/${id}.md`;
}
