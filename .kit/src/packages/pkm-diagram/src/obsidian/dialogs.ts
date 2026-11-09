/** ダイアログ（Obsidian の SuggestModal） */
import { SuggestModal, type App } from "obsidian";

/** 一覧から 1 つ選ぶ。閉じたら null */
export function pick<T>(app: App, placeholder: string, items: readonly T[], label: (item: T) => string): Promise<T | null> {
	return new Promise((resolve) => {
		let chosen = false;
		const modal = new (class extends SuggestModal<T> {
			override getSuggestions(query: string): T[] {
				const q = query.trim().toLowerCase();
				return items.filter((i) => label(i).toLowerCase().includes(q));
			}
			override renderSuggestion(item: T, el: HTMLElement): void {
				el.setText(label(item));
			}
			override onChooseSuggestion(item: T): void {
				chosen = true;
				resolve(item);
			}
			override onClose(): void {
				// onChooseSuggestion は onClose の後に呼ばれることがあるので、少し待ってから決める
				window.setTimeout(() => {
					if (!chosen) resolve(null);
				}, 0);
			}
		})(app);
		modal.setPlaceholder(placeholder);
		modal.open();
	});
}
