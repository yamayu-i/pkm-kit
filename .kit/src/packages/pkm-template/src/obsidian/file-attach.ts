import { Notice, normalizePath, type App, type Editor, type Plugin } from "obsidian";
import { ASSET_FOLDER, MAX_ATTACH_BYTES, assetFileName, attachmentMarkdown, joinAttachments, type AttachMode } from "../core/attach";

/**
 * @file・/file（ADR-0249）。OS のファイル選択で選んだファイルを asset/ に置き、カーソルの位置にリンクか埋め込みを入れる
 */

type Report = (message: string, error?: unknown) => void;

/** OS のファイル選択を開く。選ばずに閉じたら空の配列 */
function pickFiles(): Promise<File[]> {
	return new Promise((resolve) => {
		const input = document.createElement("input");
		input.type = "file";
		input.multiple = true;
		input.style.display = "none";
		const done = (files: File[]) => {
			input.remove();
			resolve(files);
		};
		input.addEventListener("change", () => done(Array.from(input.files ?? [])), { once: true });
		input.addEventListener("cancel", () => done([]), { once: true });
		document.body.appendChild(input);
		input.click();
	});
}

function assetNames(app: App): string[] {
	return app.vault.getFiles().filter((f) => f.parent?.path === ASSET_FOLDER).map((f) => f.name);
}

/** 選んだファイルを asset/ に置き、置いたパスを返す。上限を超えたものは置かない */
export async function storeAttachments(app: App, files: readonly File[], report: Report): Promise<string[]> {
	const tooLarge = files.filter((f) => f.size > MAX_ATTACH_BYTES);
	if (tooLarge.length > 0) new Notice(`20MB を超えるので置きませんでした: ${tooLarge.map((f) => f.name).join(", ")}`);
	const ok = files.filter((f) => f.size <= MAX_ATTACH_BYTES);
	if (ok.length === 0) return [];
	if (!app.vault.getFolderByPath(ASSET_FOLDER)) await app.vault.createFolder(ASSET_FOLDER);
	const taken = assetNames(app);
	const paths: string[] = [];
	for (const file of ok) {
		const name = assetFileName(file.name, taken);
		const path = normalizePath(`${ASSET_FOLDER}/${name}`);
		try {
			await app.vault.createBinary(path, await file.arrayBuffer());
			taken.push(name);
			paths.push(path);
		} catch (e) {
			report(`${file.name} を asset/ に置けませんでした`, e);
		}
	}
	return paths;
}

async function attach(app: App, editor: Editor, mode: AttachMode, report: Report): Promise<void> {
	const files = await pickFiles();
	if (files.length === 0) return;
	const paths = await storeAttachments(app, files, report);
	if (paths.length === 0) return;
	editor.replaceSelection(joinAttachments(paths.map((p) => attachmentMarkdown(p, mode)), mode));
	editor.focus();
}

export function installFileAttach(plugin: Plugin, report: Report): void {
	const app = plugin.app;
	plugin.addCommand({ id: "insert-file-link", name: "Insert file as link", icon: "paperclip", editorCallback: (editor) => void attach(app, editor, "link", report) });
	plugin.addCommand({ id: "insert-file-embed", name: "Insert file as embed", icon: "image-plus", editorCallback: (editor) => void attach(app, editor, "embed", report) });
}
