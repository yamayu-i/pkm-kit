/**
 * 図のコピー（ADR-0064、ADR-0102）。PNG / SVG（共有用。編集用 XML を除く）/ XML（全ページの編集用 XML。Draw.io の図だけ）。
 * PNG は常にライトの色で、ライトの面の色を背景にする。失敗したら通知する（成功したふりをしない）
 */
import { Notice } from "obsidian";
import { SVG_MIME as SVG_MIME_TYPE, svgDataUri } from "../core/encoding.ts";
import { forceLightSvg, PNG_BACKGROUND } from "../core/png.ts";
import { DrawioFormatError, extractDiagramXml, toSharingSvg } from "../core/svg.ts";

export type CopyFormat = "png" | "svg" | "xml";

export const COPY_FORMATS: ReadonlyArray<{ format: CopyFormat; label: string; icon: string }> = [
	{ format: "png", label: "Copy as PNG", icon: "image" },
	{ format: "svg", label: "Copy as SVG (without editable XML)", icon: "file-image" },
	{ format: "xml", label: "Copy as XML (editable in Draw.io)", icon: "file-code" },
];

/** 図の種類ごとに選べるコピーの形式（XML は Draw.io の図だけ） */
export function copyFormatsFor(drawio: boolean): typeof COPY_FORMATS {
	return drawio ? COPY_FORMATS : COPY_FORMATS.filter((f) => f.format !== "xml");
}

/** PNG の倍率（貼り付け先で粗く見えないように） */
const PNG_SCALE = 2;
/** PNG の 1 辺の上限（px） */
const MAX_PNG_SIDE = 8192;

function clipboardItemCtor(): typeof ClipboardItem | null {
	return typeof ClipboardItem === "function" ? ClipboardItem : null;
}

function supports(type: string): boolean {
	const ctor = clipboardItemCtor() as (typeof ClipboardItem & { supports?: (t: string) => boolean }) | null;
	if (!ctor) return false;
	// supports がない環境（古い WebView）は、試してみる
	return typeof ctor.supports === "function" ? ctor.supports(type) : true;
}

/**
 * 図をコピーする。svg はファイルの中身。
 * PNG は描くのに時間がかかるので、Promise のまま ClipboardItem に渡す（押した操作の有効期間が切れないように）
 */
export async function copyDiagram(svg: string, format: CopyFormat, doc: Document): Promise<void> {
	try {
		if (format === "xml") {
			const r = extractDiagramXml(svg);
			if (r.kind !== "diagram") {
				new Notice("この SVG には編集用 XML がありません（Draw.io の図ではない）");
				return;
			}
			await navigator.clipboard.writeText(r.xml);
			new Notice("XML をコピーしました");
			return;
		}
		const sharing = toSharingSvg(svg);
		if (format === "svg") {
			const Item = clipboardItemCtor();
			if (Item && supports(SVG_MIME_TYPE)) {
				try {
					await navigator.clipboard.write([
						new Item({ [SVG_MIME_TYPE]: new Blob([sharing], { type: SVG_MIME_TYPE }), "text/plain": new Blob([sharing], { type: "text/plain" }) }),
					]);
					new Notice("SVG をコピーしました");
					return;
				} catch {
					// 画像としては書けなかった。テキストで書く
				}
			}
			await navigator.clipboard.writeText(sharing);
			new Notice("SVG をテキストとしてコピーしました（この環境では画像としてコピーできません）");
			return;
		}
		const Item = clipboardItemCtor();
		if (!Item || !supports("image/png")) {
			new Notice("この環境では PNG をコピーできません。SVG か XML でコピーしてください");
			return;
		}
		await navigator.clipboard.write([new Item({ "image/png": renderPng(sharing, doc) })]);
		new Notice("PNG をコピーしました");
	} catch (e) {
		const message = e instanceof DrawioFormatError ? e.message : e instanceof Error ? e.message : String(e);
		new Notice(`コピーできませんでした: ${message}`, 8000);
	}
}

/** SVG の幅と高さ（px）。読めなければ viewBox、それもなければ 300×150 */
function svgSize(svg: Document): { width: number; height: number } {
	const root = svg.documentElement;
	const num = (v: string | null) => {
		const n = v === null ? Number.NaN : Number.parseFloat(v);
		return Number.isFinite(n) && n > 0 ? n : null;
	};
	const vb = (root.getAttribute("viewBox") ?? "").trim().split(/[\s,]+/).map(Number);
	const width = num(root.getAttribute("width")) ?? (vb.length === 4 && vb[2] && vb[2] > 0 ? vb[2] : null) ?? 300;
	const height = num(root.getAttribute("height")) ?? (vb.length === 4 && vb[3] && vb[3] > 0 ? vb[3] : null) ?? 150;
	return { width, height };
}

async function draw(svgText: string, doc: Document, size: { width: number; height: number }): Promise<Blob> {
	const img = doc.createElement("img");
	img.decoding = "async";
	img.src = svgDataUri(svgText);
	await img.decode();
	const scale = Math.min(PNG_SCALE, MAX_PNG_SIDE / size.width, MAX_PNG_SIDE / size.height);
	const canvas = doc.createElement("canvas");
	canvas.width = Math.max(1, Math.round(size.width * scale));
	canvas.height = Math.max(1, Math.round(size.height * scale));
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas を使えない");
	// 貼り付け先の背景に左右されないように、ライトの面の色を敷く
	ctx.fillStyle = PNG_BACKGROUND;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
	return await new Promise<Blob>((resolve, reject) => {
		try {
			canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG を作れない"))), "image/png");
		} catch (e) {
			// foreignObject などで Canvas が汚染されると SecurityError になる
			reject(e instanceof Error ? e : new Error(String(e)));
		}
	});
}

/**
 * 共有用の SVG を PNG にする（ダークのときだけ効く指定を除き、ライトの色にする）。Canvas が汚染されたら、<switch> の中の foreignObject を外して
 * Draw.io が用意している <text> の代わりの表示で描き直す
 */
export async function renderPng(svg: string, doc: Document): Promise<Blob> {
	const sharingSvg = forceLightSvg(svg);
	const parsed = new DOMParser().parseFromString(sharingSvg, SVG_MIME_TYPE);
	if (parsed.getElementsByTagName("parsererror").length > 0) throw new DrawioFormatError("SVG を読めない");
	const size = svgSize(parsed);
	try {
		return await draw(sharingSvg, doc, size);
	} catch {
		for (const fo of [...parsed.getElementsByTagNameNS("http://www.w3.org/2000/svg", "foreignObject")]) {
			if (fo.parentElement?.localName === "switch") fo.remove();
		}
		return await draw(new XMLSerializer().serializeToString(parsed), doc, size);
	}
}
