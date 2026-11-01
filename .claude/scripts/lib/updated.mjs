// コミット時に updated を付与する規則(ADR-0028、.plugin-src/docs/adr/0028-auto-updated.md)。
// 同じ規則を .plugin-src/packages/vault-git/src/stamp/updated.ts にも持つ。
// 両方のテストが test/fixtures/updated-cases.json を読んで揃える。

const EXCLUDED_DIRS = new Set(["temporary", "template", "tmp"]);

/** updated を付与する対象のパスか。Vault ルートからのパス */
export function isTargetPath(path) {
	if (!path.endsWith(".md")) return false;
	const parts = path.split("/");
	if (parts.some((p) => p.startsWith("."))) return false;
	if (parts.at(-1) === "README.md") return false;
	if (parts.length > 1 && EXCLUDED_DIRS.has(parts[0])) return false;
	return true;
}

/** frontmatter の範囲。lines は "\n" で分けた行(行末の "\r" は残す)。なければ null */
function frontmatterEnd(lines) {
	if (lines[0]?.replace(/\r$/, "") !== "---") return null;
	for (let i = 1; i < lines.length; i++) if (lines[i].replace(/\r$/, "") === "---") return i;
	return null;
}

const UPDATED_RE = /^updated:/;

function findLine(lines, end, re) {
	for (let i = 1; i < end; i++) if (re.test(lines[i])) return i;
	return -1;
}

/** updated を iso にする。updated の行だけを書き換える。frontmatter がなければそのまま返す。updated が曖昧(重複・リスト・複数の値)なら例外 */
export function setUpdated(text, iso) {
	const lines = text.split("\n");
	const end = frontmatterEnd(lines);
	if (end === null) return text;
	const cr = lines[0].endsWith("\r") ? "\r" : "";
	const at = findLine(lines, end, UPDATED_RE);
	if (lines.slice(1, end).filter((l) => UPDATED_RE.test(l)).length > 1) throw new Error("updated が重複しています");
	if (at !== -1) {
		const value = lines[at].slice("updated:".length).replace(/\r$/, "").trim();
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
function withoutUpdated(text) {
	const lines = text.split("\n");
	const end = frontmatterEnd(lines);
	if (end === null) return text;
	const at = findLine(lines, end, UPDATED_RE);
	if (at !== -1) lines.splice(at, 1);
	return lines.join("\n");
}

/** この変更に updated を付与するか。old は HEAD の内容(新規なら null)、next は今の内容 */
export function shouldStamp(old, next) {
	if (frontmatterEnd(next.split("\n")) === null) return false;
	if (old === null) return true;
	return withoutUpdated(old) !== withoutUpdated(next);
}

function valueOf(line) {
	return line.slice("updated:".length).replace(/\r$/, "").trim().replace(/^(["'])(.*)\1$/, "$2");
}

/** 両側で updated を変えたときに採る行。新しい方。どちらかが空なら値のある方、読めなければ ours */
export function mergeUpdatedLine(ours, theirs) {
	if (ours === null || valueOf(ours) === "") return theirs ?? ours;
	if (theirs === null || valueOf(theirs) === "") return ours;
	const [o, t] = [Date.parse(valueOf(ours)), Date.parse(valueOf(theirs))];
	if (Number.isNaN(o) || Number.isNaN(t)) return ours;
	return t > o ? theirs : ours;
}

const pad = (n) => String(n).padStart(2, "0");

/** 秒までの ISO 8601。offsetMinutes は Date#getTimezoneOffset と同じ向き(JST は -540)。UTC は Z */
export function formatIso(date, offsetMinutes = date.getTimezoneOffset()) {
	const l = new Date(date.getTime() - offsetMinutes * 60000);
	const stamp = `${l.getUTCFullYear()}-${pad(l.getUTCMonth() + 1)}-${pad(l.getUTCDate())}T${pad(l.getUTCHours())}:${pad(l.getUTCMinutes())}:${pad(l.getUTCSeconds())}`;
	if (offsetMinutes === 0) return `${stamp}Z`;
	const abs = Math.abs(offsetMinutes);
	return `${stamp}${offsetMinutes < 0 ? "+" : "-"}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** frontmatter の updated の行(なければ null)。マージで使う */
export function updatedLine(text) {
	const lines = text.split("\n");
	const end = frontmatterEnd(lines);
	if (end === null) return null;
	const at = findLine(lines, end, UPDATED_RE);
	return at === -1 ? null : lines[at].replace(/\r$/, "");
}
