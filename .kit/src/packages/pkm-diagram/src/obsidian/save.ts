/**
 * PNG の保存（ADR-0102）。PC は保存のダイアログ（File System Access API）、モバイルは共有シート（Web Share）、
 * どちらも使えなければ Vault の tmp/ に書く（git で管理せず、端末間で同期しない。ADR-0038）。
 * 失敗したら通知する（成功したふりをしない）
 */
import { Notice, normalizePath, type App } from "obsidian";
import { saveMethods } from "../core/png.ts";

interface PickerWindow {
	showSaveFilePicker?: (options: unknown) => Promise<{ createWritable(): Promise<{ write(data: Blob): Promise<void>; close(): Promise<void> }> }>;
}

const TMP = "tmp";

function isAbort(e: unknown): boolean {
	return e instanceof Error && e.name === "AbortError";
}

async function freeTmpPath(app: App, name: string): Promise<string> {
	const stem = name.replace(/\.png$/i, "");
	for (let n = 1; ; n++) {
		const path = normalizePath(`${TMP}/${n === 1 ? stem : `${stem} ${n}`}.png`);
		if (!(await app.vault.adapter.exists(path))) return path;
	}
}

async function saveToTmp(app: App, png: Blob, name: string): Promise<void> {
	if (!(await app.vault.adapter.exists(TMP))) await app.vault.adapter.mkdir(TMP);
	const path = await freeTmpPath(app, name);
	await app.vault.adapter.writeBinary(path, await png.arrayBuffer());
	new Notice(`PNG を ${path} に保存しました`);
}

/**
 * PNG を保存する。png は描いている途中の Promise のまま渡す（保存のダイアログは、押した操作の有効期間のうちに開く）
 */
export async function savePng(app: App, png: Promise<Blob>, name: string, doc: Document): Promise<void> {
	const win = (doc.defaultView ?? window) as unknown as PickerWindow;
	const nav = (doc.defaultView ?? window).navigator;
	const methods = saveMethods({
		picker: typeof win.showSaveFilePicker === "function",
		share: typeof nav.share === "function" && typeof nav.canShare === "function",
	});
	try {
		for (const method of methods) {
			if (method === "picker") {
				let handle: Awaited<ReturnType<NonNullable<PickerWindow["showSaveFilePicker"]>>>;
				try {
					handle = await (win.showSaveFilePicker as NonNullable<PickerWindow["showSaveFilePicker"]>)({
						suggestedName: name,
						types: [{ description: "PNG", accept: { "image/png": [".png"] } }],
					});
				} catch (e) {
					if (isAbort(e)) return;
					continue;
				}
				const writable = await handle.createWritable();
				await writable.write(await png);
				await writable.close();
				new Notice("PNG を保存しました");
				return;
			}
			if (method === "share") {
				const file = new File([await png], name, { type: "image/png" });
				if (!nav.canShare({ files: [file] })) continue;
				try {
					await nav.share({ files: [file], title: name });
					return;
				} catch (e) {
					if (isAbort(e)) return;
					continue;
				}
			}
			await saveToTmp(app, await png, name);
			return;
		}
	} catch (e) {
		new Notice(`PNG を保存できませんでした: ${e instanceof Error ? e.message : String(e)}`, 8000);
	}
}
