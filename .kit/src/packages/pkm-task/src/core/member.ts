import type { Member } from "./schema";

/** member の表示と検索（ADR-0035） */

/** 委任先を選ぶ画面と Members の一覧の表示: `@alias - nickname (name)` */
export function memberLabel(m: Member): string {
	return `@${m.alias} - ${m.nickname} (${m.name})`;
}

/** 検索語の正規化。前後の空白と先頭の @ を外し、小文字にする */
export function memberQuery(query: string): string {
	return query.trim().replace(/^@+/, "").trim().toLowerCase();
}

/** alias / nickname / name / ID のどれかに部分一致するか。空の検索語はすべてに一致する */
export function memberMatches(m: Member, query: string): boolean {
	const q = memberQuery(query);
	return [m.alias, m.nickname, m.name, m.id].some((v) => v.toLowerCase().includes(q));
}

/** alias / nickname / name のどれかに完全一致するか（「新しく作る」を出すかの判定） */
export function memberExactly(m: Member, query: string): boolean {
	const q = memberQuery(query);
	return q !== "" && [m.alias, m.nickname, m.name].some((v) => v.toLowerCase() === q);
}

/** ID の番号順 */
export function sortMembers(members: Iterable<Member>): Member[] {
	return [...members].sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
}

/** Members の一覧の並べ替えの項目（ADR-0036） */
export type MemberSortKey = "id" | "nickname" | "name" | "alias" | "delegated" | "created";

export const MEMBER_SORTS: { key: MemberSortKey; label: string }[] = [
	{ key: "id", label: "ID" },
	{ key: "nickname", label: "nickname" },
	{ key: "name", label: "name" },
	{ key: "alias", label: "alias" },
	{ key: "delegated", label: "委任中の数" },
	{ key: "created", label: "created" },
];

export interface MemberQuery {
	text: string;
	/** すべて持つものだけを出す（AND） */
	labels: string[];
	sort: MemberSortKey;
	desc: boolean;
}

export function defaultMemberQuery(): MemberQuery {
	return { text: "", labels: [], sort: "id", desc: false };
}

function sortValue(m: Member, key: MemberSortKey, delegated: ReadonlyMap<string, number>): string | number | null {
	switch (key) {
		case "id":
			return Number(m.id.slice(2));
		case "nickname":
			return m.nickname;
		case "name":
			return m.name;
		case "alias":
			return m.alias;
		case "delegated":
			return delegated.get(m.id) ?? 0;
		case "created": {
			const t = m.created === null ? Number.NaN : Date.parse(m.created);
			return Number.isNaN(t) ? null : t;
		}
	}
}

/** 絞り込みと並べ替え。値が同じなら ID の順、値のないものは並び順にかかわらず後ろ（Issues の一覧と同じ規則） */
export function queryMembers(members: Iterable<Member>, q: MemberQuery, delegated: ReadonlyMap<string, number>): Member[] {
	const byId = (a: Member, b: Member) => a.id.localeCompare(b.id, "en", { numeric: true });
	return [...members]
		.filter((m) => memberMatches(m, q.text) && q.labels.every((l) => m.labels.includes(l)))
		.sort((a, b) => {
			const va = sortValue(a, q.sort, delegated);
			const vb = sortValue(b, q.sort, delegated);
			if (va === vb) return byId(a, b);
			if (va === null) return 1;
			if (vb === null) return -1;
			const c = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "ja");
			return q.desc ? -c : c;
		});
}
