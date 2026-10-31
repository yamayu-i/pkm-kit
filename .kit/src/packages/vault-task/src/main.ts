import { Notice, Plugin } from "obsidian";
import { issueHeaderExtension } from "./header/extension";
import { openCaptureModal } from "./obsidian/capture";
import type { TaskContext } from "./obsidian/context";
import { DEFAULT_SETTINGS, TaskSettingTab, sanitizeDeviceName, type TaskSettings } from "./obsidian/settings";
import { TaskStore } from "./obsidian/store";
import { preactViewCreator, type ViewSpec } from "./obsidian/view";
import { TaskWriter } from "./obsidian/writer";
import { DailyView } from "./views/DailyView";
import { GroupManagerView } from "./views/GroupManagerView";
import { InboxView } from "./views/InboxView";
import { IssueListView } from "./views/IssueListView";
import { OrganizeView } from "./views/OrganizeView";
import { RoutineListView } from "./views/RoutineListView";
import { ScheduledView } from "./views/ScheduledView";
import { SomedayView } from "./views/SomedayView";

/** View の一覧（ADR-0009, 0010） */
const VIEWS: ViewSpec[] = [
	{ type: "vault-task-daily", title: "Daily", icon: "calendar-check", component: DailyView },
	{ type: "vault-task-issues", title: "Issues", icon: "list-todo", component: IssueListView },
	{ type: "vault-task-inbox", title: "Inbox", icon: "inbox", component: InboxView },
	{ type: "vault-task-organize", title: "Organize", icon: "layers", component: OrganizeView },
	{ type: "vault-task-scheduled", title: "Scheduled", icon: "calendar-range", component: ScheduledView },
	{ type: "vault-task-someday", title: "Someday", icon: "cloud", component: SomedayView },
	{ type: "vault-task-routines", title: "Routines", icon: "repeat", component: RoutineListView },
	{ type: "vault-task-groups", title: "Board groups", icon: "layout-grid", component: GroupManagerView },
];

export default class VaultTaskPlugin extends Plugin {
	private store: TaskStore | null = null;
	taskSettings: TaskSettings = { ...DEFAULT_SETTINGS };

	override async onload(): Promise<void> {
		await this.loadSettings();
		const store = new TaskStore(this.app);
		this.store = store;
		const ctx: TaskContext = {
			app: this.app,
			store,
			writer: new TaskWriter(this.app, store),
			settings: this.taskSettings,
			saveSettings: () => this.saveData(this.taskSettings),
			openPath: async (path, newTab = false) => {
				const file = this.app.vault.getFileByPath(path);
				if (file) await this.app.workspace.getLeaf(newTab ? "tab" : false).openFile(file);
			},
			openView: async (type) => {
				const { workspace } = this.app;
				const existing = workspace.getLeavesOfType(type)[0];
				const leaf = existing ?? workspace.getLeaf("tab");
				if (!existing) await leaf.setViewState({ type, active: true });
				await workspace.revealLeaf(leaf);
			},
			report: (message, error) => {
				if (error !== undefined) console.error(`vault-task: ${message}`, error);
				const detail = error instanceof Error ? `: ${error.message}` : "";
				new Notice(`${message}${detail}`);
			},
		};

		for (const spec of VIEWS) {
			this.registerView(spec.type, preactViewCreator(spec, ctx));
			this.addCommand({ id: `open-${spec.type.replace("vault-task-", "")}`, name: `${spec.title} を開く`, callback: () => void ctx.openView(spec.type) });
		}
		this.registerEditorExtension(issueHeaderExtension(ctx));
		this.addCommand({ id: "capture-issues", name: "issue をまとめて作成", callback: () => openCaptureModal(ctx) });
		this.addRibbonIcon("list-plus", "issue をまとめて作成", () => openCaptureModal(ctx));
		this.addRibbonIcon("calendar-check", "Daily を開く", () => void ctx.openView("vault-task-daily"));
		this.addSettingTab(new TaskSettingTab(this.app, this, this.taskSettings, () => this.saveData(this.taskSettings)));
		this.app.workspace.onLayoutReady(() => {
			void store.load((ref) => this.registerEvent(ref)).catch((e) => ctx.report("タスクの索引を作れませんでした", e));
		});
	}

	override onunload(): void {
		this.store?.unload();
	}

	private async loadSettings(): Promise<void> {
		const saved = ((await this.loadData()) ?? {}) as Partial<TaskSettings>;
		Object.assign(this.taskSettings, DEFAULT_SETTINGS, saved);
		if (!this.taskSettings.deviceName) {
			// 端末名の初期値は vault-git の端末名にする（同じ端末なら同じ名前がよい）
			const git = (this.app as unknown as { plugins?: { plugins?: Record<string, { data?: { deviceName?: unknown } }> } }).plugins?.plugins?.["vault-git"];
			const name = git?.data?.deviceName;
			if (typeof name === "string" && name) this.taskSettings.deviceName = sanitizeDeviceName(name);
		}
	}
}
