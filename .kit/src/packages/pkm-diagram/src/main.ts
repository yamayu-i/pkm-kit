/**
 * pkm-diagram: ノートの図（asset/ の SVG と Mermaid）を、コピー・PNG で保存・拡大表示し、
 * tmp/ への書き出しで埋め込む（ADR-0102）。以前の Draw.io の図（*.drawio.svg）も普通の SVG の図として扱う（ADR-0111）。
 * 表示は Obsidian の標準の画像の表示のまま。ほかのプラグインには依存しない
 */
import { Menu, Notice, Plugin, TFile } from "obsidian";
import { candidatePaths } from "../../pkm-html/src/core/policy.ts";
import { diagramCandidates, documentKind, findImageReferences } from "./core/document.ts";
import { svgDataUri } from "./core/encoding.ts";
import { minTextSize } from "./core/plain-svg.ts";
import { pngFileName } from "./core/png.ts";
import { isDiagramSvgPath, toSharingSvg } from "./core/svg.ts";
import { COPY_FORMATS, copyDiagram, renderPng } from "./obsidian/copy.ts";
import { pick } from "./obsidian/dialogs.ts";
import { exportToTmp } from "./obsidian/export.ts";
import { findMermaidSvg, mermaidSvgText } from "./obsidian/mermaid.ts";
import { savePng } from "./obsidian/save.ts";
import { mermaidMinTextSize, ShrinkMarker } from "./obsidian/shrink-marker.ts";
import { DiagramToolbar, type DiagramTarget, type FoundDiagram } from "./obsidian/toolbar.ts";
import { DiagramZoomModal } from "./obsidian/zoom-modal.ts";

