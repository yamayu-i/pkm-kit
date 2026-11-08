/** data URI と base64（ADR-0064）。Buffer を使わない（モバイルにない）。btoa / atob は PC・モバイル・Node のどれにもある */
import { bytesToBase64 } from "../../../pkm-html/src/core/policy.ts";

export const SVG_MIME = "image/svg+xml";

/** SVG の文字列を data URI にする。UTF-8 のバイト列を base64 にする（btoa(svg) は日本語で壊れる） */
export function svgDataUri(svg: string): string {
	return `data:${SVG_MIME};base64,${bytesToBase64(new TextEncoder().encode(svg))}`;
}

/** data URI を読む。読めなければ null */
export function decodeDataUri(uri: string): { mime: string; bytes: Uint8Array } | null {
	const m = /^data:([^;,]*)((?:;[^;,]*)*),/i.exec(uri);
	if (!m) return null;
	const mime = (m[1] || "text/plain").toLowerCase();
	const params = (m[2] ?? "").toLowerCase().split(";");
	const body = uri.slice(m[0].length);
	try {
		if (params.includes("base64")) {
			const binary = atob(body.replace(/\s/g, ""));
			const bytes = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
			return { mime, bytes };
		}
		return { mime, bytes: new TextEncoder().encode(decodeURIComponent(body)) };
	} catch {
		return null;
	}
}

/** UTF-8 として読む。壊れていれば null */
export function utf8(bytes: Uint8Array): string | null {
	try {
		return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	} catch {
		return null;
	}
}
