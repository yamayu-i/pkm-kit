/**
 * Vault の中の HTML を、OS の既定のブラウザで開く（ADR-0253。スライドは ADR-0117）。
 * この View はスクリプトと外部の資源を取り除くので、元の見た目・Slide Show・レビューはブラウザで見る。押したときだけ開く
 */
import { Notice, type App, type TFile } from "obsidian";
import { HTML_EXTENSIONS, isSlideDeck } from "../core/policy.ts";

/** Obsidian の公開されていない API。なければ開けない端末として扱う */
type AppWithOpen = App & { openWithDefaultApp?: (path: string) => void };

/** ボタン・メニューのアイコン。スライドはこれまでどおり presentation */
export function browserIcon(file: TFile): string {
	return isSlideDeck(file.path) ? "presentation" : "external-link";
}

/** HTML（.html / .htm）を OS のブラウザで開く。ほかの拡張子は開かない */
export function openHtmlInBrowser(app: App, file: TFile): void {
	if (!(HTML_EXTENSIONS as readonly string[]).includes(file.extension.toLowerCase())) return;
	const open = (app as AppWithOpen).openWithDefaultApp;
	if (typeof open !== "function") {
		new Notice("この端末では、ブラウザで開けません。PC で HTML をブラウザで開いてください");
		return;
	}
	try {
		open.call(app, file.path);
	} catch (e) {
		console.error("pkm-html: ブラウザで開けませんでした", e);
		new Notice(`ブラウザで開けませんでした: ${e instanceof Error ? e.message : String(e)}`);
	}
}

/** スライド（slide/ の index.html）だけを開く。pkm-slide の一覧から使う */
export function openSlideInBrowser(app: App, file: TFile): void {
	if (!isSlideDeck(file.path)) return;
	openHtmlInBrowser(app, file);
}
