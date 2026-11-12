/** Vault の中の HTML を読み取り専用で表示する View（ADR-0037） */
import { FileView, Notice, TFile, type WorkspaceLeaf } from "obsidian";
import { HTML_EXTENSIONS, isSlideDeck, MAX_IMAGE_BYTES } from "../core/policy.ts";
import { openSlideInBrowser } from "./open-external.ts";
import { slideLiveVars, tokenVarNames } from "../core/live-vars.ts";
import { buildSrcdoc, type Theme } from "../core/sanitize.ts";
import { type MountedFrame, mountFrame } from "../ui/frame.ts";
import tokensCss from "../../tokens.css";

export const VIEW_TYPE = "pkm-html";

/** トークンが参照する Obsidian のフォントの変数。iframe の中にはないので、今の値を写す */
const FONT_VARS = ["--font-interface", "--font-text", "--font-monospace"];

function currentTheme(): Theme {
	return document.body.classList.contains("theme-dark") ? "dark" : "light";
}

function fontVars(): Record<string, string> {
	const style = getComputedStyle(document.body);
	return Object.fromEntries(FONT_VARS.map((name) => [name, style.getPropertyValue(name)]));
}

/** トークンの変数の、Obsidian で今効いている値。子の基本の色（pkm-theme-local.css）を含む（ADR-0129） */
const TOKEN_VARS = tokenVarNames(tokensCss);
function liveVars(path: string): Record<string, string> {
	const style = getComputedStyle(document.body);
	const vars = Object.fromEntries(TOKEN_VARS.map((name) => [name, style.getPropertyValue(name)]));
	return isSlideDeck(path) ? slideLiveVars(vars) : vars;
}

export class HtmlView extends FileView {
	override allowNoFile = false;
	private frame: MountedFrame | null = null;
	/** 読み込みの途中で別のファイルに変わったら、古い結果を捨てる */
	private generation = 0;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		this.contentEl.addClass("pkm-html-view");
	}

	override getViewType(): string {
		return VIEW_TYPE;
	}

	override getDisplayText(): string {
		return this.file?.basename ?? "HTML";
	}

	override getIcon(): string {
		return "file-code";
	}

	override canAcceptExtension(extension: string): boolean {
		return (HTML_EXTENSIONS as readonly string[]).includes(extension.toLowerCase());
	}

	override async onOpen(): Promise<void> {
		this.registerEvent(this.app.workspace.on("css-change", () => this.frame?.setTheme(currentTheme(), liveVars(this.file?.path ?? ""))));
		this.registerEvent(
			this.app.vault.on("modify", (file) => {
				if (file instanceof TFile && file === this.file) void this.render(file);
			}),
		);
	}

	/** スライド（ADR-0117）を開いている間だけ出す、ブラウザで開くボタン */
	private slideAction: HTMLElement | null = null;

	override async onLoadFile(file: TFile): Promise<void> {
		this.slideAction?.remove();
		this.slideAction = isSlideDeck(file.path) ? this.addAction("presentation", "Open in browser", () => openSlideInBrowser(this.app, file)) : null;
		await this.render(file);
	}

	override async onUnloadFile(): Promise<void> {
		this.generation++;
		this.clear();
	}

	override async onClose(): Promise<void> {
		this.generation++;
		this.clear();
	}

	private clear(): void {
		this.frame?.destroy();
		this.frame = null;
		this.contentEl.empty();
	}

	private findFile(candidates: readonly string[]): TFile | null {
		for (const path of candidates) {
			const file = this.app.vault.getAbstractFileByPath(path);
			if (file instanceof TFile) return file;
		}
		return null;
	}

	private async render(file: TFile): Promise<void> {
		const generation = ++this.generation;
		const html = await this.app.vault.cachedRead(file);
		const srcdoc = await buildSrcdoc(html, {
			path: file.path,
			theme: currentTheme(),
			tokensCss,
			fontVars: fontVars(),
			liveVars: liveVars(file.path),
			readImage: async (candidates) => {
				const image = this.findFile(candidates);
				if (!image || image.stat.size > MAX_IMAGE_BYTES) return null;
				return new Uint8Array(await this.app.vault.readBinary(image));
			},
		});
		if (generation !== this.generation) return;
		this.clear();
		this.frame = mountFrame(this.contentEl, srcdoc, {
			from: file.path,
			openVault: ({ candidates, subpath }) => {
				const target = this.findFile(candidates);
				if (!target) {
					new Notice(`ファイルが見つかりません: ${candidates[0] ?? ""}`);
					return;
				}
				// iframe の中のクリックでは、この View がアクティブにならないことがある。Markdown のリンクと同じく、このタブで開く
				this.app.workspace.setActiveLeaf(this.leaf, { focus: true });
				void this.app.workspace.openLinkText(`${target.path}${subpath}`, file.path, false);
			},
			openExternal: (url) => {
				window.open(url, "_blank");
			},
		});
	}
}
