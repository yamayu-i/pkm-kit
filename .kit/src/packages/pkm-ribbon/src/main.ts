import { Notice, Plugin, type Events } from "obsidian";
import { BADGE_CHANGED_EVENT, BUTTONS, badgeText, pluginIdOf, type RibbonButton } from "./core/buttons";

/**
 * 自作プラグインのリボンのボタンを、表（core/buttons.ts）の順に登録する（ADR-0029、ADR-0070 の 5・6）。
 * どのプラグインにも依存しない（import しない）。押したらコマンドを ID で呼び、バッジの数はそのプラグインに尋ねる
 */

/** Obsidian の公開の型にはないが、コマンドの実行に使う（ない ID なら false を返す） */
interface Commands {
	executeCommandById(id: string): boolean;
}

/** バッジの数を持つプラグイン（ADR-0070 の 6） */
interface BadgeSource {
	getRibbonBadge?(command: string): number | null;
}

/** Obsidian の公開の型にはないが、有効なプラグインを ID で引くのに使う */
interface Plugins {
	getPlugin?(id: string): BadgeSource | null;
}

const BADGE_CLASS = "vt-ribbon-badge";

export default class PkmRibbonPlugin extends Plugin {
	override onload(): void {
		const app = this.app as unknown as { commands: Commands; plugins?: Plugins };
		const icons = new Map<string, { button: RibbonButton; el: HTMLElement }>();
		for (const b of BUTTONS) {
			const el = this.addRibbonIcon(b.icon, b.title, () => {
				if (!app.commands.executeCommandById(b.command)) new Notice(`${b.title}: ${pluginIdOf(b.command)} が有効になっていません`);
			});
			icons.set(b.command, { button: b, el });
		}

		const refresh = (command: string) => {
			const icon = icons.get(command);
			if (!icon) return;
			let count: unknown = null;
			try {
				count = app.plugins?.getPlugin?.(pluginIdOf(command))?.getRibbonBadge?.(command) ?? null;
			} catch (e) {
				console.error(`pkm-ribbon: ${command} のバッジの数を読めませんでした`, e);
			}
			setBadge(icon.el, icon.button.title, badgeText(count));
		};
		const refreshAll = () => {
			for (const command of icons.keys()) refresh(command);
		};

		// Workspace の型は決まった名前のイベントしか持たないので、Events の汎用の on を使う
		this.registerEvent((this.app.workspace as Events).on(BADGE_CHANGED_EVENT, (command: unknown) => typeof command === "string" && refresh(command)));
		// 数を持つプラグインが後から読み込まれても、起動の後にまとめて尋ねる
		this.app.workspace.onLayoutReady(refreshAll);
	}
}

/** ボタンの中にバッジの要素を出す・消す。読み上げ用に、ボタンの名前にも件数を足す */
function setBadge(el: HTMLElement, title: string, text: string | null): void {
	let badge = el.querySelector<HTMLElement>(`.${BADGE_CLASS}`);
	if (text === null) {
		badge?.remove();
		el.removeClass?.("vt-ribbon-badge-host");
		el.setAttribute("aria-label", title);
		return;
	}
	if (!badge) {
		badge = document.createElement("span");
		badge.className = BADGE_CLASS;
		badge.setAttribute("aria-hidden", "true");
		el.appendChild(badge);
	}
	el.addClass?.("vt-ribbon-badge-host");
	badge.textContent = text;
	el.setAttribute("aria-label", `${title}（${text} 件）`);
}
