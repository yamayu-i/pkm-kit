import { Notice, Plugin } from "obsidian";

/**
 * 今日のデイリーノートと Daily を開くボタンを、リボンに続けて並べる（ADR-0029）。
 * リボンの並びはボタンを登録した順で決まるので、2 つを 1 つのプラグインが続けて登録する。
 * vault-template と vault-task には依存しない（import しない）。実行時にコマンドを ID で呼ぶだけ
 */
const BUTTONS = [
	{ icon: "calendar", title: "今日のデイリーノートを開く", command: "vault-template:open-todays-daily", plugin: "vault-template" },
	{ icon: "calendar-check", title: "Daily を開く", command: "vault-task:open-daily", plugin: "vault-task" },
] as const;

/** Obsidian の公開の型にはないが、コマンドの実行に使う（ない ID なら false を返す） */
interface Commands {
	executeCommandById(id: string): boolean;
}

export default class VaultRibbonPlugin extends Plugin {
	override onload(): void {
		const commands = (this.app as unknown as { commands: Commands }).commands;
		for (const b of BUTTONS) {
			this.addRibbonIcon(b.icon, b.title, () => {
				if (!commands.executeCommandById(b.command)) new Notice(`${b.title}: ${b.plugin} が有効になっていません`);
			});
		}
	}
}
