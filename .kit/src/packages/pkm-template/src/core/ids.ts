/**
 * issue / routine / member の ID（`i-N` / `r-N` / `m-N`）。
 * 連番の規則は pkm-task の `core/ids.ts` と同じ（既存の最大値 + 1）。両者は独立に持つ（ADR-0023）。
 */
export type IdPrefix = "i" | "r" | "m";

export const ID_PREFIXES: readonly IdPrefix[] = ["i", "r", "m"];

export function isIdPrefix(value: string): value is IdPrefix {
	return (ID_PREFIXES as readonly string[]).includes(value);
}

export function idNumber(id: string, prefix: IdPrefix): number | null {
	const m = new RegExp(`^${prefix}-([1-9]\\d*)$`).exec(id);
	return m ? Number(m[1]) : null;
}

/** 既存の名前（ファイルの basename）の中の最大値 + 1 の ID を返す */
export function nextId(prefix: IdPrefix, existingNames: Iterable<string>): string {
	let max = 0;
	for (const name of existingNames) {
		const n = idNumber(name, prefix);
		if (n !== null && n > max) max = n;
	}
	return `${prefix}-${max + 1}`;
}
