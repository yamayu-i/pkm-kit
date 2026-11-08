/**
 * HTML を sandbox の iframe に出し、リンクのクリックを親で扱う（ADR-0035 の 1 と 4）。
 * DOM だけを使い、Obsidian に依存しない（preview で同じものを Chromium に出す）。
 * srcdoc への代入はこのファイルだけで行う（security-scan が検査する）
 */
import { classifyLink, type LinkTarget } from "../core/policy.ts";
import { MARK_ATTRIBUTE, schemeCss, type Theme } from "../core/sanitize.ts";

/**
 * iframe の sandbox。allow-scripts を付けない（中のスクリプトは動かない）。
 * allow-same-origin は、親からクリックを受け取るためだけに付ける。allow-scripts と一緒に付けてはいけない
 */
export const SANDBOX = "allow-same-origin";

export interface FrameHandlers {
	/** HTML ファイルの Vault の中のパス（リンクの相対パスの基準） */
	from: string;
	openVault(target: Extract<LinkTarget, { kind: "vault" }>): void;
	openExternal(url: string): void;
}

export interface MountedFrame {
	iframe: HTMLIFrameElement;
	setTheme(theme: Theme): void;
	destroy(): void;
}

/** クリックされた要素から、いちばん近いリンクを探す（iframe の中の要素は別の realm なので instanceof を使わない） */
function linkOf(target: EventTarget | null): Element | null {
	const el = target as Element | null;
	if (!el || typeof el.closest !== "function") return null;
	return el.closest("a[href], area[href]");
}

export function mountFrame(container: HTMLElement, srcdoc: string, handlers: FrameHandlers): MountedFrame {
	const iframe = container.ownerDocument.createElement("iframe");
	iframe.className = "vault-html-frame";
	// sandbox と referrerpolicy は srcdoc より先に付ける（付ける前の文書を作らない）
	iframe.setAttribute("sandbox", SANDBOX);
	iframe.setAttribute("referrerpolicy", "no-referrer");
	iframe.setAttribute("title", handlers.from);

	const onClick = (e: Event) => {
		const link = linkOf(e.target);
		if (!link) return;
		// iframe の中での遷移はさせない
		e.preventDefault();
		if (e.type !== "click") return;
		const target = classifyLink(handlers.from, link.getAttribute("href") ?? "");
		if (target.kind === "vault") handlers.openVault(target);
		else if (target.kind === "external") handlers.openExternal(target.url);
		else if (target.kind === "anchor") {
			const doc = iframe.contentDocument;
			const el = doc?.getElementById(target.id) ?? doc?.getElementsByName(target.id)[0];
			el?.scrollIntoView();
		}
	};
	const onSubmit = (e: Event) => e.preventDefault();
	let doc: Document | null = null;
	const onLoad = () => {
		doc = iframe.contentDocument;
		if (!doc) return;
		doc.addEventListener("click", onClick, true);
		doc.addEventListener("auxclick", onClick, true);
		doc.addEventListener("submit", onSubmit, true);
	};
	iframe.addEventListener("load", onLoad);
	iframe.srcdoc = srcdoc;
	container.appendChild(iframe);

	return {
		iframe,
		setTheme(theme) {
			const d = iframe.contentDocument;
			if (!d?.body) return;
			d.body.classList.remove("theme-light", "theme-dark");
			d.body.classList.add(`theme-${theme}`);
			const scheme = d.querySelector(`style[${MARK_ATTRIBUTE}="scheme"]`);
			if (scheme) scheme.textContent = schemeCss(theme);
		},
		destroy() {
			iframe.removeEventListener("load", onLoad);
			if (doc) {
				doc.removeEventListener("click", onClick, true);
				doc.removeEventListener("auxclick", onClick, true);
				doc.removeEventListener("submit", onSubmit, true);
			}
			iframe.remove();
		},
	};
}
