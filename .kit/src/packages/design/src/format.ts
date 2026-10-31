/**
 * tokens.json の書式。値（色・大きさなど）の小さいオブジェクトや配列は 1 行にまとめ、
 * それ以外はタブでインデントする。`pnpm --filter design format` で整え、テストで崩れていないかを見る
 */
const INLINE_MAX = 110;

function inline(value: unknown): string | null {
	if (value === null || typeof value !== "object") return JSON.stringify(value);
	const parts: string[] = [];
	if (Array.isArray(value)) {
		for (const v of value) {
			const s = inline(v);
			if (s === null) return null;
			parts.push(s);
		}
		return `[${parts.join(", ")}]`;
	}
	for (const [k, v] of Object.entries(value)) {
		if (k === "$description" || k === "$extensions") return null;
		const s = inline(v);
		if (s === null) return null;
		parts.push(`${JSON.stringify(k)}: ${s}`);
	}
	return `{ ${parts.join(", ")} }`;
}

function write(value: unknown, indent: string, keyLength: number): string {
	if (value === null || typeof value !== "object") return JSON.stringify(value);
	const one = inline(value);
	if (one !== null && indent.length + keyLength + one.length <= INLINE_MAX) return one;
	const next = `${indent}\t`;
	if (Array.isArray(value)) {
		return `[\n${value.map((v) => next + write(v, next, 0)).join(",\n")}\n${indent}]`;
	}
	const entries = Object.entries(value as Record<string, unknown>);
	const body = entries.map(([k, v]) => `${next}${JSON.stringify(k)}: ${write(v, next, JSON.stringify(k).length + 2)}`);
	return `{\n${body.join(",\n")}\n${indent}}`;
}

export function formatTokens(value: unknown): string {
	return `${write(value, "", 0)}\n`;
}
