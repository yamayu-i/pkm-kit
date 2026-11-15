import type { Modal } from "obsidian";

/**
 * ダイアログを Cmd + W（Windows / Linux は Ctrl + W）で閉じられるようにする。
 * 既定の Mod + W は背後のタブを閉じるので、ダイアログの scope で先に受けて止める。
 * プラグインで作るすべてのモーダルの constructor（または作った直後）で呼ぶ
 */
export function registerCloseKey(modal: Modal): void {
	modal.scope.register(["Mod"], "w", () => {
		modal.close();
		return false;
	});
}
