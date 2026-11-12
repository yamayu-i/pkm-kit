/** クリップボードに書き、結果を知らせる（ADR-0128）。書けなければ失敗を知らせる（成功したふりをしない） */

export interface ClipboardLike {
	writeText(text: string): Promise<void>;
}

export const COPIED = "コピーしました";
export const COPY_FAILED = "コピーできませんでした";

export async function copyText(text: string, clipboard: ClipboardLike | undefined, notify: (message: string) => void): Promise<boolean> {
	try {
		if (!clipboard) throw new Error("no clipboard");
		await clipboard.writeText(text);
		notify(COPIED);
		return true;
	} catch {
		notify(COPY_FAILED);
		return false;
	}
}
