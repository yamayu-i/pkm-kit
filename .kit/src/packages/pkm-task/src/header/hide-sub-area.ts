import type { Plugin } from "obsidian";
import { subAreaStartLine } from "../core/sub-issue";

const ISSUE_PATH_RE = /^issue\/[^/]+\.md$/;

/**
 * リーディング表示で、issue の md のサブの領域（最初のマーカーから後ろ）を隠す（ADR-0142）。
 * サブはヘッダーの一覧で読むため。編集表示（ソース / Live Preview）では隠さない
 */
export function installSubAreaHiding(plugin: Plugin): void {
	plugin.registerMarkdownPostProcessor((el, mctx) => {
		if (!ISSUE_PATH_RE.test(mctx.sourcePath)) return;
		const info = mctx.getSectionInfo(el);
		if (!info) return;
		const start = subAreaStartLine(info.text);
		if (start !== null && info.lineStart >= start) el.addClass("vt-subissue-area-hidden");
	});
}
