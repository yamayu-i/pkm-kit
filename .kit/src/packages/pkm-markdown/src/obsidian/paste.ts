/**
 * 引用の中への貼り付け（ADR-0251）
 * Obsidian は Enter では次の行に引用の記号を続けるが、貼り付けでは続けないので、2 行目から下が引用の外に出る。
 * カーソルが引用の行の記号の後ろにあり、貼る文字が複数行で、カーソルが 1 つのときだけ、記号を付けて貼る。
 * それ以外（画像・ファイル、1 行だけ、複数のカーソル）は Obsidian に任せる
 */
import { htmlToMarkdown, type App, type Editor } from "obsidian";
import { pasteIntoQuote } from "../core/blockquote.ts";

/** Obsidian の「HTML を自動で変換」の設定。公開の API がないので getConfig で読み、読めなければ既定（変換する）とみなす */
function autoConvertHtml(app: App): boolean {
	const vault = app.vault as unknown as { getConfig?: (key: string) => unknown };
	try {
		return vault.getConfig?.("autoConvertHtml") !== false;
	} catch {
		return true;
	}
}

function pastedText(data: DataTransfer, convertHtml: boolean): string {
	const html = convertHtml ? data.getData("text/html") : "";
	return html ? htmlToMarkdown(html) : data.getData("text/plain");
}

export function handleQuotePaste(app: App, evt: ClipboardEvent, editor: Editor): void {
	if (evt.defaultPrevented) return;
	const data = evt.clipboardData;
	if (!data || data.files.length > 0) return;
	if (editor.listSelections().length !== 1) return;
	const from = editor.getCursor("from");
	const text = pasteIntoQuote(editor.getLine(from.line), from.ch, pastedText(data, autoConvertHtml(app)));
	if (text === null) return;
	evt.preventDefault();
	editor.replaceSelection(text);
}
