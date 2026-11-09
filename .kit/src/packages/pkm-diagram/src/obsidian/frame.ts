/**
 * Draw.io の編集画面の iframe（ADR-0064）。
 * allow-scripts を付けてよいのは、このファイルの iframe だけ（security-scan が検査する）。
 * 読み込むのは固定の外部 HTTPS の origin だけで、Vault の中の HTML は読み込まない（srcdoc を使わない）
 */
import { EMBED_ORIGIN, embedUrl, parseMessage, type IncomingMessage } from "../core/protocol.ts";

/**
 * Draw.io が動くのに要る権限だけ。トップの遷移・popup・ダウンロードは許さない。
 * allow-same-origin を外すと origin が opaque になり、受け取るメッセージの origin を確かめられなくなる
 */
export const EDITOR_SANDBOX = "allow-scripts allow-same-origin allow-forms";

export interface EditorFrame {
	iframe: HTMLIFrameElement;
	post(message: Record<string, unknown>): void;
	destroy(): void;
}

export function mountEditorFrame(container: HTMLElement, onMessage: (msg: IncomingMessage) => void): EditorFrame {
	const doc = container.ownerDocument;
	const win = doc.defaultView ?? window;
	const iframe = doc.createElement("iframe");
	iframe.className = "vt-drawio-frame";
	// sandbox は src より先に付ける
	iframe.setAttribute("sandbox", EDITOR_SANDBOX);
	iframe.setAttribute("referrerpolicy", "no-referrer");
	iframe.setAttribute("allow", "clipboard-read; clipboard-write");
	iframe.setAttribute("title", "Draw.io");

	const listener = (e: MessageEvent) => {
		// 送り主が、この iframe の固定の origin であるものだけを受け取る
		if (e.origin !== EMBED_ORIGIN || e.source !== iframe.contentWindow) return;
		const msg = parseMessage(e.data);
		if (msg) onMessage(msg);
	};
	win.addEventListener("message", listener);
	iframe.setAttribute("src", embedUrl());
	container.appendChild(iframe);

	return {
		iframe,
		post(message) {
			iframe.contentWindow?.postMessage(JSON.stringify(message), EMBED_ORIGIN);
		},
		destroy() {
			win.removeEventListener("message", listener);
			iframe.remove();
		},
	};
}
