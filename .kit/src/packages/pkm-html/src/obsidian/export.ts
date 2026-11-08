/**
 * HTML を、トークンと画像を埋め込んだ 1 ファイルにして tmp/ に書き出す（ADR-0044）。元の HTML と画像は変えない
 */
import { Notice, TFile, type App } from "obsidian";
import { exportPath, TMP_FOLDER } from "../../../pkm-drawio/src/core/names.ts";
import { MAX_IMAGE_BYTES } from "../core/policy.ts";
import { buildStandalone } from "../core/standalone.ts";
import standaloneCss from "../../tokens-standalone.css";

function findFile(app: App, candidates: readonly string[]): TFile | null {
	for (const path of candidates) {
		const file = app.vault.getAbstractFileByPath(path);
		if (file instanceof TFile) return file;
	}
	return null;
}

/** 書き出したファイルを返す。失敗したら通知を出して null */
export async function exportHtmlToTmp(app: App, file: TFile): Promise<TFile | null> {
	const vault = app.vault;
	try {
		const html = await vault.read(file);
		const out = await buildStandalone(html, {
			path: file.path,
			standaloneCss,
			parse: (text) => new DOMParser().parseFromString(text, "text/html"),
			readImage: async (candidates) => {
				const image = findFile(app, candidates);
				if (!image || image.stat.size > MAX_IMAGE_BYTES) return null;
				return new Uint8Array(await vault.readBinary(image));
			},
		});
		if (!vault.getAbstractFileByPath(TMP_FOLDER)) await vault.createFolder(TMP_FOLDER);
		const path = exportPath(file.path, (p) => vault.getAbstractFileByPath(p) !== null);
		const created = await vault.create(path, out);
		new Notice(`${path} に書き出しました`);
		return created;
	} catch (e) {
		console.error("pkm-html: 書き出せませんでした", e);
		new Notice(`書き出せませんでした: ${e instanceof Error ? e.message : String(e)}`);
		return null;
	}
}