/** URL の ? と # を除き、エスケープを戻して比べられる形にする */
function resourceKey(url: string): string {
	const cut = url.split(/[?#]/)[0] ?? "";
	try {
		return decodeURI(cut);
	} catch {
		return cut;
	}
}

export default class PkmDiagramPlugin extends Plugin {
	private toolbar: DiagramToolbar | null = null;
	private shrink: ShrinkMarker | null = null;
	/** getResourcePath() の値（? を除く）→ 図のファイル。ファイルが増減・改名したら作り直す */
	private resources: Map<string, TFile> | null = null;

	override async onload(): Promise<void> {
		const toolbar = new DiagramToolbar({
			resolve: (el) => this.resolveDiagram(el),
			copy: (target, anchor) => this.showCopyMenu(target, anchor),
			save: (target) => this.save(target, activeDocument),
			expand: (target) => this.expand(target),
		});
		this.toolbar = toolbar;
		const register = <K extends keyof DocumentEventMap>(doc: Document, type: K, cb: (e: DocumentEventMap[K]) => void, capture = false) =>
			this.registerDomEvent(doc, type, cb, { capture });
		toolbar.attach(document, register);
		// 縮めすぎて読めない図の印（ADR-0102 の段階 3）
		const shrink = new ShrinkMarker({
			resolve: (el) => this.resolveDiagram(el),
			minTextSize: async (target) => (target.kind === "mermaid" ? mermaidMinTextSize(target.svg) : minTextSize(await this.app.vault.cachedRead(target.file))),
		});
		this.shrink = shrink;
		shrink.attach(document);
		this.registerEvent(
			this.app.workspace.on("window-open", (win) => {
				toolbar.attach(win.doc, register);
				shrink.attach(win.doc);
			}),
		);
		this.registerEvent(
			this.app.workspace.on("window-close", (win) => {
				toolbar.detach(win.doc);
				shrink.detach(win.doc);
			}),
		);
		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				toolbar.hideAll();
				shrink.rescan();
			}),
		);
		for (const event of ["create", "delete", "rename"] as const) {
			this.registerEvent(this.app.vault.on(event as "create", () => (this.resources = null)));
		}

		this.addCommand({
			id: "copy-diagram",
			name: "Copy a diagram in this note (PNG / SVG)",
			checkCallback: (checking) =>
				this.withDiagramsInActive(checking, (file) => {
					void pick(this.app, "Copy as", COPY_FORMATS, (f) => f.label).then((choice) => {
						if (choice) void this.copy(file, choice.format);
					});
				}),
		});
		this.addCommand({
			id: "save-diagram-png",
			name: "Save a diagram in this note as PNG",
			checkCallback: (checking) => this.withDiagramsInActive(checking, (file) => this.save(this.fileTarget(file), activeDocument)),
		});
		this.addCommand({
			id: "expand-diagram",
			name: "Expand a diagram in this note",
			checkCallback: (checking) => this.withDiagramsInActive(checking, (file) => this.expand(this.fileTarget(file))),
		});
		this.addCommand({
			id: "export-to-tmp",
			name: "Export this note to tmp/ (embed diagrams)",
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				if (!file || !documentKind(file.path)) return false;
				if (!checking) void exportToTmp(this.app, file);
				return true;
			},
		});

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (!(file instanceof TFile)) return;
				if (isDiagramSvgPath(file.path)) {
					for (const f of COPY_FORMATS) menu.addItem((i) => i.setTitle(f.label).setIcon(f.icon).onClick(() => void this.copy(file, f.format)));
					menu.addItem((i) => i.setTitle("Save as PNG").setIcon("download").onClick(() => this.save(this.fileTarget(file), activeDocument)));
				} else if (documentKind(file.path)) {
					menu.addItem((i) => i.setTitle("Export to tmp/ (embed diagrams)").setIcon("file-output").onClick(() => void exportToTmp(this.app, file)));
				}
			}),
		);
	}

	override onunload(): void {
		this.toolbar?.destroy();
		this.toolbar = null;
		this.shrink?.destroy();
		this.shrink = null;
	}

	private fileTarget(file: TFile): DiagramTarget {
		return { kind: "file", file };
	}

	/** 要素が図なら、その図。画像は Vault の SVG の図を指すもの、それ以外は Mermaid の図の中の要素 */
	private resolveDiagram(el: Element): FoundDiagram | null {
		if (el.tagName === "IMG") {
			const file = this.resolveImage(el as HTMLImageElement);
			return file ? { el, target: this.fileTarget(file) } : null;
		}
		const svg = findMermaidSvg(el);
		return svg ? { el: svg, target: { kind: "mermaid", svg } } : null;
	}

	/** 図の SVG の文字列。light なら PNG 用（ライトの色。以前の Draw.io の図は編集用 XML を除く） */
	private async svgText(target: DiagramTarget, light: boolean): Promise<string> {
		if (target.kind === "mermaid") return mermaidSvgText(target.svg, light);
		const svg = await this.app.vault.cachedRead(target.file);
		return light ? toSharingSvg(svg) : svg;
	}

	private diagramFileName(target: DiagramTarget): string {
		if (target.kind === "file") return pngFileName(target.file.name);
		return pngFileName(`${this.app.workspace.getActiveFile()?.basename ?? "note"}-diagram`);
	}

	private save(target: DiagramTarget, doc: Document): void {
		// 描き終わるのを待たずに保存を始める（保存のダイアログを、押した操作の有効期間のうちに開く）
		const png = this.svgText(target, true).then((svg) => renderPng(svg, doc));
		png.catch(() => undefined);
		void savePng(this.app, png, this.diagramFileName(target), doc);
	}

	private expand(target: DiagramTarget): void {
		try {
			const src = target.kind === "file" ? this.app.vault.getResourcePath(target.file) : svgDataUri(mermaidSvgText(target.svg, false));
			const title = target.kind === "file" ? target.file.basename.replace(/\.drawio$/i, "") : (this.app.workspace.getActiveFile()?.basename ?? "Mermaid");
			new DiagramZoomModal(this.app, { src, title }).open();
		} catch (e) {
			new Notice(`図を拡大できませんでした: ${e instanceof Error ? e.message : String(e)}`, 8000);
		}
	}

	/** 画像（Reading view・Live Preview・画像の View）が指す図のファイル */
	private resolveImage(img: HTMLImageElement): TFile | null {
		const embedSrc = img.closest(".internal-embed, .image-embed")?.getAttribute("src");
		if (embedSrc) {
			const file = this.fileFromLink(embedSrc);
			if (file) return file;
		}
		const src = img.getAttribute("src") ?? "";
		// data: / blob: の画像は Vault のファイルを指さない（大きな data URI を毎回解かない）
		if (/^(data|blob):/i.test(src)) return null;
		if (/^(app|capacitor|https?|file):/i.test(src)) return this.fileFromResource(src);
		return this.fileFromLink(src);
	}

	/** リンクの文字列（Vault ルートからのパス。なければ Obsidian のリンクの解決） */
	private fileFromLink(link: string): TFile | null {
		for (const path of candidatePaths("", link)) {
			const f = this.app.vault.getAbstractFileByPath(path);
			if (f instanceof TFile && isDiagramSvgPath(f.path)) return f;
		}
		const linkpath = resourceKey(link);
		const dest = this.app.metadataCache.getFirstLinkpathDest(linkpath, this.app.workspace.getActiveFile()?.path ?? "");
		return dest && isDiagramSvgPath(dest.path) ? dest : null;
	}

	private fileFromResource(url: string): TFile | null {
		if (!this.resources) {
			this.resources = new Map();
			for (const f of this.app.vault.getFiles()) {
				if (isDiagramSvgPath(f.path)) this.resources.set(resourceKey(this.app.vault.getResourcePath(f)), f);
			}
		}
		return this.resources.get(resourceKey(url)) ?? null;
	}

	/** 開いているノートの中の図（重複なし）。ノートが図そのものなら、その図 */
	private async diagramsInActive(): Promise<TFile[]> {
		const file = this.app.workspace.getActiveFile();
		if (!file) return [];
		if (isDiagramSvgPath(file.path)) return [file];
		const kind = documentKind(file.path);
		if (!kind) return [];
		const text = await this.app.vault.cachedRead(file);
		const found = new Map<string, TFile>();
		for (const ref of findImageReferences(text, kind)) {
			for (const path of diagramCandidates(file.path, ref, kind)) {
				const f = this.app.vault.getAbstractFileByPath(path);
				if (f instanceof TFile) {
					found.set(f.path, f);
					break;
				}
			}
		}
		return [...found.values()];
	}

	private withDiagramsInActive(checking: boolean, run: (file: TFile) => void): boolean {
		const active = this.app.workspace.getActiveFile();
		if (!active || !(isDiagramSvgPath(active.path) || documentKind(active.path))) return false;
		if (checking) return true;
		void this.diagramsInActive().then(async (files) => {
			if (files.length === 0) {
				new Notice("このノートに図（asset/ の SVG）がありません。Mermaid の図は、図の右上の操作バーを使ってください");
				return;
			}
			const file = files.length === 1 ? files[0] : await pick(this.app, "Choose a diagram", files, (f) => f.path);
			if (file) run(file);
		});
		return true;
	}

	private showCopyMenu(target: DiagramTarget, anchor: HTMLElement): void {
		// 選ぶ前に読み始める（押した操作からクリップボードに書くまでを短くする）。Mermaid は PNG と同じライトの色
		const content = target.kind === "file" ? this.app.vault.cachedRead(target.file) : Promise.resolve(mermaidSvgText(target.svg, true));
		const menu = new Menu();
		for (const f of COPY_FORMATS) {
			menu.addItem((i) =>
				i
					.setTitle(f.label)
					.setIcon(f.icon)
					.onClick(() => void content.then((svg) => copyDiagram(svg, f.format, anchor.ownerDocument))),
			);
		}
		const rect = anchor.getBoundingClientRect();
		menu.showAtPosition({ x: rect.left, y: rect.bottom }, anchor.ownerDocument);
	}

	private async copy(file: TFile, format: (typeof COPY_FORMATS)[number]["format"]): Promise<void> {
		await copyDiagram(await this.app.vault.cachedRead(file), format, activeDocument);
	}
}
