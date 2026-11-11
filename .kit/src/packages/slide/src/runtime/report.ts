/**
 * レビューのレポート（ADR-0117 の 4）。ブラウザでコピーし、Claude Code に貼り付ける。
 * 受け取った側は、スキルの review.md に従って deck.html を直す。DOM に依存しない（テストで形を確かめる）
 */
export interface Comment {
	id: string;
	/** スライドの番号（1 始まり）。デッキ全体へのコメントは 0 */
	n: number;
	/** スライドの見出し */
	title: string;
	/** スライドの中の部品の位置（子の番号の列）。スライド全体へのコメントは null */
	path: number[] | null;
	/** 部品の種類（h2、div.card など） */
	kind: string;
	/** deck.html の行 */
	line: number;
	/** 部品の文の冒頭 */
	excerpt: string;
	/** コメントを付けたときの部品の中身のハッシュ（後で変わったかを見る） */
	hash: string;
	text: string;
}

export type ReportComment = Comment & { state?: "" | "Updated" | "Not found" };

/** 短い文字列のハッシュ（暗号の用途ではない。変わったかどうかを見るだけ） */
export function hashText(text: string): string {
	let x = 5381;
	for (let i = 0; i < text.length; i++) x = ((x << 5) + x + text.charCodeAt(i)) | 0;
	return (x >>> 0).toString(36);
}

function indent(text: string): string {
	return text
		.split("\n")
		.map((l) => `   ${l}`)
		.join("\n");
}

export function buildReport(deckPath: string, build: string, comments: readonly ReportComment[]): string {
	const source = `${deckPath}/deck.html`;
	const lines = [
		`# スライドのレビュー: ${source}`,
		"",
		`- コメント: ${comments.length} 件`,
		`- ビルド: ${build}`,
		`- 頼みたいこと: slide スキルの review.md に従って ${source} を直し、\`node .kit/bin/slide.mjs build ${deckPath}\` でビルドし直してください。コメントごとに、どう直したか（直さなかったなら理由）を番号で返してください。`,
		"",
	];
	let no = 0;
	const item = (c: ReportComment): string[] => {
		no++;
		const where = c.path === null ? "スライド全体" : `\`${c.kind}\`${c.excerpt === "" ? "" : `「${c.excerpt}」`}`;
		const at = c.line > 0 ? `（deck.html:${c.line}）` : "";
		const state = c.state === "Updated" ? " ※コメントの後に、この部品は変わっています" : c.state === "Not found" ? " ※コメントを付けた部品が今のビルドにありません" : "";
		return [`${no}. ${c.n === 0 ? "デッキ全体" : `${where}${at}${state}`}`, indent(c.text), ""];
	};
	const general = comments.filter((c) => c.n === 0);
	if (general.length > 0) {
		lines.push("## デッキ全体", "");
		for (const c of general) lines.push(...item(c));
	}
	const numbers = [...new Set(comments.filter((c) => c.n > 0).map((c) => c.n))].sort((a, b) => a - b);
	for (const n of numbers) {
		const group = comments.filter((c) => c.n === n);
		lines.push(`## スライド ${n}「${group[0]?.title ?? ""}」`, "");
		for (const c of group) lines.push(...item(c));
	}
	return `${lines.join("\n").trimEnd()}\n`;
}
