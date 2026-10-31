import { Notice, Plugin } from "obsidian";
import type { TaskContext } from "./obsidian/context";
import { openCaptureModal } from "./obsidian/capture";
import { TaskStore } from "./obsidian/store";
import { TaskWriter } from "./obsidian/writer";
import { issueHeaderExtension } from "./header/extension";

export default class VaultTaskPlugin extends Plugin {
	private store: TaskStore | null = null;

	override async onload(): Promise<void> {
		const store = new TaskStore(this.app);
		this.store = store;
		const ctx: TaskContext = {
			app: this.app,
			store,
			writer: new TaskWriter(this.app, store),
			openPath: async (path, newTab = false) => {
				const file = this.app.vault.getFileByPath(path);
				if (file) await this.app.workspace.getLeaf(newTab ? "tab" : false).openFile(file);
			},
			report: (message, error) => {
				if (error !== undefined) console.error(`vault-task: ${message}`, error);
				const detail = error instanceof Error ? `: ${error.message}` : "";
				new Notice(`${message}${detail}`);
			},
		};

		this.registerEditorExtension(issueHeaderExtension(ctx));
		this.addCommand({ id: "capture-issues", name: "issue をまとめて作成", callback: () => openCaptureModal(ctx) });
		this.addRibbonIcon("list-plus", "issue をまとめて作成", () => openCaptureModal(ctx));
		this.app.workspace.onLayoutReady(() => {
			void store.load((ref) => this.registerEvent(ref)).catch((e) => ctx.report("タスクの索引を作れませんでした", e));
		});
	}

	override onunload(): void {
		this.store?.unload();
	}
}
