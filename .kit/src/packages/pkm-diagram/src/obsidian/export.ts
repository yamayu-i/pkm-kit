/**
 * ノート（md / html）を、図を埋め込んで tmp/ に書き出す（ADR-0064）。元のノートと図は変えない
 */
import { Notice, TFile, type App } from "obsidian";
import { checkExported, documentKind, embedDiagrams } from "../core/document.ts";
import { exportPath, TMP_FOLDER } from "../core/names.ts";

export async function exportToTmp(app: App, file: TFile): Promise<TFile | null> {
	const kind = documentKind(file.path);
	if (!kind) {
		new Notice("書き出せるのは md と html だけです");
		return null;
	}
	const vault = app.vault;
	const text = await vault.read(file);
	const result = await embedDiagrams(text, {
		sourcePath: file.path,
		kind,
		readText: async (path) => {
			const f = vault.getAbstractFileByPath(path);
			return f instanceof TFile ? await vault.read(f) : null;
		},
	});
	if (result.errors.length > 0) {
		console.warn("pkm-diagram: 書き出せませんでした", result.errors);
		new Notice(`書き出せませんでした（何も書いていません）:\n${result.errors.join("\n")}`, 12000);
		return null;
	}
	if (!vault.getAbstractFileByPath(TMP_FOLDER)) await vault.createFolder(TMP_FOLDER);
	const out = exportPath(file.path, (p) => vault.getAbstractFileByPath(p) !== null);
	const created = await vault.create(out, result.text);
	const problems = checkExported(result.text, kind, out);
	const lines = [`${out} に書き出しました（図 ${result.diagrams.length} 件）`, ...result.warnings, ...problems];
	new Notice(lines.join("\n"), result.warnings.length + problems.length > 0 ? 12000 : 5000);
	return created;
}
