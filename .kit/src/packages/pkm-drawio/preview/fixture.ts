/**
 * preview の画面: pkm-drawio の操作バー・編集画面・PNG を、Obsidian なしで Chromium に出す。
 * obsidian はモック（preview/obsidian-mock.ts）。Vault は Map
 */
import { Notice, TFile } from "obsidian";
import { svgDataUri } from "../src/core/encoding.ts";
import { extractDiagramXml, toSharingSvg } from "../src/core/svg.ts";
import { renderPng } from "../src/obsidian/copy.ts";
import { DrawioEditorModal } from "../src/obsidian/editor-modal.ts";
import { DiagramToolbar } from "../src/obsidian/toolbar.ts";
import diagram from "../test/fixtures/two-pages.drawio.svg";
import plain from "../test/fixtures/plain.svg";

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
			pngSize(): Promise<{ width: number; height: number; bytes: number }>;
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
			img.style.width = "360px";
			root.createEl("p", { text: "本文の段落。図の下に続く文章。" });
		}
		const toolbar = new DiagramToolbar({
			resolve: (img) => {
				const src = img.closest(".internal-embed")?.getAttribute("src") ?? "";
				return src.endsWith(".drawio.svg") ? fileOf(src) : null;
			},
			copy: (file) => window.__actions.push(`copy:${file.path}`),
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
	async pngSize() {
		const blob = await renderPng(toSharingSvg(diagram), document);
		const bitmap = await createImageBitmap(blob);
		return { width: bitmap.width, height: bitmap.height, bytes: blob.size };
	},
};
void Notice;
