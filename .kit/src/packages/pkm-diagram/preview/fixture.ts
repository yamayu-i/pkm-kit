/**
 * preview の画面: pkm-diagram の操作バー・編集画面・PNG を、Obsidian なしで Chromium に出す。
 * obsidian はモック（preview/obsidian-mock.ts）。Vault は Map
 */
import { Notice, TFile } from "obsidian";
import { svgDataUri } from "../src/core/encoding.ts";
import { extractDiagramXml, toSharingSvg } from "../src/core/svg.ts";
import { renderPng } from "../src/obsidian/copy.ts";
import { DrawioEditorModal } from "../src/obsidian/editor-modal.ts";
import { findMermaidSvg, mermaidSvgText } from "../src/obsidian/mermaid.ts";
import { DiagramToolbar, type DiagramTarget } from "../src/obsidian/toolbar.ts";
import { DiagramZoomModal } from "../src/obsidian/zoom-modal.ts";
import diagram from "../test/fixtures/two-pages.drawio.svg";
import plain from "../test/fixtures/plain.svg";

const MERMAID = `<svg id="mermaid-1" width="100%" viewBox="0 0 300 120" style="max-width: 300px;" xmlns="http://www.w3.org/2000/svg">
<style>#mermaid-1 .node rect{fill:#ececff;stroke:#9370db}</style>
<g class="root"><g class="nodes">
<g class="node default blue" transform="translate(70, 60)"><rect class="basic label-container" x="-50" y="-24" width="100" height="48"/>
<g class="label" transform="translate(-30, -12)"><foreignObject width="60" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display:table-cell;white-space:nowrap;line-height:1.5"><span class="nodeLabel"><p>開始</p></span></div></foreignObject></g></g>
<g class="node default" transform="translate(230, 60)"><rect class="basic label-container" x="-50" y="-24" width="100" height="48"/>
<g class="label" transform="translate(-30, -12)"><foreignObject width="60" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display:table-cell;white-space:nowrap;line-height:1.5"><span class="nodeLabel"><p>終わり</p></span></div></foreignObject></g></g>
</g><path class="flowchart-link" d="M120,60 L180,60" fill="none"/></g></svg>`;

const files = new Map<string, string>([
	["asset/sys.drawio.svg", diagram],
	["asset/plain.svg", plain],
]);
/** モックの TFile はパスを受け取る（本物の型は引数なし） */
const makeFile = (path: string): TFile => new (TFile as unknown as new (p: string) => TFile)(path);
const fileOf = (path: string) => (files.has(path) ? makeFile(path) : null);

const app = {
	vault: {
		getAbstractFileByPath: fileOf,
		read: async (f: TFile) => files.get(f.path) ?? "",
		cachedRead: async (f: TFile) => files.get(f.path) ?? "",
		process: async (f: TFile, fn: (current: string) => string) => {
			const next = fn(files.get(f.path) ?? "");
			files.set(f.path, next);
			return next;
		},
		modify: async (f: TFile, data: string) => void files.set(f.path, data),
		create: async (path: string, data: string) => {
			if (files.has(path)) throw new Error(`exists: ${path}`);
			files.set(path, data);
			return makeFile(path);
		},
		createFolder: async () => {},
	},
};

declare global {
	interface Window {
		__notices?: string[];
		__actions: string[];
		__modal?: DrawioEditorModal;
		dv: {
			files(): Record<string, string>;
			setFile(path: string, text: string): void;
			mountToolbar(): void;
			openEditor(path: string | null): void;
			openZoom(path: string): void;
			pngSize(): Promise<{ width: number; height: number; bytes: number }>;
			mermaidPng(): Promise<{ width: number; height: number; bytes: number; foreignObjects: number; hasText: boolean; dataUrl: string }>;
		};
	}
}

window.__actions = [];
window.dv = {
	files: () => Object.fromEntries(files),
	setFile: (path, text) => void files.set(path, text),
	mountToolbar() {
		const root = document.getElementById("note") as HTMLElement;
		for (const [id, path] of [
			["img-drawio", "asset/sys.drawio.svg"],
			["img-plain", "asset/plain.svg"],
		] as const) {
			const span = root.createSpan({ cls: "internal-embed image-embed", attr: { src: path } });
			const img = span.createEl("img", { attr: { id, alt: id, src: svgDataUri(files.get(path) ?? "") } });
			img.style.width = id === "img-plain" ? "160px" : "360px";
			root.createEl("p", { text: "本文の段落。図の下に続く文章。" });
		}
		// Obsidian が描く Mermaid の図と同じ形（ラベルは foreignObject の HTML）
		const box = root.createDiv({ cls: "mermaid", attr: { id: "mermaid" } });
		// innerHTML だと foreignObject の中の HTML が SVG の外に出るので、XML として読んで入れる（Mermaid は DOM で組み立てる）
		box.append(document.importNode(new DOMParser().parseFromString(MERMAID, "image/svg+xml").documentElement, true));
		root.createEl("p", { text: "図の後の段落。" });
		const name = (t: DiagramTarget) => (t.kind === "file" ? t.file.path : "mermaid");
		const toolbar = new DiagramToolbar({
			resolve: (el) => {
				if (el.tagName === "IMG") {
					const file = fileOf(el.closest(".internal-embed")?.getAttribute("src") ?? "");
					return file ? { el, target: { kind: "file", file, drawio: file.path.endsWith(".drawio.svg") } } : null;
				}
				const svg = findMermaidSvg(el);
				return svg ? { el: svg, target: { kind: "mermaid", svg } } : null;
			},
			copy: (t) => window.__actions.push(`copy:${name(t)}`),
			save: (t) => window.__actions.push(`save:${name(t)}`),
			expand: (t) => window.__actions.push(`expand:${name(t)}`),
			edit: (file) => window.__actions.push(`edit:${file.path}`),
		});
		toolbar.attach(document, (doc, type, cb, capture) => doc.addEventListener(type, cb as EventListener, { capture }));
	},
	openEditor(path) {
		if (path === null) {
			window.__modal = new DrawioEditorModal(app as never, { kind: "new", path: "asset/new.drawio.svg", onCreated: (f) => window.__actions.push(`created:${f.path}`) });
			window.__modal.open();
			return;
		}
		const svg = files.get(path) ?? "";
		const r = extractDiagramXml(svg);
		if (r.kind !== "diagram") throw new Error("not a diagram");
		window.__modal = new DrawioEditorModal(app as never, { kind: "existing", file: makeFile(path), base: svg, xml: r.xml });
		window.__modal.open();
	},
	openZoom(path) {
		new DiagramZoomModal(app as never, { src: svgDataUri(files.get(path) ?? ""), title: path }).open();
	},
	async mermaidPng() {
		const svg = findMermaidSvg(document.querySelector("#mermaid g"));
		if (!svg) throw new Error("no mermaid");
		const text = mermaidSvgText(svg, true);
		const blob = await renderPng(text, document);
		const bitmap = await createImageBitmap(blob);
		const dataUrl = await new Promise<string>((resolve) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result));
			reader.readAsDataURL(blob);
		});
		return { width: bitmap.width, height: bitmap.height, bytes: blob.size, foreignObjects: (text.match(/<foreignObject/g) ?? []).length, hasText: text.includes(">開始</tspan>"), dataUrl };
	},
	async pngSize() {
		const blob = await renderPng(toSharingSvg(diagram), document);
		const bitmap = await createImageBitmap(blob);
		return { width: bitmap.width, height: bitmap.height, bytes: blob.size };
	},
};
void Notice;
