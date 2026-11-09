/**
 * 編集用 XML（<mxfile>）を読むための小さな XML の読み取り（ADR-0085）。
 * DOM を使わない（CLI とプラグインの両方で動かす）。DOCTYPE・実体の宣言は受け付けない
 */
import { decodeXmlEntities, DrawioFormatError } from "./svg.ts";

export interface XmlElement {
	name: string;
	attrs: Record<string, string>;
	children: XmlElement[];
	/** 子要素の間の文字（<diagram> の圧縮した中身に使う） */
	text: string;
}

const NAME = /^[A-Za-z_][\w:.-]*/;

/** XML を要素の木にする。ルートの要素を返す */
export function parseXml(xml: string): XmlElement {
	if (/<!(DOCTYPE|ENTITY)/i.test(xml)) throw new DrawioFormatError("XML に DOCTYPE・実体の宣言がある");
	let i = 0;
	const stack: XmlElement[] = [];
	let root: XmlElement | null = null;
	while (i < xml.length) {
		const lt = xml.indexOf("<", i);
		const textEnd = lt < 0 ? xml.length : lt;
		if (textEnd > i) {
			const text = xml.slice(i, textEnd);
			const top = stack[stack.length - 1];
			if (top) top.text += decodeXmlEntities(text);
			else if (text.trim() !== "") throw new DrawioFormatError("XML のルートの外に文字がある");
		}
		if (lt < 0) break;
		i = lt;
		if (xml.startsWith("<?", i)) {
			const end = xml.indexOf("?>", i);
			if (end < 0) throw new DrawioFormatError("XML 宣言が閉じていない");
			i = end + 2;
			continue;
		}
		if (xml.startsWith("<!--", i)) {
			const end = xml.indexOf("-->", i);
			if (end < 0) throw new DrawioFormatError("コメントが閉じていない");
			i = end + 3;
			continue;
		}
		if (xml.startsWith("<![CDATA[", i)) {
			const end = xml.indexOf("]]>", i);
			if (end < 0) throw new DrawioFormatError("CDATA が閉じていない");
			const top = stack[stack.length - 1];
			if (top) top.text += xml.slice(i + 9, end);
			i = end + 3;
			continue;
		}
		if (xml.startsWith("</", i)) {
			const m = NAME.exec(xml.slice(i + 2, i + 258));
			const close = xml.indexOf(">", i);
			const top = stack.pop();
			if (!m || close < 0 || !top || top.name !== m[0]) throw new DrawioFormatError("XML の閉じタグが合わない");
			i = close + 1;
			continue;
		}
		const m = NAME.exec(xml.slice(i + 1, i + 257));
		if (!m) throw new DrawioFormatError("XML のタグを読めない");
		const el: XmlElement = { name: m[0], attrs: {}, children: [], text: "" };
		i += 1 + m[0].length;
		for (;;) {
			while (/\s/.test(xml[i] ?? "")) i++;
			if (i >= xml.length) throw new DrawioFormatError(`<${el.name}> が閉じていない`);
			if (xml[i] === ">" || xml.startsWith("/>", i)) break;
			const a = NAME.exec(xml.slice(i, i + 256));
			if (!a) throw new DrawioFormatError(`<${el.name}> の属性を読めない`);
			i += a[0].length;
			while (/\s/.test(xml[i] ?? "")) i++;
			if (xml[i] !== "=") throw new DrawioFormatError(`<${el.name}> の属性 ${a[0]} に値がない`);
			i++;
			while (/\s/.test(xml[i] ?? "")) i++;
			const q = xml[i];
			if (q !== '"' && q !== "'") throw new DrawioFormatError(`<${el.name}> の属性 ${a[0]} が引用符で囲まれていない`);
			const close = xml.indexOf(q, i + 1);
			if (close < 0) throw new DrawioFormatError(`<${el.name}> の属性 ${a[0]} が閉じていない`);
			el.attrs[a[0]] = decodeXmlEntities(xml.slice(i + 1, close));
			i = close + 1;
		}
		const parent = stack[stack.length - 1];
		if (parent) parent.children.push(el);
		else if (root) throw new DrawioFormatError("XML のルートが 2 つある");
		else root = el;
		if (xml[i] === ">") {
			stack.push(el);
			i++;
		} else {
			i += 2;
		}
	}
	if (stack.length > 0) throw new DrawioFormatError(`<${stack[stack.length - 1]?.name}> が閉じていない`);
	if (!root) throw new DrawioFormatError("XML が空");
	return root;
}

/** 属性の値・文字のエスケープ（改行も残す） */
export function escapeXml(text: string): string {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\n/g, "&#10;");
}

/** 要素を XML にする（属性は書いた順） */
export function serializeXml(el: XmlElement): string {
	const attrs = Object.entries(el.attrs)
		.map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
		.join("");
	if (el.children.length === 0 && el.text === "") return `<${el.name}${attrs}/>`;
	return `<${el.name}${attrs}>${escapeXml(el.text)}${el.children.map(serializeXml).join("")}</${el.name}>`;
}
