/** 選ぶだけの小さなダイアログ（ADR-0064）。Obsidian の Modal と標準のボタンを使う */
import { Modal, Setting, SuggestModal, type App } from "obsidian";
import { invalidDiagramName } from "../core/names.ts";

export interface Choice<T> {
	label: string;
	value: T;
	/** 主な操作（filled）か、取り消せない操作（warning）か */
	style?: "cta" | "warning";
}

/** ボタンのどれかを選ぶ。閉じたら null */
export function choose<T>(app: App, title: string, message: string, choices: readonly Choice<T>[]): Promise<T | null> {
	return new Promise((resolve) => {
		let done = false;
		const modal = new (class extends Modal {
			override onOpen(): void {
				this.setTitle(title);
				this.contentEl.createEl("p", { text: message });
				const setting = new Setting(this.contentEl);
				for (const c of choices) {
					setting.addButton((b) => {
						b.setButtonText(c.label).onClick(() => {
							done = true;
							resolve(c.value);
							this.close();
						});
						if (c.style === "cta") b.setCta();
						if (c.style === "warning") b.setWarning();
					});
				}
			}
			override onClose(): void {
				this.contentEl.empty();
				if (!done) resolve(null);
			}
		})(app);
		modal.open();
	});
}

/** 新しい図の名前を聞く。閉じたら null */
export function askDiagramName(app: App, initial = ""): Promise<string | null> {
	return new Promise((resolve) => {
		let done = false;
		const modal = new (class extends Modal {
			override onOpen(): void {
				this.setTitle("New diagram");
				let value = initial;
				const error = this.contentEl.createEl("p", { cls: "vt-drawio-error" });
				const submit = () => {
					const problem = invalidDiagramName(value);
					error.setText(problem ?? "");
					if (problem) return;
					done = true;
					resolve(value.trim());
					this.close();
				};
				new Setting(this.contentEl)
					.setName("Name")
					.setDesc("Saved as asset/<name>.drawio.svg")
					.addText((t) => {
						t.setValue(initial).onChange((v) => {
							value = v;
						});
						t.inputEl.addEventListener("keydown", (e) => {
							if (e.key === "Enter" && !e.isComposing) {
								e.preventDefault();
								submit();
							}
						});
						window.setTimeout(() => t.inputEl.focus(), 0);
					});
				new Setting(this.contentEl).addButton((b) => b.setButtonText("Draw in Draw.io").setCta().onClick(submit));
			}
			override onClose(): void {
				this.contentEl.empty();
				if (!done) resolve(null);
			}
		})(app);
		modal.open();
	});
}

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
