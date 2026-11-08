/**
 * コミット時に updated を付与する規則(ADR-0028)。Obsidian にも Node にも依存しない。
 * 規則の正本はここだけ(ADR-0009)。PC の Git CLI 用の cli/stamp-updated.mjs と、
 * Vault の検査(.claude/scripts/wiki-lint.mjs)もこのファイルを使う。表は test/fixtures/updated-cases.json
 */
const EXCLUDED_DIRS = new Set(["template", "tmp"]);

/** updated を付与する対象のパスか。Vault ルートからのパス */
export function isTargetPath(path: string): boolean {
	if (!path.endsWith(".md")) return false;
	const parts = path.split("/");
	if (parts.some((p) => p.startsWith("."))) return false;
	if (parts[parts.length - 1] === "README.md") return false;
	if (parts.length > 1 && EXCLUDED_DIRS.has(parts[0] as string)) return false;
	return true;
}

/** frontmatter を閉じる `---` の行の添字。lines は "\n" で分けた行(行末の "\r" は残す)。なければ null */
function frontmatterEnd(lines: string[]): number | null {
	if (lines[0]?.replace(/\r$/, "") !== "---") return null;
	for (let i = 1; i < lines.length; i++) if ((lines[i] as string).replace(/\r$/, "") === "---") return i;
	return null;
}

const UPDATED_RE = /^updated:/;

function findLine(lines: string[], end: number, re: RegExp): number {
	for (let i = 1; i < end; i++) if (re.test(lines[i] as string)) return i;
	return -1;
}

/** updated を iso にする。updated の行だけを書き換える。frontmatter がなければそのまま返す。updated が曖昧(重複・リスト・複数の値)なら例外 */
export function setUpdated(text: string, iso: string): string {
	const lines = text.split("\n");
	const end = frontmatterEnd(lines);
	if (end === null) return text;
	const cr = (lines[0] as string).endsWith("\r") ? "\r" : "";
	const at = findLine(lines, end, UPDATED_RE);
	if (lines.slice(1, end).filter((l) => UPDATED_RE.test(l)).length > 1) throw new Error("updated が重複しています");
	if (at !== -1) {
		const value = (lines[at] as string).slice("updated:".length).replace(/\r$/, "").trim();
		// 単一の日時でなければ(リスト、複数の値)、書き換えずに止める
		if (/^\s/.test(lines[at + 1] ?? "") && at + 1 < end) throw new Error("updated は単一の日時にしてください");
		if (/\s/.test(value.replace(/^(["'])(.*)\1$/, "$2"))) throw new Error("updated は単一の日時にしてください");
		const quote = value.startsWith("'") ? "'" : value === "" || value.startsWith('"') ? '"' : "";
		lines[at] = `updated: ${quote}${iso}${quote}${cr}`;
	} else {
		const created = findLine(lines, end, /^created:/);
		lines.splice(created !== -1 ? created + 1 : end, 0, `updated: "${iso}"${cr}`);
	}
	return lines.join("\n");
}

/** updated の行を除いた内容。比較用 */
function withoutUpdated(text: string): string {
	const lines = text.split("\n");
	const end = frontmatterEnd(lines);
	if (end === null) return text;
	const at = findLine(lines, end, UPDATED_RE);
	if (at !== -1) lines.splice(at, 1);
	return lines.join("\n");
}

/** この変更に updated を付与するか。old は HEAD の内容(新規なら null)、next は今の内容 */
export function shouldStamp(old: string | null, next: string): boolean {
	if (frontmatterEnd(next.split("\n")) === null) return false;
	if (old === null) return true;
	return withoutUpdated(old) !== withoutUpdated(next);
}

function valueOf(line: string): string {
	return line.slice("updated:".length).replace(/\r$/, "").trim().replace(/^(["'])(.*)\1$/, "$2");
}

/** 両側で updated を変えたときに採る行。新しい方。どちらかが空なら値のある方、読めなければ ours */
export function mergeUpdatedLine(ours: string | null, theirs: string | null): string | null {
	if (ours === null || valueOf(ours) === "") return theirs ?? ours;
	if (theirs === null || valueOf(theirs) === "") return ours;
	const [o, t] = [Date.parse(valueOf(ours)), Date.parse(valueOf(theirs))];
	if (Number.isNaN(o) || Number.isNaN(t)) return ours;
	return t > o ? theirs : ours;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** 秒までの ISO 8601。offsetMinutes は Date#getTimezoneOffset と同じ向き(JST は -540)。UTC は Z */
export function formatIso(date: Date, offsetMinutes: number = date.getTimezoneOffset()): string {
	const l = new Date(date.getTime() - offsetMinutes * 60000);
	const stamp = `${l.getUTCFullYear()}-${pad(l.getUTCMonth() + 1)}-${pad(l.getUTCDate())}T${pad(l.getUTCHours())}:${pad(l.getUTCMinutes())}:${pad(l.getUTCSeconds())}`;
	if (offsetMinutes === 0) return `${stamp}Z`;
	const abs = Math.abs(offsetMinutes);
	return `${stamp}${offsetMinutes < 0 ? "+" : "-"}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** frontmatter の updated の行(なければ null) */
export function updatedLine(text: string): string | null {
	const lines = text.split("\n");
	const end = frontmatterEnd(lines);
	if (end === null) return null;
	const at = findLine(lines, end, UPDATED_RE);
	return at === -1 ? null : (lines[at] as string).replace(/\r$/, "");
}

const MERGE_MARK = "updated: __pkm-git-merge__";

/** マージ用に、updated の行を位置を保ったまま目印の行に置き換える。updated の差で衝突させないため */
export function markUpdated(text: string): string {
	const lines = text.split("\n");
	const end = frontmatterEnd(lines);
	if (end === null) return text;
	const at = findLine(lines, end, UPDATED_RE);
	if (at === -1) return text;
	lines[at] = MERGE_MARK + ((lines[at] as string).endsWith("\r") ? "\r" : "");
	return lines.join("\n");
}

/** markUpdated の目印の行(すべて)を、採用する updated の行に戻す */
export function unmarkUpdated(text: string, line: string | null): string {
	if (!text.includes(MERGE_MARK)) return text;
	const out: string[] = [];
	for (const l of text.split("\n")) {
		if (l.replace(/\r$/, "") !== MERGE_MARK) out.push(l);
		else if (line !== null) out.push(line + (l.endsWith("\r") ? "\r" : ""));
	}
	return out.join("\n");
}
