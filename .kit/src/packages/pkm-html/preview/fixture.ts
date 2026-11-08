/**
 * preview の画面: pkm-html の表示（core と ui）を、Obsidian なしで Chromium に出す。
 * Obsidian の View（src/obsidian/）の代わりに、偽の Vault の画像と、リンクの記録を渡す
 */
import { CSP, MAX_IMAGE_BYTES } from "../src/core/policy.ts";
import { buildSrcdoc, type Theme } from "../src/core/sanitize.ts";
import { buildStandalone } from "../src/core/standalone.ts";
import { type MountedFrame, mountFrame } from "../src/ui/frame.ts";
import tokensCss from "../tokens.css";
import standaloneCss from "../tokens-standalone.css";
import evil from "./fixtures/evil.html";
import images from "./fixtures/images.html";
import links from "./fixtures/links.html";
import sample from "./fixtures/sample.html";

const FIXTURES: Record<string, string> = { evil, images, links, sample };

/** 2x2 の PNG */
const DOT_PNG = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));
/** <img> として読み込む SVG。中のスクリプトとイベントは動かない */
const DOT_SVG = new TextEncoder().encode(
	`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" onload="parent.__pwned='svg-onload'"><script>parent.__pwned='svg-img'</script><rect width="16" height="16" fill="#3a7"/></svg>`,
);

const VAULT: Record<string, Uint8Array> = {
	"asset/dot.png": DOT_PNG,
	"asset/dot.svg": DOT_SVG,
	"asset/big.png": new Uint8Array(MAX_IMAGE_BYTES + 1),
	"asset/note.md": new TextEncoder().encode("# note"),
};

declare global {
	interface Window {
		__pwned?: string;
		__opened: unknown[];
		__srcdoc: string;
		__frame: MountedFrame | null;
		vh: {
			mount(name: string, theme: Theme, root: string): Promise<void>;
			mountRaw(name: string, root: string): void;
			setTheme(theme: Theme): void;
			standalone(name: string): Promise<string>;
		};
	}
}

window.__opened = [];
window.__frame = null;

const readImage = async (candidates: string[]) => {
	for (const c of candidates) if (VAULT[c]) return VAULT[c] as Uint8Array;
	return null;
};

function handlers(from: string) {
	return {
		from,
		openVault: (target: unknown) => window.__opened.push(target),
		openExternal: (url: string) => window.__opened.push({ external: url }),
	};
}

function container(root: string): HTMLElement {
	const el = document.querySelector<HTMLElement>(root);
	if (!el) throw new Error(`no ${root}`);
	window.__frame?.destroy();
	el.replaceChildren();
	return el;
}

window.vh = {
	async mount(name, theme, root) {
		const from = `docs/${name}.html`;
		const srcdoc = await buildSrcdoc(FIXTURES[name] as string, {
			path: from,
			theme,
			tokensCss,
			fontVars: { "--font-text": "sans-serif", "--font-interface": "sans-serif", "--font-monospace": "monospace" },
			readImage,
		});
		window.__srcdoc = srcdoc;
		window.__frame = mountFrame(container(root), srcdoc, handlers(from));
	},
	/** 取り除く処理（ADR-0037 の 3）を通さず、CSP だけを入れたもの。sandbox と CSP だけでも止まることを確かめる */
	mountRaw(name, root) {
		const raw = (FIXTURES[name] as string).replace(/<head>/i, `<head><meta http-equiv="Content-Security-Policy" content="${CSP}">`);
		window.__srcdoc = raw;
		window.__frame = mountFrame(container(root), raw, handlers(`docs/${name}.html`));
	},
	setTheme(theme) {
		window.__frame?.setTheme(theme);
	},
	/** tmp/ への書き出し（ADR-0044）と同じ変換。Obsidian と同じくブラウザの DOMParser で解析する */
	standalone(name) {
		return buildStandalone(FIXTURES[name] as string, {
			path: `docs/${name}.html`,
			standaloneCss,
			parse: (html) => new DOMParser().parseFromString(html, "text/html"),
			readImage,
		});
	},
};
