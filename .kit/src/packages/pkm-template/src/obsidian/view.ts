import { ItemView, type App, type WorkspaceLeaf } from "obsidian";
import { h, render, type FunctionComponent } from "preact";

export interface ViewSpec {
	type: string;
	title: string;
	icon: string;
	component: FunctionComponent<{ app: App }>;
}

/** Preact の部品を中身にする View を作る関数を返す(ADR-0026。pkm-task の同名の仕組みとは独立に持つ) */
export function preactViewCreator(spec: ViewSpec, app: App): (leaf: WorkspaceLeaf) => ItemView {
	class PreactView extends ItemView {
		getViewType(): string {
			return spec.type;
		}

		getDisplayText(): string {
			return spec.title;
		}

		override getIcon(): string {
			return spec.icon;
		}

		override async onOpen(): Promise<void> {
			this.contentEl.addClass("vt-tpl-view");
			render(h(spec.component, { app }), this.contentEl);
		}

		override async onClose(): Promise<void> {
			render(null, this.contentEl);
		}
	}
	return (leaf) => new PreactView(leaf);
}
