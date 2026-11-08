/**
 * pkm-drawio: asset/*.drawio.svg（編集用 XML を内包した SVG）の図を、ノートからコピー・編集し、
 * tmp/ への書き出しで埋め込む（ADR-0064）。表示は Obsidian の標準の画像の表示のまま。ほかのプラグインには依存しない
 */
import { MarkdownView, Menu, Notice, Plugin, TFile, type Editor } from "obsidian";
import { candidatePaths } from "../../pkm-html/src/core/policy.ts";
import { documentKind, drawioCandidates, findImageReferences } from "./core/document.ts";
import { diagramName, diagramPath, markdownImage } from "./core/names.ts";
import { DrawioFormatError, extractDiagramXml, isDrawioSvgPath } from "./core/svg.ts";
import { COPY_FORMATS, copyDiagram } from "./obsidian/copy.ts";
import { askDiagramName, pick } from "./obsidian/dialogs.ts";
import { DrawioEditorModal } from "./obsidian/editor-modal.ts";
import { exportToTmp } from "./obsidian/export.ts";
import { DiagramToolbar } from "./obsidian/toolbar.ts";

/** URL の ? と # を除き、エスケープを戻して比べられる形にする */
function resourceKey(url: string): string {
	const cut = url.split(/[?#]/)[0] ?? "";
	try {
		return decodeURI(cut);
	} catch {
		return cut;
	}
}

export default class PkmDrawioPlugin extends Plugin {
	private toolbar: DiagramToolbar | null = null;
	/** getResourcePath() の値（? を除く）→ 図のファイル。ファイルが増減・改名したら作り直す */
	private resources: Map<string, TFile> | null = null;

	override async onload(): Promise<void> {
		const toolbar = new DiagramToolbar({
			resolve: (img) => this.resolveImage(img),
			copy: (file, anchor) => this.showCopyMenu(file, anchor),
			edit: (file) => void this.edit(file),
		});
		this.toolbar = toolbar;
		const register = <K extends keyof DocumentEventMap>(doc: Document, type: K, cb: (e: DocumentEventMap[K]) => void, capture = false) =>
			this.registerDomEvent(doc, type, cb, { capture });
		toolbar.attach(document, register);
		this.registerEvent(this.app.workspace.on("window-open", (win) => toolbar.attach(win.doc, register)));
		this.registerEvent(this.app.workspace.on("window-close", (win) => toolbar.detach(win.doc)));
		this.registerEvent(this.app.workspace.on("layout-change", () => toolbar.hideAll()));
		for (const event of ["create", "delete", "rename"] as const) {
			this.registerEvent(this.app.vault.on(event as "create", () => (this.resources = null)));
		}

		this.addCommand({ id: "create-diagram", name: "New diagram (asset/*.drawio.svg)", callback: () => void this.create() });
		this.addCommand({
			id: "edit-diagram",
			name: "Edit a diagram in this note",
			checkCallback: (checking) => this.withDiagramsInActive(checking, (file) => void this.edit(file)),
		});
		this.addCommand({
			id: "copy-diagram",
			name: "Copy a diagram in this note (PNG / SVG / XML)",
			checkCallback: (checking) =>
				this.withDiagramsInActive(checking, (file) => {
					void pick(this.app, "Copy as", COPY_FORMATS, (f) => f.label).then((choice) => {
						if (choice) void this.copy(file, choice.format);
					});
				}),
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
				if (isDrawioSvgPath(file.path)) {
					menu.addItem((i) => i.setTitle("Edit in Draw.io").setIcon("pencil").onClick(() => void this.edit(file)));
					for (const f of COPY_FORMATS) menu.addItem((i) => i.setTitle(f.label).setIcon(f.icon).onClick(() => void this.copy(file, f.format)));
				} else if (documentKind(file.path)) {
					menu.addItem((i) => i.setTitle("Export to tmp/ (embed diagrams)").setIcon("file-output").onClick(() => void exportToTmp(this.app, file)));
				}
			}),
		);
	}

	override onunload(): void {
		this.toolbar?.destroy();
		this.toolbar = null;
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
			if (f instanceof TFile && isDrawioSvgPath(f.path)) return f;
		}
		const linkpath = resourceKey(link);
		const dest = this.app.metadataCache.getFirstLinkpathDest(linkpath, this.app.workspace.getActiveFile()?.path ?? "");
		return dest && isDrawioSvgPath(dest.path) ? dest : null;
	}

	private fileFromResource(url: string): TFile | null {
		if (!this.resources) {
			this.resources = new Map();
			for (const f of this.app.vault.getFiles()) {
				if (isDrawioSvgPath(f.path)) this.resources.set(resourceKey(this.app.vault.getResourcePath(f)), f);
			}
		}
		return this.resources.get(resourceKey(url)) ?? null;
	}

	/** 開いているノートの中の図（重複なし）。ノートが図そのものなら、その図 */
	private async diagramsInActive(): Promise<TFile[]> {
		const file = this.app.workspace.getActiveFile();
		if (!file) return [];
		if (isDrawioSvgPath(file.path)) return [file];
		const kind = documentKind(file.path);
		if (!kind) return [];
		const text = await this.app.vault.cachedRead(file);
		const found = new Map<string, TFile>();
		for (const ref of findImageReferences(text, kind)) {
			for (const path of drawioCandidates(file.path, ref, kind)) {
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
		if (!active || !(isDrawioSvgPath(active.path) || documentKind(active.path))) return false;
		if (checking) return true;
		void this.diagramsInActive().then(async (files) => {
			if (files.length === 0) {
				new Notice("このノートに図（asset/*.drawio.svg）がありません");
				return;
			}
			const file = files.length === 1 ? files[0] : await pick(this.app, "Choose a diagram", files, (f) => f.path);
			if (file) run(file);
		});
		return true;
	}

	private showCopyMenu(file: TFile, anchor: HTMLElement): void {
		// 選ぶ前に読み始める（押した操作からクリップボードに書くまでを短くする）
		const content = this.app.vault.cachedRead(file);
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

	private async edit(file: TFile): Promise<void> {
		const svg = await this.app.vault.read(file);
		let xml: string;
		try {
			const r = extractDiagramXml(svg);
			if (r.kind !== "diagram") {
				new Notice(`${file.path} には編集用 XML がないので、Draw.io の図として編集できません（普通の SVG）`, 8000);
				return;
			}
			xml = r.xml;
		} catch (e) {
			new Notice(`${file.path} を読めません: ${e instanceof DrawioFormatError ? e.message : String(e)}`, 8000);
			return;
		}
		new DrawioEditorModal(this.app, { kind: "existing", file, base: svg, xml }).open();
	}

	/** 新しい図を作る。開いていたノートのカーソルの位置に、図の参照を入れる */
	private async create(): Promise<void> {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const notePath = view?.file?.path ?? null;
		const editor: Editor | null = view?.editor ?? null;
		const cursor = editor?.getCursor() ?? null;
		const name = await askDiagramName(this.app);
		if (name === null) return;
		const path = diagramPath(name);
		if (this.app.vault.getAbstractFileByPath(path)) {
			new Notice(`${path} は既にあります。別の名前にするか、その図を編集してください`);
			return;
		}
		new DrawioEditorModal(this.app, {
			kind: "new",
			path,
			onCreated: (file) => {
				const link = markdownImage(diagramName(file.path), file.path);
				if (view && editor && cursor && view.file?.path === notePath && view.editor === editor) {
					editor.replaceRange(link, cursor);
				} else {
					void navigator.clipboard.writeText(link).then(() => new Notice("図の参照をコピーしました。ノートに貼り付けてください"));
				}
			},
		}).open();
	}
}
