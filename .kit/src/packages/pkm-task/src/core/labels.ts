import type { Problem } from "./problem";

export const LABELS_PATH = "issue/labels.json";
export const DEFAULT_LABEL_COLOR = "#d0d0d0";

export interface LabelDef {
	name: string;
	color: string;
}

/** `issue/labels.json` を読む（ADR-0007） */
export function parseLabels(text: string): { labels: LabelDef[]; problems: Problem[] } {
	const problems: Problem[] = [];
	const problem = (message: string) => problems.push({ severity: "error", path: LABELS_PATH, code: "invalid-labels", message });
	let data: unknown;
	try {
		data = JSON.parse(text);
	} catch {
		problem("JSON として読めません");
		return { labels: [], problems };
	}
	if (!Array.isArray(data)) {
		problem("配列ではありません");
		return { labels: [], problems };
	}
	const labels: LabelDef[] = [];
	for (const item of data) {
		const o = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
		if (typeof o.name !== "string" || !o.name.trim()) {
			problem(`name のない label があります: ${JSON.stringify(item)}`);
			continue;
		}
		const name = o.name.trim();
		if (labels.some((l) => l.name === name)) {
			problem(`label が重複しています: ${name}`);
			continue;
		}
		const color = typeof o.color === "string" && /^#[0-9a-f]{3,8}$/i.test(o.color) ? o.color : DEFAULT_LABEL_COLOR;
		labels.push({ name, color });
	}
	return { labels, problems };
}

/** `issue/labels.json` の中身を作る */
export function serializeLabels(labels: readonly LabelDef[]): string {
	return `${JSON.stringify(labels.map((l) => ({ name: l.name, color: l.color })), null, 2)}\n`;
}
