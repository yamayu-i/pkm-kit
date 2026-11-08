/**
 * HTML を表示するときの決まり（ADR-0037）。DOM にも Obsidian にも依存しない。
 * パスはどれも Vault ルートからの相対パス（先頭に / を付けない。区切りは /）。
 */

/** 開く拡張子 */
export const HTML_EXTENSIONS = ["html", "htm"] as const;

/**
 * iframe の <head> の最初に入れる CSP。外部の画像・CSS・フォント・フレームを読み込ませない。
 * 画像とフォントは data: だけ（Vault の中の画像は、読み込む前に data: に置き換える）
 */
export const CSP = "default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:; form-action 'none'";

/** data: に置き換える画像の拡張子と MIME タイプ */
export const IMAGE_TYPES: Readonly<Record<string, string>> = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	gif: "image/gif",
	webp: "image/webp",
	svg: "image/svg+xml",
};

/** 1 枚の画像の上限。超えたものは置き換えない */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;
const EXTERNAL_SCHEMES = new Set(["http:", "https:", "mailto:"]);

/** 区切りの . と .. を畳む。Vault ルートより上に出るなら null */
function normalize(segments: readonly string[]): string | null {
	const out: string[] = [];
	for (const s of segments) {
		if (s === "" || s === ".") continue;
		if (s === "..") {
			if (out.length === 0) return null;
			out.pop();
			continue;
		}
		out.push(s);
	}
	return out.length === 0 ? null : out.join("/");
}

function decode(s: string): string | null {
	try {
		return decodeURIComponent(s);
	} catch {
		return null;
	}
}

/** `path#frag` を path と #frag に分ける。? 以降は捨てる */
function splitRef(ref: string): { path: string; hash: string } {
	const hashAt = ref.indexOf("#");
	const hash = hashAt >= 0 ? ref.slice(hashAt) : "";
	let path = hashAt >= 0 ? ref.slice(0, hashAt) : ref;
	const queryAt = path.indexOf("?");
	if (queryAt >= 0) path = path.slice(0, queryAt);
	return { path, hash };
}

/**
 * HTML ファイル（from）の中の参照（ref）が指しうる Vault の中のパスを、試す順に返す。
 * 1. HTML ファイルからの相対パス 2. Vault ルートからのパス（先頭が / なら 2 だけ）。
 * スキームのあるもの、// で始まるもの、Vault の外に出るものは含めない
 */
export function candidatePaths(from: string, ref: string): string[] {
	const trimmed = ref.trim();
	if (trimmed === "" || SCHEME_RE.test(trimmed) || trimmed.startsWith("//") || trimmed.startsWith("\\")) return [];
	const decoded = decode(splitRef(trimmed).path);
	if (decoded === null || decoded === "" || decoded.includes("\\") || decoded.includes("\0")) return [];
	const parts = decoded.split("/");
	const dir = from.split("/").slice(0, -1);
	const result: string[] = [];
	const add = (p: string | null) => {
		if (p !== null && !result.includes(p)) result.push(p);
	};
	if (!decoded.startsWith("/")) add(normalize([...dir, ...parts]));
	add(normalize(parts));
	return result;
}

/** 拡張子から画像の MIME タイプ。対象外なら null */
export function imageType(path: string): string | null {
	const dot = path.lastIndexOf(".");
	if (dot < 0 || dot < path.lastIndexOf("/")) return null;
	return IMAGE_TYPES[path.slice(dot + 1).toLowerCase()] ?? null;
}

export type LinkTarget =
	| { kind: "anchor"; id: string }
	| { kind: "external"; url: string }
	| { kind: "vault"; candidates: string[]; subpath: string }
	| { kind: "none" };

/** リンク（<a href>）をどう扱うか */
export function classifyLink(from: string, href: string): LinkTarget {
	const trimmed = href.trim();
	if (trimmed === "") return { kind: "none" };
	if (trimmed.startsWith("#")) {
		const id = decode(trimmed.slice(1));
		return id ? { kind: "anchor", id } : { kind: "none" };
	}
	if (SCHEME_RE.test(trimmed)) {
		let url: URL;
		try {
			url = new URL(trimmed);
		} catch {
			return { kind: "none" };
		}
		return EXTERNAL_SCHEMES.has(url.protocol) ? { kind: "external", url: url.href } : { kind: "none" };
	}
	const candidates = candidatePaths(from, trimmed);
	if (candidates.length === 0) return { kind: "none" };
	const hash = splitRef(trimmed).hash;
	const subpath = hash.length > 1 ? `#${decode(hash.slice(1)) ?? ""}` : "";
	return { kind: "vault", candidates, subpath: subpath === "#" ? "" : subpath };
}

/** URL の属性の値が、スクリプトを動かす URL か（空白・制御文字を除いて比べる） */
export function isScriptUrl(value: string): boolean {
	const compact = value.replace(/[\u0000-\u0020\u007f-\u009f]/g, "").toLowerCase();
	return compact.startsWith("javascript:") || compact.startsWith("vbscript:");
}

/** バイト列を base64 にする（btoa は PC・モバイル・Node のどれにもある） */
export function bytesToBase64(bytes: Uint8Array): string {
	let binary = "";
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
	}
	return btoa(binary);
}

/** srcset の最初の URL（記述子を除く） */
export function firstSrcsetUrl(srcset: string): string | null {
	const first = srcset.trim().split(/\s+/)[0];
	if (!first) return null;
	return first.endsWith(",") ? first.slice(0, -1) : first;
}
