import { ItemView, type WorkspaceLeaf } from "obsidian";
import { h, render, type FunctionComponent } from "preact";

/** preact の部品を中身にする View（pkm-updates と同じ形。プラグインどうしで共有しない） */
export function preactViewCreator<P extends object>(spec: { type: string; title: string; icon: string }, component: FunctionComponent<P>, props: P): (leaf: WorkspaceLeaf) => ItemView {
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
			this.contentEl.addClass("vt-sl-view");
			render(h(component, props), this.contentEl);
		}

		override async onClose(): Promise<void> {
			render(null, this.contentEl);
		}
	}
	return (leaf) => new PreactView(leaf);
}
