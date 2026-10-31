import { ItemView, type WorkspaceLeaf } from "obsidian";
import { h, render, type FunctionComponent } from "preact";
import type { TaskContext } from "./context";

export interface ViewSpec {
	type: string;
	title: string;
	icon: string;
	component: FunctionComponent<{ ctx: TaskContext }>;
}

/**
 * preact の部品を中身にする View（ADR-0009 の各 View）を作る関数を返す。
 * ItemView のコンストラクタが getViewType を呼ぶので、spec はフィールドに置かずクロージャで持つ
 */
export function preactViewCreator(spec: ViewSpec, ctx: TaskContext): (leaf: WorkspaceLeaf) => ItemView {
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
			this.contentEl.addClass("vt-view");
			render(h(spec.component, { ctx }), this.contentEl);
		}

		override async onClose(): Promise<void> {
			render(null, this.contentEl);
		}
	}
	return (leaf) => new PreactView(leaf);
}
