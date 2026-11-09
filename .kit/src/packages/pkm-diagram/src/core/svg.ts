/**
 * Draw.io の編集可能 SVG（ADR-0064）。DOM にも Obsidian にも Node にも依存しない文字列の処理。
 * - 編集用 XML（<mxfile>）は、ルートの <svg> の開始タグの content 属性にある
 * - 共有用の SVG は、その属性だけを開始タグから除いたもの（ほかのバイトは変えない）
 */

/** 図のファイルの拡張子（二重の拡張子） */
export const DRAWIO_SVG_SUFFIX = ".drawio.svg";
/** SVG の大きさの上限（pkm-html の画像の上限と同じ） */
export const MAX_SVG_BYTES = 10 * 1024 * 1024;
/** 編集用 XML の大きさの上限（展開した後の文字数） */
export const MAX_XML_CHARS = 20 * 1024 * 1024;

export function isDrawioSvgPath(path: string): boolean {
	return path.toLowerCase().endsWith(DRAWIO_SVG_SUFFIX) && path.length > DRAWIO_SVG_SUFFIX.length && !path.endsWith(`/${DRAWIO_SVG_SUFFIX}`);
}

/** 図の SVG（.drawio.svg と、AI が書く / D2 で描く .svg。ADR-0102） */
export function isDiagramSvgPath(path: string): boolean {
	const base = path.split("/").pop() ?? "";
	return base.toLowerCase().endsWith(".svg") && base.length > ".svg".length;
}

export class DrawioFormatError extends Error {
	override name = "DrawioFormatError";
}

export interface SvgAttribute {
	name: string;
	/** 引用符の中の生の値（実体参照はそのまま） */
	raw: string;
	/** 属性の前の空白から、閉じる引用符の次までの範囲 */
	start: number;
	end: number;
}

export interface RootSvgTag {
	/** `<svg` の位置 */
	start: number;
	/** 開始タグの `>` の次 */
	end: number;
	attributes: SvgAttribute[];
}

/** ルートの <svg> の開始タグを読む。XML 宣言・コメント・DOCTYPE（内部サブセットなし）を飛ばす */
export function parseRootSvg(text: string): RootSvgTag {
	let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;
	const skipSpace = () => {
		while (i < text.length && /\s/.test(text[i] as string)) i++;
	};
	for (;;) {
		skipSpace();
		if (text.startsWith("<?", i)) {
			const end = text.indexOf("?>", i + 2);
			if (end < 0) throw new DrawioFormatError("XML 宣言が閉じていない");
			i = end + 2;
		} else if (text.startsWith("<!--", i)) {
			const end = text.indexOf("-->", i + 4);
			if (end < 0) throw new DrawioFormatError("コメントが閉じていない");
			i = end + 3;
		} else if (/^<!DOCTYPE\b/i.test(text.slice(i, i + 9))) {
			const end = text.indexOf(">", i);
			if (end < 0) throw new DrawioFormatError("DOCTYPE が閉じていない");
			// 内部サブセット（実体の宣言）は受け付けない
			if (text.slice(i, end).includes("[")) throw new DrawioFormatError("DOCTYPE に実体の宣言がある");
			i = end + 1;
		} else {
			break;
		}
	}
	if (!/^<svg[\s>/]/.test(text.slice(i, i + 5))) throw new DrawioFormatError("SVG ではない（ルートが <svg> ではない）");
	const start = i;
	i += 4;
	const attributes: SvgAttribute[] = [];
	for (;;) {
		const before = i;
		skipSpace();
		if (i >= text.length) throw new DrawioFormatError("<svg> の開始タグが閉じていない");
		if (text[i] === ">") return { start, end: i + 1, attributes };
		if (text.startsWith("/>", i)) return { start, end: i + 2, attributes };
		if (i === before) throw new DrawioFormatError("<svg> の属性の間に空白がない");
		const nameMatch = /^[^\s=/>"']+/.exec(text.slice(i, i + 256));
		if (!nameMatch) throw new DrawioFormatError("<svg> の属性を読めない");
		const name = nameMatch[0];
		i += name.length;
		skipSpace();
		if (text[i] !== "=") throw new DrawioFormatError(`<svg> の属性 ${name} に値がない`);
		i++;
		skipSpace();
		const quote = text[i];
		if (quote !== '"' && quote !== "'") throw new DrawioFormatError(`<svg> の属性 ${name} の値が引用符で囲まれていない`);
		const close = text.indexOf(quote, i + 1);
		if (close < 0) throw new DrawioFormatError(`<svg> の属性 ${name} の値が閉じていない`);
		const raw = text.slice(i + 1, close);
		if (raw.includes("<")) throw new DrawioFormatError(`<svg> の属性 ${name} の値に < がある`);
		if (attributes.some((a) => a.name === name)) throw new DrawioFormatError(`<svg> の属性 ${name} が重複している`);
		attributes.push({ name, raw, start: before, end: close + 1 });
		i = close + 1;
	}
}

const NAMED_ENTITIES: Readonly<Record<string, string>> = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };

