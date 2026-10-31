import type { Problem } from "./problem";

export const GROUPS_PATH = "issue/board-groups.json";
/** ボードの横の段数。グループはこのうち何段分を使うか（span）で並べる */
export const BOARD_COLUMNS = 4;
export const UNGROUPED = "";

/** task board のグループ（ADR-0014）。2 階層まで */
export interface GroupDef {
	name: string;
	/** 横幅（1〜BOARD_COLUMNS 段） */
	span: number;
	children: GroupDef[];
}

function parseGroup(value: unknown, depth: number, problems: string[]): GroupDef | null {
	const o = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
	const name = typeof o.name === "string" ? o.name.trim() : "";
	if (!name || name.includes("/")) {
		problems.push(`グループ名がないか、/ を含んでいます: ${JSON.stringify(value)}`);
		return null;
	}
	const span = typeof o.span === "number" && Number.isInteger(o.span) ? Math.min(BOARD_COLUMNS, Math.max(1, o.span)) : 1;
	const children: GroupDef[] = [];
	if (Array.isArray(o.children)) {
		if (depth >= 1 && o.children.length > 0) problems.push(`グループは 2 階層までです: ${name}`);
		else for (const c of o.children) {
			const g = parseGroup(c, depth + 1, problems);
			if (g && !children.some((x) => x.name === g.name)) children.push(g);
		}
	}
	return { name, span, children };
}

/** `issue/board-groups.json` を読む */
export function parseGroups(text: string): { groups: GroupDef[]; problems: Problem[] } {
	const messages: string[] = [];
	let data: unknown;
	try {
		data = JSON.parse(text);
	} catch {
		data = null;
		messages.push("JSON として読めません");
	}
	const groups: GroupDef[] = [];
	if (Array.isArray(data)) {
		for (const item of data) {
			const g = parseGroup(item, 0, messages);
			if (g && !groups.some((x) => x.name === g.name)) groups.push(g);
		}
	} else if (data !== null) messages.push("配列ではありません");
	return { groups, problems: messages.map((message) => ({ severity: "error", path: GROUPS_PATH, code: "invalid-groups", message })) };
}

export function serializeGroups(groups: GroupDef[]): string {
	const strip = (g: GroupDef): unknown => ({ name: g.name, span: g.span, ...(g.children.length > 0 ? { children: g.children.map(strip) } : {}) });
	return `${JSON.stringify(groups.map(strip), null, 2)}\n`;
}

/** グループの鍵（`親` / `親/子`）の一覧 */
export function groupKeys(groups: GroupDef[]): string[] {
	return groups.flatMap((g) => [g.name, ...g.children.map((c) => `${g.name}/${c.name}`)]);
}

/** その鍵、またはその子孫の鍵か（グループでまとめて再生 / 停止するときに使う） */
export function inGroup(key: string, group: string): boolean {
	return key === group || key.startsWith(`${group}/`);
}
