/**
 * 見本のデッキ: スキルの patterns/<id>.md のひな形を、パターンの一覧の順に並べたもの。
 * プレビューとテストが使う（ひな形の正本は md。ここに写しを持たない）
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { crc32, deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";

export const PATTERN_DOCS = fileURLToPath(new URL("../../../../../.claude/skills/slide/patterns/", import.meta.url));

/** patterns/<id>.md の最初の html のコードブロック */
export function templateOf(id) {
	const text = readFileSync(join(PATTERN_DOCS, `${id}.md`), "utf8");
	const m = /```html\n([\s\S]*?)\n```/.exec(text);
	if (!m) throw new Error(`${id}.md に html のひな形がない`);
	return m[1];
}

/** ひな形が参照する添付（src="…"）の名前 */
export function assetsOf(html) {
	return [...html.matchAll(/<img[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
}

const PLACEHOLDER_SVG = (label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600"><rect width="1200" height="600" fill="#d9d8d2"/><text x="600" y="310" font-family="sans-serif" font-size="40" text-anchor="middle" fill="#57564f">${label}</text></svg>`;
/** 単色の PNG（写真と画面の代わり）。依存なしで作る */
function placeholderPng(width, height) {
	const chunk = (type, data) => {
		const body = Buffer.concat([Buffer.from(type), data]);
		const out = Buffer.alloc(body.length + 8);
		out.writeUInt32BE(data.length, 0);
		body.copy(out, 4);
		out.writeUInt32BE(crc32(body) >>> 0, body.length + 4);
		return out;
	};
	const head = Buffer.alloc(13);
	head.writeUInt32BE(width, 0);
	head.writeUInt32BE(height, 4);
	head.set([8, 0, 0, 0, 0], 8); // 8 ビットのグレースケール
	const raw = Buffer.alloc((width + 1) * height, 0xd4);
	for (let y = 0; y < height; y++) raw[y * (width + 1)] = 0;
	return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", head), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

/** Vault の代わりのフォルダに、見本のデッキ（slide/<name>/deck.html と添付）を書く */
export function writeGallery(root, ids, { name = "gallery", head = "" } = {}) {
	const folder = join(root, "slide", name);
	mkdirSync(folder, { recursive: true });
	const sections = ids.map(templateOf);
	for (const asset of sections.flatMap(assetsOf)) {
		writeFileSync(join(folder, asset), asset.endsWith(".svg") ? PLACEHOLDER_SVG(asset) : placeholderPng(1200, 675));
	}
	writeFileSync(join(folder, "deck.html"), `<title>パターンの見本</title>\n<meta name="deck-author" content="pkm-kit">\n${head}\n${sections.join("\n\n")}\n`);
	return folder;
}
