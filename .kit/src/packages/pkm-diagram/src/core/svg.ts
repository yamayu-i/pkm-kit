/**
 * 図の SVG の文字列の処理。DOM にも Obsidian にも Node にも依存しない。
 * - 共有用の SVG: ルートの <svg> の開始タグから content 属性だけを除いたもの（ほかのバイトは変えない）。
 *   以前の Draw.io の図（*.drawio.svg）は、そこに編集用 XML を持つ。大きく、共有先では要らない（ADR-0111）
 * - 埋め込む前の検査（スクリプト・外部の読み込み）
 */

/** SVG の大きさの上限（pkm-html の画像の上限と同じ） */
export const MAX_SVG_BYTES = 10 * 1024 * 1024;

/** 図の SVG（AI が書く / D2 で描く .svg と、以前の Draw.io の .drawio.svg。ADR-0102、ADR-0111） */
export function isDiagramSvgPath(path: string): boolean {
	const base = path.split("/").pop() ?? "";
	return base.toLowerCase().endsWith(".svg") && base.length > ".svg".length;
}

export class SvgFormatError extends Error {
	override name = "SvgFormatError";
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
			if (end < 0) throw new SvgFormatError("XML 宣言が閉じていない");
			i = end + 2;
		} else if (text.startsWith("<!--", i)) {
			const end = text.indexOf("-->", i + 4);
			if (end < 0) throw new SvgFormatError("コメントが閉じていない");
			i = end + 3;
		} else if (/^<!DOCTYPE\b/i.test(text.slice(i, i + 9))) {
			const end = text.indexOf(">", i);
			if (end < 0) throw new SvgFormatError("DOCTYPE が閉じていない");
			// 内部サブセット（実体の宣言）は受け付けない
			if (text.slice(i, end).includes("[")) throw new SvgFormatError("DOCTYPE に実体の宣言がある");
			i = end + 1;
		} else {
			break;
		}
	}
	if (!/^<svg[\s>/]/.test(text.slice(i, i + 5))) throw new SvgFormatError("SVG ではない（ルートが <svg> ではない）");
	const start = i;
	i += 4;
	const attributes: SvgAttribute[] = [];
	for (;;) {
		const before = i;
		skipSpace();
		if (i >= text.length) throw new SvgFormatError("<svg> の開始タグが閉じていない");
		if (text[i] === ">") return { start, end: i + 1, attributes };
		if (text.startsWith("/>", i)) return { start, end: i + 2, attributes };
		if (i === before) throw new SvgFormatError("<svg> の属性の間に空白がない");
		const nameMatch = /^[^\s=/>"']+/.exec(text.slice(i, i + 256));
		if (!nameMatch) throw new SvgFormatError("<svg> の属性を読めない");
		const name = nameMatch[0];
		i += name.length;
		skipSpace();
		if (text[i] !== "=") throw new SvgFormatError(`<svg> の属性 ${name} に値がない`);
		i++;
		skipSpace();
		const quote = text[i];
		if (quote !== '"' && quote !== "'") throw new SvgFormatError(`<svg> の属性 ${name} の値が引用符で囲まれていない`);
		const close = text.indexOf(quote, i + 1);
		if (close < 0) throw new SvgFormatError(`<svg> の属性 ${name} の値が閉じていない`);
		const raw = text.slice(i + 1, close);
		if (raw.includes("<")) throw new SvgFormatError(`<svg> の属性 ${name} の値に < がある`);
		if (attributes.some((a) => a.name === name)) throw new SvgFormatError(`<svg> の属性 ${name} が重複している`);
		attributes.push({ name, raw, start: before, end: close + 1 });
		i = close + 1;
	}
}

/** 共有用の SVG: ルートの開始タグから content 属性だけを除く。普通の SVG はそのまま */
export function toSharingSvg(svg: string): string {
	if (svg.length > MAX_SVG_BYTES) throw new SvgFormatError("SVG が大きすぎる（10 MiB まで）");
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
