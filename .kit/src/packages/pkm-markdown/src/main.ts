/**
 * pkm-markdown: ノートの表示を整える（ADR-0128）
 * - インラインコードのコピーボタン（閲覧モード・ライブプレビュー。ホバーのない端末では閲覧モードでタップ）
 * - 引用とコールアウトのコピーボタン、引用の中への複数行の貼り付け（ADR-0251）
 * - 本文の # で始まる語を、タグではなく普通の文字として表示する（押しても検索を開かない）
 * - 見出しと箇条書きのスタイル（styles.css）
 */
import { Platform, Plugin } from "obsidian";
import { livePreviewCopy } from "./obsidian/live-preview.ts";
import { handleQuotePaste } from "./obsidian/paste.ts";
import { readingProcessor } from "./obsidian/reading.ts";

/** ライブプレビューのタグ。見た目は styles.css で本文と同じにする */
const LIVE_TAG = ".markdown-source-view .cm-hashtag";

export default class PkmMarkdownPlugin extends Plugin {
	override onload(): void {
		this.registerMarkdownPostProcessor(readingProcessor);
		// 編集中のタップはカーソルを置く操作なので、ホバーのない端末ではライブプレビューにボタンを出さない
		if (!Platform.isMobile) this.registerEditorExtension(livePreviewCopy);
		// 引用の中に複数行を貼ると、2 行目から下にも引用の記号を付ける（モバイルでも）
		this.registerEvent(this.app.workspace.on("editor-paste", (evt, editor) => handleQuotePaste(this.app, evt, editor)));
		// ライブプレビューでタグを押しても検索を開かない。カーソルは mousedown で置かれるので、click だけを止める
		this.guardTagClicks(activeDocument);
		this.registerEvent(this.app.workspace.on("window-open", (win) => this.guardTagClicks(win.doc)));
	}

	private guardTagClicks(doc: Document): void {
		this.registerDomEvent(
			doc,
			"click",
			(e) => {
				if (e.target instanceof Element && e.target.closest(LIVE_TAG)) e.stopPropagation();
			},
			{ capture: true },
		);
	}
}
