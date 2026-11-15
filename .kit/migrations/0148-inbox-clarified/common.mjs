/** 0148 の migrate.mjs と check.mjs が共有するもの。依存なしの Node。パスとキーはこの移行を書いた時点のもので、後で変えない */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "issue";

/** issue の md のパス（Vault ルートからの相対）。サブフォルダは見ない */
export function targetFiles(root) {
	const full = join(root, DIR);
	if (!existsSync(full)) return [];
	return readdirSync(full, { withFileTypes: true })
		.filter((d) => d.isFile() && /^i-\d+\.md$/.test(d.name))
		.map((d) => `${DIR}/${d.name}`)
		.sort();
}

/** frontmatter（先頭の --- から次の --- まで）の中身の位置。なければ null */
function frontmatter(text) {
	const m = /^---[ \t]*\r?\n/.exec(text);
	if (!m) return null;
	const start = m[0].length;
	const end = text.slice(start).search(/^---[ \t]*(\r?\n|$)/m);
	return end < 0 ? null : { start, end: start + end };
}

/** 空の値か（なし、null、~、空の引用符、空のリスト） */
function emptyValue(raw) {
	const v = raw.replace(/[ \t]+#.*$/, "").trim();
	return v === "" || v === "null" || v === "~" || v === "''" || v === '""' || v === "[]";
}

/** key の行の値。続きに字下げした `- ` の行があれば、それもあるものとして扱う。行がなければ undefined */
function field(body, key) {
	const m = new RegExp(`^${key}[ \\t]*:([^\\r\\n]*)(\\r?\\n|$)`, "m").exec(body);
	if (!m) return undefined;
	if (!emptyValue(m[1])) return m[1].trim();
	const after = body.slice(m.index + m[0].length);
	return /^[ \t]+-[ \t]+\S/.test(after) ? "(list)" : null;
}

/**
 * clarified: true を足す対象か: status が open で、clarified がなく、scheduled・soft_deadline・deadline のどれかがある。
 * 移行の前は、日付がある issue を「整理済み」として Inbox から外していた（ADR-0006）。見た目を変えないため
 */
export function needsClarified(text) {
	const fm = frontmatter(text);
	if (fm === null) return false;
	const body = text.slice(fm.start, fm.end);
	const status = field(body, "status");
	if (typeof status !== "string" || status.replace(/^["']|["']$/g, "") !== "open") return false;
	if (field(body, "clarified") !== undefined) return false;
	return ["scheduled", "soft_deadline", "deadline"].some((k) => typeof field(body, k) === "string");
}

/** frontmatter の最後に clarified: true の行を足す（ほかの行と行末は変えない） */
export function addClarified(text) {
	if (!needsClarified(text)) return text;
	const fm = frontmatter(text);
	const eol = text.includes("\r\n") ? "\r\n" : "\n";
	return text.slice(0, fm.end) + `clarified: true${eol}` + text.slice(fm.end);
}

export function read(root, path) {
	return readFileSync(join(root, path), "utf8");
}
