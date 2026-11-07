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
