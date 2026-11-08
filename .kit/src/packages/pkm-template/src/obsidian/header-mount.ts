import { MarkdownView, type Plugin } from "obsidian";
import { h, render } from "preact";
import { installHeaderMount } from "../../../shared/src/header-mount.ts";
import { buildHeader, type HeaderModel } from "../core/note-header";
import { hasNoteHeader, WIKI_TYPES } from "../core/note-list";
import { NoteHeader } from "./NoteHeader";
import { backlinkCount, collectNotes, noteInfo } from "./note-index";

const HEADER_CLASS = "vt-tpl-note-header";

/**
 * ノートの先頭(Properties 欄より上)にヘッダーを差し込む(ADR-0026)。差し込みの仕組みは shared(ADR-0077)。
 * 編集(ソース / Live Preview)とリーディングの両方に同じものを出す。標準のタイトルは app.json で隠している
 */
export function installNoteHeaders(plugin: Plugin): void {
	const { app } = plugin;

	const model = (view: MarkdownView): HeaderModel | null => {
		const file = view.file;
		const info = file ? noteInfo(app, file) : null;
		if (!info || !hasNoteHeader(info.path, info.frontmatter)) return null;
		// 全ノートの一覧と被リンクは、source と wiki のページでしか使わない
		const type = info.frontmatter.type;
		const needsVault = type === "source" || (typeof type === "string" && WIKI_TYPES.includes(type));
		return buildHeader(info, { notes: needsVault ? collectNotes(app) : [], backlinks: needsVault ? backlinkCount(app, info.path) : 0 });
	};

	installHeaderMount<MarkdownView, HeaderModel>({
		plugin,
		className: HEADER_CLASS,
		views: () => {
			const views: MarkdownView[] = [];
			app.workspace.iterateAllLeaves((leaf) => {
				if (leaf.view instanceof MarkdownView) views.push(leaf.view);
			});
			return views;
		},
		activeView: () => app.workspace.getActiveViewOfType(MarkdownView),
		model,
		draw: (host, m) => render(h(NoteHeader, { app, model: m }), host),
		clear: (host) => render(null, host),
	});
}
