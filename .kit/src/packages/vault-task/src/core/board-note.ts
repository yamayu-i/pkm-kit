import { parseBoardForWrite, serializeBoard, unfinished } from "./board";
import { isLocalDate, type LocalDate } from "./dates";
import type { TaskIndex } from "./index";
import { boardSummary, upsertSummary } from "./summary";

/** Obsidian とテストで YAML の読み書きを注入する。 */
export interface BoardYaml {
	parse(text: string): unknown;
	stringify(value: Record<string, unknown>): string;
}

/** 最新の本文から完成した保存内容を作る。失敗時は一切保存しない。 */
export function closeBoardNote(text: string, date: LocalDate, index: TaskIndex, yaml: BoardYaml): string {
	if (!isLocalDate(date)) throw new Error("日付が不正です");
	if (/^(?:<{7}|={7}|>{7})(?: |\r?$)/m.test(text)) throw new Error("同期の競合を解消してからボードを締めてください");
	const fm = /^(---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/.exec(text);
	if (!fm) throw new Error("board の frontmatter がありません");
	const raw = yaml.parse(fm[2]!);
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) throw new Error("frontmatter が不正です");
	const fields = raw as Record<string, unknown>;
	if (!("board" in fields)) throw new Error("board がありません");
	const board = parseBoardForWrite(fields.board);
	if (board.closed) return text;
	for (const id of board.issues) {
		if (!index.issues.has(id)) throw new Error(`issue がありません: ${id}`);
	}
	const remaining = unfinished(index, date, board);
	if (remaining.issues.length + remaining.routines.length > 0) throw new Error("未完了のタスクがあるためボードを締められません");
	board.closed = true;

	// board のブロックだけ置換し、人の YAML のコメント・引用符・改行を保持する。
	// 複雑な YAML は推測で書き換えず、拒否する。
	const eol = fm[1]!.endsWith("\r\n") ? "\r\n" : "\n";
	const lines = fm[2]!.split(/\r?\n/);
	const starts = lines.flatMap((line, i) => /^(?:board|"board"|'board')\s*:/.test(line) ? [i] : []);
	if (starts.length !== 1) throw new Error("board の位置を安全に特定できません");
	const start = starts[0]!;
	let end = start + 1;
	while (end < lines.length && /^(?:[ \t]|#|$)/.test(lines[end]!)) end++;
	// 次の欄に付いたコメント・空行は残す。
	while (end > start + 1 && /^(?:\s*#.*|\s*)$/.test(lines[end - 1]!)) end--;
	const replacement = yaml.stringify({ board: serializeBoard(board) }).trimEnd().split(/\r?\n/);
	const nextFm = [...lines.slice(0, start), ...replacement, ...lines.slice(end)].join(eol);
	const nextFields = yaml.parse(nextFm) as Record<string, unknown>;
	const withoutBoard = (value: Record<string, unknown>) => Object.fromEntries(Object.entries(value).filter(([key]) => key !== "board"));
	if (JSON.stringify(withoutBoard(fields)) !== JSON.stringify(withoutBoard(nextFields))) throw new Error("board 以外の欄が変わるため保存できません");
	const next = fm[1] + nextFm + fm[3] + text.slice(fm[0].length);
	return upsertSummary(next, boardSummary(index, date, board));
}