/** XML の属性の値の実体参照を戻す。知らない実体はエラー */
export function decodeXmlEntities(raw: string): string {
	if (/&(?![^;&\s]{1,16};)/.test(raw)) throw new DrawioFormatError("& が実体参照になっていない");
	return raw.replace(/&([^;&\s]{1,16});/g, (_, ref: string) => {
		if (ref.startsWith("#x") || ref.startsWith("#X")) {
			const code = Number.parseInt(ref.slice(2), 16);
			if (!/^[0-9a-f]+$/i.test(ref.slice(2)) || code > 0x10ffff) throw new DrawioFormatError(`読めない文字参照 &${ref};`);
			return String.fromCodePoint(code);
		}
		if (ref.startsWith("#")) {
			const code = Number.parseInt(ref.slice(1), 10);
			if (!/^[0-9]+$/.test(ref.slice(1)) || code > 0x10ffff) throw new DrawioFormatError(`読めない文字参照 &${ref};`);
			return String.fromCodePoint(code);
		}
		const named = NAMED_ENTITIES[ref];
		if (named === undefined) throw new DrawioFormatError(`知らない実体参照 &${ref};`);
		return named;
	});
}

function utf8FromBase64(b64: string): string | null {
	if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64) || b64.length % 4 !== 0) return null;
	try {
		const binary = atob(b64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
		return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	} catch {
		return null;
	}
}

export type DiagramXml = { kind: "diagram"; xml: string } | { kind: "plain-svg" };

/**
 * SVG の中の編集用 XML を取り出す。content 属性がなければ普通の SVG。
 * content は XML（実体参照で書いたもの）か、古い版の base64。どちらでもなければエラー
 */
export function extractDiagramXml(svg: string): DiagramXml {
	if (svg.length > MAX_SVG_BYTES) throw new DrawioFormatError("SVG が大きすぎる（10 MiB まで）");
	const root = parseRootSvg(svg);
	const content = root.attributes.find((a) => a.name === "content");
	if (!content) return { kind: "plain-svg" };
	let xml = decodeXmlEntities(content.raw).trim();
	if (!xml.startsWith("<")) {
		const decoded = utf8FromBase64(xml);
		if (decoded === null || !decoded.trimStart().startsWith("<")) throw new DrawioFormatError("編集用 XML の形式を読めない");
		xml = decoded.trim();
	}
	if (xml.length > MAX_XML_CHARS) throw new DrawioFormatError("編集用 XML が大きすぎる");
	if (!/^<(mxfile|mxGraphModel)[\s>/]/.test(xml)) throw new DrawioFormatError("編集用 XML が <mxfile> / <mxGraphModel> ではない");
	if (/<!(DOCTYPE|ENTITY)/i.test(xml)) throw new DrawioFormatError("編集用 XML に DOCTYPE・実体の宣言がある");
	return { kind: "diagram", xml };
}

