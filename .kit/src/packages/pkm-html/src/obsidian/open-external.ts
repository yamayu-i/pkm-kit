/**
 * ビルドしたスライド（ADR-0117）を、OS の既定のブラウザで開く。
 * この View はスクリプトを取り除くので、Slide Show とレビューはブラウザで使う。開けるのは slide/ の index.html だけ
 */
import { Notice, type App, type TFile } from "obsidian";
import { isSlideDeck } from "../core/policy.ts";

/** Obsidian の公開されていない API。なければ開けない端末として扱う */
type AppWithOpen = App & { openWithDefaultApp?: (path: string) => void };

export function openSlideInBrowser(app: App, file: TFile): void {
	if (!isSlideDeck(file.path)) return;
	const open = (app as AppWithOpen).openWithDefaultApp;
	if (typeof open !== "function") {
		new Notice("この端末では、ブラウザで開けません。PC でスライドの index.html をブラウザで開いてください");
		return;
	}
	try {
		open.call(app, file.path);
	} catch (e) {
		console.error("pkm-html: ブラウザで開けませんでした", e);
		new Notice(`ブラウザで開けませんでした: ${e instanceof Error ? e.message : String(e)}`);
	}
}
