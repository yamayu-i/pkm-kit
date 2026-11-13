/**
 * 発表者ノートの読み込みと保存（ADR-0132）。
 * 保存は、deck.html の変えたノートだけを書き換え、プラグインの中でビルドし直して index.html も書く。
 * ビルドがエラーなら、どちらも書かない。開いた後に deck.html がほかで変わっていたら、書かずに知らせる
 */
import { normalizePath, TFile, type App } from "obsidian";
import assets from "virtual:slide-assets";
import { THEME_FILE } from "../../../design/src/theme.ts";
import type { Problem } from "../../../slide/src/core/build.ts";
import { applyNotes, buildDeckSource, INDEX_FILE, readDeckNotes, SOURCE_FILE, type DeckNotes } from "../core/rebuild.ts";

export interface LoadedDeck {
	/** 読んだときの deck.html（保存の前に、ほかで変わっていないかを比べる） */
	source: string;
	notes: DeckNotes;
}

export type SaveResult = { ok: true; source: string; warnings: Problem[] } | { ok: false; message: string; problems: Problem[] };

export async function loadDeck(app: App, deckPath: string): Promise<LoadedDeck | null> {
	const file = app.vault.getFileByPath(`${deckPath}/${SOURCE_FILE}`);
	if (!file) return null;
	const source = await app.vault.read(file);
	return { source, notes: readDeckNotes(source) };
}

async function readTheme(app: App): Promise<string | null> {
	// .kit-local/ は隠しフォルダなので、Vault の一覧には入らない。アダプターで読む
	const path = normalizePath(THEME_FILE);
	return (await app.vault.adapter.exists(path)) ? await app.vault.adapter.read(path) : null;
}

export async function saveNotes(app: App, deckPath: string, original: string, changes: ReadonlyMap<number, string>): Promise<SaveResult> {
	const file = app.vault.getFileByPath(`${deckPath}/${SOURCE_FILE}`);
	if (!file) return { ok: false, message: `${deckPath}/${SOURCE_FILE} がありません`, problems: [] };
	const current = await app.vault.read(file);
	if (current !== original) return { ok: false, message: "deck.html がほかで変わりました。Reload で読み直してから、もう一度直してください", problems: [] };
	const next = applyNotes(current, changes);
	if (next === null) return { ok: false, message: "deck.html のノートの位置が分かりませんでした。Reload で読み直してください", problems: [] };
	const result = buildDeckSource({
		source: next,
		deckPath,
		assets,
		fileExists: (path) => app.vault.getAbstractFileByPath(path) instanceof TFile,
		themeJson: await readTheme(app),
	});
	const errors = result.problems.filter((p) => p.level === "error");
	if (result.html === null) return { ok: false, message: "ビルドのエラーで保存しませんでした（deck.html も index.html も元のまま）", problems: errors };
	await app.vault.modify(file, next);
	const indexPath = `${deckPath}/${INDEX_FILE}`;
	const index = app.vault.getFileByPath(indexPath);
	if (index) await app.vault.modify(index, result.html);
	else await app.vault.create(indexPath, result.html);
	return { ok: true, source: next, warnings: result.problems.filter((p) => p.level === "warning") };
}
