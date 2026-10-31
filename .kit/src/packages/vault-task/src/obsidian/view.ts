import { ItemView, type WorkspaceLeaf } from "obsidian";
import { h, render, type FunctionComponent } from "preact";
import type { TaskContext } from "./context";

export interface ViewSpec {
	type: string;
	title: string;
	icon: string;
	component: FunctionComponent<{ ctx: TaskContext }>;
}

/** preact の部品を中身にする View（ADR-0009 の各 View） */
export class PreactView extends ItemView {
	constructor(
		leaf: WorkspaceLeaf,
		private readonly spec: ViewSpec,
		private readonly ctx: TaskContext,
	) {
		super(leaf);
	}

	getViewType(): string {
		return this.spec.type;
	}

	getDisplayText(): string {
		return this.spec.title;
	}

	override getIcon(): string {
		return this.spec.icon;
	}

	override async onOpen(): Promise<void> {
		this.contentEl.addClass("vt-view");
		render(h(this.spec.component, { ctx: this.ctx }), this.contentEl);
	}

	override async onClose(): Promise<void> {
		render(null, this.contentEl);
	}
}
