import { MarkdownView, type Plugin } from "obsidian";
import { h, render } from "preact";
import { buildHeader, type HeaderModel } from "../core/note-header";
import { hasNoteHeader, WIKI_TYPES } from "../core/note-list";
import { NoteHeader } from "./NoteHeader";
import { backlinkCount, collectNotes, noteInfo } from "./note-index";

const HEADER_CLASS = "vt-tpl-note-header";
/** Obsidian が標準のタイトルと Properties 欄を置く、編集とリーディングの本文の入れ物 */
const SIZERS = ".cm-sizer, .markdown-preview-sizer";

/**
 * ノートの先頭(Properties 欄より上)にヘッダーを差し込む(ADR-0025)。
 * 編集(ソース / Live Preview)とリーディングの両方に同じものを出す。標準のタイトルは app.json で隠している
 */
export function installNoteHeaders(plugin: Plugin): void {
	const { app } = plugin;

	const mount = (view: MarkdownView): void => {
		const file = view.file;
		const info = file ? noteInfo(app, file) : null;
		const show = info !== null && hasNoteHeader(info.path, info.frontmatter);
		let model: HeaderModel | null = null;
		if (info && show) {
			// 全ノートの一覧と被リンクは、source と wiki のページでしか使わない
			const type = info.frontmatter.type;
			const needsVault = type === "source" || (typeof type === "string" && WIKI_TYPES.includes(type));
			model = buildHeader(info, { notes: needsVault ? collectNotes(app) : [], backlinks: needsVault ? backlinkCount(app, info.path) : 0 });
		}
		for (const sizer of Array.from(view.contentEl.querySelectorAll<HTMLElement>(SIZERS))) {
			let host = sizer.querySelector<HTMLElement>(`:scope > .${HEADER_CLASS}`);
			if (!model) {
				if (host) {
					render(null, host);
					host.remove();
				}
				continue;
			}
			if (!host) {
				host = document.createElement("div");
				host.className = HEADER_CLASS;
				sizer.prepend(host);
			} else if (sizer.firstElementChild !== host) {
				sizer.prepend(host);
			}
			render(h(NoteHeader, { app, model }), host);
		}
	};

	const refresh = (): void => {
		app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.view instanceof MarkdownView) mount(leaf.view);
		});
	};

	// 連続したイベントは 1 回にまとめる
	let timer: number | undefined;
	const schedule = (): void => {
		window.clearTimeout(timer);
		timer = window.setTimeout(refresh, 100);
	};

	plugin.registerEvent(app.workspace.on("file-open", schedule));
	plugin.registerEvent(app.workspace.on("layout-change", schedule));
	plugin.registerEvent(app.workspace.on("active-leaf-change", schedule));
	plugin.registerEvent(app.metadataCache.on("changed", schedule));
	plugin.registerEvent(app.metadataCache.on("resolved", schedule));
	app.workspace.onLayoutReady(refresh);

	plugin.register(() => {
		window.clearTimeout(timer);
		for (const host of Array.from(document.querySelectorAll<HTMLElement>(`.${HEADER_CLASS}`))) {
			render(null, host);
			host.remove();
		}
	});
}
