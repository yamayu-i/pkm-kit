import type { Problem } from "./problem";

export const GROUPS_PATH = "issue/board-groups.json";
export const UNGROUPED = "";

/**
 * task board のグループ（ADR-0015）。2 階層まで。
 * 1 階層目はボードに横に並び（狭いペインでは縦）、2 階層目はグループの中に縦に並ぶ
 */
export interface GroupDef {
	name: string;
	children: GroupDef[];
}

function parseGroup(value: unknown, depth: number, problems: string[]): GroupDef | null {
	const o = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
	const name = typeof o.name === "string" ? o.name.trim() : "";
	if (!name || name.includes("/")) {
		problems.push(`グループ名がないか、/ を含んでいます: ${JSON.stringify(value)}`);
		return null;
	}
	const children: GroupDef[] = [];
	if (Array.isArray(o.children)) {
		if (depth >= 1 && o.children.length > 0) problems.push(`グループは 2 階層までです: ${name}`);
		else
			for (const c of o.children) {
				const g = parseGroup(c, depth + 1, problems);
				if (g && !children.some((x) => x.name === g.name)) children.push(g);
			}
	}
	// 以前の形式の span（横幅）は使わないので読み捨てる
	return { name, children };
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
	const strip = (g: GroupDef): unknown => ({ name: g.name, ...(g.children.length > 0 ? { children: g.children.map(strip) } : {}) });
	return `${JSON.stringify(groups.map(strip), null, 2)}\n`;
}

/**
 * グループ名の入力の検査。`siblings` は同じ階層のグループ、`current` は改名するときの元の名前。
 * 問題がなければ null
 */
export function groupNameError(name: string, siblings: GroupDef[], current?: string): string | null {
	const n = name.trim();
	if (!n) return "名前を入れてください";
	if (n.includes("/")) return "/ は使えません";
	if (n !== current && siblings.some((g) => g.name === n)) return "同じ名前があります";
	return null;
}

/** グループの鍵（`親` / `親/子`）の一覧 */
export function groupKeys(groups: GroupDef[]): string[] {
	return groups.flatMap((g) => [g.name, ...g.children.map((c) => `${g.name}/${c.name}`)]);
}

/** その鍵、またはその子孫の鍵か（グループでまとめて再生 / 停止するときに使う） */
export function inGroup(key: string, group: string): boolean {
	return key === group || key.startsWith(`${group}/`);
}