/** 編集用 XML のページの数（<mxGraphModel> だけなら 1） */
export function countPages(xml: string): number {
	if (xml.startsWith("<mxGraphModel")) return 1;
	return (xml.match(/<diagram[\s>]/g) ?? []).length;
}

/** 共有用の SVG: ルートの開始タグから content 属性だけを除く。普通の SVG はそのまま */
export function toSharingSvg(svg: string): string {
	if (svg.length > MAX_SVG_BYTES) throw new DrawioFormatError("SVG が大きすぎる（10 MiB まで）");
	const root = parseRootSvg(svg);
	const content = root.attributes.find((a) => a.name === "content");
	if (!content) return svg;
	return svg.slice(0, content.start) + svg.slice(content.end);
}

/** 検査用に、文字参照（&#106; &#x6a;）と &colon; を戻す。読めないものは残す */
function decodeLoosely(value: string): string {
	return value.replace(/&#(x[0-9a-f]{1,6}|[0-9]{1,7});?|&colon;/gi, (m, ref: string | undefined) => {
		if (ref === undefined) return ":";
		const code = ref[0] === "x" || ref[0] === "X" ? Number.parseInt(ref.slice(1), 16) : Number.parseInt(ref, 10);
		return code <= 0x10ffff ? String.fromCodePoint(code) : m;
	});
}

export interface SvgProblems {
	/** 埋め込みを止めるもの（スクリプトを動かしうるもの） */
	errors: string[];
	/** 外部の読み込み（<img> の中では読み込まれず、表示が欠ける） */
	warnings: string[];
}

/**
 * 共有用の SVG の検査。<img> の中の SVG ではスクリプトも外部の読み込みも動かないが、
 * SVG のファイルとして開かれる場合に備えて、スクリプトを動かしうるものは止める
 */
export function findSvgProblems(svg: string): SvgProblems {
	const errors = new Set<string>();
	const warnings = new Set<string>();
	if (/<!ENTITY/i.test(svg)) errors.add("実体の宣言（<!ENTITY>）");
	for (const m of svg.matchAll(/<([a-zA-Z][\w:.-]*)\b([^>]*)>/g)) {
		const tag = (m[1] as string).toLowerCase();
		const attrs = m[2] as string;
		const local = tag.includes(":") ? tag.slice(tag.indexOf(":") + 1) : tag;
		if (["script", "iframe", "object", "embed", "frame", "frameset", "handler", "listener"].includes(local)) errors.add(`<${local}> 要素`);
		if (/(^|\s)on[a-z]+\s*=/i.test(attrs)) errors.add("イベント属性（on*）");
		for (const v of attrs.matchAll(/=\s*(?:"([^"]*)"|'([^']*)')/g)) {
			const value = decodeLoosely(v[1] ?? v[2] ?? "").replace(/[\u0000-\u0020]/g, "").toLowerCase();
			if (value.startsWith("javascript:") || value.startsWith("vbscript:") || value.startsWith("data:text/html")) errors.add("スクリプトを動かす URL");
		}
		if (["image", "use", "feimage"].includes(local) && /(^|\s)(xlink:)?href\s*=\s*["']\s*(https?:|\/\/)/i.test(attrs)) {
			warnings.add(`外部の画像・図形の読み込み（<${local}>）`);
		}
		if (/url\(\s*["']?\s*(https?:|\/\/)/i.test(attrs)) warnings.add("外部の url()");
	}
	if (/@import/i.test(svg)) warnings.add("CSS の @import");
	if (/url\(\s*["']?\s*(https?:|\/\/)/i.test(svg.replace(/<[^>]*>/g, ""))) warnings.add("外部の url()");
	return { errors: [...errors], warnings: [...warnings] };
}
